// Hizmet turleri, ilceler ve serbest metinden bilgi cikarma yardimcilari.

export const SERVICE_TYPES = {
  bebek: { label: 'Bebek Bakıcısı', keywords: ['bebek', 'yeni doğan', 'yenidogan', 'süt', 'sut'] },
  cocuk: { label: 'Çocuk Bakıcısı', keywords: ['çocuk', 'cocuk', 'okul'] },
  yasli: { label: 'Yaşlı Bakıcısı', keywords: ['yaşlı', 'yasli', 'alzheimer', 'demans'] },
  hasta: { label: 'Hasta Bakıcısı', keywords: ['hasta', 'refakat', 'felç', 'felc', 'ameliyat'] },
  temizlik: { label: 'Ev Temizliği', keywords: ['temizlik', 'gündelik', 'gundelik', 'ütü', 'utu'] },
  yardimci: { label: 'Ev Yardımcısı', keywords: ['yardımcı', 'yardimci', 'yatılı yardımcı', 'ev işi', 'ev isi'] },
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

export const detectServiceType = (text) => {
  const t = normalize(text);
  for (const [key, def] of Object.entries(SERVICE_TYPES)) {
    if (def.keywords.some((k) => t.includes(normalize(k)))) return key;
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
  const t = normalize(text);
  const seekerHints = [
    'ariyorum', 'arıyorum', 'lazim', 'lazım', 'ihtiyac', 'ihtiyaç', 'bulmak', 'personel ar',
    'bakici ar', 'bakıcı ar', 'yardimci ar', 'yardımcı ar', 'tutmak',
  ];
  const workerHints = [
    'is ariyorum', 'iş arıyorum', 'is ar', 'iş ar', 'basvuru', 'başvuru', 'calismak', 'çalışmak',
    'is bakiyorum', 'cv', 'bakiciyim', 'bakıcıyım', 'yardimciyim', 'yardımcıyım', 'deneyimliyim',
  ];
  if (workerHints.some((h) => t.includes(normalize(h)))) return 'worker';
  if (seekerHints.some((h) => t.includes(normalize(h)))) return 'seeker';
  return null;
};

export const serviceLabel = (key) => SERVICE_TYPES[key]?.label || key;

export default {
  SERVICE_TYPES,
  DISTRICTS,
  detectServiceType,
  detectDistrict,
  detectLiveIn,
  detectSalaryRange,
  detectIntent,
  serviceLabel,
};
