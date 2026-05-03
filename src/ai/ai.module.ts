import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { PromptsService } from './prompts/prompts.service';

@Module({
  providers: [GeminiService, PromptsService],
  exports: [GeminiService, PromptsService],
})
export class AiModule {}
