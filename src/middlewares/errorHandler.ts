import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
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
  // Operational AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Mongoose duplicate key (e.g. email)
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "field";
    if (field === "email") {
      sendError(res, Messages.EMAIL_EXISTS, 409);
      return;
    }
    sendError(res, `Duplicate value for ${field}`, 409);
    return;
  }

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, Messages.VALIDATION_FAILED, 400, errors);
    return;
  }

  // Mongoose CastError (invalid ObjectId that slipped through)
  if (err instanceof MongooseError.CastError) {
    sendError(res, Messages.INVALID_OBJECT_ID, 400);
    return;
  }

  // Unexpected errors — never leak stack or password
  if (!config.isProduction) {
    console.error("[Error]", err);
  }

  sendError(res, Messages.INTERNAL_ERROR, 500);
}
