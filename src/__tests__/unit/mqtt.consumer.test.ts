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
    it("should subscribe to the correct topic when connected", () => {
      startTelemetrySubscriber("SITE_A", "OFFICE_1");

      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        "sites/SITE_A/offices/OFFICE_1/telemetry",
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

      startTelemetrySubscriber("SITE_A", "OFFICE_1");

      expect(mockMqttClient.on).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(mockMqttClient.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
    });

    it("should parse JSON telemetry message correctly and broadcast it", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler as (topic: string, payload: Buffer) => void;
        }
      });

      startTelemetrySubscriber("SITE_A", "OFFICE_1");

      const telemetryData = {
        people: 2,
        co2: 300,
        humidity: 50,
        temperature: 25,
        battery: 90,
      };

      const payload = Buffer.from(JSON.stringify(telemetryData));
      const topic = "sites/SITE_A/offices/OFFICE_1/telemetry";

      if (messageHandler) {
        (messageHandler as (topic: string, payload: Buffer) => void)(
          topic,
          payload,
        );
      }

      expect(mockBroadcastTelemetry).toHaveBeenCalledWith(telemetryData);
    });

    it("should handle invalid JSON gracefully and broadcast raw string", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler as (topic: string, payload: Buffer) => void;
        }
      });

      startTelemetrySubscriber("SITE_A", "OFFICE_1");

      const invalidPayload = Buffer.from("invalid json");
      const topic = "sites/SITE_A/offices/OFFICE_1/telemetry";

      if (messageHandler) {
        (messageHandler as (topic: string, payload: Buffer) => void)(
          topic,
          invalidPayload,
        );
      }

      expect(mockBroadcastTelemetry).toHaveBeenCalledWith("invalid json");
    });

    it("should ignore messages from different topics", () => {
      let messageHandler: ((topic: string, payload: Buffer) => void) | null =
        null;

      (mockMqttClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler as (topic: string, payload: Buffer) => void;
        }
      });

      startTelemetrySubscriber("SITE_A", "OFFICE_1");

      const telemetryData = {
        people: 2,
        co2: 300,
      };

      const payload = Buffer.from(JSON.stringify(telemetryData));
      const differentTopic = "sites/SITE_B/offices/OFFICE_2/telemetry";

      if (messageHandler) {
        (messageHandler as (topic: string, payload: Buffer) => void)(
          differentTopic,
          payload,
        );
      }

      expect(mockBroadcastTelemetry).not.toHaveBeenCalled();
    });

    it("should return cleanup function that unsubscribes and removes listeners", () => {
      const cleanup = startTelemetrySubscriber("SITE_A", "OFFICE_1");

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
        "sites/SITE_A/offices/OFFICE_1/telemetry",
      );
    });

    it("should not subscribe if client is not connected", () => {
      mockMqttClient.connected = false;

      startTelemetrySubscriber("SITE_A", "OFFICE_1");

      expect(mockMqttClient.subscribe).not.toHaveBeenCalled();
    });
  });
});

