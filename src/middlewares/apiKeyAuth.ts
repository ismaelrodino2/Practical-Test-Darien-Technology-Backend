import { RequestHandler } from "express";
import { env } from "../config/env";

export const apiKeyAuth: RequestHandler = (req, res, next) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== env.apiKey) {
    return res.status(401).json({
      message: "Invalid or missing API key.",
    });
  }

  return next();
};

export default apiKeyAuth;


