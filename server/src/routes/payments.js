import express from 'express';
import config from '../config.js';
import logger from '../utils/logger.js';
import { payments, listings, seekers } from '../repositories/index.js';
import { verifyPaymentSignature, verifyPaytrCallback } from '../payments/index.js';
import iyzico from '../payments/iyzico.js';
import { onPaymentPaid } from '../services/paymentEvents.js';
import { loadPayBundle, savePayBundle } from '../store/blobs.js';

const router = express.Router();

const restorePayment = async (reference) => {
  let payment = payments.getByReference(reference);
  if (payment) return payment;
  const bundle = await loadPayBundle(reference);
  if (!bundle?.payment) return null;
  const row = bundle.payment;
  const listingRow = bundle.listing;
  if (bundle.seeker?.wa_id) {
    seekers.upsert({
      waId: bundle.seeker.wa_id,
      name: bundle.seeker.name,
      kvkkOk: Boolean(bundle.seeker.kvkk_ok),
    });
  } else if (row.wa_id) {
    seekers.upsert({ waId: row.wa_id, kvkkOk: true });
  }
  if (listingRow && !listings.getByCode(listingRow.code)) {
    const seeker = seekers.getByWaId(row.wa_id);
    listings.create({
      code: listingRow.code,
      seekerId: seeker?.id,
      source: listingRow.source,
      serviceType: listingRow.service_type,
      district: listingRow.district,
      liveIn: listingRow.live_in,
      salaryMin: listingRow.salary_min,
      salaryMax: listingRow.salary_max,
      startDate: listingRow.start_date,
      notes: listingRow.notes,
      aiText: listingRow.ai_text,
      status: listingRow.status || 'awaiting_payment',
    });
  }
  if (!payments.getByReference(row.reference)) {
    payments.create({
      reference: row.reference,
      listingCode: row.listing_code,
      waId: row.wa_id,
      package: row.package,
      amount: row.amount,
      provider: row.provider,
      link: row.link,
      providerRef: row.provider_ref,
    });
  }
  logger.info(`Odeme blob'dan geri yuklendi ${reference}`);
  return payments.getByReference(reference);
};

// Odeme saglayici webhook'u (iyzico/PayTR/mock). reference + durum bildirir.
router.post('/payments/webhook', async (req, res) => {
  const signature = req.get('x-payment-signature');
  if (!verifyPaymentSignature(req.rawBody, signature)) {
    logger.warn('Odeme webhook imza dogrulanamadi');
    return res.sendStatus(401);
  }
  const { reference, status } = req.body || {};
  if (!reference) return res.status(400).json({ error: 'reference gerekli' });
  res.sendStatus(200);
  if (status && status !== 'paid') {
    logger.info(`Odeme durumu ${reference}: ${status}`);
    return;
  }
  try {
    await onPaymentPaid(reference);
  } catch (err) {
    logger.error('onPaymentPaid hatasi', err.message, err.stack);
  }
});

// iyzico callback: odeme sonrasi token ile geri doner; retrieve ile dogrulanir.
router.post('/payments/iyzico/callback', async (req, res) => {
  const token = req.body?.token;
  const payment = payments.getByProviderRef(token);
  const done = () => res.send('<script>window.close&&window.close();</script>Ödeme alındı, WhatsApp\'a dönebilirsiniz.');
  if (!token || !payment) {
    logger.warn('iyzico callback: eslesen odeme yok');
    return res.status(200).send('Ödeme kaydı bulunamadı.');
  }
  try {
    const paid = await iyzico.isCheckoutPaid(token);
    if (paid) {
      await onPaymentPaid(payment.reference);
      return done();
    }
    return res.status(200).send('Ödeme tamamlanamadı.');
  } catch (err) {
    logger.error('iyzico callback hatasi', err.message);
    return res.status(200).send('Ödeme doğrulanamadı.');
  }
});

// PayTR Link API callback: hash dogrula, success ise odemeyi tamamla.
router.post('/payments/paytr/callback', async (req, res) => {
  const body = req.body || {};
  if (!verifyPaytrCallback(body)) {
    logger.warn('PayTR callback hash dogrulanamadi');
    return res.status(200).send('PAYTR notification failed: bad hash');
  }
  // PayTR "OK" bekler; aksi halde tekrar dener.
  res.send('OK');
  if (body.status !== 'success') return;
  const reference = body.callback_id;
  const payment = reference ? payments.getByReference(reference) : payments.getByProviderRef(body.id);
  if (!payment) {
    logger.warn(`PayTR callback: eslesen odeme yok (callback_id=${reference}, id=${body.id})`);
    return;
  }
  try {
    await onPaymentPaid(payment.reference);
  } catch (err) {
    logger.error('PayTR onPaymentPaid hatasi', err.message);
  }
});

// Hosted checkout stub (mock/gelistirme). Gercek saglayicida bu sayfa saglayicida barinar.
router.get('/pay/:reference', async (req, res) => {
  const payment = await restorePayment(req.params.reference);
  if (!payment) return res.status(404).send('Ödeme bulunamadı');
  if (payment.status === 'paid') return res.send('<h2>Bu ödeme zaten tamamlandı.</h2>');
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Benim Bakıcım — Ödeme</title>
    <style>
      body{font-family:system-ui,Arial,sans-serif;background:#faf8f5;color:#0f2744;
        display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
      .card{background:#fff;padding:32px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.08);max-width:360px;width:90%}
      h1{font-size:20px;margin:0 0 8px}.amt{font-size:32px;font-weight:700;color:#c45c26;margin:16px 0}
      button{width:100%;padding:14px;border:0;border-radius:10px;background:#25D366;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
      .muted{color:#6b7280;font-size:13px;margin-top:12px}
    </style></head><body>
    <div class="card">
      <h1>Benim Bakıcım</h1>
      <div>İlan: <strong>${payment.listing_code}</strong> — ${payment.package}</div>
      <div class="amt">${payment.amount} TL</div>
      <button onclick="pay()">Ödemeyi Tamamla</button>
      <div class="muted">Test ortamı (mock). Gerçek ödeme iyzico/PayTR ile alınır.</div>
    </div>
    <script>
      async function pay(){
        const r = await fetch(location.pathname + '/complete', {method:'POST'});
        if(r.ok){document.querySelector('.card').innerHTML='<h1>Ödeme alındı ✓</h1><p>WhatsApp\\'a dönebilirsiniz.</p>';}
        else{alert('Ödeme tamamlanamadı');}
      }
    </script></body></html>`);
});

// Mock odeme tamamlama (yalnizca mock/gelistirme). Uretimde saglayici webhook'u kullanilir.
router.post('/pay/:reference/complete', async (req, res) => {
  if (config.payments.provider !== 'mock' && !config.dryRun) {
    return res.status(403).json({ error: 'Bu uç yalnızca mock/dry-run ortamında kullanılır' });
  }
  const payment = await restorePayment(req.params.reference);
  if (!payment) return res.status(404).json({ error: 'not_found' });
  try {
    await onPaymentPaid(payment.reference);
    await savePayBundle(payment.reference, {
      payment: payments.getByReference(payment.reference),
      listing: listings.getByCode(payment.listing_code),
      seeker: seekers.getByWaId(payment.wa_id),
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error('mock complete hatasi', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
