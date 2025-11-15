import dotenv from "dotenv";

dotenv.config();

const requiredVariables = ["DATABASE_URL", "API_KEY"] as const;

const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  console.warn(
    `Warning: missing environment variables -> ${missingVariables.join(", ")}`,
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3009),
  databaseUrl: process.env.DATABASE_URL ?? "",
  apiKey: process.env.API_KEY ?? "",
};

export default env;

