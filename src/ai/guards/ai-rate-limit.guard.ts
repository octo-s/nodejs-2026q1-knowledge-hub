import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * In-memory sliding-window rate limiter for AI routes.
 * Limit is configurable via AI_RATE_LIMIT_RPM (default 20) per client IP.
 * On overflow returns 429 with a Retry-After header (seconds).
 */
@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly windowMs = 60_000;
  private readonly limit: number;
  private readonly hits = new Map<string, number[]>();

  constructor() {
    const rpm = Number(process.env.AI_RATE_LIMIT_RPM ?? 20);
    this.limit = Number.isFinite(rpm) && rpm > 0 ? rpm : 20;
  }

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const key = this.clientKey(req);
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.hits.get(key) ?? []).filter(
      (t) => t > windowStart,
    );

    if (timestamps.length >= this.limit) {
      const oldest = timestamps[0];
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - now) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(this.limit));
      res.setHeader('X-RateLimit-Remaining', '0');
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `AI rate limit exceeded (${this.limit} req/min). Retry after ${retryAfterSec}s.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    res.setHeader('X-RateLimit-Limit', String(this.limit));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, this.limit - timestamps.length)),
    );
    return true;
  }

  private clientKey(req: Request): string {
    const fwd = req.headers['x-forwarded-for'];
    const fromHeader = Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]?.trim();
    return (
      (fromHeader as string) || req.ip || req.socket?.remoteAddress || 'unknown'
    );
  }
}
