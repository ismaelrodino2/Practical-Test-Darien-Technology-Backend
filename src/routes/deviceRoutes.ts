import { Router } from "express";
import { updateDeviceDesiredHandler } from "../controllers/deviceController";
import { asyncHandler } from "../middlewares/asyncHandler";

const deviceRoutes: import("express").Router = Router();

deviceRoutes.put("/:officeId/desired", asyncHandler(updateDeviceDesiredHandler));

export default deviceRoutes;

