import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { AppError } from "../utils/AppError";
import { ResponseHelper } from "../utils/response";
import { Messages } from "../constants/messages";
import { config } from "../constants/config";

export class ErrorMiddleware {
  notFoundHandler = (
    _req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    next(new AppError(Messages.NOT_FOUND, 404));
  };

  errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    if (err instanceof AppError) {
      ResponseHelper.sendError(res, err.message, err.statusCode, err.errors);
      return;
    }

    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
      const field = keyValue ? Object.keys(keyValue)[0] : "field";
      if (field === "email") {
        ResponseHelper.sendError(res, Messages.EMAIL_EXISTS, 409);
        return;
      }
      ResponseHelper.sendError(res, `Duplicate value for ${field}`, 409);
      return;
    }

    if (err instanceof MongooseError.ValidationError) {
      const errors = Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      ResponseHelper.sendError(res, Messages.VALIDATION_FAILED, 400, errors);
      return;
    }

    if (err instanceof MongooseError.CastError) {
      ResponseHelper.sendError(res, Messages.INVALID_OBJECT_ID, 400);
      return;
    }

    if (!config.isProduction) {
      console.error("[Error]", err);
    }

    ResponseHelper.sendError(res, Messages.INTERNAL_ERROR, 500);
  };
}
