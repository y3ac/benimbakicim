// better-sqlite3 uyumlu ince katman — sql.js (WASM) uzerinde calisir.
// Netlify/Linux'ta native .node modulu gerektirmez.

let persistHook = null;

export const setPersistHook = (fn) => {
  persistHook = fn;
};

const afterWrite = () => {
  if (persistHook) persistHook();
};

const normalizeNamed = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.startsWith('@') || k.startsWith(':') || k.startsWith('$') ? k : `@${k}`;
    out[key] = v;
  }
  return out;
};

// sql.js'in bind() metodu yalnizca dizi veya nesne kabul eder; ciplak bir deger
// verilirse parametre sessizce baglanmaz ve sorgu NULL ile calisir.
const isNamedParams = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !ArrayBuffer.isView(value) &&
  !(value instanceof ArrayBuffer);

const bindParams = (stmt, params) => {
  if (!params.length) return;
  if (params.length === 1) {
    const [only] = params;
    if (isNamedParams(only)) return stmt.bind(normalizeNamed(only));
    if (Array.isArray(only)) return stmt.bind(only);
    return stmt.bind([only]);
  }
  return stmt.bind(params);
};

class CompatStatement {
  constructor(nativeDb, sql) {
    this._db = nativeDb;
    this._sql = sql;
  }

  run(...params) {
    const stmt = this._db.prepare(this._sql);
    try {
      bindParams(stmt, params);
      while (stmt.step()) {}
      const idRow = this._db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid = idRow[0]?.values?.[0]?.[0] ?? 0;
      const changes = this._db.getRowsModified();
      afterWrite();
      return { lastInsertRowid, changes };
    } finally {
      stmt.free();
    }
  }

  get(...params) {
    const stmt = this._db.prepare(this._sql);
    try {
      bindParams(stmt, params);
      if (stmt.step()) return stmt.getAsObject();
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params) {
    const stmt = this._db.prepare(this._sql);
    try {
      bindParams(stmt, params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }
}

export class CompatDatabase {
  constructor(nativeDb) {
    this._db = nativeDb;
  }

  prepare(sql) {
    return new CompatStatement(this._db, sql);
  }

  exec(sql) {
    this._db.exec(sql);
    afterWrite();
  }

  pragma(cmd) {
    this._db.run(`PRAGMA ${cmd}`);
  }

  exportBytes() {
    return this._db.export();
  }
}

export default CompatDatabase;
