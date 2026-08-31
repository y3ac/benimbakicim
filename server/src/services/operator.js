import logger from '../utils/logger.js';
import { listings } from '../repositories/index.js';
import { logEvent } from './audit.js';

// Operatorun elle yaptigi (onay gerektirmeyen) aksiyonlar.
// Iptal/iade DISINDAKI islemler otomatik uygulanir.

const ALLOWED_STATUSES = [
  'draft',
  'awaiting_payment',
  'published',
  'matching',
  'delivered',
  'closed',
];

export const addNote = (listingCode, note, author = 'operator') => {
  logEvent({ type: 'note', listingCode, actor: author, detail: { note } });
  logger.info(`Not eklendi ${listingCode}: ${note}`);
  return { ok: true };
};

export const changeStatus = (listingCode, status, author = 'operator') => {
  const listing = listings.getByCode(listingCode);
  if (!listing) return { ok: false, reason: 'not_found' };
  if (!ALLOWED_STATUSES.includes(status)) return { ok: false, reason: 'invalid_status' };
  // Iptal, elle durum degistirmeyle yapilamaz; onay kuyrugundan gecer.
  const from = listing.status;
  listings.setStatus(listingCode, status);
  logEvent({
    type: 'status_changed',
    listingCode,
    actor: author,
    detail: { from, to: status },
  });
  logger.info(`Durum degistirildi ${listingCode}: ${from} -> ${status}`);
  return { ok: true, from, to: status };
};

export default { addNote, changeStatus, ALLOWED_STATUSES };
