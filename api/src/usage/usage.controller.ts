import {
  Controller,
  UseGuards,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from 'src/admin/admin.guard';
import { UsageService } from './usage.service';

@Controller('usage')
@UseGuards(AdminGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('stats')
  async getStats(@Query('date') date?: string) {
    let targetDate = date;
    if (!targetDate) {
      // 如果沒有提供日期，預設為今天 (台灣時間)
      targetDate = new Date().toLocaleDateString('sv-SE', {
        timeZone: 'Asia/Taipei',
      });
    }

    // 簡單的日期格式驗證
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new BadRequestException('日期格式不正確，請使用 YYYY-MM-DD 格式');
    }

    return this.usageService.getUsageStats(targetDate);
  }
}
