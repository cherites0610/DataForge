import { Injectable } from '@nestjs/common';
import {
  IGeneratorStrategy,
  GeneratorOptions,
} from './generator.strategy.interface';

@Injectable()
export class TaiwanIdCardGenerator implements IGeneratorStrategy {
  private readonly cityMap: { [key: string]: number } = {
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33,
  };
  private readonly cities = Object.keys(this.cityMap);

  async generate(rows: number, options: GeneratorOptions): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < rows; i++) {
      results.push(this._generateSingle(options));
    }
    return results;
  }

  private _generateSingle(options: GeneratorOptions): string {
    const cityCode =
      this.cities[Math.floor(Math.random() * this.cities.length)];

    let gender: number;
    if (options.gender === 'male') {
      gender = 1;
    } else if (options.gender === 'female') {
      gender = 2;
    } else {
      gender = Math.floor(Math.random() * 2) + 1;
    }

    const serial = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 10),
    );

    const body = [gender, ...serial];
    const checksum = this._calculateChecksum(cityCode, body);

    return `${cityCode}${body.join('')}${checksum}`;
  }

  private _calculateChecksum(cityCode: string, body: number[]): number {
    const cityValue = this.cityMap[cityCode];
    const n1 = Math.floor(cityValue / 10);
    const n2 = cityValue % 10;

    const fullDigits = [n1, n2, ...body];
    const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    let sum = 0;
    for (let i = 0; i < fullDigits.length; i++) {
      sum += fullDigits[i] * weights[i];
    }

    const remainder = sum % 10;
    const checksum = (10 - remainder) % 10;

    return checksum;
  }
}
