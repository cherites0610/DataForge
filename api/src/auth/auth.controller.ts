import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    // 走到這裡，代表 LocalStrategy 的 validate 已經成功執行
    // Passport 會自動將回傳的 user 物件附加到 req.user
    return this.authService.login(req.user);
  }

  @Post('verify-email') // 改為 POST
  async verifyEmail(@Body('token') token: string) {
    const success = await this.authService.verifyEmail(token);
    if (success) {
      return { message: 'Email 驗證成功！' };
    }
  }
}
