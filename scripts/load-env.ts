import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Clear any existing env vars that might be cached
// This is important to prevent conflicts
delete process.env.DATABASE_URL;

// Determine which environment to use (default to development)
const environment = process.env.NODE_ENV || "development";

// First try to load environment-specific file
const envFile = path.resolve(process.cwd(), `.env.${environment}`);
if (fs.existsSync(envFile)) {
  console.log(`Loading environment config from: ${envFile}`);
  dotenv.config({ path: envFile });
} else {
  // Fall back to base .env file
  console.log(`Environment file ${envFile} not found, loading base .env`);
  dotenv.config();
}

if (process.env.DATABASE_URL) {
  const dbUrlParts = (process.env.DATABASE_URL as string).split("@");
  const maskedUrl =
    dbUrlParts.length > 1
      ? `[credentials-hidden]@${dbUrlParts[1]}`
      : "[formatted-db-url-hidden]";
  console.log(`Using database: ${maskedUrl}`);
}

console.log(`Environment '${environment}' loaded successfully`);
