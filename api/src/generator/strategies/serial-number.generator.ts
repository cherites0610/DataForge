import { Injectable } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class SerialNumberGenerator implements IGeneratorStrategy {
  async generate(rows: number, options: GeneratorOptions): Promise<string[]> {
    const { prefix = 'SN', start = 1, step = 1 } = options;

    const results: string[] = [];
    let currentValue = Number(start);

    for (let i = 0; i < rows; i++) {
      results.push(`${prefix}${currentValue}`);
      currentValue += Number(step);
    }

    return results;
  }
}
