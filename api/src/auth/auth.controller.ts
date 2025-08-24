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
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Res() res) {
    // 登入成功後，Passport 會將 user 物件附加到 req.user
    const { access_token } = await this.authService.login(req.user);
    const redirectUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/callback`;

    return res.redirect(`${redirectUrl}?token=${access_token}`);
  }

  @Get('line')
  @UseGuards(AuthGuard('line'))
  async lineAuth(@Request() req) {}

  @Get('line/callback')
  @UseGuards(AuthGuard('line'))
  async lineAuthRedirect(@Request() req, @Res() res) {
    const { access_token } = await this.authService.login(req.user);
    const redirectUrl = `${this.configService.get<string>('FRONTEND_URL')}/auth/callback`;
    return res.redirect(`${redirectUrl}?token=${access_token}`);
  }

  @Post('verify-email') // 改為 POST
  async verifyEmail(@Body('token') token: string) {
    const success = await this.authService.verifyEmail(token);
    if (success) {
      return { message: 'Email 驗證成功！' };
    }
  }
}
