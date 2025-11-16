import request from "supertest";
import app from "../../app";

/**
 * Helper to make authenticated requests in tests
 * @param apiKey - API key for authentication (optional, uses API_KEY from env by default)
 * @returns Function that returns supertest object with authentication header configured
 */
export const authenticatedRequest = (apiKey?: string) => {
  const key = apiKey ?? process.env.API_KEY ?? "test-api-key";
  const req = request(app);
  // Attaches authentication header using internal property
  return {
    get: (path: string) => req.get(path).set("x-api-key", key),
    post: (path: string) => req.post(path).set("x-api-key", key),
    put: (path: string) => req.put(path).set("x-api-key", key),
    delete: (path: string) => req.delete(path).set("x-api-key", key),
    patch: (path: string) => req.patch(path).set("x-api-key", key),
  };
};

/**
 * Helper to make unauthenticated requests in tests
 */
export const unauthenticatedRequest = () => {
  return request(app);
};

