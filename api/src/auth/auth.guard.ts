import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly validKeys: string[];
  private readonly isAuthEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isAuthEnabled =
      this.configService.get<string>('AUTH_ENABLED') === 'true';
    const keysString = this.configService.get<string>('BETA_API_KEYS', '');
    this.validKeys = keysString.split(',');
  }

  canActivate(context: ExecutionContext): boolean {
    // 如果 .env 中 AUTH_ENABLED 不為 true，則直接放行
    if (!this.isAuthEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // 我們約定 API Key 放在 'x-api-key' 這個 header 中
    const apiKey = request.headers['x-api-key'];
    console.log(apiKey);

    if (!apiKey || !this.validKeys.includes(apiKey)) {
      throw new UnauthorizedException('無效或遺失 API Key');
    }

    // 將使用者資訊附加到 request 物件上，供後續使用 (例如用量統計)
    request.user = { apiKey };
    return true;
  }
}
