// dataStore.js
import openDatabaseAsync from './schema';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: openDatabaseAsync returns a wrapped db object or null. We call it per-op.
const STORAGE_KEY = '@expiry_items_v1';

const parseDate = (s) => {
  if (!s) return null;
  // Accept Date objects or ISO strings
  if (s instanceof Date) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const storageLoad = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('storageLoad error', e);
    return [];
  }
};

const storageSave = async (items) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('storageSave error', e);
  }
};

export const addItem = (item, cb) => {
  (async () => {
    const db = await openDatabaseAsync();
    if (!db) {
      const items = await storageLoad();
      const id = Date.now();
      const newItem = {
        id,
        name: item.name,
        expiryDate: item.expiryDate,
        category: item.category || 'Other',
        quantity: item.quantity || 1,
        notes: item.notes || '',
        addedDate: new Date().toISOString(),
        isExpired: 0,
        reminderDays: item.reminderDays || 3,
      };
      items.push(newItem);
      await storageSave(items);
      console.log('addItem (storage) inserted', newItem);
      cb && cb(id);
      return;
    }

    try {
      const res = await db.runAsync(
        'INSERT INTO items (name, expiryDate, category, quantity, notes, reminderDays) VALUES (?, ?, ?, ?, ?, ?)',
        [item.name, item.expiryDate, item.category, item.quantity, item.notes, item.reminderDays]
      );
      console.log('addItem result', res);
      // Normalize insert id for different implementations
      const insertId = res?.lastInsertRowId ?? res?.insertId ?? res?.insert_id ?? null;
      cb && cb(insertId);
    } catch (e) {
      console.error('addItem error', e);
      cb && cb(null);
    }
  })();
};

export const getExpiringItems = (days, cb) => {
  (async () => {
    const db = await openDatabaseAsync();
    if (!db) {
      const items = await storageLoad();
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + Number(days));
      const filtered = items
        .filter((it) => {
          if (!it.expiryDate) return false;
          const d = parseDate(it.expiryDate);
          return d && d >= now && d <= end && (!it.isExpired || it.isExpired === 0);
        })
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      cb && cb(filtered);
      return;
    }

    try {
      // Use parameter binding for safety; some SQLite wrappers don't accept template interpolation
      const sql = `SELECT * FROM items WHERE expiryDate BETWEEN date('now') AND date('now', ? ) AND isExpired = 0 ORDER BY expiryDate ASC`;
      const param = [`+${Number(days)} days`];
      const rows = await db.getAllAsync(sql, param);
      cb && cb(rows);
    } catch (e) {
      console.error('getExpiringItems error', e);
      cb && cb([]);
    }
  })();
};

export const updateExpired = () => {
  (async () => {
    const db = await openDatabaseAsync();
    if (!db) {
      const items = await storageLoad();
      const now = new Date();
      const updated = items.map((it) => ({
        ...it,
        isExpired: parseDate(it.expiryDate) && new Date(it.expiryDate) < now ? 1 : 0,
      }));
      await storageSave(updated);
      return;
    }

    try {
      await db.execAsync('UPDATE items SET isExpired = 1 WHERE date(expiryDate) < date("now")');
    } catch (e) {
      console.error('updateExpired error', e);
    }
  })();
};

export const getAllItems = (cb) => {
  (async () => {
    const db = await openDatabaseAsync();
    if (!db) {
      cb && cb(await storageLoad());
      return;
    }
    try {
      const rows = await db.getAllAsync('SELECT * FROM items ORDER BY expiryDate ASC', []);
      cb && cb(rows);
    } catch (e) {
      console.error('getAllItems error', e);
      cb && cb([]);
    }
  })();
};

export const deleteItem = (id, cb) => {
  (async () => {
    const db = await openDatabaseAsync();
    if (!db) {
      const items = await storageLoad();
      const filtered = items.filter((i) => i.id !== id);
      await storageSave(filtered);
      cb && cb(true);
      return;
    }

    try {
      const res = await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
      // Return standardized result (number of changes if available)
      const changes = res?.changes ?? res?.rowsAffected ?? null;
      cb && cb(changes);
    } catch (e) {
      console.error('deleteItem error', e);
      cb && cb(null);
    }
  })();
};

export const getExpiredItems = (cb) => {
  (async () => {
    const db = await openDatabaseAsync();
    if (!db) {
      const items = await storageLoad();
      const filtered = items
        .filter((i) => i.isExpired === 1)
        .sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));
      cb && cb(filtered);
      return;
    }

    try {
      const rows = await db.getAllAsync('SELECT * FROM items WHERE isExpired = 1 ORDER BY expiryDate DESC', []);
      cb && cb(rows);
    } catch (e) {
      console.error('getExpiredItems error', e);
      cb && cb([]);
    }
  })();
};

// keep default export if you want to import the DB opener elsewhere
export default null;
