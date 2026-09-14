// Hizmet turleri, ilceler ve serbest metinden bilgi cikarma yardimcilari.

export const SERVICE_TYPES = {
  bebek: { label: 'Bebek Bakıcısı', keywords: ['bebek', 'yeni doğan', 'yenidogan', 'süt', 'sut', 'bebek bak'] },
  cocuk: { label: 'Çocuk Bakıcısı', keywords: ['çocuk', 'cocuk', 'okul', 'çocuk bak', 'cocuk bak'] },
  yasli: { label: 'Yaşlı Bakıcısı', keywords: ['yaşlı', 'yasli', 'alzheimer', 'demans', 'yaşlı bak', 'yasli bak'] },
  hasta: { label: 'Hasta Bakıcısı', keywords: ['hasta', 'refakat', 'felç', 'felc', 'ameliyat', 'hasta bak'] },
  temizlik: { label: 'Ev Temizliği', keywords: ['temizlik', 'gündelik', 'gundelik', 'ütü', 'utu'] },
  yardimci: { label: 'Ev Yardımcısı', keywords: ['ev yardımcısı', 'ev yardimcisi', 'yatılı yardımcı', 'ev işi', 'ev isi'] },
};

// Istanbul ilceleri (yayin ve eslestirme icin)
export const DISTRICTS = [
  'kadıköy', 'üsküdar', 'ataşehir', 'maltepe', 'kartal', 'pendik', 'tuzla', 'sancaktepe',
  'çekmeköy', 'ümraniye', 'beşiktaş', 'şişli', 'beyoğlu', 'fatih', 'bakırköy', 'bahçelievler',
  'başakşehir', 'esenyurt', 'beylikdüzü', 'avcılar', 'küçükçekmece', 'sarıyer', 'kağıthane',
  'zeytinburnu', 'güngören', 'bağcılar', 'eyüpsultan', 'gaziosmanpaşa', 'sultanbeyli', 'adalar',
];

const normalize = (s) =>
  String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[İıI]/g, 'i')
    .trim();

// Turkce karakterleri ASCII'ye indirger; "İş" / "iş" ayni kabul edilir.
export const foldTr = (s) =>
  normalize(s)
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');

export const detectServiceType = (text) => {
  const t = foldTr(text);
  const hits = [];
  for (const [key, def] of Object.entries(SERVICE_TYPES)) {
    if (def.keywords.some((k) => t.includes(foldTr(k)))) hits.push(key);
  }
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    // Botun kendi sorusu 3+ tur listeler; bunu cevap sanma.
    if (hits.length >= 3) return null;
    let best = null;
    let bestAt = Infinity;
    for (const key of hits) {
      for (const k of SERVICE_TYPES[key].keywords) {
        const at = t.indexOf(foldTr(k));
        if (at >= 0 && at < bestAt) {
          bestAt = at;
          best = key;
        }
      }
    }
    return best;
  }
  return null;
};

export const detectDistrict = (text) => {
  const t = normalize(text);
  for (const d of DISTRICTS) {
    if (t.includes(normalize(d))) return d;
  }
  return null;
};

// "yatılı" / "gündüzlü" tespiti -> 1 / 0 / null
export const detectLiveIn = (text) => {
  const t = normalize(text);
  if (/(yatili|yatılı|24 saat|24saat|kalacak)/.test(t)) return 1;
  if (/(gunduzlu|gündüzlü|gunduz|gelip gid|part[- ]?time|part time)/.test(t)) return 0;
  return null;
};

// Maas araligini serbest metinden cikar. Ornek: "25-30 bin", "25000 30000", "30 bin"
export const detectSalaryRange = (text) => {
  const t = normalize(text).replace(/\./g, '');
  if (/örn|ornek|örnek/.test(t)) return { min: null, max: null };
  const bin = /bin|k\b/.test(t);
  const nums = (t.match(/\d+/g) || []).map((n) => {
    let v = Number(n);
    if (bin && v < 1000) v *= 1000;
    return v;
  });
  const salaries = nums.filter((v) => v >= 1000 && v <= 500000);
  if (salaries.length === 0) return { min: null, max: null };
  if (salaries.length === 1) return { min: salaries[0], max: salaries[0] };
  return { min: Math.min(...salaries), max: Math.max(...salaries) };
};

// Niyet: personel arayan (seeker) mi, is arayan (worker) mi?
export const detectIntent = (text) => {
  const t = foldTr(text);
  if (!t) return null;
  if (/\bbakici\s*ariyorum\b|\byardimci\s*ariyorum\b|\bpersonel\s*ariyorum\b/.test(t)) return 'seeker';
  if (/\bis\s*ariyorum\b|\bis\s*ariyom\b|\bcalismak\s*istiyorum\b|\bbakiciyim\b|\byardimciyim\b/.test(t)) {
    return 'worker';
  }
  if (/\bbasvuru\b|\bcv\b|\bdeneyimliyim\b/.test(t)) return 'worker';
  if (/\bariyorum\b|\blazim\b|\bihtiyac\b|\bbulmak\b|\btutmak\b/.test(t)) return 'seeker';
  return null;
};

// Buton basligi veya kisa serbest metin: kullanici akisi degistirmek istiyor.
export const standaloneIntent = (text) => {
  const t = foldTr(text).replace(/[!.?]+$/g, '').trim();
  if (!t || t.length > 40) return null;
  if (/^(ben\s+)?is\s*ariyorum$/.test(t)) return 'worker';
  if (/^(ben\s+)?(bakici|yardimci)\s*ariyorum$/.test(t)) return 'seeker';
  return null;
};

export const serviceLabel = (key) => SERVICE_TYPES[key]?.label || key;

export default {
  SERVICE_TYPES,
  DISTRICTS,
  foldTr,
  detectServiceType,
  detectDistrict,
  detectLiveIn,
  detectSalaryRange,
  detectIntent,
  standaloneIntent,
  serviceLabel,
};
