import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { OpenaiStrategy } from './strategies/openai.strategy';
import { GeminiStrategy } from './strategies/gemini.strategy';
import { QwenStrategy } from './strategies/qwen.strategy';

@Module({
  providers: [LlmService, OpenaiStrategy, GeminiStrategy, QwenStrategy],
  exports: [LlmService],
})
export class LlmModule {}
