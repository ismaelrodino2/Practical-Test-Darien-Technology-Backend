import { Router } from "express";
import {
  listSpacesHandler,
  getSpaceHandler,
  createSpaceHandler,
  updateSpaceHandler,
  deleteSpaceHandler,
} from "../controllers/spaceController";
import { asyncHandler } from "../middlewares/asyncHandler";

const spaceRoutes: import("express").Router = Router();

spaceRoutes.get("/", asyncHandler(listSpacesHandler));
spaceRoutes.get("/:id", asyncHandler(getSpaceHandler));
spaceRoutes.post("/", asyncHandler(createSpaceHandler));
spaceRoutes.put("/:id", asyncHandler(updateSpaceHandler));
spaceRoutes.delete("/:id", asyncHandler(deleteSpaceHandler));

export default spaceRoutes;

