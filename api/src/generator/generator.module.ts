import { Module } from '@nestjs/common';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';
import { SerialNumberGenerator } from './strategies/serial-number.generator';
import { LlmModule } from 'src/llm/llm.module';
import { LlmCustomPromptGenerator } from './strategies/llm-custom-prompt.generator';
import { TaiwanIdCardGenerator } from './strategies/taiwan-id-card.generator';
import { TaiwanMobilePhoneGenerator } from './strategies/taiwan-mobile-phone.generator';
import { ScaleGenerator } from './strategies/scale.generator';
import { SingleChoiceGenerator } from './strategies/single-choice.generator';
import { ChinaIdCardGenerator } from './strategies/china-id-card.generator';
import { ChinaMobilePhoneGenerator } from './strategies/china-mobile-phone.generator';
import { PromptTemplatesModule } from 'src/prompt-templates/prompt-templates.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [LlmModule, PromptTemplatesModule, UsersModule],
  controllers: [GeneratorController],
  providers: [
    GeneratorService,
    SerialNumberGenerator,
    LlmCustomPromptGenerator,
    TaiwanIdCardGenerator,
    TaiwanMobilePhoneGenerator,
    ScaleGenerator,
    SingleChoiceGenerator,
    ChinaIdCardGenerator,
    ChinaMobilePhoneGenerator,
  ],
})
export class GeneratorModule {}
