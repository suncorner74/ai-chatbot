import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.header('x-request-id') || randomUUID();
  res.setHeader('X-Request-Id', id);
  res.locals.requestId = id;
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    console.info('[Request]', {
      requestId: id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
