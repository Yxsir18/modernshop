import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[CRITICAL BACKEND ERROR]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Customize specific errors (e.g. Mongoose Validation, JWT errors, SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 400, 'Invalid JSON body format parsed.', err.message);
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Authorization header required') {
    return sendError(res, 401, 'Session clearance verification denied.', err.message);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, 400, 'Input content validation failed.', err.message);
  }

  return sendError(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
