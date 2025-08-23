import {
  Controller,
  Get,
  NotFoundException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard) // 使用 JWT 守衛來保護這個路由
  @Get('me')
  async getProfile(@Request() req) {
    const userId = req.user.id;
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('找不到該用戶');
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
