import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

let db;

// Ek kolonlari guvenli sekilde ekle (var olan veritabanlarini bozmadan).
const runMigrations = (database) => {
  const cols = database.prepare('PRAGMA table_info(payments)').all().map((c) => c.name);
  if (!cols.includes('provider_ref')) {
    database.exec('ALTER TABLE payments ADD COLUMN provider_ref TEXT');
    logger.info('Migration: payments.provider_ref eklendi');
  }
};

export const getDb = () => {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const dbPath = process.env.DB_PATH || path.join(DATA_DIR, 'benimbakicim.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  runMigrations(db);
  logger.info(`SQLite hazir: ${dbPath}`);
  return db;
};

export default getDb;
