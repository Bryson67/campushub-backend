"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
console.log("=== DEBUG ENVIRONMENT VARIABLES ===");
// Check current directory
console.log("Current directory:", process.cwd());
console.log("__dirname:", __dirname);
// Check multiple possible .env locations
const possiblePaths = [
    path_1.default.resolve(process.cwd(), ".env"),
    path_1.default.resolve(__dirname, ".env"),
    path_1.default.resolve(__dirname, "../.env"),
    path_1.default.resolve(__dirname, "../../.env"),
];
possiblePaths.forEach((envPath) => {
    console.log(`\nChecking: ${envPath}`);
    console.log("Exists:", fs_1.default.existsSync(envPath));
    if (fs_1.default.existsSync(envPath)) {
        const content = fs_1.default.readFileSync(envPath, "utf8");
        console.log("Content preview:", content.substring(0, 100) + "...");
        // Try loading from this path
        const result = dotenv_1.default.config({ path: envPath });
        console.log("Load result:", result.error ? "Error" : "Success");
    }
});
// Check what's actually loaded
console.log("\n=== LOADED ENVIRONMENT VARIABLES ===");
console.log("CONVEX_URL:", process.env.CONVEX_URL);
console.log("MPESA_CONSUMER_KEY:", process.env.MPESA_CONSUMER_KEY ? "✅ Present" : "❌ Missing");
console.log("MPESA_CONSUMER_SECRET:", process.env.MPESA_CONSUMER_SECRET ? "✅ Present" : "❌ Missing");
console.log("MPESA_BUSINESS_SHORTCODE:", process.env.MPESA_BUSINESS_SHORTCODE ? "✅ Present" : "❌ Missing");
