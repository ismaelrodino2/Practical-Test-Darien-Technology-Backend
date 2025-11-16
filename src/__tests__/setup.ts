// Global setup for tests
// Defines default environment variables for tests if not already defined

if (!process.env.API_KEY) {
  process.env.API_KEY = "test-api-key";
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test?schema=public";
}

if (!process.env.PORT) {
  process.env.PORT = "3009";
}

if (!process.env.MQTT_URL) {
  process.env.MQTT_URL = "mqtt://localhost:1883";
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

