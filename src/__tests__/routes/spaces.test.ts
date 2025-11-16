import { authenticatedRequest, unauthenticatedRequest } from "../helpers/testHelpers";
import prisma from "../../config/prismaClient";

jest.mock("../../config/prismaClient", () => ({
  __esModule: true,
  default: {
    space: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    location: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Spaces Routes", () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GET /api/spaces", () => {
    it("should return 401 when API key is missing", async () => {
      const response = await unauthenticatedRequest().get("/api/spaces");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/spaces/:id", () => {
    it("should return 401 when API key is missing", async () => {
      const response = await unauthenticatedRequest().get("/api/spaces/1");

      expect(response.status).toBe(401);
    });

    it("should return 404 when space does not exist", async () => {
      (mockPrisma.space.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await authenticatedRequest().get("/api/spaces/non-existent-id");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Space not found.");
    });
  });

  describe("POST /api/spaces", () => {
    it("should return 401 when API key is missing", async () => {
      const response = await unauthenticatedRequest()
        .post("/api/spaces")
        .send({ name: "Test Space" });

      expect(response.status).toBe(401);
    });

    it("should return 400 or 422 when body is invalid", async () => {
      const response = await authenticatedRequest()
        .post("/api/spaces")
        .send({});

      // May return 400 or 422 depending on validation
      expect([400, 422]).toContain(response.status);
    });
  });
});

