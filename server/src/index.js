import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { notFound, errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import instrumentRoutes from "./routes/instruments.js";
import applicationRoutes from "./routes/applications.js";
import verificationRoutes from "./routes/verifications.js";
import certificateRoutes from "./routes/certificates.js";
import alertRoutes from "./routes/alerts.js";
import documentRoutes from "./routes/documents.js";
import dashboardRoutes from "./routes/dashboard.js";
import searchRoutes from "./routes/search.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.resolve("uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/instruments", instrumentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/verifications", verificationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/dist")));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads"))
      res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`LM Verify server running on http://localhost:${PORT}`);
});
