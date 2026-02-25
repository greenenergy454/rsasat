import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// الربط المباشر بـ Turso باستخدام متغيرات البيئة
// ملاحظة: القيم الحقيقية موجودة الآن في Netlify تحت الأسماء التالية
const db = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

// فحص أولي للاتصال لضمان عدم وجود قيم فارغة
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.warn("⚠️ Warning: Turso credentials are not set in environment variables!");
}

// Initialize Database (Cloud)
async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        departmentId TEXT,
        status TEXT,
        password TEXT
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS items (
        serialNumber TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        workerId TEXT,
        deliveryDate TEXT,
        installationDate TEXT,
        meterNumber TEXT,
        operationType TEXT,
        notes TEXT
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        serialNumber TEXT NOT NULL,
        workerId TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        meterNumber TEXT,
        operationType TEXT,
        notes TEXT
      );
    `);
    console.log("✅ Turso Database tables initialized or already exist.");
  } catch (err) {
    console.error("❌ Failed to initialize Turso DB:", err);
  }
}

initDb();

const app = express();
app.use(express.json());

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const departments = await db.execute('SELECT * FROM departments');
    const workers = await db.execute('SELECT * FROM workers');
    const items = await db.execute('SELECT * FROM items');
    const logs = await db.execute('SELECT * FROM logs ORDER BY timestamp DESC');
    
    res.json({ 
      departments: departments.rows, 
      workers: workers.rows, 
      items: items.rows, 
      logs: logs.rows 
    });
  } catch (error) {
    console.error('Error fetching data from Turso:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/sync', async (req, res) => {
  const { departments, workers, items, logs } = req.body;
  
  try {
    const batch: any[] = [
      'DELETE FROM departments',
      'DELETE FROM workers',
      'DELETE FROM items',
      'DELETE FROM logs'
    ];

    departments.forEach((d: any) => {
      batch.push({
        sql: 'INSERT INTO departments (id, name) VALUES (?, ?)',
        args: [d.id, d.name]
      });
    });

    workers.forEach((w: any) => {
      batch.push({
        sql: 'INSERT INTO workers (id, name, departmentId, status, password) VALUES (?, ?, ?, ?, ?)',
        args: [w.id, w.name, w.departmentId, w.status, w.password]
      });
    });

    items.forEach((i: any) => {
      batch.push({
        sql: 'INSERT INTO items (serialNumber, status, workerId, deliveryDate, installationDate, meterNumber, operationType, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [i.serialNumber, i.status, i.workerId || null, i.deliveryDate || null, i.installationDate || null, i.meterNumber || null, i.operationType || null, i.notes || null]
      });
    });

    logs.forEach((l: any) => {
      batch.push({
        sql: 'INSERT INTO logs (id, serialNumber, workerId, status, timestamp, meterNumber, operationType, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [l.id, l.serialNumber, l.workerId, l.status, l.timestamp, l.meterNumber || null, l.operationType || null, l.notes || null]
      });
    });

    await db.batch(batch, "write");
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing to Turso:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
