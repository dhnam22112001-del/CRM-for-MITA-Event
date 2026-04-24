import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import customerRoutes from "./src/routes/customerRoutes";
import { getStats } from "./src/controllers/customerController";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Debug Logger
  app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
  });

  // --- API ROUTES ---
  
  // Stats route (matching frontend fetchData call /api/stats)
  app.get("/api/stats", getStats);

  // Customer CRUD routes
  app.use("/api/customers", customerRoutes);

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

  // Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[FATAL ERROR]", err);
    res.status(500).json({ error: "A fatal error occurred on the server." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🚀 Nexus CRM Server is now LIVE`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🛠️  Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
