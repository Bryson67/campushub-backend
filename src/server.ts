import dotenv from "dotenv";
import express from "express";
import path from "path";
import paymentsRouter from "./routes/payments";
import tournamentRouter from "./routes/tournament";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(express.json());

// ✅ Health check endpoint (must be at root level)
app.get("/health", (req, res) => {
  console.log("🏥 Health check called");
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "campushub-backend",
  });
});

// Your routes
app.use("/api", paymentsRouter);
app.use("/api/tournaments", tournamentRouter);

// ✅ CRITICAL: Bind to 0.0.0.0 and use Railway's PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = "0.0.0.0"; // This is essential for Railway

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`✅ Health check available at /health`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
  });
});
