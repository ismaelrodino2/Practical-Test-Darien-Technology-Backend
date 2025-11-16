import { authenticatedRequest, unauthenticatedRequest } from "../helpers/testHelpers";

describe("Health Check Route", () => {
  describe("GET /api/health", () => {
    it("should return 401 when API key is missing", async () => {
      const response = await unauthenticatedRequest().get("/api/health");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Invalid or missing API key.");
    });

    it("should return 401 when API key is invalid", async () => {
      const response = await authenticatedRequest("invalid-key").get("/api/health");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Invalid or missing API key.");
    });

    it("should return 200 with status ok when API key is valid", async () => {
      const response = await authenticatedRequest().get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body.status).toBe("ok");
      expect(typeof response.body.timestamp).toBe("string");
    });
  });
});

