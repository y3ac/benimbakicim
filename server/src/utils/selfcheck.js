import config, { isAiEnabled, isWhatsappLive } from '../config.js';
import { httpRequest } from './http.js';

// Her API baglantisini hafifce dogrula. Canli kimlik yoksa 'skipped' doner.
// Donen: { ok, checks: { whatsapp, ai, payments } }

const checkWhatsapp = async () => {
  if (!isWhatsappLive()) return { status: 'skipped', reason: 'kimlik yok (dry-run)' };
  try {
    const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}?fields=verified_name,display_phone_number`;
    const res = await httpRequest(url, {
      headers: { Authorization: `Bearer ${config.whatsapp.accessToken}` },
      timeoutMs: 8000,
      retries: 1,
    });
    if (res.ok) return { status: 'ok', phone: res.data?.display_phone_number };
    return { status: 'error', code: res.status, message: res.data?.error?.message };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
};

const checkAi = async () => {
  if (!isAiEnabled()) return { status: 'skipped', reason: 'OPENAI_API_KEY yok (fallback aktif)' };
  try {
    const res = await httpRequest(`${config.ai.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.ai.apiKey}` },
      timeoutMs: 8000,
      retries: 1,
    });
    return res.ok
      ? { status: 'ok' }
      : { status: 'error', code: res.status, message: res.data?.error?.message };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
};

const checkPayments = () => {
  const p = config.payments;
  if (p.provider === 'mock') return { status: 'ok', provider: 'mock' };
  if (p.provider === 'iyzico') {
    const ready = Boolean(p.iyzico.apiKey && p.iyzico.secretKey);
    return { status: ready ? 'ok' : 'error', provider: 'iyzico', ready };
  }
  if (p.provider === 'paytr') {
    const ready = Boolean(p.paytr.merchantId && p.paytr.merchantKey && p.paytr.merchantSalt);
    return { status: ready ? 'ok' : 'error', provider: 'paytr', ready };
  }
  return { status: 'error', provider: p.provider, reason: 'bilinmeyen saglayici' };
};

export const runSelfCheck = async () => {
  const [whatsapp, ai] = await Promise.all([checkWhatsapp(), checkAi()]);
  const payments = checkPayments();
  const checks = { whatsapp, ai, payments };
  const ok = Object.values(checks).every((c) => c.status !== 'error');
  return { ok, dryRun: config.dryRun, checks };
};

export default { runSelfCheck };
