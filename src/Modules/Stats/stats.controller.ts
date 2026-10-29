import { Request, Response } from "express";
import { StatsService } from "./stats.service";
import { ResponseHelper } from "../../utils/response";

export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  getStats = async (_req: Request, res: Response): Promise<void> => {
    const { data, cache } = await this.statsService.getStats();
    res.setHeader("X-Cache", cache);
    ResponseHelper.sendSuccess(res, data);
  };
}
