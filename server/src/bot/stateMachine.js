import logger from '../utils/logger.js';
import config from '../config.js';
import wa from '../whatsapp/client.js';
import messages from './messages.js';
import {
  conversations,
  workers,
  listings,
  applications,
  payments,
} from '../repositories/index.js';
import {
  detectIntent,
  detectServiceType,
  detectDistrict,
  detectLiveIn,
  detectSalaryRange,
  standaloneIntent,
} from '../domain/taxonomy.js';
import { createDraftListing } from '../listings/service.js';
import { createPayment, PACKAGES } from '../payments/index.js';
import { requestCancellation } from '../services/approvals.js';

const setState = (waId, patch) => {
  const current = conversations.get(waId) || { role: null, state: 'start', context: {} };
  return conversations.save(waId, {
    role: patch.role ?? current.role,
    state: patch.state ?? current.state,
    context: { ...(current.context || {}), ...(patch.context || {}) },
  });
};

// Odeme paketi mesaji: katalog varsa katalog urunu, yoksa link.
const sendPackageOffer = async (waId, listing, packageKey) => {
  const payment = await createPayment({ listingCode: listing.code, waId, packageKey });
  if (config.whatsapp.catalogId) {
    await wa.sendCatalogProduct(
      waId,
      messages.paymentIntro(listing),
      PACKAGES[packageKey].retailer,
      'Benim Bakıcım'
    );
  }
  await wa.sendText(waId, messages.paymentLink(payment));
  return payment;
};

// ---- Ana giris: bir mesaji isle ----
export const handleInbound = async ({ waId, name, text, buttonId }) => {
  const convo = conversations.get(waId) || setState(waId, { state: 'start', context: {} });
  logger.info(`Inbound ${waId} [${convo.state}] ${buttonId ? `btn:${buttonId}` : `"${text}"`}`);

  // Global: apply_yes/no butonlari (havuzdaki adayin ilana yaniti) her durumda islenebilir
  if (buttonId && (buttonId.startsWith('apply_yes_') || buttonId.startsWith('apply_no_'))) {
    return handleJobOfferReply(waId, buttonId);
  }
  // Global: unlock butonlari
  if (buttonId && ['unlock_2', 'unlock_6', 'unlock_no'].includes(buttonId)) {
    return handleUnlockReply(waId, buttonId, convo);
  }

  // Ilan iptali: aktif ilani olan kullanici "iptal" yazarsa AI talep olusturur,
  // ancak iptal YALNIZCA operator onayindan sonra uygulanir.
  if (!buttonId && /(iptal|vazgeç|vazgec)/i.test(text || '')) {
    const handled = await maybeRequestCancellation(waId);
    if (handled) return;
  }

  // Sert sifirlama: yalnizca acik komut. "merhaba" akisi bozmasin.
  if (/^(baştan|bastan|reset|menü|menu)$/i.test(text || '')) {
    conversations.reset(waId);
    return askIntent(waId, name);
  }
  if (
    /^(merhaba|selam)$/i.test(text || '') &&
    ['start', 'await_intent', 'worker_done'].includes(convo.state)
  ) {
    return askIntent(waId, name);
  }

  // Durum kaybolduysa bile KVKK / niyet butonlari ilerlesin.
  if (
    (buttonId === 'kvkk_yes' || /^(onaylıyorum|onayliyorum)$/i.test((text || '').trim())) &&
    ['start', 'await_intent'].includes(convo.state)
  ) {
    if (convo.role === 'worker') return workerKvkk(waId, 'kvkk_yes', text);
    return seekerKvkk(waId, 'kvkk_yes', text);
  }

  const roleIntent = readRoleIntent(buttonId, text);
  const serviceAnswer = !buttonId && detectServiceType(text);

  // Hizmet cevabi ("bebek bakıcısı") niyet/menüye donmesin; soruya devam et.
  if (serviceAnswer && ['start', 'await_intent'].includes(convo.state)) {
    if (convo.role === 'worker') return workerService(waId, text, convo);
    return resumeSeekerWithService(waId, name, serviceAnswer);
  }

  if (roleIntent && !serviceAnswer) {
    const inThisFlow =
      convo.role === roleIntent &&
      convo.state &&
      !['start', 'await_intent', 'worker_done'].includes(convo.state);
    if (!inThisFlow) {
      conversations.reset(waId);
      return roleIntent === 'seeker' ? startSeeker(waId, name) : startWorker(waId, name);
    }
    if (convo.state === 'worker_kvkk' || convo.state === 'seeker_kvkk') return;
  }

  switch (convo.state) {
    case 'start':
      return routeStart(waId, name, text, buttonId);
    case 'await_intent':
      return routeIntent(waId, name, text, buttonId);

    // Seeker akisi
    case 'seeker_kvkk':
      return seekerKvkk(waId, buttonId, text);
    case 'seeker_service':
      return seekerService(waId, text, convo);
    case 'seeker_district':
      return seekerDistrict(waId, text, convo);
    case 'seeker_live_in':
      return seekerLiveIn(waId, text, buttonId, convo);
    case 'seeker_salary':
      return seekerSalary(waId, text, convo);
    case 'seeker_notes':
      return seekerNotes(waId, name, text, convo);
    case 'seeker_confirm':
      return seekerConfirm(waId, buttonId, text, convo);
    case 'awaiting_payment':
      return awaitingPayment(waId, convo);
    case 'matching':
    case 'published':
      return afterPaid(waId, convo);

    // Worker akisi
    case 'worker_kvkk':
      return workerKvkk(waId, buttonId, text);
    case 'worker_service':
      return workerService(waId, text, convo);
    case 'worker_district':
      return workerDistrict(waId, text, convo);
    case 'worker_live_in':
      return workerLiveIn(waId, text, buttonId, convo);
    case 'worker_experience':
      return workerExperience(waId, text, convo);
    case 'worker_salary':
      return workerSalary(waId, text, convo);
    case 'worker_reference':
      return workerReference(waId, name, buttonId, text, convo);

    default:
      return askIntent(waId, name);
  }
};

