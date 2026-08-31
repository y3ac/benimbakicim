import logger from './logger.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Zaman asimi + yeniden deneme destekli HTTP istemcisi (global fetch uzerine).
// Donen: { ok, status, data, text }
export const httpRequest = async (
  url,
  { method = 'GET', headers = {}, body, timeoutMs = 15000, retries = 2, retryDelayMs = 500 } = {}
) => {
  let attempt = 0;
  let lastErr;
  const payload = body && typeof body !== 'string' ? JSON.stringify(body) : body;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, body: payload, signal: controller.signal });
      clearTimeout(timer);
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      // 5xx ve 429 durumlarinda yeniden dene
      if ((res.status >= 500 || res.status === 429) && attempt < retries) {
        attempt += 1;
        logger.warn(`HTTP ${res.status} ${url} — yeniden deneme ${attempt}/${retries}`);
        await sleep(retryDelayMs * attempt);
        continue;
      }
      return { ok: res.ok, status: res.status, data, text };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      const aborted = err.name === 'AbortError';
      if (attempt < retries) {
        attempt += 1;
        logger.warn(
          `HTTP hata ${aborted ? 'timeout' : err.message} ${url} — yeniden deneme ${attempt}/${retries}`
        );
        await sleep(retryDelayMs * attempt);
        continue;
      }
      throw new Error(`HTTP istegi basarisiz (${url}): ${aborted ? 'timeout' : err.message}`);
    }
  }
  throw lastErr || new Error('HTTP istegi basarisiz');
};

// JSON kolayligi: hata durumunda anlamli mesaj firlatir.
export const httpJson = async (url, opts = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await httpRequest(url, { ...opts, headers });
  if (!res.ok) {
    const detail = res.text ? res.text.slice(0, 300) : '';
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.data;
};

export default { httpRequest, httpJson };
