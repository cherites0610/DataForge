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
import { AuthGuard } from 'src/auth/auth.guard';
import { UsageInterceptor } from 'src/usage/usage.interceptor';

@Controller('generator')
@UseGuards(AuthGuard) // 在整個 Controller 層級啟用認證守衛
@UseInterceptors(UsageInterceptor) // 在整個 Controller 層級啟用用量攔截器
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('generate-excel')
  async generateData(
    @Body() payload: GenerateDataDto,
    @Res() res: Response,
    @Req() req, // 獲取請求物件
  ) {
    const userId = req.user.apiKey;
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
    const userId = req.user.apiKey;
    const buffer = await this.generatorService.generateCoherentSurveySet(
      payload,
      userId,
    );

    const filename = `coherent-survey-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    res.send(buffer);
  }
}
