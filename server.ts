import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('database.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    departmentId TEXT,
    status TEXT,
    password TEXT
  );
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

const app = express();
app.use(express.json());

// API Routes
app.get('/api/data', (req, res) => {
  const departments = db.prepare('SELECT * FROM departments').all();
  const workers = db.prepare('SELECT * FROM workers').all();
  const items = db.prepare('SELECT * FROM items').all();
  const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
  res.json({ departments, workers, items, logs });
});

app.post('/api/sync', (req, res) => {
  const { departments, workers, items, logs } = req.body;
  
  db.transaction(() => {
    db.prepare('DELETE FROM departments').run();
    db.prepare('DELETE FROM workers').run();
    db.prepare('DELETE FROM items').run();
    db.prepare('DELETE FROM logs').run();

    const insertDept = db.prepare('INSERT INTO departments (id, name) VALUES (?, ?)');
    departments.forEach((d: any) => insertDept.run(d.id, d.name));

    const insertWorker = db.prepare('INSERT INTO workers (id, name, departmentId, status, password) VALUES (?, ?, ?, ?, ?)');
    workers.forEach((w: any) => insertWorker.run(w.id, w.name, w.departmentId, w.status, w.password));

    const insertItem = db.prepare('INSERT INTO items (serialNumber, status, workerId, deliveryDate, installationDate, meterNumber, operationType, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    items.forEach((i: any) => insertItem.run(i.serialNumber, i.status, i.workerId || null, i.deliveryDate || null, i.installationDate || null, i.meterNumber || null, i.operationType || null, i.notes || null));

    const insertLog = db.prepare('INSERT INTO logs (id, serialNumber, workerId, status, timestamp, meterNumber, operationType, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    logs.forEach((l: any) => insertLog.run(l.id, l.serialNumber, l.workerId, l.status, l.timestamp, l.meterNumber || null, l.operationType || null, l.notes || null));
  })();

  res.json({ success: true });
});

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
}

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://localhost:3000');
});
