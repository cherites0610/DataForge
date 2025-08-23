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

@Module({
  imports: [
    GeneratorModule,
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController, UsageController],
  providers: [AppService, UsageService],
})
export class AppModule {}
