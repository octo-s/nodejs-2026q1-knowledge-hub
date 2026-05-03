import { Injectable } from '@nestjs/common';

export type AiEndpoint = 'summarize' | 'translate' | 'analyze' | 'generate';

export interface UsageStats {
  startedAt: string;
  uptimeSec: number;
  totalRequests: number;
  byEndpoint: Record<AiEndpoint, number>;
  tokens: {
    prompt: number;
    response: number;
    total: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRatio: number;
  };
  latencyMs: {
    avg: number;
    last: number;
    samples: number;
  };
  errors: number;
}

@Injectable()
export class UsageService {
  private readonly startedAt = new Date();
  private totalRequests = 0;
  private readonly byEndpoint: Record<AiEndpoint, number> = {
    summarize: 0,
    translate: 0,
    analyze: 0,
    generate: 0,
  };
  private promptTokens = 0;
  private responseTokens = 0;
  private totalTokens = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private latencySum = 0;
  private latencySamples = 0;
  private latencyLast = 0;
  private errors = 0;

  recordRequest(endpoint: AiEndpoint): void {
    this.totalRequests += 1;
    this.byEndpoint[endpoint] += 1;
  }

  recordTokens(prompt = 0, response = 0, total = 0): void {
    this.promptTokens += prompt || 0;
    this.responseTokens += response || 0;
    this.totalTokens += total || prompt + response || 0;
  }

  recordLatency(ms: number): void {
    this.latencyLast = ms;
    this.latencySum += ms;
    this.latencySamples += 1;
  }

  recordCacheHit(): void {
    this.cacheHits += 1;
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1;
  }

  recordError(): void {
    this.errors += 1;
  }

  getStats(): UsageStats {
    const totalCacheLookups = this.cacheHits + this.cacheMisses;
    return {
      startedAt: this.startedAt.toISOString(),
      uptimeSec: Math.round((Date.now() - this.startedAt.getTime()) / 1000),
      totalRequests: this.totalRequests,
      byEndpoint: { ...this.byEndpoint },
      tokens: {
        prompt: this.promptTokens,
        response: this.responseTokens,
        total: this.totalTokens,
      },
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRatio:
          totalCacheLookups === 0
            ? 0
            : Number((this.cacheHits / totalCacheLookups).toFixed(3)),
      },
      latencyMs: {
        avg:
          this.latencySamples === 0
            ? 0
            : Math.round(this.latencySum / this.latencySamples),
        last: this.latencyLast,
        samples: this.latencySamples,
      },
      errors: this.errors,
    };
  }
}
