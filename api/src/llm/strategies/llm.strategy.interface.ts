export interface ILlmStrategy {
  generate(prompt: string): Promise<string>;
}
