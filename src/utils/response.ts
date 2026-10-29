import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ResponseHelper {
  static sendSuccess<T>(
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

  static sendPaginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      pagination,
    });
  }

  static sendMessage(
    res: Response,
    message: string,
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
    });
  }

  static sendError(
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

  static buildPagination(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }
}
