import { getDb } from '../db/index.js';

const json = (v) => (v == null ? null : JSON.stringify(v));
const parse = (v, fallback = null) => {
  if (v == null) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

// ---------------- Seekers (isveren / bakici arayan) ----------------
export const seekers = {
  upsert({ waId, name, kvkkOk }) {
    const db = getDb();
    db.prepare(
      `INSERT INTO seekers (wa_id, name, kvkk_ok) VALUES (?, ?, ?)
       ON CONFLICT(wa_id) DO UPDATE SET
         name = COALESCE(excluded.name, seekers.name),
         kvkk_ok = MAX(seekers.kvkk_ok, excluded.kvkk_ok)`
    ).run(waId, name ?? null, kvkkOk ? 1 : 0);
    return this.getByWaId(waId);
  },
  getByWaId(waId) {
    return getDb().prepare('SELECT * FROM seekers WHERE wa_id = ?').get(waId);
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM seekers WHERE id = ?').get(id);
  },
};

// ---------------- Worker profiles (aday havuzu) ----------------
export const workers = {
  upsert(p) {
    const db = getDb();
    db.prepare(
      `INSERT INTO worker_profiles
        (wa_id, name, service_types, districts, live_in, experience_years, languages,
         expected_salary_min, expected_salary_max, has_reference, kvkk_ok, active)
       VALUES (@wa_id, @name, @service_types, @districts, @live_in, @experience_years, @languages,
         @expected_salary_min, @expected_salary_max, @has_reference, @kvkk_ok, 1)
       ON CONFLICT(wa_id) DO UPDATE SET
         name = COALESCE(excluded.name, worker_profiles.name),
         service_types = COALESCE(excluded.service_types, worker_profiles.service_types),
         districts = COALESCE(excluded.districts, worker_profiles.districts),
         live_in = COALESCE(excluded.live_in, worker_profiles.live_in),
         experience_years = COALESCE(excluded.experience_years, worker_profiles.experience_years),
         languages = COALESCE(excluded.languages, worker_profiles.languages),
         expected_salary_min = COALESCE(excluded.expected_salary_min, worker_profiles.expected_salary_min),
         expected_salary_max = COALESCE(excluded.expected_salary_max, worker_profiles.expected_salary_max),
         has_reference = COALESCE(excluded.has_reference, worker_profiles.has_reference),
         kvkk_ok = MAX(worker_profiles.kvkk_ok, excluded.kvkk_ok)`
    ).run({
      wa_id: p.waId,
      name: p.name ?? null,
      service_types: json(p.serviceTypes),
      districts: json(p.districts),
      live_in: p.liveIn == null ? null : p.liveIn ? 1 : 0,
      experience_years: p.experienceYears ?? 0,
      languages: json(p.languages),
      expected_salary_min: p.expectedSalaryMin ?? null,
      expected_salary_max: p.expectedSalaryMax ?? null,
      has_reference: p.hasReference ? 1 : 0,
      kvkk_ok: p.kvkkOk ? 1 : 0,
    });
    return this.getByWaId(p.waId);
  },
  getByWaId(waId) {
    const row = getDb().prepare('SELECT * FROM worker_profiles WHERE wa_id = ?').get(waId);
    return row ? this.hydrate(row) : null;
  },
  listActive() {
    return getDb()
      .prepare('SELECT * FROM worker_profiles WHERE active = 1')
      .all()
      .map((r) => this.hydrate(r));
  },
  hydrate(row) {
    return {
      ...row,
      serviceTypes: parse(row.service_types, []),
      districts: parse(row.districts, []),
      languages: parse(row.languages, []),
      liveIn: row.live_in,
    };
  },
};

// ---------------- Listings (ilan) ----------------
export const listings = {
  create(l) {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO listings
          (code, seeker_id, source, service_type, district, live_in, salary_min, salary_max, start_date, notes, ai_text, status)
         VALUES (@code, @seeker_id, @source, @service_type, @district, @live_in, @salary_min, @salary_max, @start_date, @notes, @ai_text, @status)`
      )
      .run({
        code: l.code,
        seeker_id: l.seekerId,
        source: l.source ?? 'whatsapp',
        service_type: l.serviceType,
        district: l.district ?? null,
        live_in: l.liveIn == null ? null : l.liveIn ? 1 : 0,
        salary_min: l.salaryMin ?? null,
        salary_max: l.salaryMax ?? null,
        start_date: l.startDate ?? null,
        notes: l.notes ?? null,
        ai_text: l.aiText ?? null,
        status: l.status ?? 'draft',
      });
    return this.getById(info.lastInsertRowid);
  },
  getById(id) {
    return getDb().prepare('SELECT * FROM listings WHERE id = ?').get(id);
  },
  getByCode(code) {
    return getDb().prepare('SELECT * FROM listings WHERE code = ?').get(code);
  },
  setStatus(code, status, extra = {}) {
    const fields = ['status = ?'];
    const params = [status];
    if (extra.matchDeadline !== undefined) {
      fields.push('match_deadline = ?');
      params.push(extra.matchDeadline);
    }
    if (extra.aiText !== undefined) {
      fields.push('ai_text = ?');
      params.push(extra.aiText);
    }
    params.push(code);
    getDb()
      .prepare(`UPDATE listings SET ${fields.join(', ')} WHERE code = ?`)
      .run(...params);
    return this.getByCode(code);
  },
  updateDetails(code, details = {}) {
    const map = {
      serviceType: 'service_type',
      district: 'district',
      liveIn: 'live_in',
      salaryMin: 'salary_min',
      salaryMax: 'salary_max',
      startDate: 'start_date',
      notes: 'notes',
      aiText: 'ai_text',
      source: 'source',
    };
    const fields = [];
    const params = [];
    for (const [key, column] of Object.entries(map)) {
      if (details[key] === undefined) continue;
      fields.push(`${column} = ?`);
      if (key === 'liveIn') {
        params.push(details.liveIn == null ? null : details.liveIn ? 1 : 0);
      } else {
        params.push(details[key]);
      }
    }
    if (!fields.length) return this.getByCode(code);
    params.push(code);
    getDb()
      .prepare(`UPDATE listings SET ${fields.join(', ')} WHERE code = ?`)
      .run(...params);
    return this.getByCode(code);
  },
  dueForMatching(nowIso) {
    return getDb()
      .prepare(
        `SELECT * FROM listings WHERE status IN ('published','matching')
         AND match_deadline IS NOT NULL AND match_deadline <= ?`
      )
      .all(nowIso);
  },
  listAll() {
    return getDb().prepare('SELECT * FROM listings ORDER BY created_at DESC').all();
  },
  latestActiveBySeeker(waId) {
    return getDb()
      .prepare(
        `SELECT l.* FROM listings l JOIN seekers s ON s.id = l.seeker_id
         WHERE s.wa_id = ? AND l.status NOT IN ('cancelled','closed')
         ORDER BY l.id DESC LIMIT 1`
      )
      .get(waId);
  },
};

// ---------------- Applications (basvuru / ilgi) ----------------
export const applications = {
  add({ listingCode, workerWaId, workerProfileId, source, score }) {
    const db = getDb();
    db.prepare(
      `INSERT INTO applications (listing_code, worker_wa_id, worker_profile_id, source, score)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(listing_code, worker_wa_id) DO UPDATE SET
         score = excluded.score,
         source = excluded.source`
    ).run(listingCode, workerWaId, workerProfileId ?? null, source, score ?? 0);
    return this.get(listingCode, workerWaId);
  },
  get(listingCode, workerWaId) {
    return getDb()
      .prepare('SELECT * FROM applications WHERE listing_code = ? AND worker_wa_id = ?')
      .get(listingCode, workerWaId);
  },
  listByListing(listingCode) {
    return getDb()
      .prepare('SELECT * FROM applications WHERE listing_code = ? ORDER BY score DESC, created_at ASC')
      .all(listingCode);
  },
  countByListing(listingCode) {
    return getDb()
      .prepare('SELECT COUNT(*) AS n FROM applications WHERE listing_code = ?')
      .get(listingCode).n;
  },
  setScore(listingCode, workerWaId, score) {
    getDb()
      .prepare('UPDATE applications SET score = ? WHERE listing_code = ? AND worker_wa_id = ?')
      .run(score, listingCode, workerWaId);
  },
  markRevealed(listingCode, workerWaId) {
    getDb()
      .prepare('UPDATE applications SET revealed = 1 WHERE listing_code = ? AND worker_wa_id = ?')
      .run(listingCode, workerWaId);
  },
};

// ---------------- Payments ----------------
export const payments = {
  create(p) {
    const db = getDb();
    db.prepare(
      `INSERT INTO payments (reference, listing_code, wa_id, package, amount, status, provider, link, provider_ref)
       VALUES (@reference, @listing_code, @wa_id, @package, @amount, 'pending', @provider, @link, @provider_ref)`
    ).run({
      reference: p.reference,
      listing_code: p.listingCode,
      wa_id: p.waId,
      package: p.package,
      amount: p.amount,
      provider: p.provider ?? null,
      link: p.link ?? null,
      provider_ref: p.providerRef ?? null,
    });
    return this.getByReference(p.reference);
  },
  setLinkAndRef(reference, link, providerRef) {
    getDb()
      .prepare('UPDATE payments SET link = ?, provider_ref = ? WHERE reference = ?')
      .run(link, providerRef ?? null, reference);
    return this.getByReference(reference);
  },
  getByReference(reference) {
    return getDb().prepare('SELECT * FROM payments WHERE reference = ?').get(reference);
  },
  getByProviderRef(providerRef) {
    if (!providerRef) return undefined;
    return getDb().prepare('SELECT * FROM payments WHERE provider_ref = ?').get(providerRef);
  },
  markPaid(reference) {
    getDb()
      .prepare("UPDATE payments SET status = 'paid', paid_at = datetime('now') WHERE reference = ?")
      .run(reference);
    return this.getByReference(reference);
  },
  setStatus(reference, status) {
    getDb().prepare('UPDATE payments SET status = ? WHERE reference = ?').run(status, reference);
    return this.getByReference(reference);
  },
  listPaidByListing(listingCode) {
    return getDb()
      .prepare("SELECT * FROM payments WHERE listing_code = ? AND status = 'paid'")
      .all(listingCode);
  },
  latestPendingByListing(listingCode) {
    return getDb()
      .prepare(
        "SELECT * FROM payments WHERE listing_code = ? AND status = 'pending' ORDER BY id DESC LIMIT 1"
      )
      .get(listingCode);
  },
  listByListing(listingCode) {
    return getDb()
      .prepare('SELECT * FROM payments WHERE listing_code = ? ORDER BY id DESC')
      .all(listingCode);
  },
  listAll() {
    return getDb().prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
  },
};

// ---------------- Reveal logs ----------------
export const reveals = {
  add({ listingCode, seekerWaId, workerWaId, paymentReference, pkg }) {
    getDb()
      .prepare(
        `INSERT INTO reveal_logs (listing_code, seeker_wa_id, worker_wa_id, payment_reference, package)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(listingCode, seekerWaId, workerWaId, paymentReference ?? null, pkg ?? null);
  },
  listByListing(listingCode) {
    return getDb()
      .prepare('SELECT * FROM reveal_logs WHERE listing_code = ?')
      .all(listingCode);
  },
};

// ---------------- Conversations (state machine) ----------------
export const conversations = {
  get(waId) {
    const row = getDb().prepare('SELECT * FROM conversations WHERE wa_id = ?').get(waId);
    if (!row) return null;
    return { ...row, context: parse(row.context, {}) };
  },
  save(waId, { role, state, context }) {
    getDb()
      .prepare(
        `INSERT INTO conversations (wa_id, role, state, context, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(wa_id) DO UPDATE SET
           role = COALESCE(excluded.role, conversations.role),
           state = excluded.state,
           context = excluded.context,
           updated_at = datetime('now')`
      )
      .run(waId, role ?? null, state, json(context ?? {}));
    return this.get(waId);
  },
  reset(waId) {
    getDb().prepare('DELETE FROM conversations WHERE wa_id = ?').run(waId);
  },
};

// ---------------- Processed messages (Meta tekrar gonderimlerine karsi) ----------------
export const processedMessages = {
  // Mesaj ilk kez goruluyorsa true doner; tekrar gonderimde false.
  claim(messageId) {
    if (!messageId) return true;
    const { changes } = getDb()
      .prepare('INSERT OR IGNORE INTO processed_messages (message_id) VALUES (?)')
      .run(messageId);
    return changes > 0;
  },
};

// ---------------- Events (denetim / aksiyon gunlugu) ----------------
export const events = {
  add({ type, listingCode, waId, actor, detail }) {
    getDb()
      .prepare(
        `INSERT INTO events (type, listing_code, wa_id, actor, detail)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(type, listingCode ?? null, waId ?? null, actor ?? 'system', detail == null ? null : json(detail));
  },
  listByListing(listingCode) {
    return getDb()
      .prepare('SELECT * FROM events WHERE listing_code = ? ORDER BY id ASC')
      .all(listingCode)
      .map((r) => ({ ...r, detail: parse(r.detail, null) }));
  },
  listRecent(limit = 100) {
    return getDb()
      .prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?')
      .all(limit)
      .map((r) => ({ ...r, detail: parse(r.detail, null) }));
  },
};

// ---------------- Approvals (onay kuyrugu) ----------------
export const approvals = {
  create({ type, listingCode, paymentReference, reason, requestedBy, detail }) {
    const info = getDb()
      .prepare(
        `INSERT INTO approvals (type, listing_code, payment_reference, reason, requested_by, detail)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        type,
        listingCode ?? null,
        paymentReference ?? null,
        reason ?? null,
        requestedBy ?? 'ai',
        detail == null ? null : json(detail)
      );
    return this.getById(info.lastInsertRowid);
  },
  getById(id) {
    const row = getDb().prepare('SELECT * FROM approvals WHERE id = ?').get(id);
    return row ? { ...row, detail: parse(row.detail, null) } : null;
  },
  listPending() {
    return getDb()
      .prepare("SELECT * FROM approvals WHERE status = 'pending' ORDER BY id DESC")
      .all()
      .map((r) => ({ ...r, detail: parse(r.detail, null) }));
  },
  pendingForListing(listingCode, type) {
    return getDb()
      .prepare(
        "SELECT * FROM approvals WHERE listing_code = ? AND status = 'pending'" +
          (type ? ' AND type = ?' : '')
      )
      .get(...(type ? [listingCode, type] : [listingCode]));
  },
  listByListing(listingCode) {
    return getDb()
      .prepare('SELECT * FROM approvals WHERE listing_code = ? ORDER BY id DESC')
      .all(listingCode)
      .map((r) => ({ ...r, detail: parse(r.detail, null) }));
  },
  decide(id, status, decidedBy) {
    getDb()
      .prepare(
        "UPDATE approvals SET status = ?, decided_by = ?, decided_at = datetime('now') WHERE id = ?"
      )
      .run(status, decidedBy ?? 'operator', id);
    return this.getById(id);
  },
};

// ---------------- Publications ----------------
export const publications = {
  add({ listingCode, channel, status, externalRef, detail }) {
    getDb()
      .prepare(
        `INSERT INTO publications (listing_code, channel, status, external_ref, detail)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(listingCode, channel, status ?? 'pending', externalRef ?? null, detail ?? null);
  },
  listByListing(listingCode) {
    return getDb()
      .prepare('SELECT * FROM publications WHERE listing_code = ?')
      .all(listingCode);
  },
};

export default {
  seekers,
  workers,
  listings,
  applications,
  payments,
  reveals,
  conversations,
  publications,
  events,
  approvals,
};
