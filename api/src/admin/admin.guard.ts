import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminKey: string;

  constructor(private readonly configService: ConfigService) {
    this.adminKey = this.configService.get<string>('ADMIN_API_KEY')!;
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.adminKey) {
      // 如果沒有設定 Admin Key，則禁用此功能
      throw new ForbiddenException('管理員功能未啟用');
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (apiKey !== this.adminKey) {
      throw new ForbiddenException('需要有效的管理員 API Key');
    }

    return true;
  }
}
