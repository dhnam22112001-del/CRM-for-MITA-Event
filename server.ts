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

// Essential Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased for larger payloads
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Logger - log ALL incoming requests to aid diagnosis
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Validation Schemas
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["new", "contacted", "converted", "lost"]).default("new"),
  notes: z.string().optional(),
});

// --- API ROUTES ---

// Diagnostic route for reachability
app.get("/api/import-excel", (req, res) => {
  res.json({ message: "Import endpoint is reachable via GET" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/customers", (req, res) => {
  try {
    const customers = db.prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
    res.json(customers);
  } catch (error) {
    console.error("Fetch customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.post("/api/customers", (req, res) => {
  try {
    const validated = customerSchema.parse(req.body);
    
    if (validated.phone) {
      const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(validated.phone);
      if (existing) {
        return res.status(400).json({ error: "Duplicate phone number" });
      }
    }

    const info = db.prepare(`
      INSERT INTO customers (name, phone, email, company, position, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      validated.name,
      validated.phone || null,
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
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

app.put("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  try {
    const validated = customerSchema.parse(req.body);
    
    if (validated.phone) {
      const existing = db.prepare("SELECT id FROM customers WHERE phone = ? AND id != ?").get(validated.phone, id);
      if (existing) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
    }

    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, company = ?, position = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      validated.name,
      validated.phone || null,
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
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// The Critical Excel Import Route
app.post("/api/import-excel", upload.single("file"), (req, res) => {
  console.log("[ExcelImport] Request received");
  if (!req.file) {
    console.error("[ExcelImport] No file attached in request");
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    console.log(`[ExcelImport] Parsing file: ${req.file.originalname} (${req.file.size} bytes)`);
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

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
          const name = row.Name || row.name || row["Full Name"] || row["Họ tên"] || row["Tên"] || row["Tên khách hàng"] || "";
          const phone = row.Phone || row.phone || row["Phone Number"] || row["Telephone"] || row["SĐT"] || row["Số điện thoại"] || row["Điện thoại"] || "";
          const email = row.Email || row.email || "";
          const company = row.Company || row.company || row["Organization"] || row["Công ty"] || "";
          const position = row.Position || row.position || row["Job Title"] || row["Chức vụ"] || "";
          const status = (row.Status || row.status || row["Trạng thái"] || "new").toString().toLowerCase();
          const notes = row.Notes || row.notes || row.Comment || row["Ghi chú"] || "";

          if (!name) {
            results.skipped++;
            continue;
          }

          const validStatuses = ["new", "contacted", "converted", "lost"];
          const finalStatus = validStatuses.includes(status) ? status : "new";

          if (phone) {
            const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone.toString());
            if (existing) {
              results.skipped++;
              continue;
            }
          }

          insertStmt.run(
            name.toString(),
            phone ? phone.toString() : null,
            email.toString() || null,
            company.toString() || null,
            position.toString() || null,
            finalStatus,
            notes.toString() || null
          );
          results.imported++;
        } catch (e: any) {
          console.error("[ExcelImport] Row error:", e.message);
          results.errors.push(e.message);
          results.skipped++;
        }
      }
    })();

    console.log(`[ExcelImport] Success: ${results.imported} imported, ${results.skipped} skipped`);
    res.json(results);
  } catch (error: any) {
    console.error("[ExcelImport] Parse error:", error);
    res.status(500).json({ error: "Critical error processing Excel: " + error.message });
  }
});

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
    console.error("Fetch stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// JSON 404 for any other /api route
app.all("/api/*", (req, res) => {
  console.warn(`[404] API route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route ${req.method} ${req.url} not defined.` });
});

// --- SERVER INITIALIZATION ---

async function start() {
  // Vite for dev, Static for prod
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

  // Final Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large (Max 20MB)" });
      return res.status(400).json({ error: err.message });
    }
    console.error("[Fatal Error]", err);
    res.status(500).json({ error: "A fatal error occurred on the server." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Nexus Server listening at http://localhost:${PORT}`);
    console.log(`>>> Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
