import { Router } from "express";
import { getLocations } from "../controllers/locationController";

const router: import("express").Router = Router();

router.get("/", getLocations);

export default router;


