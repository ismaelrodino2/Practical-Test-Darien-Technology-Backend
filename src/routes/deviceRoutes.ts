import { Router } from "express";
import {
  getDeviceDesiredHandler,
  getDeviceReportedHandler,
  updateDeviceDesiredHandler,
} from "../controllers/deviceController";
import { asyncHandler } from "../middlewares/asyncHandler";

const deviceRoutes: import("express").Router = Router();

deviceRoutes.get("/:officeId/desired", asyncHandler(getDeviceDesiredHandler));
deviceRoutes.get("/:officeId/reported", asyncHandler(getDeviceReportedHandler));
deviceRoutes.put("/:officeId/desired", asyncHandler(updateDeviceDesiredHandler));

export default deviceRoutes;

