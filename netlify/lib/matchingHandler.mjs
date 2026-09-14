import './env.mjs';
import { restoreDb, flushDb } from './dbsync.mjs';
import { initDb, exportDbBytes } from '../../server/src/db/index.js';
import { processDueListings } from '../../server/src/matching/engine.js';
import { prepareEvent } from './eventAdapter.mjs';

export const run = async (event) => {
  const lambdaEvent = event?.httpMethod ? event : await prepareEvent(event);
  await restoreDb(lambdaEvent);
  await initDb();
  try {
    const n = await processDueListings();
    if (n > 0) {
      const bytes = exportDbBytes();
      if (bytes) await flushDb(bytes, lambdaEvent);
      console.log(`[matching] ${n} ilan eslestirmeye alindi`);
    }
  } catch (err) {
    console.error('[matching] hata:', err.message);
  }
  return { statusCode: 200, body: 'ok' };
};

export default run;
