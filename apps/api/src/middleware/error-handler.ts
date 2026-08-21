import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 *
 * In Express, a middleware with 4 parameters (error, req, res, next)
 * is automatically treated as an error handler. Any time a route calls
 * next(error), Express skips straight to this function.
 *
 * This must be registered LAST in app.ts — after all routes.
 *
 * SECURITY RULE:
 * We log the full technical error on the server (stack trace, context).
 * We send ONLY a safe, generic message to the client.
 *
 * This prevents leaking:
 * - Stack traces (reveal internal file paths and logic)
 * - API keys (if accidentally embedded in an error message)
 * - Database connection strings
 * - Any other internal infrastructure details
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // next is required for Express to recognize this as an error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log the real, detailed error — visible only to you (the developer)
  console.error('[ErrorHandler]', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Send a safe response — visible to the client (the user)
  res.status(500).json({
    error: {
      code: 'LLM_REQUEST_FAILED',
      message: 'Unable to generate a response. Please try again.',
    },
  });
}
