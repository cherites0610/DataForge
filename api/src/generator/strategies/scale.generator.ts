import { Injectable } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class ScaleGenerator implements IGeneratorStrategy {
  async generate(rows: number, options: GeneratorOptions): Promise<number[]> {
    const min = Number(options.min ?? 1);
    const max = Number(options.max ?? 5);

    const results: number[] = [];
    for (let i = 0; i < rows; i++) {
      const value = Math.floor(Math.random() * (max - min + 1)) + min;
      results.push(value);
    }

    return results;
  }
}
