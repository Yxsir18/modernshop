import { Request, Response, NextFunction } from 'express';

// Phase 1 Response Formatter
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pageSize?: number;
    pageIndex?: number;
    totalCount?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: string;
  statusCode: number;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  meta?: ApiResponse['meta']
) => {
  const response: ApiResponse<T> = {
    success,
    message,
    data,
    meta,
    statusCode
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errDetails?: string
) => {
  const response: ApiResponse = {
    success: false,
    message,
    error: errDetails || message,
    statusCode
  };
  return res.status(statusCode).json(response);
};

// Async Controller Wrapper to bypass try-catch boilerplate
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: any) => next(err));
  };
};
