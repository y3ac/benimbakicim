import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const bool = (v, fallback = false) => {
  if (v === undefined || v === null || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const list = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = {
  port: num(process.env.PORT, 3000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  dryRun: bool(process.env.DRY_RUN, true),

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'benimbakicim-verify',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v23.0',
    businessPhoneDisplay: process.env.BUSINESS_PHONE_DISPLAY || '0535 596 35 45',
    catalogId: process.env.WHATSAPP_CATALOG_ID || '',
    retailerIds: {
      base: process.env.CATALOG_RETAILER_ID_BASE || 'iln-base-300',
      unlock2: process.env.CATALOG_RETAILER_ID_UNLOCK2 || 'iln-unlock-300',
      unlock6: process.env.CATALOG_RETAILER_ID_UNLOCK6 || 'iln-unlock-900',
    },
  },

  payments: {
    provider: (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase(),
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'degistir-bu-degeri',
    iyzico: {
      apiKey: process.env.IYZICO_API_KEY || '',
      secretKey: process.env.IYZICO_SECRET_KEY || '',
      baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    },
    paytr: {
      merchantId: process.env.PAYTR_MERCHANT_ID || '',
      merchantKey: process.env.PAYTR_MERCHANT_KEY || '',
      merchantSalt: process.env.PAYTR_MERCHANT_SALT || '',
    },
  },

  ai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },

  publishing: {
    igUserId: process.env.IG_USER_ID || '',
    fbPageId: process.env.FB_PAGE_ID || '',
    metaContentToken: process.env.META_CONTENT_ACCESS_TOKEN || '',
    waGroups: list(process.env.PUBLISH_WA_GROUPS || 'istanbul-bakici,istanbul-yardimci'),
    // Faz 2 kanallari (varsayilan kapali)
    waChannelId: process.env.WHATSAPP_CHANNEL_ID || '',
    sahibindenEnabled: bool(process.env.SAHIBINDEN_ENABLED, false),
  },

  pricing: {
    base: num(process.env.PRICE_BASE, 300),
    unlock2: num(process.env.PRICE_UNLOCK2, 300),
    unlock6: num(process.env.PRICE_UNLOCK6, 900),
    revealBaseCount: num(process.env.REVEAL_BASE_COUNT, 2),
    revealUnlock2Count: num(process.env.REVEAL_UNLOCK2_COUNT, 2),
    unlock6Threshold: num(process.env.UNLOCK6_THRESHOLD, 6),
  },

  matching: {
    windowHours: num(process.env.MATCH_WINDOW_HOURS, 24),
  },

  admin: {
    // Yonetim paneli erisim anahtari. Bos ise (yerel gelistirme) korumasiz calisir.
    token: process.env.ADMIN_TOKEN || '',
  },
};

export const isAiEnabled = () => Boolean(config.ai.apiKey);
export const isWhatsappLive = () =>
  Boolean(config.whatsapp.accessToken && config.whatsapp.phoneNumberId);

export default config;
