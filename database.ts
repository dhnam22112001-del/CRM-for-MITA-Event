import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database('crm.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    company TEXT,
    position TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data
const count = db.prepare("SELECT COUNT(*) as count FROM customers").get() as any;
if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO customers (name, phone, email, company, position, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insert.run("Alex Rivera", "+1 (555) 123-4567", "alex@acme.com", "Acme Corp", "Product Manager", "new", "Interested in bulk license");
  insert.run("Sarah Chen", "+1 (555) 987-6543", "sarah@techflow.io", "TechFlow", "CTO", "converted", "Priority support needed");
  insert.run("Jordan Smith", "+1 (555) 555-5555", "jordan@independent.com", null, "Freelancer", "contacted", "Follow up next Tuesday");
}

export default db;
