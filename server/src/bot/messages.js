import config from '../config.js';
import { serviceLabel } from '../domain/taxonomy.js';

const { base, unlock2, unlock6, revealBaseCount } = config.pricing;

export const messages = {
  welcome:
    'Merhaba, Benim Bakıcım\'a hoş geldiniz. Size nasıl yardımcı olabiliriz?\n\n' +
    'İlanınızı bakıcı/yardımcı havuzunda yayınlar, başvuruları size iletiriz.',

  askIntent: 'Lütfen size uygun olanı seçin:',
  intentButtons: [
    { id: 'intent_seeker', title: 'Bakıcı arıyorum' },
    { id: 'intent_worker', title: 'İş arıyorum' },
  ],

  kvkkSeeker:
    'Devam etmeden önce: Paylaştığınız bilgiler yalnızca ilan yayını ve başvuru iletimi için ' +
    'kullanılır. Onaylıyor musunuz?',
  kvkkWorker:
    'Devam etmeden önce: Bilgileriniz ve numaranız, ödeme yapan ilan sahibine yalnızca ' +
    'başvuru iletimi için iletilebilir. Onaylıyor musunuz?',
  kvkkButtons: [
    { id: 'kvkk_yes', title: 'Onaylıyorum' },
    { id: 'kvkk_no', title: 'Vazgeç' },
  ],

  askService: 'Ne tür bir bakıcı/yardımcı arıyorsunuz? (bebek, çocuk, yaşlı, hasta, temizlik, ev yardımcısı)',
  askDistrict: 'Hangi ilçedesiniz? (örn: Kadıköy, Üsküdar, Şişli)',
  askLiveIn: 'Çalışma şekli nasıl olsun?',
  liveInButtons: [
    { id: 'live_in_1', title: 'Yatılı' },
    { id: 'live_in_0', title: 'Gündüzlü' },
    { id: 'live_in_any', title: 'Farketmez' },
  ],
  askSalary: 'Aylık ücret aralığınız nedir? (örn: 25-30 bin)',
  askNotes: 'Eklemek istediğiniz özel bir şart var mı? Yoksa "yok" yazabilirsiniz.',

  summaryConfirm: (listing) =>
    'İlanınızı kontrol edelim:\n\n' +
    `${listing.aiText || ''}\n\n` +
    'Onaylıyor musunuz?',
  summaryButtons: [
    { id: 'listing_confirm', title: 'Onayla' },
    { id: 'listing_edit', title: 'Baştan başla' },
  ],

  paymentIntro: (listing) =>
    `İlan kodunuz: ${listing.code}\n\n` +
    `Ödeme yalnızca WhatsApp katalog üzerinden alınır.\n` +
    `İlan paketi ${base} TL — paket başına en fazla ${revealBaseCount} başvuran numarası.\n` +
    'Ödemeyi katalogdan tamamladıktan sonra ilan bilgilerinizi yazarak ilanınızı oluşturursunuz.',

  catalogPaymentHint:
    'Yukarıdaki katalog ürününden ödemeyi tamamlayın. Ödeme onayından sonra ilan detaylarınızı soracağız.',

  paymentReceivedAskListing:
    'Ödemeniz alındı. Şimdi ilanınızı oluşturalım.\n\n' +
    'Ne tür bir bakıcı/yardımcı arıyorsunuz? (bebek, çocuk, yaşlı, hasta, temizlik, ev yardımcısı)',

  paymentLink: () =>
    'Ödeme yalnızca WhatsApp katalog üzerinden yapılır. Katalog ürününü kullanarak ödemeyi tamamlayın.',

  published: (listing) =>
    `İlanınız (${listing.code}) yayınlandı. Başvurular toplanıyor.\n` +
    `Paket başına en fazla ${revealBaseCount} başvuran numarası WhatsApp ile iletilecek.\n` +
    'Referans kontrolü / ön görüşme yapmıyoruz; görüşmeyi siz yönetirsiniz.',

  noCandidatesYet: (listing) =>
    `İlanınız (${listing.code}) için henüz yeterli başvuru oluşmadı. ` +
    'Havuzdaki uygun adaylara ilanınız iletildi; başvuru geldikçe sizi bilgilendireceğiz.',

  topReveal: (listing, revealed, remainingCount) => {
    const lines = [`İlan ${listing.code} için iletilen başvurular:\n`];
    revealed.forEach((c, i) => {
      lines.push(
        `${i + 1}. ${c.name || 'Başvuran'} — ${c.summary}\n   📞 ${c.phone}`
      );
    });
    if (remainingCount > 0) {
      lines.push('');
      lines.push(
        `Ayrıca ${remainingCount} başvuru daha var. ` +
        'Ek numaralar için aynı paketi tekrar satın almanız gerekir.'
      );
    }
    return lines.join('\n');
  },

  maskedList: (masked) => {
    if (masked.length === 0) return '';
    const lines = ['Diğer uygun adaylar (numara gizli):'];
    masked.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.name || 'Aday'} — ${c.summary}`);
    });
    return lines.join('\n');
  },

  unlockOffer: (remainingCount) => {
    if (remainingCount >= config.pricing.unlock6Threshold) {
      return (
        `${remainingCount} uygun aday daha var. Tümünün numarasını açmak için ${unlock6} TL ` +
        'ödeyebilirsiniz.'
      );
    }
    return (
      `${remainingCount} uygun aday daha var. Sıradaki adayların numarasını açmak için ` +
      `${unlock2} TL ödeyebilirsiniz.`
    );
  },
  unlockButtons: (remainingCount) => [
    {
      id: remainingCount >= config.pricing.unlock6Threshold ? 'unlock_6' : 'unlock_2',
      title: remainingCount >= config.pricing.unlock6Threshold ? `Tümü (${unlock6} TL)` : `Aç (${unlock2} TL)`,
    },
    { id: 'unlock_no', title: 'Şimdilik yeter' },
  ],

  // ---- Worker (is arayan) tarafi ----
  workerAskService: 'Hangi alanlarda çalışıyorsunuz? (bebek, çocuk, yaşlı, hasta, temizlik, ev yardımcısı)',
  workerAskDistrict: 'Hangi ilçelerde çalışabilirsiniz?',
  workerAskLiveIn: 'Çalışma tercihiniz?',
  workerAskExperience: 'Kaç yıl deneyiminiz var? (sayı olarak)',
  workerAskSalary: 'Beklediğiniz aylık ücret nedir? (örn: 25 bin)',
  workerAskReference: 'Referansınız var mı?',
  yesNoButtons: [
    { id: 'yn_yes', title: 'Evet' },
    { id: 'yn_no', title: 'Hayır' },
  ],
  workerDone:
    'Teşekkürler, profiliniz oluşturuldu. Size uygun ilanlar çıktıkça buradan haber vereceğiz.',

  jobOffer: (listing) =>
    `Yeni iş ilanı — ${listing.code}\n\n${listing.ai_text || ''}\n\nİlgileniyor musunuz?`,
  jobOfferButtons: (code) => [
    { id: `apply_yes_${code}`, title: 'Evet, ilgileniyorum' },
    { id: `apply_no_${code}`, title: 'Hayır' },
  ],
  applied: (code) =>
    `Başvurunuz alındı (${code}). İlan sahibi onaylarsa bilgileriniz iletilecektir.`,

  fallback:
    'Sizi doğru yönlendirebilmem için lütfen aşağıdaki seçeneklerden birini kullanın.',
  handoff:
    'Talebinizi aldık. Bir danışmanımız en kısa sürede size dönecek.',
};

export const candidateSummary = (worker) => {
  const parts = [];
  if (worker.serviceTypes?.length) parts.push(worker.serviceTypes.map(serviceLabel).join(', '));
  if (worker.experience_years || worker.experienceYears)
    parts.push(`${worker.experience_years ?? worker.experienceYears} yıl deneyim`);
  if (worker.has_reference || worker.hasReference) parts.push('referanslı');
  if (worker.liveIn === 1) parts.push('yatılı');
  else if (worker.liveIn === 0) parts.push('gündüzlü');
  return parts.join(', ') || 'Deneyimli aday';
};

export default messages;