// Aktif ilani olan kullanicidan iptal talebi al -> onay kuyruguna gonder.
const maybeRequestCancellation = async (waId) => {
  const listing = listings.latestActiveBySeeker(waId);
  if (!listing) return false;
  requestCancellation({
    listingCode: listing.code,
    reason: 'Kullanıcı WhatsApp üzerinden iptal talep etti',
    requestedBy: 'seeker',
  });
  await wa.sendText(
    waId,
    `İlanınız (${listing.code}) için iptal talebiniz alındı. Ekibimizin onayının ` +
      `ardından iptal işlemi tamamlanacak ve size bilgi verilecektir.`
  );
  return true;
};

// ---- Ortak ----
const askIntent = async (waId, name) => {
  setState(waId, { state: 'await_intent', context: { name } });
  await wa.sendText(waId, messages.welcome);
  await wa.sendButtons(waId, messages.askIntent, messages.intentButtons);
};

const buttonFromIntent = (buttonId) => {
  if (buttonId === 'intent_seeker') return 'seeker';
  if (buttonId === 'intent_worker') return 'worker';
  return null;
};

const readRoleIntent = (buttonId, text) =>
  buttonFromIntent(buttonId) || standaloneIntent(text);

const routeIntent = async (waId, name, text, buttonId) => {
  const serviceType = detectServiceType(text);
  if (serviceType && !buttonId) return resumeSeekerWithService(waId, name, serviceType);
  const intent = readRoleIntent(buttonId, text) || detectIntent(text);
  if (intent === 'seeker') return startSeeker(waId, name);
  if (intent === 'worker') return startWorker(waId, name);
  await wa.sendButtons(waId, messages.fallback, messages.intentButtons);
};

const routeStart = async (waId, name, text, buttonId) => {
  const serviceType = detectServiceType(text);
  if (serviceType && !buttonId) return resumeSeekerWithService(waId, name, serviceType);
  const intent = readRoleIntent(buttonId, text) || detectIntent(text);
  if (intent === 'seeker') return startSeeker(waId, name);
  if (intent === 'worker') return startWorker(waId, name);
  return askIntent(waId, name);
};

const isAffirmative = (buttonId, text, yesId) => {
  if (buttonId === yesId) return true;
  return /^(onaylıyorum|onayliyorum|evet|tamam)$/i.test((text || '').trim());
};

