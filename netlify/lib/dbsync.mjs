// Netlify Functions'ta yerel disk kalici degildir. SQLite dosyasini istekler
// arasinda Netlify Blobs'ta saklariz.
//
// Lambda uyumluluk modunda event.blobs ile baglam kurulur. Okumada strong
// consistency kullanilir; aksi halde bir onceki mesajin kaydi henuz gorunmez
// ve bot konusmayı bastan baslatir.
import fs from 'node:fs';
import { connectLambda, getStore } from '@netlify/blobs';

const DB_FILE = '/tmp/benimbakicim.sqlite';
const STORE_NAME = 'benimbakicim-db';
const KEY = 'db.sqlite';

process.env.SERVERLESS_DB = '1';
process.env.DB_PATH = DB_FILE;

const header = (event, name) => {
  const h = event?.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()];
};

const applyBlobsContext = (rawEvent) => {
  if (rawEvent?.blobs) {
    try {
      connectLambda(rawEvent);
    } catch (err) {
      console.warn('[dbsync] connectLambda:', err.message);
    }
    try {
      const data = JSON.parse(Buffer.from(rawEvent.blobs, 'base64').toString());
      const context = {
        deployID: header(rawEvent, 'x-nf-deploy-id'),
        edgeURL: data.url || data.edgeURL,
        uncachedEdgeURL:
          data.url_uncached || data.uncachedURL || data.uncached_url || data.uncachedEdgeURL,
        siteID: header(rawEvent, 'x-nf-site-id') || data.siteID,
        token: data.token,
        apiURL: data.apiURL,
      };
      process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify(context)).toString('base64');
    } catch (err) {
      console.warn('[dbsync] blobs context:', err.message);
    }
  }

  const siteID = header(rawEvent, 'x-nf-site-id') || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  let token;
  try {
    if (rawEvent?.blobs) {
      token = JSON.parse(Buffer.from(rawEvent.blobs, 'base64').toString()).token;
    }
  } catch {
    /* ignore */
  }
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
};

let restored = false;

const readBlob = async (store) => {
  try {
    return await store.get(KEY, { type: 'arrayBuffer', consistency: 'strong' });
  } catch (err) {
    if (/uncachedEdgeURL|strong consistency/i.test(err.message)) {
      return store.get(KEY, { type: 'arrayBuffer' });
    }
    throw err;
  }
};

export const restoreDb = async (rawEvent) => {
  if (restored) return;
  try {
    const buf = await readBlob(applyBlobsContext(rawEvent));
    if (buf) {
      fs.writeFileSync(DB_FILE, Buffer.from(buf));
      console.log('[dbsync] restore tamam', Buffer.from(buf).length, 'byte');
    } else {
      console.log('[dbsync] restore: kayit yok (ilk calisma)');
    }
    restored = true;
  } catch (err) {
    console.warn('[dbsync] restore atlandi:', err.message);
  }
};

export const flushDb = async (bytes, rawEvent) => {
  try {
    const payload = bytes || (fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE) : null);
    if (!payload) return;
    await applyBlobsContext(rawEvent).set(KEY, Buffer.from(payload));
    console.log('[dbsync] flush tamam', Buffer.from(payload).length, 'byte');
  } catch (err) {
    console.warn('[dbsync] flush atlandi:', err.message);
  }
};

export const DB_FILE_PATH = DB_FILE;
