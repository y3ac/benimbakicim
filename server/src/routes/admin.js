import express from 'express';
import config from '../config.js';
import { getOverview, getListingDetail } from '../services/adminView.js';
import { addNote, changeStatus } from '../services/operator.js';
import { requestCancellation, requestRefund, approve, reject } from '../services/approvals.js';
import { renderAdminPage } from './adminPage.js';

const router = express.Router();

// Token kontrolu: header (x-admin-token) veya query (?token=). Token bos ise serbest.
const checkToken = (req) => {
  if (!config.admin.token) return true;
  const provided = req.get('x-admin-token') || req.query.token;
  return provided === config.admin.token;
};

const guard = (req, res, next) => {
  if (checkToken(req)) return next();
  return res.status(401).json({ error: 'unauthorized', hint: 'x-admin-token veya ?token= gerekli' });
};

// Yonetim paneli (HTML)
router.get('/admin', (req, res) => {
  if (!checkToken(req)) {
    res.status(401).set('Content-Type', 'text/html; charset=utf-8');
    return res.send('<h2>Yetkisiz</h2><p>Panele erişim için <code>?token=ADMIN_TOKEN</code> ekleyin.</p>');
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(renderAdminPage(config.admin.token ? req.query.token : ''));
});

// Genel bakis JSON
router.get('/api/admin/overview', guard, (_req, res) => {
  res.json(getOverview());
});

// Ilan detayi JSON
router.get('/api/admin/listings/:code', guard, (req, res) => {
  const detail = getListingDetail(req.params.code);
  if (!detail) return res.status(404).json({ error: 'not_found' });
  res.json(detail);
});

// --- Operator aksiyonlari (onay gerektirmez) ---

// Not ekle
router.post('/api/admin/listings/:code/notes', guard, (req, res) => {
  const note = (req.body?.note || '').trim();
  if (!note) return res.status(400).json({ error: 'note gerekli' });
  res.json(addNote(req.params.code, note));
});

// Durum degistir (iptal HARIC)
router.post('/api/admin/listings/:code/status', guard, (req, res) => {
  const status = req.body?.status;
  if (status === 'cancelled') {
    return res.status(400).json({ error: 'iptal icin onay kuyrugu kullanin (/cancel-request)' });
  }
  const r = changeStatus(req.params.code, status);
  if (!r.ok) return res.status(400).json(r);
  res.json(r);
});

// --- Onay gerektiren islemler (iptal / iade) ---

// Iptal talebi olustur (AI/operator) -> operator onayi bekler
router.post('/api/admin/listings/:code/cancel-request', guard, (req, res) => {
  const r = requestCancellation({
    listingCode: req.params.code,
    reason: req.body?.reason || '',
    requestedBy: req.body?.requestedBy || 'operator',
  });
  if (!r.ok) return res.status(400).json(r);
  res.json(r);
});

// Iade talebi olustur
router.post('/api/admin/payments/:reference/refund-request', guard, (req, res) => {
  const r = requestRefund({
    paymentReference: req.params.reference,
    reason: req.body?.reason || '',
    requestedBy: req.body?.requestedBy || 'operator',
  });
  if (!r.ok) return res.status(400).json(r);
  res.json(r);
});

// Onay ver (yalnizca operator) -> talebi yurut
router.post('/api/admin/approvals/:id/approve', guard, async (req, res) => {
  const r = await approve(Number(req.params.id), 'operator');
  if (!r.ok) return res.status(400).json(r);
  res.json(r);
});

// Reddet
router.post('/api/admin/approvals/:id/reject', guard, (req, res) => {
  const r = reject(Number(req.params.id), 'operator');
  if (!r.ok) return res.status(400).json(r);
  res.json(r);
});

export default router;