const isNegative = (buttonId, text, noId) => {
  if (buttonId === noId) return true;
  return /^(vazgeç|vazgec|hayır|hayir|no)$/i.test((text || '').trim());
};

// Buton ya da serbest metinden calisma sekli: 1 yatili, 0 gunduzlu,
// null farketmez, undefined ise anlasilamadi (tekrar sorulur).
const readLiveIn = (text, buttonId) => {
  if (buttonId === 'live_in_1') return 1;
  if (buttonId === 'live_in_0') return 0;
  if (buttonId === 'live_in_any') return null;
  if (buttonId) return undefined;
  const detected = detectLiveIn(text);
  if (detected !== null) return detected;
  return /farketmez|fark etmez|farkotmez|önemli değil|onemli degil/i.test(text || '')
    ? null
    : undefined;
};

// ---- Seeker akisi ----
const startSeeker = async (waId, name, extras = {}) => {
  setState(waId, {
    role: 'seeker',
    state: 'seeker_kvkk',
    context: { name, ...extras },
  });
  await wa.sendButtons(waId, messages.kvkkSeeker, messages.kvkkButtons);
};

// Oturum dusse bile "bebek bakıcısı" gibi cevap menuye dondurmesin; ilceye gec.
const resumeSeekerWithService = async (waId, name, serviceType) => {
  setState(waId, {
    role: 'seeker',
    state: 'seeker_district',
    context: { name, serviceType, kvkkOk: true },
  });
  await wa.sendText(waId, messages.askDistrict);
};

const seekerKvkk = async (waId, buttonId, text) => {
  if (isNegative(buttonId, text, 'kvkk_no')) {
    conversations.reset(waId);
    await wa.sendText(waId, 'Anladık, işlemi iptal ettik. İhtiyacınız olursa tekrar yazabilirsiniz.');
    return;
  }
  if (!isAffirmative(buttonId, text, 'kvkk_yes')) {
    return wa.sendButtons(waId, messages.kvkkSeeker, messages.kvkkButtons);
  }
  const pending = conversations.get(waId)?.context?.pendingServiceType;
  if (pending) {
    setState(waId, { state: 'seeker_district', context: { kvkkOk: true, serviceType: pending } });
    await wa.sendText(waId, messages.askDistrict);
    return;
  }
  setState(waId, { state: 'seeker_service', context: { kvkkOk: true } });
  await wa.sendText(waId, messages.askService);
};

const seekerService = async (waId, text, convo) => {
  const serviceType = detectServiceType(text);
  if (!serviceType) {
    return wa.sendText(waId, 'Hizmet türünü anlayamadım. Örn: bebek, yaşlı, temizlik. Tekrar yazar mısınız?');
  }
  setState(waId, { state: 'seeker_district', context: { serviceType } });
  await wa.sendText(waId, messages.askDistrict);
};

const seekerDistrict = async (waId, text, convo) => {
  const raw = (text || '').trim();
  if (!raw) return wa.sendText(waId, messages.askDistrict);
  const district = detectDistrict(raw) || raw.toLocaleLowerCase('tr-TR');
  setState(waId, { state: 'seeker_live_in', context: { district } });
  await wa.sendButtons(waId, messages.askLiveIn, messages.liveInButtons);
};

const seekerLiveIn = async (waId, text, buttonId, convo) => {
  const liveIn = readLiveIn(text, buttonId);
  if (liveIn === undefined) {
    return wa.sendButtons(waId, messages.askLiveIn, messages.liveInButtons);
  }
  setState(waId, { state: 'seeker_salary', context: { liveIn } });
  await wa.sendText(waId, messages.askSalary);
};

const seekerSalary = async (waId, text, convo) => {
  const { min, max } = detectSalaryRange(text);
  if (min == null) {
    return wa.sendText(waId, `Ücreti anlayamadım. ${messages.askSalary}`);
  }
  setState(waId, { state: 'seeker_notes', context: { salaryMin: min, salaryMax: max } });
  await wa.sendText(waId, messages.askNotes);
};

