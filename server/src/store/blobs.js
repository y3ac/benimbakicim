// Netlify Blobs: her kullanicinin konusma durumunu ayri kayit olarak tutar.
// SQLite dosyasi Lambda'lar arasinda kaybolunca bot ayni soruyu tekrar soruyordu.
import { connectLambda, getStore } from '@netlify/blobs';
import { getBlobsEvent } from './blobsContext.js';
import logger from '../utils/logger.js';

const STORE_NAME = 'benimbakicim-db';

const isServerless = () =>
  Boolean(process.env.SERVERLESS_DB || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

const header = (event, name) => {
  const h = event?.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()];
};

const openStore = () => {
  const rawEvent = getBlobsEvent();
  if (rawEvent?.blobs) {
    try {
      connectLambda(rawEvent);
    } catch {
      /* connectLambda yoksa asagidaki siteID/token yeter */
    }
    try {
      const data = JSON.parse(Buffer.from(rawEvent.blobs, 'base64').toString());
      const siteID = header(rawEvent, 'x-nf-site-id') || process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
      if (siteID && data.token) {
        return getStore({ name: STORE_NAME, siteID, token: data.token });
      }
    } catch {
      /* getStore(name) dene */
    }
  }
  return getStore(STORE_NAME);
};

const getJson = async (key) => {
  if (!isServerless()) return null;
  try {
    const store = openStore();
    try {
      return await store.get(key, { type: 'json', consistency: 'strong' });
    } catch (err) {
      if (/uncachedEdgeURL|strong consistency/i.test(err.message || '')) {
        return store.get(key, { type: 'json' });
      }
      throw err;
    }
  } catch (err) {
    logger.warn(`[blobs] okunamadi ${key}: ${err.message}`);
    return null;
  }
};

const setJson = async (key, value) => {
  if (!isServerless()) return;
  try {
    await openStore().setJSON(key, value);
  } catch (err) {
    logger.warn(`[blobs] yazilamadi ${key}: ${err.message}`);
  }
};

export const loadConversation = async (waId) => getJson(`convo/${waId}`);

export const saveConversation = async (waId, convo) => {
  if (!waId) return;
  await setJson(`convo/${waId}`, {
    role: convo?.role ?? null,
    state: convo?.state || 'start',
    context: convo?.context || {},
    updatedAt: Date.now(),
  });
};

export const clearConversation = async (waId) => {
  if (!waId || !isServerless()) return;
  try {
    await openStore().delete(`convo/${waId}`);
  } catch {
    await setJson(`convo/${waId}`, { role: null, state: 'start', context: {}, updatedAt: Date.now() });
  }
};

export const loadPayBundle = async (reference) => getJson(`pay/${reference}`);

export const savePayBundle = async (reference, bundle) => {
  if (!reference) return;
  await setJson(`pay/${reference}`, bundle);
};

export const claimRemoteMessage = async (messageId) => {
  if (!messageId) return true;
  if (!isServerless()) return true;
  const key = `msg/${messageId}`;
  const seen = await getJson(key);
  if (seen) return false;
  await setJson(key, { at: Date.now() });
  return true;
};
