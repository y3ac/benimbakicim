// Uctan uca yerel simulasyon: gercek WhatsApp/odeme olmadan tum akisi calistirir.
// Calistir: npm run simulate
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Temiz bir test veritabani kullan
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.resolve(__dirname, '..', 'data', 'simulate.sqlite');
if (fs.existsSync(testDbPath)) fs.rmSync(testDbPath);
process.env.DB_PATH = testDbPath;
process.env.DRY_RUN = 'true';
process.env.MATCH_WINDOW_HOURS = '0'; // hemen finalize edilebilsin

const { initDb, getDb } = await import('../src/db/index.js');
await initDb();

const { handleInbound } = await import('../src/bot/stateMachine.js');
const { workers, listings, payments, reveals, applications } = await import(
  '../src/repositories/index.js'
);
const { onPaymentPaid, finalizeNow } = await import('../src/services/paymentEvents.js');
const wa = (await import('../src/whatsapp/client.js')).default;
const { publishOutbox } = await import('../src/publishing/index.js');

const line = (s = '') => console.log(s);
const header = (s) => {
  line();
  line(`==================== ${s} ====================`);
};

const lastTo = (waId, n = 1) => {
  const msgs = wa.outbox.filter((o) => o.to === waId);
  return msgs.slice(-n);
};

const showLast = (waId, label) => {
  const msgs = lastTo(waId, 3);
  line(`  -> ${label}:`);
  msgs.forEach((m) => {
    const p = m.payload;
    if (p.type === 'text') line(`     [text] ${p.text.body.replace(/\n/g, '\n            ')}`);
    else if (p.type === 'interactive') {
      const it = p.interactive;
      const body = it.body?.text || '';
      const btns = (it.action?.buttons || []).map((b) => b.reply.title).join(' | ');
      line(`     [${it.type}] ${body.replace(/\n/g, '\n            ')}${btns ? `\n            butonlar: ${btns}` : ''}`);
    }
  });
};

// --- 1) Aday havuzu olustur (worker profilleri) ---
header('1) Aday havuzu olusturuluyor');
const pool = [
  { waId: '905550000001', name: 'Ayşe Y.', service: 'bebek', district: 'kadıköy', liveIn: 1, exp: 5, ref: true, smin: 25000, smax: 30000 },
  { waId: '905550000002', name: 'Fatma K.', service: 'bebek', district: 'kadıköy', liveIn: 1, exp: 3, ref: true, smin: 28000, smax: 32000 },
  { waId: '905550000003', name: 'Zeynep D.', service: 'bebek', district: 'üsküdar', liveIn: 0, exp: 2, ref: false, smin: 22000, smax: 26000 },
  { waId: '905550000004', name: 'Hatice T.', service: 'bebek', district: 'kadıköy', liveIn: 1, exp: 8, ref: true, smin: 30000, smax: 35000 },
  { waId: '905550000005', name: 'Elif S.', service: 'yasli', district: 'kadıköy', liveIn: 1, exp: 4, ref: true, smin: 27000, smax: 30000 },
  { waId: '905550000006', name: 'Meryem A.', service: 'bebek', district: 'ataşehir', liveIn: 1, exp: 6, ref: true, smin: 29000, smax: 33000 },
  { waId: '905550000007', name: 'Sultan B.', service: 'bebek', district: 'kadıköy', liveIn: 1, exp: 1, ref: false, smin: 24000, smax: 28000 },
];
for (const p of pool) {
  workers.upsert({
    waId: p.waId,
    name: p.name,
    serviceTypes: [p.service],
    districts: [p.district],
    liveIn: p.liveIn,
    experienceYears: p.exp,
    expectedSalaryMin: p.smin,
    expectedSalaryMax: p.smax,
    hasReference: p.ref,
    kvkkOk: true,
  });
}
line(`  ${pool.length} aday havuza eklendi.`);

// --- 2) Bakici arayan (seeker) konusmasi ---
header('2) Bakici arayan WhatsApp akisi');
const seeker = '905559999999';
await handleInbound({ waId: seeker, name: 'Merve Hanım', text: 'Merhaba' });
showLast(seeker, 'karsilama + niyet');

await handleInbound({ waId: seeker, buttonId: 'intent_seeker' });
showLast(seeker, 'KVKK');

await handleInbound({ waId: seeker, buttonId: 'kvkk_yes' });
showLast(seeker, 'hizmet sorusu');

await handleInbound({ waId: seeker, text: 'Bebek bakıcısı arıyorum' });
showLast(seeker, 'ilce sorusu');

