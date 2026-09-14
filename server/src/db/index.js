import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import logger from '../utils/logger.js';
import { SCHEMA_SQL } from './schema.js';
import { CompatDatabase, setPersistHook } from './adapter.js';

const isServerless = () =>
  Boolean(process.env.SERVERLESS_DB || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

const resolveDataDir = () => {
  if (isServerless()) return '/tmp';
  if (fs.existsSync(path.join(process.cwd(), 'src', 'index.js'))) {
    return path.join(process.cwd(), 'data');
  }
  return path.join(process.cwd(), 'server', 'data');
};

let sqlPromise;
let db;
let dbPath;

const loadSql = () => {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file) => path.join(process.cwd(), 'node_modules/sql.js/dist', file),
    });
  }
  return sqlPromise;
};

const runMigrations = (database) => {
  const cols = database.prepare('PRAGMA table_info(payments)').all().map((c) => c.name);
  if (!cols.includes('provider_ref')) {
    database.exec('ALTER TABLE payments ADD COLUMN provider_ref TEXT');
    logger.info('Migration: payments.provider_ref eklendi');
  }
};

export const persistDb = () => {
  if (!db || !dbPath) return;
  try {
    const bytes = db.exportBytes();
    fs.writeFileSync(dbPath, Buffer.from(bytes));
  } catch (err) {
    logger.warn(`DB persist hatasi: ${err.message}`);
  }
};

export const exportDbBytes = () => {
  if (!db) return null;
  return db.exportBytes();
};

// Yerel gelistirmede her yazmadan sonra dosyaya kaydet.
setPersistHook(() => {
  if (!isServerless()) persistDb();
});

export const initDb = async () => {
  if (db) return db;

  const SQL = await loadSql();
  const dataDir = resolveDataDir();
  dbPath = process.env.DB_PATH || path.join(dataDir, 'benimbakicim.sqlite');

  if (!isServerless() && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let nativeDb;
  if (fs.existsSync(dbPath)) {
    nativeDb = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    nativeDb = new SQL.Database();
  }

  db = new CompatDatabase(nativeDb);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  runMigrations(db);
  persistDb();

  logger.info(`SQLite hazir (sql.js): ${dbPath}`);
  return db;
};

export const getDb = () => {
  if (!db) throw new Error('DB henuz hazir degil — once await initDb() cagirin');
  return db;
};

export default getDb;
