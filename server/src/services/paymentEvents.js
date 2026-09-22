import logger from '../utils/logger.js';
import { payments, listings, seekers, conversations } from '../repositories/index.js';
import { publishAndOffer } from '../listings/service.js';
import { applyUnlock, finalizeMatching } from '../matching/engine.js';
import wa from '../whatsapp/client.js';
import messages from '../bot/messages.js';
import { logEvent } from './audit.js';
import { saveConversation } from '../store/blobs.js';
import { isBasePackage } from '../payments/index.js';

const markSeekerPaid = async (waId, listingCode) => {
  if (!waId) return;
  conversations.save(waId, {
    role: 'seeker',
    state: 'matching',
    context: { listingCode },
  });
  await saveConversation(waId, conversations.get(waId));
};

const isPrepaidShell = (listing) =>
  listing?.source === 'whatsapp_prepaid' ||
  listing?.service_type === 'genel' ||
  /ödeme sonrası/i.test(listing?.notes || '');

// Odeme "paid" oldugunda cagrilir. Pakete gore aksiyon alir.
export const onPaymentPaid = async (reference) => {
  const payment = payments.getByReference(reference);
  if (!payment) {
    logger.warn(`onPaymentPaid: referans bulunamadi ${reference}`);
    return { ok: false, reason: 'not_found' };
  }
  if (payment.status !== 'paid') {
    payments.markPaid(reference);
  }
  logEvent({
    type: 'payment_paid',
    listingCode: payment.listing_code,
    waId: payment.wa_id,
    actor: 'provider',
    detail: { reference, package: payment.package, amount: payment.amount, provider: payment.provider },
  });
  const listing = listings.getByCode(payment.listing_code);
  if (!listing) return { ok: false, reason: 'listing_not_found' };
  const seeker = seekers.getById(listing.seeker_id);
  const waId = payment.wa_id || seeker?.wa_id;

  if (isBasePackage(payment.package)) {
    // Once odeme: once katalog odendi, simdi ilan detaylarini topla.
    if (isPrepaidShell(listing)) {
      if (waId) {
        conversations.save(waId, {
          role: 'seeker',
          state: 'seeker_service',
          context: {
            kvkkOk: true,
            listingCode: listing.code,
            prepaid: true,
            prepaidPaid: true,
            name: seeker?.name,
          },
        });
        await saveConversation(waId, conversations.get(waId));
        await wa.sendText(waId, messages.paymentReceivedAskListing);
      }
      logger.info(`Odeme tamamlandi ${reference} -> ilan detayi bekleniyor (${listing.code})`);
      return { ok: true, action: 'awaiting_listing_details', code: listing.code };
    }

    const { listing: published } = await publishAndOffer(listing);
    if (waId) {
      await wa.sendText(waId, messages.published(published));
      await markSeekerPaid(waId, published.code);
    }
    logger.info(`Odeme tamamlandi ${reference} -> ilan ${published.code} yayinlandi`);
    return { ok: true, action: 'published', code: published.code };
  }

  if (payment.package === 'unlock_300' || payment.package === 'unlock_900') {
    const result = await applyUnlock(payment.listing_code, payment.package, reference);
    if (waId) await markSeekerPaid(waId, payment.listing_code);
    return { ok: true, action: 'unlocked', code: payment.listing_code, ...result };
  }

  return { ok: false, reason: 'unknown_package' };
};

// Test/operasyon icin: bir ilanin eslestirmesini hemen sonuclandir.
export const finalizeNow = (listingCode) => finalizeMatching(listingCode);

export default { onPaymentPaid, finalizeNow };
