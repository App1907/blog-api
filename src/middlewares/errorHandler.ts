import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/response";
import { Messages } from "../constants/messages";
import { config } from "../constants/config";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError(Messages.NOT_FOUND, 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  if (!config.isProduction) {
    console.error("[Error]", err);
  }

  sendError(res, Messages.INTERNAL_ERROR, 500);
}
