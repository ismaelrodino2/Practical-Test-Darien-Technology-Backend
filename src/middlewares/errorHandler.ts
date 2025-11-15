import { ErrorRequestHandler } from "express";
import { isHttpError } from "../utils/httpError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isHttpError(error)) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error.",
  });
};

export default errorHandler;

