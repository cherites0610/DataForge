import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { UsageLogsService } from './usage-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('usage-logs')
@UseGuards(JwtAuthGuard)
export class UsageLogsController {
  constructor(private readonly usageLogsService: UsageLogsService) {}

  @Get('me')
  async findMyLogs(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.id;
    return this.usageLogsService.findByUserId(userId, page, limit);
  }
}
