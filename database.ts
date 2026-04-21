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
    phone TEXT, -- Made nullable
    email TEXT,
    company TEXT,
    position TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone)
  );
`);

// Migration: Ensure 'phone' column is actually nullable if table already existed
try {
  const tableInfo = db.prepare("PRAGMA table_info(customers)").all() as any[];
  const phoneCol = tableInfo.find(col => col.name === 'phone');
  
  if (phoneCol && phoneCol.notnull === 1) {
    console.log("Migration: Making 'phone' column nullable...");
    // SQLite doesn't support 'ALTER TABLE ALTER COLUMN'
    // This is a simplified migration for development
    db.transaction(() => {
      db.exec(`
        CREATE TABLE customers_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          company TEXT,
          position TEXT,
          status TEXT DEFAULT 'new',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(phone)
        );
        INSERT INTO customers_new SELECT * FROM customers;
        DROP TABLE customers;
        ALTER TABLE customers_new RENAME TO customers;
      `);
    })();
    console.log("Migration: Completed successfully.");
  }
} catch (migrationError) {
  console.error("Migration Error:", migrationError);
}

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
