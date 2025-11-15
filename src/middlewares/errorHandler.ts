import { ErrorRequestHandler } from "express";
import HttpError from "../utils/httpError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Erro interno do servidor.",
  });
};

export default errorHandler;

