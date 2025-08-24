import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-line';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class LineStrategy extends PassportStrategy(Strategy, 'line') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      channelID: configService.get<string>('LINE_CHANNEL_ID'),
      channelSecret: configService.get<string>('LINE_CHANNEL_SECRET'),
      callbackURL: `${configService.get<string>('BACKEND_URL')}/api/auth/line/callback`, // LINE 重新導向回後端的 URL
      scope: ['profile', 'openid', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, displayName, pictureUrl, email } = profile;

    if (!email) {
      return done(
        new Error('Email permission is required for LINE login.'),
        null,
      );
    }

    const user = await this.authService.findOrCreateSocialUser({
      email,
      lineId: id,
    });

    done(null, user);
  }
}
