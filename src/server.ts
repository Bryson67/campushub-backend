import dotenv from "dotenv";
import express from "express";
import path from "path";
import paymentsRouter from "./routes/payments";
import tournamentRouter from "./routes/tournament";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
