import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const body: Record<string, unknown> = {
    success: true,
    data,
  };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): Response {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
}
