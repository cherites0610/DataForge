import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ILlmStrategy, LlmResponse, LlmUsage } from './llm.strategy.interface';
import OpenAI from 'openai';

@Injectable()
export class QwenStrategy implements ILlmStrategy {
  constructor(private readonly configService: ConfigService) {}

  async generate(prompt: string): Promise<LlmResponse> {
    try {
      const openai = new OpenAI({
        apiKey: this.configService.get<string>('QWEN_API_KEY') ?? '',
        baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      });
      const completion = await openai.chat.completions.create({
        model: 'qwen3-4b',
        messages: [{ role: 'user', content: prompt }],
      });
      const usage = completion.usage!;
      return {
        response: completion.choices[0].message.content!.trim(),
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        provider: 'qwen3-4b',
      };
    } catch (error) {
      console.error('Qwen API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate data from Qwen');
    }
  }
}
