import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeneratorModule } from './generator/generator.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { UsageController } from './usage/usage.controller';
import { UsageService } from './usage/usage.service';
import { UsageModule } from './usage/usage.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTemplatesModule } from './prompt-templates/prompt-templates.module';
import { PlansModule } from './plans/plans.module';
import { UsersModule } from './users/users.module';
import { UsageLogsModule } from './usage-logs/usage-logs.module';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from './email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    GeneratorModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    LlmModule,
    UsageModule,
    PromptTemplatesModule,
    PlansModule,
    UsersModule,
    UsageLogsModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [AppController, UsageController],
  providers: [AppService, UsageService],
})
export class AppModule {}
