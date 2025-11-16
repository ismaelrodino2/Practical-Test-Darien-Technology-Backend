import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;

export const initWebSocketServer = (httpServer: HttpServer): WebSocketServer => {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({
    server: httpServer,
    path: "/telemetry",
  });

  wss.on("connection", (socket: WebSocket) => {
    console.log("[WS] Client connected");

    socket.on("close", () => {
      console.log("[WS] Client disconnected");
    });

    socket.on("error", (error) => {
      console.error("[WS] Client error:", error.message);
    });
  });

  wss.on("error", (error) => {
    console.error("[WS] Server error:", error.message);
  });

  console.log("[WS] WebSocket server running on /telemetry");
  return wss;
};

export const broadcastTelemetry = (payload: unknown) => {
  if (!wss) {
    return;
  }

  const message =
    typeof payload === "string" || Buffer.isBuffer(payload) ? payload : JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export default {
  initWebSocketServer,
  broadcastTelemetry,
};

