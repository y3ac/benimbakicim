import crypto from 'crypto';
import config from '../config.js';
import { httpRequest } from '../utils/http.js';
import logger from '../utils/logger.js';

const CREATE_URL = 'https://www.paytr.com/odeme/api/link/create';

const hasCreds = () => {
  const p = config.payments.paytr;
  return Boolean(p.merchantId && p.merchantKey && p.merchantSalt);
};

// PayTR callback yalnizca public https URL kabul eder (localhost/port olmaz).
const buildCallback = () => {
  const base = config.publicBaseUrl || '';
  if (base.startsWith('https://') && !base.includes('localhost')) {
    return `${base}/payments/paytr/callback`;
  }
  return '';
};

// Link ile Odeme (create) -> { link, providerRef(id) }
export const createPaymentLink = async ({ reference, amountTl }) => {
  if (!hasCreds()) return null;
  const { merchantId, merchantKey, merchantSalt } = config.payments.paytr;

  const name = 'Benim Bakicim ilan/aday paketi';
  const price = String(Math.round(Number(amountTl) * 100)); // kurus
  const currency = 'TL';
  const maxInstallment = '1';
  const linkType = 'product';
  const lang = 'tr';
  const minCount = '1';

  const required = name + price + currency + maxInstallment + linkType + lang + minCount;
  const paytrToken = crypto
    .createHmac('sha256', merchantKey)
    .update(required + merchantSalt)
    .digest('base64');

  const callbackLink = buildCallback();
  const form = new URLSearchParams({
    merchant_id: merchantId,
    name,
    price,
    currency,
    max_installment: maxInstallment,
    link_type: linkType,
    lang,
    min_count: minCount,
    debug_on: '1',
    paytr_token: paytrToken,
  });
  if (callbackLink) {
    form.set('callback_link', callbackLink);
    form.set('callback_id', reference);
  }

  const res = await httpRequest(CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    timeoutMs: 20000,
    retries: 1,
  });

  if (!res.data || res.data.status !== 'success') {
    const msg = res.data?.err_msg || res.data?.reason || res.text;
    throw new Error(`PayTR link create hata: ${msg}`);
  }
  return { link: res.data.link, providerRef: res.data.id };
};

// Callback hash dogrulamasi (Link API): id + merchant_oid + salt + status + total_amount
export const verifyCallback = (body) => {
  if (!hasCreds()) return false;
  const { merchantKey, merchantSalt } = config.payments.paytr;
  const id = body.id ?? body.callback_id ?? '';
  const token = `${id}${body.merchant_oid ?? ''}${merchantSalt}${body.status ?? ''}${body.total_amount ?? ''}`;
  const expected = crypto.createHmac('sha256', merchantKey).update(token).digest('base64');
  const ok = expected === body.hash;
  if (!ok) logger.warn('PayTR callback hash uyusmadi');
  return ok;
};

export default { createPaymentLink, verifyCallback };
