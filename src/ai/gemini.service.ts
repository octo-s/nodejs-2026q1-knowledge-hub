import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface GeminiCallResult {
  text: string;
  latencyMs: number;
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
  model: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries = 3;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      throw new Error(
        'GEMINI_API_KEY is not configured. Copy .env.example to .env and set a real key.',
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    this.timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 30_000);
  }

  async generate(prompt: string): Promise<GeminiCallResult> {
    const start = Date.now();
    let attempt = 0;
    let lastErr: unknown;

    while (attempt < this.maxRetries) {
      attempt += 1;
      try {
        const result = await this.withTimeout(
          this.client.models.generateContent({
            model: this.model,
            contents: prompt,
          }),
          this.timeoutMs,
        );

        const text = this.extractText(result);
        const usage = this.extractUsage(result);

        return {
          text,
          latencyMs: Date.now() - start,
          model: this.model,
          ...usage,
        };
      } catch (err) {
        lastErr = err;
        const status = this.statusFromError(err);
        const retriable = status === 429 || (status >= 500 && status < 600);

        this.logger.warn(
          `Gemini call failed (attempt ${attempt}/${this.maxRetries}, status=${status ?? 'n/a'})`,
        );
        if (!retriable || attempt >= this.maxRetries) break;
        await this.sleep(this.backoffMs(attempt));
      }
    }

    throw this.toHttpException(lastErr);
  }

  private extractText(result: unknown): string {
    const r = result as Record<string, unknown> | null;
    if (!r) return '';
    if (typeof (r as { text?: unknown }).text === 'string') {
      return (r as { text: string }).text;
    }
    const response = (r as { response?: { text?: () => string } }).response;
    if (response && typeof response.text === 'function') {
      try {
        return response.text();
      } catch {
        /* noop */
      }
    }
    return '';
  }

  private extractUsage(result: unknown): Partial<GeminiCallResult> {
    const meta = (result as { usageMetadata?: Record<string, number> } | null)
      ?.usageMetadata;
    if (!meta) return {};
    return {
      promptTokens: meta.promptTokenCount,
      responseTokens: meta.candidatesTokenCount,
      totalTokens: meta.totalTokenCount,
    };
  }

  private statusFromError(err: unknown): number {
    const e = err as {
      status?: number;
      code?: number;
      response?: { status?: number };
    };
    return Number(e?.status ?? e?.code ?? e?.response?.status ?? 0);
  }

  private toHttpException(err: unknown) {
    const status = this.statusFromError(err);
    const message = err instanceof Error ? err.message : 'Unknown Gemini error';
    const safe = message.replace(/key=[^&\s]+/gi, 'key=***');

    if (status === 401 || status === 403) {
      return new InternalServerErrorException(
        'AI provider authentication failed. Check server configuration.',
      );
    }
    return new ServiceUnavailableException(`AI provider unavailable: ${safe}`);
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => {
        const e: Error & { status?: number } = new Error(
          `Gemini request timed out after ${ms}ms`,
        );
        e.status = 504;
        reject(e);
      }, ms);
      promise.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        },
      );
    });
  }

  private backoffMs(attempt: number): number {
    // 250ms, 500ms, 1000ms (+ jitter)
    return 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 100);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
