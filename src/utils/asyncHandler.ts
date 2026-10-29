import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export class AsyncHandler {
  static wrap(fn: AsyncRequestHandler): RequestHandler {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
