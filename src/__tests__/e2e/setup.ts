// E2E test specific setup
// Loads environment variables from .env.test if it exists
import dotenv from "dotenv";
import { resolve } from "path";

// Tries to load .env.test, if it doesn't exist, uses default variables
dotenv.config({ path: resolve(process.cwd(), ".env.test") });

// Defines default environment variables for E2E tests if not already defined
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://prisma:prisma@localhost:5433/tests?schema=public";
}

if (!process.env.API_KEY) {
  process.env.API_KEY = "test-api-key";
}

if (!process.env.PORT) {
  process.env.PORT = "3009";
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

