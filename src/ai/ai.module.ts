import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { PromptsService } from './prompts/prompts.service';

@Module({
  controllers: [AiController],
  providers: [AiService, GeminiService, PromptsService],
  exports: [AiService, GeminiService, PromptsService],
})
export class AiModule {}
