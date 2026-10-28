import { Router } from "express";
import { statsController } from "../Modules/Stats/stats.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/",
  asyncHandler((req, res) => statsController.getStats(req, res))
);

export default router;
