// Aday <-> ilan uyum skoru. 0..100 arasi.
// Girdiler: listing (DB satiri), worker profile (hydrate edilmis) veya minimal aday.

const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR');

export const scoreCandidate = (listing, worker, opts = {}) => {
  let score = 0;
  const reasons = [];

  const listingService = listing.service_type || listing.serviceType;
  const services = worker.serviceTypes || [];

  // Hizmet turu uyumu (en onemli): 40 puan
  if (services.includes(listingService)) {
    score += 40;
    reasons.push('hizmet-uyumlu');
  } else if (services.length === 0) {
    score += 10; // bilgi yok, kismi
  }

  // Semt uyumu: 20 puan
  const listingDistrict = norm(listing.district);
  const districts = (worker.districts || []).map(norm);
  if (listingDistrict && districts.includes(listingDistrict)) {
    score += 20;
    reasons.push('semt-uyumlu');
  } else if (!listingDistrict || districts.length === 0) {
    score += 8;
  }

  // Yatili/gunduzlu uyumu: 15 puan
  const lLive = listing.live_in ?? listing.liveIn;
  const wLive = worker.liveIn ?? worker.live_in;
  if (lLive == null || wLive == null) {
    score += 6;
  } else if (lLive === wLive) {
    score += 15;
    reasons.push('calisma-uyumlu');
  }

  // Maas ortusmesi: 15 puan
  const lMin = listing.salary_min ?? listing.salaryMin;
  const lMax = listing.salary_max ?? listing.salaryMax;
  const wMin = worker.expected_salary_min ?? worker.expectedSalaryMin;
  const wMax = worker.expected_salary_max ?? worker.expectedSalaryMax;
  if (lMax && wMin) {
    if (wMin <= lMax) {
      score += 15;
      reasons.push('ucret-uyumlu');
    } else if (wMin <= lMax * 1.15) {
      score += 8; // az uzerinde, pazarlik olabilir
    }
  } else {
    score += 6;
  }

  // Deneyim: 6 puan
  const exp = worker.experience_years ?? worker.experienceYears ?? 0;
  score += Math.min(6, exp);
  if (exp >= 3) reasons.push('deneyimli');

  // Referans: 4 puan
  if (worker.has_reference || worker.hasReference) {
    score += 4;
    reasons.push('referansli');
  }

  // "Evet" / basvuru hizi bonusu: erken yanit verene kucuk bonus
  if (opts.responseRank != null) {
    score += Math.max(0, 5 - opts.responseRank);
  }

  return { score: Math.round(Math.min(100, score) * 100) / 100, reasons };
};

export default { scoreCandidate };
