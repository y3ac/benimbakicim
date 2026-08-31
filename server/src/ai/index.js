import config, { isAiEnabled } from '../config.js';
import logger from '../utils/logger.js';
import { serviceLabel } from '../domain/taxonomy.js';
import { httpRequest } from '../utils/http.js';

const liveInLabel = (v) => (v === 1 ? 'Yatılı' : v === 0 ? 'Gündüzlü' : 'Farketmez');

const salaryLabel = (min, max) => {
  if (!min && !max) return 'Görüşülür';
  if (min && max && min !== max) return `${min.toLocaleString('tr-TR')} - ${max.toLocaleString('tr-TR')} TL`;
  const v = min || max;
  return `${v.toLocaleString('tr-TR')} TL`;
};

// Kural tabanli ilan metni (AI kapaliyken veya hata durumunda).
export const buildListingTextFallback = (listing) => {
  const parts = [
    `İş: ${serviceLabel(listing.serviceType || listing.service_type)}`,
    listing.district ? `Bölge: ${capitalize(listing.district)}` : 'Bölge: İstanbul',
    `Çalışma: ${liveInLabel(listing.liveIn ?? listing.live_in)}`,
    `Ücret: ${salaryLabel(listing.salaryMin ?? listing.salary_min, listing.salaryMax ?? listing.salary_max)}`,
  ];
  if (listing.startDate || listing.start_date) parts.push(`Başlangıç: ${listing.startDate || listing.start_date}`);
  if (listing.notes) parts.push(`Not: ${listing.notes}`);
  return parts.join('\n');
};

const capitalize = (s) => (s ? s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1) : s);

const chat = async (messages, { json = false, temperature = 0.4 } = {}) => {
  const res = await httpRequest(`${config.ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.ai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: config.ai.model,
      temperature,
      messages,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    },
    timeoutMs: 20000,
    retries: 2,
  });
  if (!res.ok) {
    throw new Error(`AI ${res.status}: ${(res.text || '').slice(0, 200)}`);
  }
  return res.data?.choices?.[0]?.message?.content ?? '';
};

// Ilani standart, temiz bir ilan metnine cevir. AI yoksa fallback.
export const composeListingText = async (listing) => {
  if (!isAiEnabled()) return buildListingTextFallback(listing);
  try {
    const sys =
      'Sen bir bakıcı/yardımcı ajansının ilan editörüsün. Verilen bilgilerden kısa, ' +
      'profesyonel, Türkçe bir iş ilanı metni yaz. Telefon numarası, tam adres veya ' +
      'kişisel veri EKLEME. En fazla 6 satır. Başvuru için ilan kodunu kullanmalarını iste.';
    const user = JSON.stringify({
      hizmet: serviceLabel(listing.serviceType || listing.service_type),
      bolge: listing.district || 'İstanbul',
      calisma: liveInLabel(listing.liveIn ?? listing.live_in),
      ucret: salaryLabel(listing.salaryMin ?? listing.salary_min, listing.salaryMax ?? listing.salary_max),
      baslangic: listing.startDate || listing.start_date || null,
      not: listing.notes || null,
      ilan_kodu: listing.code,
    });
    const text = await chat(
      [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      { temperature: 0.5 }
    );
    return text.trim() || buildListingTextFallback(listing);
  } catch (err) {
    logger.warn('AI ilan metni hatasi, fallback:', err.message);
    return buildListingTextFallback(listing);
  }
};

export default { composeListingText, buildListingTextFallback };
