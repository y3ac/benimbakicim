import crypto from 'node:crypto';
import config from '../config.js';
import logger from '../utils/logger.js';
import { generateReference } from '../utils/code.js';
import { payments as paymentsRepo, listings as listingsRepo, seekers as seekersRepo } from '../repositories/index.js';
import { logEvent } from '../services/audit.js';
import { savePayBundle } from '../store/blobs.js';
import iyzico from './iyzico.js';
import paytr from './paytr.js';

// Paket tanimlari
export const PACKAGES = {
  base_300: { amount: config.pricing.base, label: 'İlan Paketi (2 Aday)', retailer: config.whatsapp.retailerIds.base },
  unlock_300: { amount: config.pricing.unlock2, label: 'Ek Aday Açma', retailer: config.whatsapp.retailerIds.unlock2 },
  unlock_900: { amount: config.pricing.unlock6, label: '6+ Aday Paketi', retailer: config.whatsapp.retailerIds.unlock6 },
};

// --- Saglayici implementasyonlari ---
// Her saglayici async createLink() -> { link, providerRef } | null (null => fallback) doner.

const stubLink = (reference) => `${config.publicBaseUrl}/pay/${reference}`;

const mockProvider = {
  name: 'mock',
  async createLink({ reference }) {
    return { link: stubLink(reference), providerRef: null };
  },
};

const iyzicoProvider = {
  name: 'iyzico',
  async createLink({ reference, amount, listingCode, waId }) {
    const listing = listingsRepo.getByCode(listingCode);
    const seeker = seekersRepo.getByWaId ? seekersRepo.getByWaId(waId) : null;
    return iyzico.createCheckoutLink({
      reference,
      amountTl: amount,
      listing,
      waId,
      buyerName: seeker?.name,
    });
  },
  async isPaidRemote(providerRef) {
    return iyzico.isCheckoutPaid(providerRef);
  },
};

const paytrProvider = {
  name: 'paytr',
  async createLink({ reference, amount }) {
    return paytr.createPaymentLink({ reference, amountTl: amount });
  },
};

const providers = {
  mock: mockProvider,
  iyzico: iyzicoProvider,
  paytr: paytrProvider,
};

export const getProvider = () => providers[config.payments.provider] || mockProvider;

// Bir ilan icin odeme olustur ve link uret. Gercek saglayici hata verirse stub'a duser.
export const createPayment = async ({ listingCode, waId, packageKey }) => {
  const pkg = PACKAGES[packageKey];
  if (!pkg) throw new Error(`Bilinmeyen paket: ${packageKey}`);
  const provider = getProvider();
  const reference = generateReference('PAY');

  let link = stubLink(reference);
  let providerRef = null;
  try {
    const result = await provider.createLink({ reference, amount: pkg.amount, listingCode, waId });
    if (result?.link) {
      link = result.link;
      providerRef = result.providerRef ?? null;
    } else if (provider.name !== 'mock') {
      logger.warn(`${provider.name} kimlik bilgisi eksik; hosted stub kullaniliyor.`);
    }
  } catch (err) {
    logger.error(`${provider.name} link olusturma hatasi: ${err.message}. Stub kullaniliyor.`);
  }

  const payment = paymentsRepo.create({
    reference,
    listingCode,
    waId,
    package: packageKey,
    amount: pkg.amount,
    provider: provider.name,
    link,
    providerRef,
  });
  logger.info(`Odeme olusturuldu ${reference} (${packageKey}, ${pkg.amount} TL) -> ${provider.name}`);
  logEvent({
    type: 'payment_created',
    listingCode,
    waId,
    detail: { reference, package: packageKey, amount: pkg.amount, provider: provider.name },
  });
  await savePayBundle(reference, {
    payment,
    listing: listingsRepo.getByCode(listingCode),
    seeker: seekersRepo.getByWaId(waId),
  });
  return payment;
};

// Odeme saglayici webhook imzasi. Mock/test icin HMAC secret dogrulamasi.
export const verifyPaymentSignature = (rawBody, signature) => {
  if (!config.payments.webhookSecret) return true;
  const expected = crypto
    .createHmac('sha256', config.payments.webhookSecret)
    .update(rawBody)
    .digest('hex');
  if (!signature) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

// Referansa gore odeme durumunu dogrula. Yerelde pending ise saglayiciya sor.
export const lookupPaid = async (reference) => {
  const p = paymentsRepo.getByReference(reference);
  if (!p) return false;
  if (p.status === 'paid') return true;
  const provider = providers[p.provider];
  if (provider?.isPaidRemote && p.provider_ref) {
    try {
      const paid = await provider.isPaidRemote(p.provider_ref);
      if (paid) {
        paymentsRepo.markPaid(reference);
        return true;
      }
    } catch (err) {
      logger.warn(`Uzak odeme durum sorgu hatasi (${reference}): ${err.message}`);
    }
  }
  return false;
};

// PayTR callback dogrulamasi (payments route icin).
export const verifyPaytrCallback = (body) => paytr.verifyCallback(body);

export default {
  PACKAGES,
  createPayment,
  verifyPaymentSignature,
  verifyPaytrCallback,
  getProvider,
  lookupPaid,
};