await handleInbound({ waId: seeker, text: 'Kadıköy' });
showLast(seeker, 'calisma sekli');

await handleInbound({ waId: seeker, buttonId: 'live_in_1' });
showLast(seeker, 'ucret sorusu');

await handleInbound({ waId: seeker, text: '28-32 bin' });
showLast(seeker, 'not sorusu');

await handleInbound({ waId: seeker, text: 'Deneyimli ve referanslı olsun' });
showLast(seeker, 'ilan ozeti + onay');

await handleInbound({ waId: seeker, buttonId: 'listing_confirm' });
showLast(seeker, 'odeme (ilan paketi 300 TL)');

// Olusan ilani bul (en son eklenen)
const allListings = getDb().prepare('SELECT * FROM listings ORDER BY id DESC LIMIT 1').get();
const code = allListings.code;
line(`  Olusan ilan kodu: ${code} (durum: ${allListings.status})`);

// --- 3) Odeme tamamlandi (300 TL) ---
header('3) Ilan paketi odemesi tamamlaniyor (300 TL)');
const basePayment = payments.latestPendingByListing(code);
line(`  Odeme referansi: ${basePayment.reference} (${basePayment.amount} TL)`);
await onPaymentPaid(basePayment.reference);
showLast(seeker, 'ilan yayinlandi bildirimi');
line(`  Yayin ciktilari (${publishOutbox.length} kanal):`);
publishOutbox
  .filter((p) => p.listingCode === code)
  .forEach((p) => line(`     - ${p.channel}`));

// --- 4) Havuz adaylari "Evet" diyor ---
header('4) Havuz adaylari ilana yanit veriyor (Evet)');
const yesSayers = ['905550000001', '905550000002', '905550000004', '905550000006', '905550000007'];
for (const w of yesSayers) {
  await handleInbound({ waId: w, buttonId: `apply_yes_${code}` });
}
line(`  ${yesSayers.length} aday "Evet, ilgileniyorum" dedi.`);
line(`  Toplam basvuru: ${applications.countByListing(code)}`);

// --- 5) Eslestirmeyi sonuclandir (ilk 2 numara acilir) ---
header('5) Eslestirme sonuclaniyor -> en uygun 2 numara');
await finalizeNow(code);
showLast(seeker, 'top-2 + kalanlar + unlock teklifi');

// --- 6) Ek unlock (kalan adaylar) ---
header('6) Seeker ek aday paketini seciyor');
await handleInbound({ waId: seeker, buttonId: 'unlock_2' });
showLast(seeker, 'unlock odeme linki');
const unlockPayment = payments.latestPendingByListing(code);
line(`  Unlock odeme referansi: ${unlockPayment.reference} (${unlockPayment.amount} TL, ${unlockPayment.package})`);
await onPaymentPaid(unlockPayment.reference);
showLast(seeker, 'ek numaralar acildi');

// --- 7) Ozet / denetim ---
header('7) Ozet ve denetim (RevealLog)');
const finalListing = listings.getByCode(code);
line(`  Ilan durumu: ${finalListing.status}`);
const revealLogs = reveals.listByListing(code);
line(`  Acilan numara sayisi (RevealLog): ${revealLogs.length}`);
revealLogs.forEach((r) =>
  line(`     - ${r.worker_wa_id} (paket: ${r.package}, ref: ${r.payment_reference || '-'})`)
);
const paidAll = payments.listPaidByListing(code);
line(`  Odenen paketler: ${paidAll.map((p) => `${p.package}:${p.amount}TL`).join(', ')}`);
line(`  Toplam tahsilat: ${paidAll.reduce((s, p) => s + p.amount, 0)} TL`);

header('8) Is arayan (worker) akisi ornegi');
const worker = '905557777777';
await handleInbound({ waId: worker, text: 'İş arıyorum' });
showLast(worker, 'KVKK');
await handleInbound({ waId: worker, buttonId: 'kvkk_yes' });
await handleInbound({ waId: worker, text: 'yaşlı bakımı' });
await handleInbound({ waId: worker, text: 'Üsküdar' });
await handleInbound({ waId: worker, buttonId: 'live_in_1' });
await handleInbound({ waId: worker, text: '4' });
await handleInbound({ waId: worker, text: '27 bin' });
await handleInbound({ waId: worker, buttonId: 'yn_yes' });
showLast(worker, 'profil olusturuldu');
const savedWorker = workers.getByWaId(worker);
line(`  Kaydedilen profil: ${savedWorker.name} — ${savedWorker.serviceTypes.join(',')} — ${savedWorker.districts.join(',')}`);

line();
line('SIMULASYON TAMAMLANDI ✓');
