import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ResponseHelper } from "../utils/response";
import { Messages } from "../constants/messages";

type RequestPart = "body" | "query" | "params";

export class ValidateMiddleware {
  validate(schema: ZodSchema, part: RequestPart = "body") {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const parsed = schema.parse(req[part]);
        req[part] = parsed;
        next();
      } catch (err) {
        if (err instanceof ZodError) {
          const errors = err.errors.map((e) => ({
            field: e.path.join(".") || part,
            message: e.message,
          }));
          ResponseHelper.sendError(res, Messages.VALIDATION_FAILED, 400, errors);
          return;
        }
        next(err);
      }
    };
  }
}
