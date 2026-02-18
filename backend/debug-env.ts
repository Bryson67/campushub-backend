import dotenv from "dotenv";
import fs from "fs";
import path from "path";

console.log("=== DEBUG ENVIRONMENT VARIABLES ===");

// Check current directory
console.log("Current directory:", process.cwd());
console.log("__dirname:", __dirname);

// Check multiple possible .env locations
const possiblePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];

possiblePaths.forEach((envPath) => {
  console.log(`\nChecking: ${envPath}`);
  console.log("Exists:", fs.existsSync(envPath));

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    console.log("Content preview:", content.substring(0, 100) + "...");

    // Try loading from this path
    const result = dotenv.config({ path: envPath });
    console.log("Load result:", result.error ? "Error" : "Success");
  }
});

// Check what's actually loaded
console.log("\n=== LOADED ENVIRONMENT VARIABLES ===");
console.log("CONVEX_URL:", process.env.CONVEX_URL);
console.log(
  "MPESA_CONSUMER_KEY:",
  process.env.MPESA_CONSUMER_KEY ? "✅ Present" : "❌ Missing",
);
console.log(
  "MPESA_CONSUMER_SECRET:",
  process.env.MPESA_CONSUMER_SECRET ? "✅ Present" : "❌ Missing",
);
console.log(
  "MPESA_BUSINESS_SHORTCODE:",
  process.env.MPESA_BUSINESS_SHORTCODE ? "✅ Present" : "❌ Missing",
);