const seekerNotes = async (waId, name, text, convo) => {
  const raw = (text || '').trim();
  if (!raw) return wa.sendText(waId, messages.askNotes);
  const notes = /^yok$/i.test(raw) ? null : raw;
  const ctx = { ...convo.context, notes };
  const listing = await createDraftListing({
    seekerWaId: waId,
    seekerName: ctx.name || name,
    kvkkOk: ctx.kvkkOk,
    criteria: {
      serviceType: ctx.serviceType,
      district: ctx.district,
      liveIn: ctx.liveIn,
      salaryMin: ctx.salaryMin,
      salaryMax: ctx.salaryMax,
      notes,
      source: 'whatsapp',
    },
  });
  setState(waId, { state: 'seeker_confirm', context: { listingCode: listing.code } });
  await wa.sendButtons(
    waId,
    messages.summaryConfirm({ aiText: listing.ai_text }),
    messages.summaryButtons
  );
};

const seekerConfirm = async (waId, buttonId, text, convo) => {
  const code = convo.context.listingCode;
  if (buttonId === 'listing_edit' || /^(baştan|bastan)/i.test(text || '')) {
    setState(waId, { state: 'seeker_service', context: {} });
    return wa.sendText(waId, messages.askService);
  }
  if (buttonId !== 'listing_confirm' && !isAffirmative(buttonId, text, 'listing_confirm')) {
    const listing = listings.getByCode(code);
    return wa.sendButtons(
      waId,
      messages.summaryConfirm({ aiText: listing?.ai_text }),
      messages.summaryButtons
    );
  }
  const listing = listings.setStatus(code, 'awaiting_payment');
  await wa.sendText(waId, messages.paymentIntro(listing));
  await sendPackageOffer(waId, listing, 'base_300');
  setState(waId, { state: 'awaiting_payment', context: { listingCode: code } });
};

const awaitingPayment = async (waId, convo) => {
  const code = convo.context.listingCode;
  const listing = code ? listings.getByCode(code) : null;
  const paid = code ? payments.listPaidByListing(code) : [];
  const alreadyPaid =
    paid.length > 0 ||
    (listing && ['published', 'matching', 'delivered'].includes(listing.status));
  if (alreadyPaid) {
    setState(waId, { state: 'matching', context: { listingCode: code } });
    await wa.sendText(
      waId,
      listing ? messages.published(listing) : 'Ödemeniz alındı. İlanınız yayınlandı.'
    );
    return;
  }
  await wa.sendText(
    waId,
    `İlanınız (${code}) ödeme bekliyor. Ödeme tamamlanınca ilan otomatik yayınlanacaktır.`
  );
};

const afterPaid = async (waId, convo) => {
  const code = convo.context.listingCode;
  const listing = code ? listings.getByCode(code) : null;
  await wa.sendText(
    waId,
    listing
      ? `İlanınız (${listing.code}) yayında. Uygun adaylar belirlendiğinde bilgilerini buradan ileteceğiz.`
      : 'Ödemeniz alındı. İlanınız yayında.'
  );
};

// ---- Worker akisi ----
const startWorker = async (waId, name) => {
  setState(waId, { role: 'worker', state: 'worker_kvkk', context: { name } });
  await wa.sendButtons(waId, messages.kvkkWorker, messages.kvkkButtons);
};

const workerKvkk = async (waId, buttonId, text) => {
  if (isNegative(buttonId, text, 'kvkk_no')) {
    conversations.reset(waId);
    await wa.sendText(waId, 'Anladık, işlemi iptal ettik.');
    return;
  }
  if (!isAffirmative(buttonId, text, 'kvkk_yes')) {
    return wa.sendButtons(waId, messages.kvkkWorker, messages.kvkkButtons);
  }
  setState(waId, { state: 'worker_service', context: { kvkkOk: true } });
  await wa.sendText(waId, messages.workerAskService);
};

const workerService = async (waId, text, convo) => {
  const serviceType = detectServiceType(text);
  if (!serviceType) {
    return wa.sendText(waId, `Alanı anlayamadım. ${messages.workerAskService}`);
  }
  setState(waId, { state: 'worker_district', context: { serviceTypes: [serviceType] } });
  await wa.sendText(waId, messages.workerAskDistrict);
};

