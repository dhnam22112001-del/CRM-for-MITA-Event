import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import multer from "multer";
import * as xlsx from "xlsx";
import { z } from "zod";
import db from "./database.ts";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Validation Schemas
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Valid phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["new", "contacted", "converted", "lost"]).default("new"),
  notes: z.string().optional(),
});

// API Routes
app.get("/api/customers", (req, res) => {
  try {
    const customers = db.prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.post("/api/customers", (req, res) => {
  try {
    const validated = customerSchema.parse(req.body);
    
    // Check for duplicate phone
    const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(validated.phone);
    if (existing) {
      return res.status(400).json({ error: "Duplicate phone number" });
    }

    const info = db.prepare(`
      INSERT INTO customers (name, phone, email, company, position, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      validated.name,
      validated.phone,
      validated.email || null,
      validated.company || null,
      validated.position || null,
      validated.status,
      validated.notes || null
    );

    const newCustomer = db.prepare("SELECT * FROM customers WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(newCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: "Failed to create customer" });
  }
});

app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  try {
    const validated = customerSchema.parse(req.body);
    
    // Check for duplicate phone (if changed)
    const existing = db.prepare("SELECT id FROM customers WHERE phone = ? AND id != ?").get(validated.phone, id);
    if (existing) {
      return res.status(400).json({ error: "Phone number already in use by another customer" });
    }

    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, company = ?, position = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      validated.name,
      validated.phone,
      validated.email || null,
      validated.company || null,
      validated.position || null,
      validated.status,
      validated.notes || null,
      id
    );

    const updatedCustomer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    res.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(500).json({ error: "Failed to update customer" });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Excel Import
app.post("/api/import-excel", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Dynamic mapping - look for columns that match our schema
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const insertStmt = db.prepare(`
      INSERT INTO customers (name, phone, email, company, position, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const row of data as any[]) {
        try {
          // Robust key finding
          const name = row.Name || row.name || row["Full Name"] || "";
          const phone = row.Phone || row.phone || row["Phone Number"] || row["Telephone"] || "";
          const email = row.Email || row.email || "";
          const company = row.Company || row.company || row["Organization"] || "";
          const position = row.Position || row.position || row["Job Title"] || "";
          const status = (row.Status || row.status || "new").toLowerCase();
          const notes = row.Notes || row.notes || row.Comment || "";

          if (!name || !phone) {
            results.skipped++;
            continue;
          }

          // Simple status normalization
          const validStatuses = ["new", "contacted", "converted", "lost"];
          const finalStatus = validStatuses.includes(status) ? status : "new";

          // Check for existing phone in current DB
          const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone.toString());
          if (existing) {
            results.skipped++;
            continue;
          }

          insertStmt.run(
            name.toString(),
            phone.toString(),
            email.toString() || null,
            company.toString() || null,
            position.toString() || null,
            finalStatus,
            notes.toString() || null
          );
          results.imported++;
        } catch (e: any) {
          results.errors.push(e.message);
          results.skipped++;
        }
      }
    })();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to parse Excel file" });
  }
});

// Analytics
app.get("/api/stats", (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
      FROM customers
    `).get();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
