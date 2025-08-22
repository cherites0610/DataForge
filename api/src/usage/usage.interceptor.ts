import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import Redis from 'ioredis';

@Injectable()
export class UsageInterceptor implements NestInterceptor {
  private readonly isAuthEnabled: boolean;
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.isAuthEnabled =
      this.configService.get<string>('AUTH_ENABLED') === 'true';
    if (this.isAuthEnabled) {
      this.redisClient = new Redis(
        this.configService.get<string>('REDIS_URL')!,
      );
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.isAuthEnabled) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest();
        // 只有被 AuthGuard 驗證過且附加了 user 物件的請求，才會被記錄
        if (request.user && request.user.apiKey) {
          const apiKey = request.user.apiKey;
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

          // 我們可以記錄兩個維度：API 呼叫次數和生成的總行數
          const rowsGenerated = request.body.rows || 0;

          const usageKey = `usage_stats:${today}`;

          // 使用 HINCRBY 原子性地增加計數
          this.redisClient.hincrby(usageKey, `${apiKey}:calls`, 1);
          this.redisClient.hincrby(usageKey, `${apiKey}:rows`, rowsGenerated);
        }
      }),
    );
  }
}
