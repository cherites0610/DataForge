import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';
import { LlmService } from '../../llm/llm.service';

@Injectable()
export class LlmCustomPromptGenerator implements IGeneratorStrategy {
  constructor(private readonly llmService: LlmService) {}

  async generate(rows: number, options: GeneratorOptions): Promise<string[]> {
    const { prompt } = options;

    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestException(
        'Custom LLM generator requires a "prompt" in options.',
      );
    }

    // 為了提升效率，並行發送所有請求
    const llmPromises = Array.from({ length: rows }, () =>
      this.llmService.generateWithPrompt(prompt),
    );

    return (await Promise.all(llmPromises)).map((res) => res.response);
  }
}
