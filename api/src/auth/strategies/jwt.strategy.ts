import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  // JWT 驗證成功後，會呼叫此方法
  // payload 是我們在 login 時簽入的內容
  async validate(payload: any) {
    // 我們可以在這裡返回完整的 user 物件，或只返回部分資訊
    // NestJS 會將回傳值附加到 request.user 上
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
