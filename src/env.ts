import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

export const env = z
  .object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    PORT: z.string(),
    SEND_EMAIL_STMP: z.string(),
    SEND_EMAIL_USER_EMAIL: z.string().email(),
    SEND_EMAIL_USER_PASS: z.string(),
    HELCIM_API_TOKEN: z.string(),
    SEND_EMAIL_WAREHOUSE_EMAIL: z.string().email(),
    SEND_EMAIL_INVENTORY_EMAIL: z.string().email(),
  })
  .parse(process.env);
