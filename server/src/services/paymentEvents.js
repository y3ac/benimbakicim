import logger from '../utils/logger.js';
import { payments, listings, seekers } from '../repositories/index.js';
import { publishAndOffer } from '../listings/service.js';
import { applyUnlock, finalizeMatching } from '../matching/engine.js';
import wa from '../whatsapp/client.js';
import messages from '../bot/messages.js';
import { logEvent } from './audit.js';

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

  if (payment.package === 'base_300') {
    // Ilan yayinla + havuza teklif gonder
    const { listing: published } = await publishAndOffer(listing);
    await wa.sendText(seeker.wa_id, messages.published(published));
    // Eger toplama penceresi kisa/dolmussa hemen finalize denenebilir.
    // Normalde scheduler match_deadline'da finalize eder.
    return { ok: true, action: 'published', code: published.code };
  }

  if (payment.package === 'unlock_300' || payment.package === 'unlock_900') {
    const result = await applyUnlock(payment.listing_code, payment.package, reference);
    return { ok: true, action: 'unlocked', code: payment.listing_code, ...result };
  }

  return { ok: false, reason: 'unknown_package' };
};

// Test/operasyon icin: bir ilanin eslestirmesini hemen sonuclandir.
export const finalizeNow = (listingCode) => finalizeMatching(listingCode);

export default { onPaymentPaid, finalizeNow };
