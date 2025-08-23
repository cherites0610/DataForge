import { Injectable } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class ChinaMobilePhoneGenerator implements IGeneratorStrategy {
  // 常見的手機號碼前綴 (三大運營商)
  private readonly prefixes: string[] = [
    // 中國移動
    '134',
    '135',
    '136',
    '137',
    '138',
    '139',
    '150',
    '151',
    '152',
    '157',
    '158',
    '159',
    '182',
    '183',
    '184',
    '187',
    '188',
    '198',
    // 中國聯通
    '130',
    '131',
    '132',
    '155',
    '156',
    '185',
    '186',
    '166',
    '176',
    // 中國電信
    '133',
    '153',
    '180',
    '181',
    '189',
    '199',
    '177',
  ];

  async generate(rows: number, options: GeneratorOptions): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < rows; i++) {
      const prefix =
        this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
      // 隨機生成後 8 位
      const suffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      results.push(`${prefix}${suffix}`);
    }
    return results;
  }
}
