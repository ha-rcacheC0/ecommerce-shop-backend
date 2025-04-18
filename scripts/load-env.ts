import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load base .env file
dotenv.config();

// Determine which environment to use (default to development)
const environment = process.env.NODE_ENV || "development";

// Load environment-specific file
const envFile = path.resolve(process.cwd(), `.env.${environment}`);
if (fs.existsSync(envFile)) {
  const envConfig = dotenv.parse(fs.readFileSync(envFile));

  // Add environment variables to process.env
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }

  console.log(`Loaded environment: ${environment}`);
} else {
  console.warn(`Warning: Environment file for ${environment} not found`);
}
