import config from '../config.js';
import logger from '../utils/logger.js';
import {
  listings,
  applications,
  workers,
  seekers,
  payments,
  reveals,
} from '../repositories/index.js';
import { scoreCandidate } from './scoring.js';
import wa from '../whatsapp/client.js';
import messages, { candidateSummary } from '../bot/messages.js';
import { logEvent } from '../services/audit.js';

// Bir aday satirini gosterime uygun nesneye cevir.
const candidateView = (app) => {
  const worker = workers.getByWaId(app.worker_wa_id);
  return {
    waId: app.worker_wa_id,
    name: worker?.name || null,
    summary: worker ? candidateSummary(worker) : 'Aday',
    phone: app.worker_wa_id,
    score: app.score,
    revealed: Boolean(app.revealed),
    worker,
  };
};

// Ilan icin tum basvurulari (Evet/basvuru + havuz) skorla ve sirala.
export const scoreListing = (listing) => {
  const apps = applications.listByListing(listing.code);
  // Yanit sirasina gore bonus icin index kullan
  apps.forEach((app, idx) => {
    const worker = workers.getByWaId(app.worker_wa_id);
    const base = worker
      ? scoreCandidate(listing, worker, { responseRank: idx }).score
      : app.score || 20;
    applications.setScore(listing.code, app.worker_wa_id, base);
  });
  return applications.listByListing(listing.code);
};

// Toplama penceresi dolan ilanlari isle: skorla, ilk paket ile top-N ac.
export const processDueListings = async (nowIso = new Date().toISOString()) => {
  const due = listings.dueForMatching(nowIso);
  for (const listing of due) {
    await finalizeMatching(listing.code);
  }
  return due.length;
};

// Eslestirmeyi sonuclandir: odeme yapildiysa ilk paket adaylarini ac, ozet gonder.
export const finalizeMatching = async (listingCode) => {
  const listing = listings.getByCode(listingCode);
  if (!listing) return null;
  const seeker = seekers.getById(listing.seeker_id);

  const ranked = scoreListing(listing);
  if (ranked.length === 0) {
    await wa.sendText(seeker.wa_id, messages.noCandidatesYet(listing));
    listings.setStatus(listingCode, 'matching');
    logEvent({
      type: 'matching_pending',
      listingCode,
      detail: { reason: 'no_candidates', candidates: 0 },
    });
    return { listing, revealed: [], remaining: 0 };
  }

  // Ilk paket odemesi yapilmis mi?
  const paid = payments.listPaidByListing(listingCode);
  const basePaid = paid.some((p) => p.package === 'base_300');
  if (!basePaid) {
    // Odeme yoksa numara acilmaz; sadece kac aday oldugunu bildir.
    await wa.sendText(
      seeker.wa_id,
      `İlan ${listing.code} için ${ranked.length} uygun aday oluştu. ` +
        `En uygun ${config.pricing.revealBaseCount} adayın numarasını almak için ilan paketi ödemesi gerekir.`
    );
    listings.setStatus(listingCode, 'matching');
    logEvent({
      type: 'matching_pending',
      listingCode,
      detail: { reason: 'awaiting_payment', candidates: ranked.length },
    });
    return { listing, revealed: [], remaining: ranked.length };
  }

  return revealTopN(listingCode, config.pricing.revealBaseCount, 'base_300');
};

// En uygun N adayin numarasini ac; kalanlari maskeli listele + unlock teklifi.
export const revealTopN = async (listingCode, count, pkg, paymentReference) => {
  const listing = listings.getByCode(listingCode);
  const seekerWaId = seekers.getById(listing.seeker_id)?.wa_id;
  const ranked = applications.listByListing(listingCode);

  const alreadyRevealed = ranked.filter((a) => a.revealed);
  const notRevealed = ranked.filter((a) => !a.revealed);
  const toReveal = notRevealed.slice(0, count);

  for (const app of toReveal) {
    applications.markRevealed(listingCode, app.worker_wa_id);
    reveals.add({
      listingCode,
      seekerWaId,
      workerWaId: app.worker_wa_id,
      paymentReference,
      pkg,
    });
  }

  const revealedViews = [...alreadyRevealed, ...toReveal].map(candidateView);
  const remaining = notRevealed.slice(count);
  const remainingViews = remaining.map(candidateView);

  // Mesaj: acilan numaralar + kalanlarin maskeli listesi
  const msg = messages.topReveal(listing, revealedViews, remainingViews.length);
  await wa.sendText(seekerWaId, msg);

  if (remainingViews.length > 0) {
    const masked = messages.maskedList(remainingViews);
    if (masked) await wa.sendText(seekerWaId, masked);
    await wa.sendButtons(
      seekerWaId,
      messages.unlockOffer(remainingViews.length),
      messages.unlockButtons(remainingViews.length)
    );
  } else {
    listings.setStatus(listingCode, 'delivered');
  }

  logger.info(
    `Ilan ${listingCode}: ${toReveal.length} numara acildi (${pkg}), ${remainingViews.length} aday kaldi.`
  );
  if (toReveal.length > 0) {
    logEvent({
      type: 'candidate_revealed',
      listingCode,
      actor: 'system',
      detail: {
        package: pkg,
        paymentReference: paymentReference ?? null,
        count: toReveal.length,
        workers: toReveal.map((a) => a.worker_wa_id),
        remaining: remainingViews.length,
      },
    });
  }
  if (remainingViews.length === 0) {
    logEvent({
      type: 'matching_finalized',
      listingCode,
      detail: { totalRevealed: revealedViews.length },
    });
  }
  return { listing, revealed: revealedViews, remaining: remainingViews.length };
};

// Unlock paketi odendikten sonra ek numara ac.
export const applyUnlock = async (listingCode, pkg, paymentReference) => {
  const ranked = applications.listByListing(listingCode);
  const remainingCount = ranked.filter((a) => !a.revealed).length;
  if (remainingCount === 0) return { revealed: [], remaining: 0 };

  if (pkg === 'unlock_900') {
    // 6+ paketi: kalan tum uygun adaylari ac
    return revealTopN(listingCode, remainingCount, pkg, paymentReference);
  }
  // unlock_300: sonraki sabit sayida aday
  return revealTopN(listingCode, config.pricing.revealUnlock2Count, pkg, paymentReference);
};

export default {
  scoreListing,
  processDueListings,
  finalizeMatching,
  revealTopN,
  applyUnlock,
};
