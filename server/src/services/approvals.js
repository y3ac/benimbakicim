import logger from '../utils/logger.js';
import { approvals, listings, payments, seekers } from '../repositories/index.js';
import { logEvent } from './audit.js';
import wa from '../whatsapp/client.js';

// KRITIK KURAL: Iptal ve iade otomatik YAPILMAZ. AI/kullanici talep eder,
// yalnizca operator (siz) onayladiginda yurutulur.

// Iptal talebi olustur (AI, kullanici veya operator tarafindan).
export const requestCancellation = ({ listingCode, reason, requestedBy = 'ai' }) => {
  const listing = listings.getByCode(listingCode);
  if (!listing) return { ok: false, reason: 'listing_not_found' };
  if (listing.status === 'cancelled') return { ok: false, reason: 'already_cancelled' };

  const existing = approvals.pendingForListing(listingCode, 'cancel_listing');
  if (existing) return { ok: true, approval: existing, duplicate: true };

  const approval = approvals.create({
    type: 'cancel_listing',
    listingCode,
    reason,
    requestedBy,
  });
  logEvent({
    type: 'cancel_requested',
    listingCode,
    actor: requestedBy,
    detail: { reason, approvalId: approval.id },
  });
  logger.info(`Iptal talebi olusturuldu ${listingCode} (talep: ${requestedBy}) — operator onayi bekleniyor.`);
  return { ok: true, approval };
};

// Iade talebi olustur.
export const requestRefund = ({ paymentReference, reason, requestedBy = 'ai' }) => {
  const payment = payments.getByReference(paymentReference);
  if (!payment) return { ok: false, reason: 'payment_not_found' };
  if (payment.status === 'refunded') return { ok: false, reason: 'already_refunded' };

  const approval = approvals.create({
    type: 'refund',
    listingCode: payment.listing_code,
    paymentReference,
    reason,
    requestedBy,
    detail: { amount: payment.amount, package: payment.package },
  });
  logEvent({
    type: 'refund_requested',
    listingCode: payment.listing_code,
    actor: requestedBy,
    detail: { reason, paymentReference, amount: payment.amount, approvalId: approval.id },
  });
  logger.info(`Iade talebi olusturuldu ${paymentReference} — operator onayi bekleniyor.`);
  return { ok: true, approval };
};

// --- Yurutme (yalnizca onay sonrasi cagrilir) ---
const executeCancelListing = async (approval) => {
  const listing = listings.getByCode(approval.listing_code);
  if (!listing) return;
  listings.setStatus(listing.code, 'cancelled');
  logEvent({
    type: 'listing_cancelled',
    listingCode: listing.code,
    actor: 'operator',
    detail: { reason: approval.reason, approvalId: approval.id },
  });
  const seeker = seekers.getById(listing.seeker_id);
  if (seeker?.wa_id) {
    await wa.sendText(
      seeker.wa_id,
      `İlanınız (${listing.code}) talebiniz üzerine iptal edilmiştir. Yeni ilan için bize yazabilirsiniz.`
    );
  }
};

const executeRefund = async (approval) => {
  const payment = payments.getByReference(approval.payment_reference);
  if (!payment) return;
  payments.setStatus(payment.reference, 'refunded');
  logEvent({
    type: 'refund_done',
    listingCode: payment.listing_code,
    actor: 'operator',
    detail: { paymentReference: payment.reference, amount: payment.amount, approvalId: approval.id },
  });
  // NOT: Gercek para iadesi saglayici panelinden/API'sinden yapilir; burada durum kaydi tutulur.
};

// Operator onayi: talebi yurut.
export const approve = async (id, decidedBy = 'operator') => {
  const approval = approvals.getById(id);
  if (!approval) return { ok: false, reason: 'not_found' };
  if (approval.status !== 'pending') return { ok: false, reason: 'already_decided' };

  approvals.decide(id, 'approved', decidedBy);
  if (approval.type === 'cancel_listing') await executeCancelListing(approval);
  else if (approval.type === 'refund') await executeRefund(approval);

  logger.info(`Onay verildi #${id} (${approval.type}) — ${decidedBy}`);
  return { ok: true, approval: approvals.getById(id) };
};

// Operator reddi.
export const reject = (id, decidedBy = 'operator') => {
  const approval = approvals.getById(id);
  if (!approval) return { ok: false, reason: 'not_found' };
  if (approval.status !== 'pending') return { ok: false, reason: 'already_decided' };

  approvals.decide(id, 'rejected', decidedBy);
  logEvent({
    type: approval.type === 'refund' ? 'refund_rejected' : 'cancel_rejected',
    listingCode: approval.listing_code,
    actor: decidedBy,
    detail: { approvalId: id },
  });
  logger.info(`Talep reddedildi #${id} (${approval.type}) — ${decidedBy}`);
  return { ok: true, approval: approvals.getById(id) };
};

export default { requestCancellation, requestRefund, approve, reject };
