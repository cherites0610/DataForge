import {
  Controller,
  UseGuards,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('usage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('stats')
  @Roles(Role.ADMIN)
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
