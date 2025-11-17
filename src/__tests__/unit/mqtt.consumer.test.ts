import { startTelemetrySubscriber } from "../../integrations/mqtt/telemetrySubscriber";
import mqttClient from "../../integrations/mqtt/mqttClient";
import { broadcastTelemetry } from "../../integrations/ws/websocketServer";

jest.mock("../../integrations/mqtt/mqttClient", () => ({
  __esModule: true,
  default: {
    connected: true,
    subscribe: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

jest.mock("../../integrations/ws/websocketServer", () => ({
  broadcastTelemetry: jest.fn(),
}));

describe("MQTT Consumer - Unit Tests", () => {
  const mockMqttClient = mqttClient as jest.Mocked<typeof mqttClient>;
  const mockBroadcastTelemetry = broadcastTelemetry as jest.MockedFunction<
    typeof broadcastTelemetry
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMqttClient.connected = true;
    (mockMqttClient.subscribe as jest.Mock).mockImplementation(
      (topic, options, callback) => {
        if (callback) callback(null);
      },
    );
  });

  describe("startTelemetrySubscriber", () => {
    it("should subscribe to wildcard topics when connected", () => {
      startTelemetrySubscriber();

      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        "sites/+/offices/+/telemetry",
        { qos: 0 },
        expect.any(Function),
      );
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        "sites/+/offices/+/reported",
        { qos: 0 },
        expect.any(Function),
      );
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        "sites/+/offices/+/desired",
        { qos: 0 },
        expect.any(Function),
      );
    });

    it("should set up message handler when message is received", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      startTelemetrySubscriber();

      expect(mockMqttClient.on).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(mockMqttClient.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
    });

    it("should parse JSON telemetry message correctly and broadcast it with metadata", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler as (topic: string, payload: Buffer) => void;
        }
      });

      startTelemetrySubscriber();

      const telemetryData = {
        ts: "2025-10-08T14:30:00Z",
        temp_c: 24.1,
        humidity_pct: 49.3,
        co2_ppm: 930,
        occupancy: 4,
        power_w: 120,
      };

      const payload = Buffer.from(JSON.stringify(telemetryData));
      const topic = "sites/SITE_A/offices/OFFICE_1/telemetry";

      if (messageHandler) {
        (messageHandler as (topic: string, payload: Buffer) => void)(
          topic,
          payload,
        );
      }

      expect(mockBroadcastTelemetry).toHaveBeenCalledWith({
        ...telemetryData,
        siteId: "SITE_A",
        officeId: "OFFICE_1",
        topic: "sites/SITE_A/offices/OFFICE_1/telemetry",
      });
    });

    it("should handle invalid JSON gracefully and broadcast raw string", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler as (topic: string, payload: Buffer) => void;
        }
      });

      startTelemetrySubscriber();

      const invalidPayload = Buffer.from("invalid json");
      const topic = "sites/SITE_A/offices/OFFICE_1/telemetry";

      if (messageHandler) {
        (messageHandler as (topic: string, payload: Buffer) => void)(
          topic,
          invalidPayload,
        );
      }

      expect(mockBroadcastTelemetry).toHaveBeenCalledWith({
        data: "invalid json",
        siteId: "SITE_A",
        officeId: "OFFICE_1",
        topic: "sites/SITE_A/offices/OFFICE_1/telemetry",
      });
    });

    it("should handle messages from different sites/offices", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler as (topic: string, payload: Buffer) => void;
        }
      });

      startTelemetrySubscriber();

      const telemetryData = {
        ts: "2025-10-08T14:30:00Z",
        temp_c: 24.1,
        occupancy: 2,
      };

      const payload = Buffer.from(JSON.stringify(telemetryData));
      const differentTopic = "sites/SITE_B/offices/OFFICE_2/telemetry";

      if (messageHandler) {
        (messageHandler as (topic: string, payload: Buffer) => void)(
          differentTopic,
          payload,
        );
      }

      // Should broadcast with different site/office info
      expect(mockBroadcastTelemetry).toHaveBeenCalledWith({
        ...telemetryData,
        siteId: "SITE_B",
        officeId: "OFFICE_2",
        topic: "sites/SITE_B/offices/OFFICE_2/telemetry",
      });
    });

    it("should return cleanup function that unsubscribes and removes listeners", () => {
      const cleanup = startTelemetrySubscriber();

      expect(cleanup).toBeInstanceOf(Function);

      cleanup();

      expect(mockMqttClient.off).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(mockMqttClient.off).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
      expect(mockMqttClient.unsubscribe).toHaveBeenCalledWith(
        "sites/+/offices/+/telemetry",
      );
      expect(mockMqttClient.unsubscribe).toHaveBeenCalledWith(
        "sites/+/offices/+/reported",
      );
      expect(mockMqttClient.unsubscribe).toHaveBeenCalledWith(
        "sites/+/offices/+/desired",
      );
    });

    it("should not subscribe if client is not connected", () => {
      mockMqttClient.connected = false;

      startTelemetrySubscriber();

      expect(mockMqttClient.subscribe).not.toHaveBeenCalled();
    });
  });
});