const workerDistrict = async (waId, text, convo) => {
  const raw = (text || '').trim();
  if (!raw) return wa.sendText(waId, messages.workerAskDistrict);
  const d = detectDistrict(raw) || raw.toLocaleLowerCase('tr-TR');
  setState(waId, { state: 'worker_live_in', context: { districts: [d] } });
  await wa.sendButtons(waId, messages.workerAskLiveIn, messages.liveInButtons);
};

const workerLiveIn = async (waId, text, buttonId, convo) => {
  const liveIn = readLiveIn(text, buttonId);
  if (liveIn === undefined) {
    return wa.sendButtons(waId, messages.workerAskLiveIn, messages.liveInButtons);
  }
  setState(waId, { state: 'worker_experience', context: { liveIn } });
  await wa.sendText(waId, messages.workerAskExperience);
};

const workerExperience = async (waId, text, convo) => {
  const match = (text || '').match(/\d+/);
  if (!match) {
    return wa.sendText(waId, `Anlayamadım, lütfen sayı yazın. ${messages.workerAskExperience}`);
  }
  setState(waId, { state: 'worker_salary', context: { experienceYears: Number(match[0]) } });
  await wa.sendText(waId, messages.workerAskSalary);
};

const workerSalary = async (waId, text, convo) => {
  const { min, max } = detectSalaryRange(text);
  if (min == null) {
    return wa.sendText(waId, `Ücreti anlayamadım. ${messages.workerAskSalary}`);
  }
  setState(waId, {
    state: 'worker_reference',
    context: { expectedSalaryMin: min, expectedSalaryMax: max },
  });
  await wa.sendButtons(waId, messages.workerAskReference, messages.yesNoButtons);
};

const workerReference = async (waId, name, buttonId, text, convo) => {
  const yes = isAffirmative(buttonId, text, 'yn_yes');
  const no = isNegative(buttonId, text, 'yn_no');
  if (!yes && !no) {
    return wa.sendButtons(waId, messages.workerAskReference, messages.yesNoButtons);
  }
  const ctx = convo.context || {};
  if (!ctx.serviceTypes?.length || !ctx.districts?.length) {
    setState(waId, { role: 'worker', state: 'worker_service', context: { name: ctx.name || name, kvkkOk: true } });
    await wa.sendText(waId, messages.workerAskService);
    return;
  }
  workers.upsert({
    waId,
    name: ctx.name || name,
    serviceTypes: ctx.serviceTypes,
    districts: ctx.districts,
    liveIn: ctx.liveIn,
    experienceYears: ctx.experienceYears,
    expectedSalaryMin: ctx.expectedSalaryMin,
    expectedSalaryMax: ctx.expectedSalaryMax,
    hasReference: yes,
    kvkkOk: ctx.kvkkOk,
  });
  conversations.save(waId, { role: 'worker', state: 'worker_done', context: {} });
  await wa.sendText(waId, messages.workerDone);
};

// ---- Havuz adayinin ilana yaniti (Evet/Hayir) ----
const handleJobOfferReply = async (waId, buttonId) => {
  const isYes = buttonId.startsWith('apply_yes_');
  const code = buttonId.replace(/^apply_(yes|no)_/, '');
  const listing = listings.getByCode(code);
  if (!listing) return wa.sendText(waId, 'Bu ilan artık aktif değil.');
  if (!isYes) return wa.sendText(waId, 'Anladık, teşekkürler.');

  const worker = workers.getByWaId(waId);
  applications.add({
    listingCode: code,
    workerWaId: waId,
    workerProfileId: worker?.id,
    source: 'yes_button',
    score: 0, // skorlama finalize sirasinda yapilir
  });
  await wa.sendText(waId, messages.applied(code));
};

// ---- Unlock yaniti ----
const handleUnlockReply = async (waId, buttonId, convo) => {
  if (buttonId === 'unlock_no') {
    return wa.sendText(waId, 'Tamamdır. İhtiyaç olursa buradan ek aday açabilirsiniz.');
  }
  const code = convo.context.listingCode;
  if (!code) return wa.sendText(waId, 'İşleme devam etmek için ilan bulunamadı.');
  const packageKey = buttonId === 'unlock_6' ? 'unlock_900' : 'unlock_300';
  const listing = listings.getByCode(code);
  await sendPackageOffer(waId, listing, packageKey);
};

export default { handleInbound };
