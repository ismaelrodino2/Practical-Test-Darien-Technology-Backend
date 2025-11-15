import dotenv from "dotenv";

dotenv.config();

const requiredVariables = ["DATABASE_URL"] as const;

const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  console.warn(
    `Aviso: variáveis de ambiente ausentes -> ${missingVariables.join(", ")}`,
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
};

export default env;

