import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILlmStrategy } from './llm.strategy.interface';

@Injectable()
export class GeminiStrategy implements ILlmStrategy {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY') ?? '',
    );
  }

  async generate(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 1.0,
        },
      });
      const result = await model.generateContent(prompt);
      const response = result.response;

      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate data from Gemini');
    }
  }
}
