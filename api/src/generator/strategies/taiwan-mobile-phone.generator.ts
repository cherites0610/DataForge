import { Injectable } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class TaiwanMobilePhoneGenerator implements IGeneratorStrategy {
  private readonly prefixes: string[] = [
    '0910',
    '0911',
    '0912',
    '0918',
    '0919',
    '0921',
    '0928',
    '0932',
    '0933',
    '0934',
    '0935',
    '0937',
    '0939',
    '0952',
    '0953',
    '0955',
    '0958',
    '0963',
    '0965',
    '0966',
    '0972',
    '0975',
    '0978',
    '0988',
    '0905',
    '0909',
    '0968',
  ];

  async generate(rows: number, options: GeneratorOptions): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < rows; i++) {
      const prefix =
        this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
      const suffix = Math.floor(100000 + Math.random() * 900000).toString();
      results.push(`${prefix}${suffix}`);
    }
    return results;
  }
}
