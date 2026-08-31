import {
  listings,
  payments,
  applications,
  reveals,
  publications,
  events,
  seekers,
  workers,
  approvals,
} from '../repositories/index.js';
import { serviceLabel } from '../domain/taxonomy.js';

const maskPhone = (p) => {
  const s = String(p || '');
  if (s.length < 6) return s;
  return `${s.slice(0, 4)}****${s.slice(-2)}`;
};

// Bir ilanin odeme durumunu ozetle.
const paymentSummary = (code) => {
  const list = payments.listByListing(code);
  const paid = list.filter((p) => p.status === 'paid');
  const pending = list.filter((p) => p.status === 'pending');
  return {
    all: list,
    paidPackages: paid.map((p) => p.package),
    paidTotal: paid.reduce((s, p) => s + p.amount, 0),
    pendingCount: pending.length,
    pendingTotal: pending.reduce((s, p) => s + p.amount, 0),
    hasPaid: paid.length > 0,
    hasPending: pending.length > 0,
  };
};

// Ilan icin ozet satiri (liste gorunumu).
const listingRow = (listing) => {
  const pay = paymentSummary(listing.code);
  const apps = applications.listByListing(listing.code);
  const state = pay.hasPaid ? 'paid' : pay.hasPending || listing.status === 'awaiting_payment' ? 'awaiting' : 'draft';
  return {
    code: listing.code,
    status: listing.status,
    paymentState: state,
    service: serviceLabel(listing.service_type),
    district: listing.district,
    createdAt: listing.created_at,
    applicants: apps.length,
    revealed: apps.filter((a) => a.revealed).length,
    paidPackages: pay.paidPackages,
    paidTotal: pay.paidTotal,
    pendingCount: pay.pendingCount,
    matchDeadline: listing.match_deadline,
  };
};

export const getOverview = () => {
  const all = listings.listAll().map(listingRow);
  const paidList = all.filter((l) => l.paymentState === 'paid');
  const awaitingList = all.filter((l) => l.paymentState === 'awaiting');
  const draftList = all.filter((l) => l.paymentState === 'draft');

  const allPayments = payments.listAll();
  const paidPayments = allPayments.filter((p) => p.status === 'paid');
  const pendingPayments = allPayments.filter((p) => p.status === 'pending');

  return {
    summary: {
      totalListings: all.length,
      paidListings: paidList.length,
      awaitingListings: awaitingList.length,
      draftListings: draftList.length,
      revenue: paidPayments.reduce((s, p) => s + p.amount, 0),
      pendingRevenue: pendingPayments.reduce((s, p) => s + p.amount, 0),
      paidPaymentCount: paidPayments.length,
      pendingPaymentCount: pendingPayments.length,
    },
    groups: {
      paid: paidList,
      awaiting: awaitingList,
      draft: draftList,
    },
    pendingApprovals: approvals.listPending().map((a) => ({
      ...a,
      service: (() => {
        const l = a.listing_code ? listings.getByCode(a.listing_code) : null;
        return l ? serviceLabel(l.service_type) : null;
      })(),
    })),
    recentEvents: events.listRecent(40),
  };
};

export const getListingDetail = (code) => {
  const listing = listings.getByCode(code);
  if (!listing) return null;
  const seeker = seekers.getById(listing.seeker_id);
  const apps = applications.listByListing(code).map((a) => {
    const w = workers.getByWaId(a.worker_wa_id);
    return {
      waId: a.worker_wa_id,
      name: w?.name || null,
      serviceTypes: w?.serviceTypes || [],
      districts: w?.districts || [],
      experienceYears: w?.experience_years ?? null,
      hasReference: w ? Boolean(w.has_reference) : null,
      score: a.score,
      source: a.source,
      revealed: Boolean(a.revealed),
      phone: a.revealed ? a.worker_wa_id : maskPhone(a.worker_wa_id),
    };
  });
  return {
    code: listing.code,
    status: listing.status,
    service: serviceLabel(listing.service_type),
    district: listing.district,
    liveIn: listing.live_in,
    salaryMin: listing.salary_min,
    salaryMax: listing.salary_max,
    notes: listing.notes,
    aiText: listing.ai_text,
    createdAt: listing.created_at,
    matchDeadline: listing.match_deadline,
    seeker: seeker ? { name: seeker.name, phone: seeker.wa_id } : null,
    payments: payments.listByListing(code),
    paymentSummary: paymentSummary(code),
    applications: apps,
    publications: publications.listByListing(code),
    reveals: reveals.listByListing(code),
    approvals: approvals.listByListing(code),
    events: events.listByListing(code),
  };
};

export default { getOverview, getListingDetail };
