import { Router } from "express";
import { StatsController } from "../Modules/Stats/stats.controller";
import { AsyncHandler } from "../utils/asyncHandler";

export function createStatsRoutes(statsController: StatsController): Router {
  const router = Router();

  router.get("/", AsyncHandler.wrap(statsController.getStats));

  return router;
}
