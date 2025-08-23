import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ILlmStrategy, LlmResponse } from './llm.strategy.interface';

@Injectable()
export class OpenaiStrategy implements ILlmStrategy {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generate(prompt: string): Promise<LlmResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
        max_tokens: 50,
      });
      const usage = completion.usage!;
      return {
        response: completion.choices[0].message.content!.trim(),
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate data from OpenAI');
    }
  }
}
