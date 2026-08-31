import express from 'express';
import { listings, applications, payments, workers } from '../repositories/index.js';
import { createDraftListing } from '../listings/service.js';
import { createPayment } from '../payments/index.js';
import {
  detectServiceType,
  detectDistrict,
  detectLiveIn,
} from '../domain/taxonomy.js';

const router = express.Router();

const normalizeWaId = (phone) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = `90${d.slice(1)}`;
  if (d.length === 10) d = `90${d}`; // 5xxxxxxxxx
  return d;
};

// Web ilan formu -> taslak ilan + odeme linki
router.post('/api/listings', async (req, res) => {
  try {
    const { name, phone, service, district, liveIn, salaryMin, salaryMax, notes, kvkk } = req.body || {};
    if (!phone || !service) return res.status(400).json({ error: 'phone ve service zorunlu' });
    if (!kvkk) return res.status(400).json({ error: 'KVKK onayı gerekli' });

    const waId = normalizeWaId(phone);
    const serviceType = detectServiceType(service) || service;
    const listing = await createDraftListing({
      seekerWaId: waId,
      seekerName: name,
      kvkkOk: true,
      criteria: {
        serviceType,
        district: detectDistrict(district || '') || (district || '').toLocaleLowerCase('tr-TR'),
        liveIn: liveIn === undefined ? detectLiveIn(notes || '') : Number(liveIn),
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        notes: notes || null,
        source: 'web',
      },
    });
    listings.setStatus(listing.code, 'awaiting_payment');
    const payment = await createPayment({
      listingCode: listing.code,
      waId,
      packageKey: 'base_300',
    });
    res.json({
      ok: true,
      code: listing.code,
      aiText: listing.ai_text,
      payment: { reference: payment.reference, amount: payment.amount, link: payment.link },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ilan durumu
router.get('/api/listings/:code', (req, res) => {
  const listing = listings.getByCode(req.params.code);
  if (!listing) return res.status(404).json({ error: 'not_found' });
  const apps = applications.listByListing(listing.code);
  const paid = payments.listPaidByListing(listing.code);
  res.json({
    code: listing.code,
    status: listing.status,
    serviceType: listing.service_type,
    district: listing.district,
    applicants: apps.length,
    revealed: apps.filter((a) => a.revealed).length,
    paidPackages: paid.map((p) => p.package),
    matchDeadline: listing.match_deadline,
  });
});

// Web calisan basvurusu -> aday havuzuna ekle
router.post('/api/workers', (req, res) => {
  try {
    const { name, phone, services, districts, liveIn, experienceYears, salaryMin, salaryMax, hasReference, kvkk } =
      req.body || {};
    if (!phone) return res.status(400).json({ error: 'phone zorunlu' });
    if (!kvkk) return res.status(400).json({ error: 'KVKK onayı gerekli' });
    const waId = normalizeWaId(phone);
    const serviceTypes = (Array.isArray(services) ? services : [services])
      .map((s) => detectServiceType(s) || s)
      .filter(Boolean);
    const worker = workers.upsert({
      waId,
      name,
      serviceTypes,
      districts: Array.isArray(districts) ? districts : districts ? [districts] : [],
      liveIn: liveIn === undefined ? null : Number(liveIn),
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      expectedSalaryMin: salaryMin ? Number(salaryMin) : null,
      expectedSalaryMax: salaryMax ? Number(salaryMax) : null,
      hasReference: Boolean(hasReference),
      kvkkOk: true,
    });
    res.json({ ok: true, id: worker.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
