import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getDashboardData(@Req() req) {
    const user = req.user as User;
    return this.dashboardService.getDashboardData(user);
  }

  @Get('public-stats')
  getPublicStats() {
    return this.dashboardService.getPublicStats();
  }
}
