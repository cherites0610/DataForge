import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmtpStrategy } from './strategies/smtp.strategy';
import { ResendStrategy } from './strategies/resend.strategy';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: parseInt(configService.get<string>('EMAIL_PORT') ?? ''),
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_FROM'),
        },
      }),
    }),
  ],
  providers: [EmailService, SmtpStrategy, ResendStrategy],
  exports: [EmailService],
})
export class EmailModule {}
