import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { OpenaiStrategy } from './strategies/openai.strategy';
import { GeminiStrategy } from './strategies/gemini.strategy';

@Module({
  providers: [LlmService, OpenaiStrategy, GeminiStrategy],
  exports: [LlmService],
})
export class LlmModule {}
