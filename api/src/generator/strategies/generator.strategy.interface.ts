export interface GeneratorOptions {
  [key: string]: any;
}

export interface IGeneratorStrategy {
  // 返回值改為 Promise<any[]>
  generate(rows: number, options: GeneratorOptions): Promise<any[]>;
}
