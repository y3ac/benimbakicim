import config from '../config.js';
import logger from '../utils/logger.js';
import { generateListingCode } from '../utils/code.js';
import { listings, seekers, workers, applications } from '../repositories/index.js';
import { composeListingText } from '../ai/index.js';
import { scoreCandidate } from '../matching/scoring.js';
import { publishListing } from '../publishing/index.js';
import wa from '../whatsapp/client.js';
import messages from '../bot/messages.js';
import { logEvent } from '../services/audit.js';

// Taslak ilan olustur (odeme oncesi). Benzersiz kod uretir, AI metni ekler.
export const createDraftListing = async ({ seekerWaId, seekerName, kvkkOk, criteria }) => {
  const seeker = seekers.upsert({ waId: seekerWaId, name: seekerName, kvkkOk });
  let code = generateListingCode();
  // Kod cakismasi ihtimaline karsi
  while (listings.getByCode(code)) code = generateListingCode();

  const draft = {
    code,
    seekerId: seeker.id,
    source: criteria.source || 'whatsapp',
    serviceType: criteria.serviceType,
    district: criteria.district,
    liveIn: criteria.liveIn,
    salaryMin: criteria.salaryMin,
    salaryMax: criteria.salaryMax,
    startDate: criteria.startDate,
    notes: criteria.notes,
    status: 'draft',
  };
  const aiText = await composeListingText({ ...draft });
  const listing = listings.create({ ...draft, aiText });
  logger.info(`Taslak ilan olusturuldu ${code} (${criteria.serviceType})`);
  logEvent({
    type: 'listing_created',
    listingCode: code,
    waId: seekerWaId,
    actor: criteria.source === 'web' ? 'operator' : 'ai',
    detail: { serviceType: criteria.serviceType, district: criteria.district, source: draft.source },
  });
  return listing;
};

// Odeme sonrasi ilani yayinla + havuzdaki uygun adaylara Evet/Hayir teklifi gonder.
export const publishAndOffer = async (listing) => {
  const deadline = new Date(Date.now() + config.matching.windowHours * 3600 * 1000).toISOString();
  const published = listings.setStatus(listing.code, 'published', { matchDeadline: deadline });

  await publishListing(published);

  // Havuzdaki uygun adaylara ilan teklifi (Akis 2 -> Evet/Hayir).
  const pool = workers.listActive();
  let offered = 0;
  for (const worker of pool) {
    const { score } = scoreCandidate(published, worker);
    if (score >= 40) {
      // havuz adayini "pool" kaynakli aday olarak kaydet (henuz Evet dememis)
      applications.add({
        listingCode: published.code,
        workerWaId: worker.wa_id,
        workerProfileId: worker.id,
        source: 'pool',
        score,
      });
      await wa.sendButtons(
        worker.wa_id,
        messages.jobOffer(published),
        messages.jobOfferButtons(published.code)
      );
      offered += 1;
    }
  }
  logger.info(`Ilan ${published.code} yayinlandi, ${offered} havuz adayina teklif gonderildi.`);
  logEvent({
    type: 'published',
    listingCode: published.code,
    detail: { offered, matchDeadline: deadline },
  });
  if (offered > 0) {
    logEvent({ type: 'offer_sent', listingCode: published.code, detail: { count: offered } });
  }
  return { listing: published, offered };
};

export default { createDraftListing, publishAndOffer };
