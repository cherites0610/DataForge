export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmResponse {
  response: string;
  usage: LlmUsage;
}

export interface ILlmStrategy {
  generate(prompt: string): Promise<LlmResponse>;
}
