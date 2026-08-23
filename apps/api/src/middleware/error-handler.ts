import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = res.locals.requestId;
  console.error('[ErrorHandler]', {
    requestId,
    message: error.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (res.headersSent) return;
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong. Please try again.',
      requestId,
    },
  });
}
