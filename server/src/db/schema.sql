-- Benim Bakicim - eslestirme sistemi semasi

-- Bakici/yardimci arayan (isveren) taraf
CREATE TABLE IF NOT EXISTS seekers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT UNIQUE NOT NULL,          -- WhatsApp numarasi (ulke koduyla)
  name TEXT,
  kvkk_ok INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Is arayan / calisan profili (aday havuzu)
CREATE TABLE IF NOT EXISTS worker_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT UNIQUE NOT NULL,
  name TEXT,
  service_types TEXT,                  -- JSON: ["bebek","yasli",...]
  districts TEXT,                      -- JSON: ["kadikoy",...]
  live_in INTEGER,                     -- 1 yatili, 0 gunduzlu, NULL farketmez
  experience_years INTEGER DEFAULT 0,
  languages TEXT,                      -- JSON
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
  code TEXT UNIQUE NOT NULL,           -- ILN-XXXX
  seeker_id INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp | web | instagram
  service_type TEXT NOT NULL,          -- bebek | cocuk | yasli | hasta | temizlik | yardimci ...
  district TEXT,
  live_in INTEGER,                     -- 1 yatili, 0 gunduzlu
  salary_min INTEGER,
  salary_max INTEGER,
  start_date TEXT,
  notes TEXT,
  ai_text TEXT,                        -- yapay zeka ile duzenlenmis ilan metni
  status TEXT NOT NULL DEFAULT 'draft',-- draft | awaiting_payment | published | matching | delivered | closed
  match_deadline TEXT,                 -- toplama penceresi bitisi
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (seeker_id) REFERENCES seekers(id)
);

-- Basvuru / ilgi (Evet)
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT NOT NULL,
  worker_wa_id TEXT NOT NULL,
  worker_profile_id INTEGER,
  source TEXT NOT NULL,                -- apply | yes_button | pool
  score REAL DEFAULT 0,
  revealed INTEGER NOT NULL DEFAULT 0, -- numarasi arayana acildi mi
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
  package TEXT NOT NULL,               -- base_300 | unlock_300 | unlock_900
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | expired
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
  role TEXT,                           -- seeker | worker | unknown
  state TEXT NOT NULL DEFAULT 'start',
  context TEXT,                        -- JSON: toplanan gecici veriler
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Yayin kaydi
CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT NOT NULL,
  channel TEXT NOT NULL,               -- wa_group:xxx | instagram | facebook | wa_channel
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | skipped
  external_ref TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (listing_code) REFERENCES listings(code)
);

-- Denetim / aksiyon gunlugu (operator + AI takibi icin)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_code TEXT,                   -- ilgili ilan (varsa)
  wa_id TEXT,                          -- ilgili kullanici (varsa)
  type TEXT NOT NULL,                  -- listing_created | payment_created | payment_paid | published | offer_sent | candidate_revealed | matching_pending | matching_finalized | publication | note
  actor TEXT NOT NULL DEFAULT 'system',-- system | ai | operator | provider
  detail TEXT,                         -- JSON serbest aciklama
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Onay kuyrugu: iptal/iade gibi kritik islemler operator onayi bekler
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                  -- cancel_listing | refund
  listing_code TEXT,
  payment_reference TEXT,
  reason TEXT,
  requested_by TEXT NOT NULL DEFAULT 'ai', -- ai | operator | seeker
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
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
