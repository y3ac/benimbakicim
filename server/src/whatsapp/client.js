import crypto from 'node:crypto';
import config, { isWhatsappLive } from '../config.js';
import logger from '../utils/logger.js';
import { httpRequest } from '../utils/http.js';

const graphUrl = (pathPart) =>
  `https://graph.facebook.com/${config.whatsapp.apiVersion}/${pathPart}`;

// Giden mesajlarin denetlenebilmesi icin bellekte tutulan kayit (test/simulasyon).
export const outbox = [];

const record = (to, payload) => {
  const entry = { to, payload, at: new Date().toISOString() };
  outbox.push(entry);
  return entry;
};

const post = async (body) => {
  // Canli degilse (token yok) veya DRY_RUN acikken gercek istek atma; sadece kaydet.
  if (!isWhatsappLive() || config.dryRun) {
    logger.debug('[WA outbox]', JSON.stringify(body));
    record(body.to, body);
    return { simulated: true, body };
  }
  const res = await httpRequest(graphUrl(`${config.whatsapp.phoneNumberId}/messages`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
    timeoutMs: 15000,
    retries: 2,
  });
  if (!res.ok) {
    const err = res.data?.error;
    logger.error('WhatsApp gonderim hatasi', res.status, JSON.stringify(res.data || res.text));
    throw new Error(`WhatsApp API ${res.status}: ${err?.message || 'gonderim basarisiz'}`);
  }
  return res.data;
};

export const sendText = (to, text, previewUrl = false) =>
  post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text, preview_url: previewUrl },
  });

// Interaktif buton mesaji (en fazla 3 buton). buttons: [{id,title}]
export const sendButtons = (to, bodyText, buttons, header, footer) =>
  post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(header ? { header: { type: 'text', text: header } } : {}),
      body: { text: bodyText },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });

// Tek urun katalog mesaji (odeme paketi vitrini).
export const sendCatalogProduct = (to, bodyText, retailerId, footer) =>
  post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'product',
      body: { text: bodyText },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        catalog_id: config.whatsapp.catalogId,
        product_retailer_id: retailerId,
      },
    },
  });

// Onayli sablon mesaji (24 saat penceresi disinda kullanilir).
export const sendTemplate = (to, templateName, languageCode = 'tr', components = []) =>
  post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: { name: templateName, language: { code: languageCode }, components },
  });

// Meta webhook imza dogrulamasi (X-Hub-Signature-256).
export const verifySignature = (rawBody, signatureHeader) => {
  if (!config.whatsapp.appSecret) return true; // secret yoksa (yerel gelistirme) atla
  if (!signatureHeader) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', config.whatsapp.appSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
};

export default {
  sendText,
  sendButtons,
  sendCatalogProduct,
  sendTemplate,
  verifySignature,
  outbox,
};
