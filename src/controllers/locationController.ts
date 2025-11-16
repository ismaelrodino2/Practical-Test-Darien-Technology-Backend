import { RequestHandler } from "express";
import { listLocations } from "../services/locationService";

export const getLocations: RequestHandler = async (_req, res, next) => {
  try {
    const locations = await listLocations();
    res.json({ data: locations });
  } catch (error) {
    next(error);
  }
};

