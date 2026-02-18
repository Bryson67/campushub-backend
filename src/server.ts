import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file - do this FIRST
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Log to verify CONVEX_URL is loaded (remove this in production)
console.log(
  "🔍 CONVEX_URL:",
  process.env.CONVEX_URL ? "✅ Loaded" : "❌ Not loaded",
);
console.log(
  "🔍 MPESA variables:",
  process.env.MPESA_CONSUMER_KEY ? "✅ Loaded" : "❌ Not loaded",
);

import express from "express";
import paymentsRouter from "./routes/payments";
import tournamentsRouter from "./routes/tournament";

const app = express();
app.use(express.json());

// Routes
app.use("/api", paymentsRouter);
app.use("/api/tournament", tournamentsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
