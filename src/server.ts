import app from "./app";
import env from "./config/env";
import startTelemetrySubscriber from "./integrations/mqtt/telemetrySubscriber";
import { initWebSocketServer } from "./integrations/ws/websocketServer";

const server = app.listen(env.port, () => {
  console.log(`API ready at http://localhost:${env.port}`);
});

initWebSocketServer(server);

// Start subscriber for all sites and offices using MQTT wildcards
const stopTelemetrySubscriber = startTelemetrySubscriber();

const gracefulShutdown = () => {
  stopTelemetrySubscriber();
  server.close(() => {
    console.log("Server shut down gracefully.");
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

