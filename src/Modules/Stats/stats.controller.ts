import { Request, Response } from "express";
import { statsService } from "./stats.service";
import { sendSuccess } from "../../utils/response";

export class StatsController {
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await statsService.getStats();
    sendSuccess(res, stats);
  }
}

export const statsController = new StatsController();
