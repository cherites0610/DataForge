import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { GenerateDataDto } from './dto/generate-data.dto';
import type { Response } from 'express';
import { CoherentSurveyDto } from './dto/coherent-survey.dto';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('generator')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class GeneratorController {
  constructor(
    private readonly generatorService: GeneratorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('generate-excel')
  async generateData(
    @Body() payload: GenerateDataDto,
    @Res() res: Response,
    @Req() req, // 獲取請求物件
  ) {
    const userId = req.user.id;
    const buffer = await this.generatorService.generateDataSet(payload, userId);

    const filename = `generated-data-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    res.send(buffer);
  }

  @Post('generate-coherent-survey')
  async generateCoherentSurvey(
    @Body() payload: CoherentSurveyDto,
    @Res() res: Response,
    @Req() req, // 獲取請求物件
  ) {
    const userId = req.user.id;
    const buffer = await this.generatorService.generateCoherentSurveySet(
      payload,
      userId,
    );

    this.eventEmitter.emit('data.generated', {
      userId: userId,
      details: {
        mode: 'coherent',
        rows: payload.rows,
        questionCount: payload.questions.length,
        // 可以在這裡累加所有 LLM 呼叫的 token 數
      },
    });

    const filename = `coherent-survey-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    res.send(buffer);
  }
}
