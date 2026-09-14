// Sema, bundle (Netlify Functions/esbuild) ortamlarinda dosya okuma sorunlari
// yasanmamasi icin JS sabiti olarak tutulur. Kaynak referans: schema.sql
export const SCHEMA_SQL = `
-- Benim Bakicim - eslestirme sistemi semasi

-- Bakici/yardimci arayan (isveren) taraf
CREATE TABLE IF NOT EXISTS seekers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT UNIQUE NOT NULL,
  name TEXT,
  kvkk_ok INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Is arayan / calisan profili (aday havuzu)
CREATE TABLE IF NOT EXISTS worker_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT UNIQUE NOT NULL,
  name TEXT,
  service_types TEXT,
  districts TEXT,
  live_in INTEGER,
  experience_years INTEGER DEFAULT 0,
  languages TEXT,
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  has_reference INTEGER DEFAULT 0,
  kvkk_ok INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ilan
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  seeker_id INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'whatsapp',
  service_type TEXT NOT NULL,
  district TEXT,
  live_in INTEGER,
  salary_min INTEGER,
  salary_max INTEGER,
  start_date TEXT,
  notes TEXT,
  ai_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  match_deadline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (seeker_id) REFERENCES seekers(id)
);

-- Basvuru / ilgi (Evet)
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT NOT NULL,
  worker_wa_id TEXT NOT NULL,
  worker_profile_id INTEGER,
  source TEXT NOT NULL,
  score REAL DEFAULT 0,
  revealed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (listing_code, worker_wa_id),
  FOREIGN KEY (listing_code) REFERENCES listings(code)
);

-- Odeme
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  listing_code TEXT NOT NULL,
  wa_id TEXT NOT NULL,
  package TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  link TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (listing_code) REFERENCES listings(code)
);

-- Numara acma kaydi (denetim / KVKK)
CREATE TABLE IF NOT EXISTS reveal_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT NOT NULL,
  seeker_wa_id TEXT NOT NULL,
  worker_wa_id TEXT NOT NULL,
  payment_reference TEXT,
  package TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (listing_code) REFERENCES listings(code)
);

-- WhatsApp konusma durumu (state machine)
CREATE TABLE IF NOT EXISTS conversations (
  wa_id TEXT PRIMARY KEY,
  role TEXT,
  state TEXT NOT NULL DEFAULT 'start',
  context TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Islenmis WhatsApp mesajlari: Meta yeniden gonderirse ayni mesaj iki kez islenmesin
CREATE TABLE IF NOT EXISTS processed_messages (
  message_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Yayin kaydi
CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  external_ref TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (listing_code) REFERENCES listings(code)
);

-- Denetim / aksiyon gunlugu (operator + AI takibi icin)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT,
  wa_id TEXT,
  type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Onay kuyrugu: iptal/iade gibi kritik islemler operator onayi bekler
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  listing_code TEXT,
  payment_reference TEXT,
  reason TEXT,
  requested_by TEXT NOT NULL DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by TEXT,
  decided_at TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_applications_listing ON applications(listing_code);
CREATE INDEX IF NOT EXISTS idx_payments_listing ON payments(listing_code);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_events_listing ON events(listing_code);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
`;

export default SCHEMA_SQL;
