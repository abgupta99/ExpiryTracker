import * as SQLite from 'expo-sqlite';

const DB_NAME = 'expiry.db';
let dbPromise = null;

// --- OPEN DB ------------------------------------------------
async function openDatabaseAsync() {
  if (!dbPromise) {
    if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
      // new async API
      dbPromise = SQLite.openDatabaseAsync(DB_NAME);
    } else {
      console.warn("SQLite.openDatabaseAsync not supported on this platform.");
      dbPromise = Promise.resolve(null);
    }
  }
  return dbPromise;
}

// --- INIT TABLE ----------------------------------------------
export async function initDB() {
  const db = await openDatabaseAsync();
  if (!db) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      expiryDate TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      addedDate TEXT DEFAULT (datetime('now')),
      isExpired INTEGER DEFAULT 0,
      reminderDays INTEGER DEFAULT 3
    );
  `);
}

// --- ADD ITEM --------------------------------------------------
export async function addItemAsync(item) {
  const { name, expiryDate, category, quantity, notes, reminderDays } = item;
  const db = await openDatabaseAsync();
  if (!db) throw new Error("DB unavailable");

  const result = await db.runAsync(
    `INSERT INTO items (name, expiryDate, category, quantity, notes, reminderDays)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [name, expiryDate, category, quantity, notes, reminderDays]
  );

  return result.lastInsertRowId ?? null;
}

// --- GET ALL ITEMS --------------------------------------------
export async function getItemsAsync() {
  const db = await openDatabaseAsync();
  if (!db) return [];

  const rows = await db.getAllAsync(
    `SELECT * FROM items ORDER BY addedDate DESC;`
  );

  return rows;
}

// --- UPDATE ITEM ------------------------------------------------
export async function updateItemAsync(id, data) {
  const { name, expiryDate, category, quantity, notes, reminderDays, isExpired } = data;

  const db = await openDatabaseAsync();
  if (!db) return 0;

  const result = await db.runAsync(
    `UPDATE items
     SET name=?, expiryDate=?, category=?, quantity=?, notes=?, reminderDays=?, isExpired=?
     WHERE id=?;`,
    [name, expiryDate, category, quantity, notes, reminderDays, isExpired, id]
  );

  return result.changes ?? 0;
}

// --- DELETE ITEM -------------------------------------------------
export async function deleteItemAsync(id) {
  const db = await openDatabaseAsync();
  if (!db) return 0;

  const result = await db.runAsync(
    `DELETE FROM items WHERE id=?;`,
    [id]
  );

  return result.changes ?? 0;
}

export default openDatabaseAsync;
