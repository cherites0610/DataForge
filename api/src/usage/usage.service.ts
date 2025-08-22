import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface UsageStats {
  apiKey: string;
  calls: number;
  rows: number;
}

@Injectable()
export class UsageService {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis(this.configService.get<string>('REDIS_URL')!);
  }

  async getUsageStats(date: string): Promise<UsageStats[]> {
    const usageKey = `usage_stats:${date}`;
    const rawStats = await this.redisClient.hgetall(usageKey);

    const processedStats: { [key: string]: { calls: number; rows: number } } =
      {};

    for (const [key, value] of Object.entries(rawStats)) {
      const [apiKey, metric] = key.split(':');

      if (!processedStats[apiKey]) {
        processedStats[apiKey] = { calls: 0, rows: 0 };
      }

      if (metric === 'calls') {
        processedStats[apiKey].calls = parseInt(value, 10);
      } else if (metric === 'rows') {
        processedStats[apiKey].rows = parseInt(value, 10);
      }
    }

    return Object.entries(processedStats).map(([apiKey, stats]) => ({
      apiKey,
      ...stats,
    }));
  }

  // 在應用程式關閉時，優雅地關閉 Redis 連線
  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
