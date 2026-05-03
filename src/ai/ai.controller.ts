import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('articles/:articleId/summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize an article via Gemini' })
  summarize(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    return this.aiService.summarizeArticle(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate an article via Gemini' })
  translate(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    return this.aiService.translateArticle(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze an article via Gemini' })
  analyze(
    @Param('articleId', new ParseUUIDPipe()) articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    return this.aiService.analyzeArticle(articleId, dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Free-form Gemini generation (optional)' })
  generate(@Body() dto: GenerateDto) {
    return this.aiService.generate(dto);
  }
}
