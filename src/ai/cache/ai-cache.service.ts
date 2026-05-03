import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class AiCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;

  constructor() {
    const ttlSec = Number(process.env.AI_CACHE_TTL_SEC ?? 300);
    this.ttlMs = (Number.isFinite(ttlSec) && ttlSec > 0 ? ttlSec : 300) * 1000;
  }

  /**
   * Build deterministic cache key from endpoint name + identifying parts.
   * Includes article `updatedAt` so cache auto-invalidates when content changes.
   */
  buildKey(endpoint: string, parts: Record<string, unknown>): string {
    const normalised = JSON.stringify(
      Object.keys(parts)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = parts[k];
          return acc;
        }, {}),
    );
    const hash = createHash('sha1').update(normalised).digest('hex');
    return `${endpoint}:${hash}`;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
