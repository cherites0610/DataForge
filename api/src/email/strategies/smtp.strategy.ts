import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IEmailStrategy } from './email.strategy.interface';
import { User } from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmtpStrategy implements IEmailStrategy {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: '歡迎來到數造工坊！請驗證您的 Email',
      html: `<p>您好， ${user.email}！</p><p>請點擊下方的連結來完成您的帳號驗證：</p><a href="${verificationUrl}">驗證我的 Email</a>`,
    });
  }
}
