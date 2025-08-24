import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { OpenaiStrategy } from './strategies/openai.strategy';
import { ILlmStrategy, LlmResponse } from './strategies/llm.strategy.interface';
import CircuitBreaker from 'opossum';
import { ConfigService } from '@nestjs/config';
import {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
} from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { GeminiStrategy } from './strategies/gemini.strategy';
import { QwenStrategy } from './strategies/qwen.strategy';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);

  private strategies: Map<string, ILlmStrategy> = new Map();
  private breakers: Map<string, CircuitBreaker> = new Map();
  private providerOrder: string[] = [];

  private rpmLimiter: RateLimiterMemory;
  private rpdLimiter: RateLimiterRedis;
  constructor(
    private readonly configService: ConfigService,
    private readonly geminiStrategy: GeminiStrategy,
    private readonly openaiStrategy: OpenaiStrategy,
    private readonly qwenStrategy: QwenStrategy,
  ) {}

  onModuleInit() {
    this.strategies.set('openai', this.openaiStrategy);
    this.strategies.set('gemini', this.geminiStrategy);
    this.strategies.set('qwen', this.qwenStrategy);

    this.providerOrder = this.configService
      .get<string>('LLM_PROVIDER_ORDER', 'gemini,openai')
      .split(',');

    this.providerOrder.forEach((providerKey) => {
      const strategy = this.strategies.get(providerKey);
      if (strategy) {
        const breakerOptions: CircuitBreaker.Options = {
          timeout: 30000, // 30秒內未完成則視為失敗
          errorThresholdPercentage: 10, // 10% 的請求失敗時，斷路器打開
          resetTimeout: 30000, // 30秒後進入半開狀態
        };
        // 將 strategy.generate 方法綁定到 strategy 實例上
        const action = strategy.generate.bind(strategy);
        this.breakers.set(
          providerKey,
          new CircuitBreaker(action, breakerOptions),
        );
      }
    });

    const redisClient = new Redis(this.configService.get<string>('REDIS_URL')!);

    this.rpmLimiter = new RateLimiterMemory({
      points: this.configService.get<number>('LLM_RPM_LIMIT', 60),
      duration: 60, // 60 秒
    });

    this.rpdLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'llm_rpd',
      points: this.configService.get<number>('LLM_RPD_LIMIT', 1000),
      duration: 60 * 60 * 24, // 1 天
    });
  }

  async generateWithPrompt(prompt: string): Promise<LlmResponse> {
    // 步驟 1: 檢查每日上限 (RPD) - 保持立即失敗
    try {
      await this.rpdLimiter.consume('llm_api');
    } catch (error) {
      console.warn(`LLM Daily Rate Limit Exceeded. Error: ${error.message}`);
      throw new HttpException(
        '已達到今日請求總量上限，請明天再試。',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 步驟 2: 檢查每分鐘上限 (RPM) - 改造為「等待」模式
    try {
      await this.rpmLimiter.consume('llm_api');
    } catch (rejRes) {
      // 檢查錯誤物件是否是節流器回傳的特定物件
      if (rejRes instanceof RateLimiterRes) {
        console.log(
          `RPM limit reached. Waiting for ${rejRes.msBeforeNext}ms before continuing...`,
        );
        // 等待指定的時間
        await new Promise((resolve) =>
          setTimeout(resolve, rejRes.msBeforeNext),
        );
      } else {
        // 如果是其他未知錯誤，則向上拋出
        throw rejRes;
      }
    }

    // --- 原有的熔斷與備援邏輯 (完全不變) ---
    for (const provider of this.providerOrder) {
      const breaker = this.breakers.get(provider);
      if (!breaker) continue;

      try {
        console.log(`Attempting to generate data with: ${provider}`);
        const result = await breaker.fire(prompt); // breaker.fire 會回傳 LlmResponse
        console.log(`Successfully generated data with: ${provider}`);
        return result as LlmResponse;
      } catch (error) {
        console.error(
          `Provider ${provider} failed or circuit is open. Error: ${error.message}`,
        );
      }
    }

    throw new Error('All LLM providers are currently unavailable.');
  }

  async generateBatchForType(type: string, count: number): Promise<string[]> {
    const prompt = this._getPromptForType(type, count);
    const rawResponse = await this.generateWithPrompt(prompt);

    // 將 LLM 回傳的、用換行符分隔的字串，整理成陣列
    return rawResponse.response
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async generateForType(type: string): Promise<string> {
    const prompt = this._getPromptForType(type);
    return (await this.generateWithPrompt(prompt)).response;
  }

  private _getPromptForType(type: string, count: number = 1): string {
    const promptMap: { [key: string]: string } = {
      'full-name-tw': `請生成 ${count} 個不同的、符合台灣習慣的中文姓名`,
      'company-name-tw': `請生成 ${count} 個不同的、符合台灣風格的隨機公司名稱`,
      'address-tw': `請生成 ${count} 個不同的、真實且詳細的台灣地址`,
    };

    let basePrompt = promptMap[type];
    if (!basePrompt) {
      basePrompt = `請生成 ${count} 個不同的、關於 "${type}" 的假數據`;
    }

    const fullPrompt = `
      ${basePrompt}。
      請確保每一個結果都是獨一無二的，並且每一個結果佔一行，用換行符分隔。
      不要包含編號、引號或其他多餘的字符。
      (內部參考碼: ${Math.random()})
    `;

    return fullPrompt.trim();
  }
}
