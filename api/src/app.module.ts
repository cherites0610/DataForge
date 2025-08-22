import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeneratorModule } from './generator/generator.module';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { UsageController } from './usage/usage.controller';
import { UsageService } from './usage/usage.service';
import { UsageModule } from './usage/usage.module';

@Module({
  imports: [
    GeneratorModule,
    ConfigModule.forRoot({ isGlobal: true }),
    LlmModule,
    UsageModule,
  ],
  controllers: [AppController, UsageController],
  providers: [AppService, UsageService],
})
export class AppModule {}
