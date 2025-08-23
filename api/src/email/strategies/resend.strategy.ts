import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailStrategy } from './email.strategy.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ResendStrategy implements IEmailStrategy {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(configService.get<string>('RESEND_API_KEY'));
    this.fromEmail = configService.get<string>(
      'EMAIL_FROM',
      'noreply@dataforge.com',
    );
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    console.log(123, verificationUrl);

    const result = await this.resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: '歡迎來到數造工坊！請驗證您的 Email',
      html: `<p>您好， ${user.email}！</p><p>請點擊下方的連結來完成您的帳號驗證：</p><a href="${verificationUrl}">驗證我的 Email</a>`,
    });
    console.log(result);
  }
}
