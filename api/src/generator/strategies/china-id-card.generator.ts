import { Injectable } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class ChinaIdCardGenerator implements IGeneratorStrategy {
  // 為提高真實性，僅列舉部分有效的行政區劃代碼前綴
  private readonly addressPrefixes: string[] = [
    '110101',
    '110102',
    '110105',
    '110108', // 北京市
    '310101',
    '310104',
    '310106',
    '310115', // 上海市
    '440103',
    '440104',
    '440106',
    '440111', // 廣州市
    '440301',
    '440303',
    '440304',
    '440306', // 深圳市
    '510104',
    '510105',
    '510107',
    '510112', // 成都市
    '330102',
    '330103',
    '330106',
    '330108', // 杭州市
  ];

  private readonly weights = [
    7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2,
  ];
  private readonly checksumMap = [
    '1',
    '0',
    'X',
    '9',
    '8',
    '7',
    '6',
    '5',
    '4',
    '3',
    '2',
  ];

  async generate(rows: number, options: GeneratorOptions): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < rows; i++) {
      results.push(this._generateSingle());
    }
    return results;
  }

  private _generateSingle(): string {
    const addressCode =
      this.addressPrefixes[
        Math.floor(Math.random() * this.addressPrefixes.length)
      ];

    // 生成一個 18-60 歲之間的隨機生日
    const start = new Date();
    start.setFullYear(start.getFullYear() - 60);
    const end = new Date();
    end.setFullYear(end.getFullYear() - 18);
    const birthDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
    const year = birthDate.getFullYear();
    const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    const day = birthDate.getDate().toString().padStart(2, '0');
    const birthDateString = `${year}${month}${day}`;

    const sequenceCode = Math.floor(100 + Math.random() * 900).toString();

    const body = `${addressCode}${birthDateString}${sequenceCode}`;
    const checksum = this._calculateChecksum(body);

    return `${body}${checksum}`;
  }

  private _calculateChecksum(body: string): string {
    let sum = 0;
    for (let i = 0; i < body.length; i++) {
      sum += parseInt(body[i], 10) * this.weights[i];
    }
    const remainder = sum % 11;
    return this.checksumMap[remainder];
  }
}
