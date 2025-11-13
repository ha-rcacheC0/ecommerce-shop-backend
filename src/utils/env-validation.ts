// Environment variable validation utility
// Ensures all required environment variables are set on startup

interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // Application
  NODE_ENV: string;
  PORT: string;

  // Authentication
  JWT_SECRET: string;
  SESSION_SECRET: string;

  // Payment
  HELCIM_API_TOKEN: string;
  TESTING_HELCIM_API_TOKEN: string;

  // Email
  SEND_EMAIL_USER_EMAIL: string;
  SEND_EMAIL_USER_PASS: string;
  SEND_EMAIL_STMP_HOST: string;
  SEND_EMAIL_WAREHOUSE_EMAIL: string;
  SEND_EMAIL_INVENTORY_EMAIL: string;
}

/**
 * Validates that all required environment variables are present
 * Throws an error with detailed message if any are missing
 */
export function validateEnvironment(): EnvConfig {
  const requiredVars: (keyof EnvConfig)[] = [
    "DATABASE_URL",
    "NODE_ENV",
    "PORT",
    "JWT_SECRET",
    "SESSION_SECRET",
    "HELCIM_API_TOKEN",
    "TESTING_HELCIM_API_TOKEN",
    "SEND_EMAIL_USER_EMAIL",
    "SEND_EMAIL_USER_PASS",
    "SEND_EMAIL_STMP_HOST",
    "SEND_EMAIL_WAREHOUSE_EMAIL",
    "SEND_EMAIL_INVENTORY_EMAIL",
  ];

  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check for missing required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Check for weak/default values
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push(
      "JWT_SECRET is shorter than 32 characters. Generate a stronger secret with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  if (
    process.env.SESSION_SECRET &&
    (process.env.SESSION_SECRET === "SomeSecret" ||
      process.env.SESSION_SECRET.length < 16)
  ) {
    warnings.push(
      "SESSION_SECRET appears to be a default or weak value. Use a strong random string."
    );
  }

  // Report missing variables
  if (missingVars.length > 0) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║           MISSING REQUIRED ENVIRONMENT VARIABLES               ║
╚════════════════════════════════════════════════════════════════╝

The following environment variables are required but not set:

${missingVars.map((v) => `  ✗ ${v}`).join("\n")}

To fix this:
1. Copy .env.example to .env: cp .env.example .env
2. Fill in the missing values in .env
3. Restart the application

See README.md for details on each variable.
    `;

    throw new Error(errorMessage);
  }

  // Report warnings
  if (warnings.length > 0 && process.env.NODE_ENV !== "development") {
    console.warn("\n⚠️  Environment Variable Warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn("");
  }

  // Return validated config
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV: process.env.NODE_ENV!,
    PORT: process.env.PORT!,
    JWT_SECRET: process.env.JWT_SECRET!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    HELCIM_API_TOKEN: process.env.HELCIM_API_TOKEN!,
    TESTING_HELCIM_API_TOKEN: process.env.TESTING_HELCIM_API_TOKEN!,
    SEND_EMAIL_USER_EMAIL: process.env.SEND_EMAIL_USER_EMAIL!,
    SEND_EMAIL_USER_PASS: process.env.SEND_EMAIL_USER_PASS!,
    SEND_EMAIL_STMP_HOST: process.env.SEND_EMAIL_STMP_HOST!,
    SEND_EMAIL_WAREHOUSE_EMAIL: process.env.SEND_EMAIL_WAREHOUSE_EMAIL!,
    SEND_EMAIL_INVENTORY_EMAIL: process.env.SEND_EMAIL_INVENTORY_EMAIL!,
  };
}

/**
 * Get environment with validation
 * Use this instead of process.env to get type-safe environment variables
 */
export function getEnv(): EnvConfig {
  return validateEnvironment();
}

// Validate on module load in production
if (process.env.NODE_ENV === "production") {
  try {
    validateEnvironment();
    console.info("✓ All required environment variables are set");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
