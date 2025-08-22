import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { OpenaiStrategy } from './strategies/openai.strategy';
import { ILlmStrategy } from './strategies/llm.strategy.interface';
import CircuitBreaker from 'opossum';
import { ConfigService } from '@nestjs/config';
import { GeminiStrategy } from './strategies/gemini.strategy';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

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
  ) {}

  onModuleInit() {
    this.strategies.set('openai', this.openaiStrategy);
    this.strategies.set('gemini', this.geminiStrategy);

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

  async generateWithPrompt(prompt: string): Promise<string> {
    // 4. 在所有操作之前，先通過節流檢查
    try {
      // consume 會回傳 Promise，所以我們可以用 Promise.all 並行檢查
      await Promise.all([
        this.rpmLimiter.consume('llm_api'),
        this.rpdLimiter.consume('llm_api'),
      ]);
    } catch (error) {
      // 如果任一節流器超限，則會拋出錯誤
      console.warn(`LLM Rate Limit Exceeded. Error: ${error.message}`);
      throw new HttpException(
        '已達到請求速率上限，請稍後再試。',
        HttpStatus.TOO_MANY_REQUESTS, // 429 狀態碼
      );
    }

    // --- 原有的熔斷與備援邏輯 ---
    for (const provider of this.providerOrder) {
      const breaker = this.breakers.get(provider);
      if (!breaker) continue;

      try {
        this.logger.log(`呼叫${provider}`);
        const result = await breaker.fire(prompt);
        this.logger.log(`呼叫成功${provider}`);
        return result as string;
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
    return rawResponse
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async generateForType(type: string): Promise<string> {
    const prompt = this._getPromptForType(type);
    return this.generateWithPrompt(prompt);
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
