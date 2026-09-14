// Tum backend (webhook, odeme, api, admin) tek Netlify Function uzerinden calisir.
import './env.mjs';
import serverless from 'serverless-http';
import { restoreDb, flushDb } from './dbsync.mjs';
import { prepareEvent } from './eventAdapter.mjs';
import { setBlobsEvent } from '../../server/src/store/blobsContext.js';
import { createApp } from '../../server/src/index.js';
import { initDb, exportDbBytes } from '../../server/src/db/index.js';

let handlerFn;
let dbReady;

const ensureReady = async (rawEvent) => {
  if (dbReady) return;
  await restoreDb(rawEvent);
  await initDb();
  handlerFn = serverless(createApp(), {
    request: (req, event) => {
      if (event?.path && !req.url.startsWith('http')) {
        req.url = event.path + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
      }
      if (event?.body != null) {
        req.rawBody = event.isBase64Encoded
          ? Buffer.from(event.body, 'base64')
          : Buffer.from(event.body, 'utf8');
      }
    },
  });
  dbReady = true;
};

export const run = async (event, context = {}) => {
  if (context?.callbackWaitsForEmptyEventLoop !== undefined) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const lambdaEvent = await prepareEvent(event);
  console.log(`[api] ${lambdaEvent.httpMethod} ${lambdaEvent.path} blobs=${Boolean(event?.blobs)}`);

  setBlobsEvent(event);
  await ensureReady(event);
  const response = await handlerFn(lambdaEvent, context);

  const method = (lambdaEvent.httpMethod || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const bytes = exportDbBytes();
    if (bytes) await flushDb(bytes, event);
  }
  return response;
};

export default run;
