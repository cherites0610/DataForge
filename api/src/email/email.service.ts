import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailStrategy } from './strategies/email.strategy.interface';
import { SmtpStrategy } from './strategies/smtp.strategy';
import { ResendStrategy } from './strategies/resend.strategy';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EmailService implements OnModuleInit {
  private strategy: IEmailStrategy;

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpStrategy: SmtpStrategy,
    private readonly resendStrategy: ResendStrategy,
  ) {}

  onModuleInit() {
    const provider = this.configService.get<string>('EMAIL_PROVIDER');
    if (provider === 'resend') {
      console.log('Email Service is using: Resend');
      this.strategy = this.resendStrategy;
    } else {
      console.log('Email Service is using: SMTP');
      this.strategy = this.smtpStrategy;
    }
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    return this.strategy.sendVerificationEmail(user, token);
  }
}
