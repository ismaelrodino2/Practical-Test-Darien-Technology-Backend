import { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Rota não encontrada.",
  });
};

export default notFoundHandler;

