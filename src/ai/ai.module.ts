import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { PromptsService } from './prompts/prompts.service';
import { AiCacheService } from './cache/ai-cache.service';
import { UsageService } from './usage/usage.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    PromptsService,
    AiCacheService,
    UsageService,
  ],
  exports: [AiService, GeminiService, PromptsService],
})
export class AiModule {}
