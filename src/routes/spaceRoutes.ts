import { Router } from "express";
import {
  listSpacesHandler,
  getSpaceHandler,
  createSpaceHandler,
  updateSpaceHandler,
  deleteSpaceHandler,
} from "../controllers/spaceController";

const spaceRoutes: import("express").Router = Router();

spaceRoutes.get("/", listSpacesHandler);
spaceRoutes.get("/:id", getSpaceHandler);
spaceRoutes.post("/", createSpaceHandler);
spaceRoutes.put("/:id", updateSpaceHandler);
spaceRoutes.delete("/:id", deleteSpaceHandler);

export default spaceRoutes;

