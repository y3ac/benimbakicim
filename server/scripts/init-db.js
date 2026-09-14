import { initDb } from '../src/db/index.js';

await initDb();
console.log('Veritabani hazir (data/benimbakicim.sqlite).');
