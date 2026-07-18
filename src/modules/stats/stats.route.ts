import express from "express";
import { StatsController } from "./stats.controller";

const router = express.Router();

router.get("/platform", StatsController.getPlatformStats);

export const statsRouter = router;
