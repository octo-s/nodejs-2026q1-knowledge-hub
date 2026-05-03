import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { PromptsService } from './prompts/prompts.service';
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
  ) {}

  async summarizeArticle(
    articleId: string,
    dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponse> {
    const article = await this.getArticleOrThrow(articleId);
    const prompt = this.prompts.summarize(article.content, dto.maxLength);
    const { text } = await this.gemini.generate(prompt);
    const summary = text.trim();
    return {
      articleId: article.id,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };
  }

  async translateArticle(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponse> {
    const article = await this.getArticleOrThrow(articleId);
    const prompt = this.prompts.translate(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const { text } = await this.gemini.generate(prompt);

    const parsed = this.tryParseJson<{
      detectedLanguage?: string;
      translatedText?: string;
    }>(text);

    return {
      articleId: article.id,
      translatedText: parsed?.translatedText?.trim() || text.trim(),
      detectedLanguage:
        parsed?.detectedLanguage?.trim() || dto.sourceLanguage || 'unknown',
    };
  }

  async analyzeArticle(
    articleId: string,
    dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponse> {
    const article = await this.getArticleOrThrow(articleId);
    const prompt = this.prompts.analyze(article.content, dto.task);
    const { text } = await this.gemini.generate(prompt);

    const parsed = this.tryParseJson<{
      analysis?: string;
      suggestions?: string[];
      severity?: 'info' | 'warning' | 'error';
    }>(text);

    const severity = parsed?.severity;
    return {
      articleId: article.id,
      analysis: parsed?.analysis?.trim() || text.trim(),
      suggestions: Array.isArray(parsed?.suggestions)
        ? parsed!.suggestions!.filter((s) => typeof s === 'string')
        : [],
      severity:
        severity === 'warning' || severity === 'error' ? severity : 'info',
    };
  }

  async generate(dto: GenerateDto): Promise<{ text: string }> {
    const prompt = this.prompts.generic(dto.prompt);
    const { text } = await this.gemini.generate(prompt);
    return { text: text.trim() };
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

  private tryParseJson<T>(raw: string): T | null {
    if (!raw) return null;
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
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
