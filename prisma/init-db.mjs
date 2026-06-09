import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveSqlitePath() {
  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only SQLite file: DATABASE_URL values are supported.");
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (isAbsolute(rawPath)) {
    return rawPath;
  }

  return resolve(__dirname, rawPath);
}

const dbPath = resolveSqlitePath();
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS Product (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    spec TEXT,
    unit TEXT,
    category TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS InventorySession (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    month TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SystemStock (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    systemQty INTEGER NOT NULL,
    CONSTRAINT SystemStock_sessionId_fkey FOREIGN KEY (sessionId) REFERENCES InventorySession (id) ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS SystemStock_sessionId_sku_key ON SystemStock(sessionId, sku);

  CREATE TABLE IF NOT EXISTS CountedStock (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    sku TEXT NOT NULL,
    countedQty INTEGER NOT NULL,
    countedBy TEXT NOT NULL,
    note TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CountedStock_sessionId_fkey FOREIGN KEY (sessionId) REFERENCES InventorySession (id) ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS CountedStock_sessionId_sku_key ON CountedStock(sessionId, sku);
`);

db.close();
console.log(`SQLite database initialized: ${dbPath}`);
