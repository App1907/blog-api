import { Request, Response } from "express";
import { statsService } from "./stats.service";
import { sendSuccess } from "../../utils/response";

export class StatsController {
  async getStats(_req: Request, res: Response): Promise<void> {
    const { data, cache } = await statsService.getStats();
    res.setHeader("X-Cache", cache);
    sendSuccess(res, data);
  }
}

export const statsController = new StatsController();
