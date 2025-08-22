import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class SingleChoiceGenerator implements IGeneratorStrategy {
  async generate(rows: number, options: GeneratorOptions): Promise<any[]> {
    const { choices } = options;

    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      throw new BadRequestException(
        'Single Choice generator requires a non-empty "choices" array in options.',
      );
    }

    const results: any[] = [];
    for (let i = 0; i < rows; i++) {
      const randomIndex = Math.floor(Math.random() * choices.length);
      results.push(choices[randomIndex]);
    }
    return results;
  }
}
