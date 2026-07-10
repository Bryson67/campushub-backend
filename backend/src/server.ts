// backend/src/server.ts
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables with absolute path
const envPath = path.resolve(__dirname, "../.env");
console.log(`📂 Loading .env from: ${envPath}`);
console.log(`📂 File exists: ${fs.existsSync(envPath)}`);

// Force load the .env file
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("❌ Error loading .env:", result.error);
} else {
  console.log("✅ .env loaded successfully");
  console.log("📋 Loaded keys:", Object.keys(result.parsed || {}).join(", "));
}

// Rest of your imports...
import express from "express";
import paymentsRouter from "./routes/payments";
import tournamentRouter from "./routes/tournament";

const app = express();
app.use(express.json());

// Log all environment variables (for debugging)
console.log("🔍 Environment variables:");
console.log("- PORT:", process.env.PORT);
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- CONVEX_URL:", process.env.CONVEX_URL ? "✅ Set" : "❌ Not set");
console.log(
  "- MPESA variables:",
  process.env.MPESA_CONSUMER_KEY ? "✅ Set" : "❌ Not set",
);

// ... rest of your code

// ✅ Health check endpoint with detailed logging
app.get("/health", (req, res) => {
  console.log("🏥 Health check called at:", new Date().toISOString());
  console.log("- Headers:", req.headers);
  console.log("- IP:", req.ip);
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "campushub-backend",
    port: process.env.PORT || "not set",
  });
});

// Add this before your other routes
app.get("/", (req, res) => {
  res.send("API is running");
});

// Also add a simple HEAD endpoint
app.head("/health", (req, res) => {
  res.status(200).end();
});

// Your routes
app.use("/api", paymentsRouter);
app.use("/api/tournaments", tournamentRouter);

// ✅ CRITICAL: Bind to 0.0.0.0 and use Railway's PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = "0.0.0.0";

console.log(`🚀 Attempting to start server on ${HOST}:${PORT}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server successfully started on http://${HOST}:${PORT}`);
  console.log(`✅ Health check available at http://${HOST}:${PORT}/health`);
  console.log(`✅ Process ID: ${process.pid}`);
});

server.on("error", (error) => {
  console.error("❌ Server error:", error);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
  });
});

// Log when the process starts
console.log("📦 Process started at:", new Date().toISOString());
