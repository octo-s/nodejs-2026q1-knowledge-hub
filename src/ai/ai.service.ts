import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, GeminiCallResult } from './gemini.service';
import { PromptsService } from './prompts/prompts.service';
import { AiCacheService } from './cache/ai-cache.service';
import { UsageService } from './usage/usage.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';

export interface SummarizeArticleResponse {
  articleId: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
}

export interface TranslateArticleResponse {
  articleId: string;
  translatedText: string;
  detectedLanguage: string;
}

export interface AnalyzeArticleResponse {
  articleId: string;
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly prompts: PromptsService,
    private readonly cache: AiCacheService,
    private readonly usage: UsageService,
  ) {}

  async summarizeArticle(
    articleId: string,
    dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    this.usage.recordRequest('summarize');
    const article = await this.getArticleOrThrow(articleId);

    const cacheKey = this.cache.buildKey('summarize', {
      articleId: article.id,
      updatedAt: article.updatedAt.toISOString(),
      maxLength: dto.maxLength ?? 'medium',
    });
    const cached = this.cache.get<SummarizeArticleResponse>(cacheKey);
    if (cached) {
      this.usage.recordCacheHit();
      return cached;
    }
    this.usage.recordCacheMiss();

    const prompt = this.prompts.summarize(article.content, dto.maxLength);
    const result = await this.callGemini(prompt);
    const summary = result.text.trim();
    const response: SummarizeArticleResponse = {
      articleId: article.id,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };
    this.cache.set(cacheKey, response);
    return response;
  }

  async translateArticle(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponse> {
    this.usage.recordRequest('translate');
    const article = await this.getArticleOrThrow(articleId);

    const cacheKey = this.cache.buildKey('translate', {
      articleId: article.id,
      updatedAt: article.updatedAt.toISOString(),
      targetLanguage: dto.targetLanguage,
      sourceLanguage: dto.sourceLanguage ?? null,
    });
    const cached = this.cache.get<TranslateArticleResponse>(cacheKey);
    if (cached) {
      this.usage.recordCacheHit();
      return cached;
    }
    this.usage.recordCacheMiss();

    const prompt = this.prompts.translate(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const result = await this.callGemini(prompt);

    const parsed = this.tryParseJson<{
      detectedLanguage?: string;
      translatedText?: string;
    }>(result.text);

    const response: TranslateArticleResponse = {
      articleId: article.id,
      translatedText: parsed?.translatedText?.trim() || result.text.trim(),
      detectedLanguage:
        parsed?.detectedLanguage?.trim() || dto.sourceLanguage || 'unknown',
    };
    this.cache.set(cacheKey, response);
    return response;
  }

  async analyzeArticle(
    articleId: string,
    dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponse> {
    this.usage.recordRequest('analyze');
    const article = await this.getArticleOrThrow(articleId);
    const prompt = this.prompts.analyze(article.content, dto.task);
    const result = await this.callGemini(prompt);

    const parsed = this.tryParseJson<{
      analysis?: string;
      suggestions?: string[];
      severity?: 'info' | 'warning' | 'error';
    }>(result.text);

    const severity = parsed?.severity;
    return {
      articleId: article.id,
      analysis: parsed?.analysis?.trim() || result.text.trim(),
      suggestions: Array.isArray(parsed?.suggestions)
        ? parsed!.suggestions!.filter((s) => typeof s === 'string')
        : [],
      severity:
        severity === 'warning' || severity === 'error' ? severity : 'info',
    };
  }

  async generate(dto: GenerateDto): Promise<{ text: string }> {
    this.usage.recordRequest('generate');
    const prompt = this.prompts.generic(dto.prompt);
    const result = await this.callGemini(prompt);
    return { text: result.text.trim() };
  }

  private async callGemini(prompt: string): Promise<GeminiCallResult> {
    try {
      const result = await this.gemini.generate(prompt);
      this.usage.recordLatency(result.latencyMs);
      this.usage.recordTokens(
        result.promptTokens,
        result.responseTokens,
        result.totalTokens,
      );
      return result;
    } catch (err) {
      this.usage.recordError();
      throw err;
    }
  }

  private async getArticleOrThrow(articleId: string) {
    if (!uuidValidate(articleId)) {
      throw new BadRequestException('Invalid article id');
    }
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  private tryParseJson<T = unknown>(raw: string): T | null {
    if (!raw) return null;
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const match = cleaned.match(/\{[\s\S]*}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as T;
        } catch {
          /* fallthrough */
        }
      }
      this.logger.warn('Failed to parse JSON response from Gemini');
      return null;
    }
  }
}
