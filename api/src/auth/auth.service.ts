import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto'; // 我們需要建立這個 DTO
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    this.eventEmitter.emit('user.login', { userId: user.id });
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('此 Email 已被註冊');
    }
    const verificationToken = randomBytes(32).toString('hex');
    const user = await this.usersService.create({
      ...createUserDto,
      verificationToken,
    });
    this.eventEmitter.emit('user.registered', { userId: user.id });
    // 5. 發送驗證郵件
    await this.emailService.sendVerificationEmail(user, verificationToken);
    // 確保回傳的 user 物件不包含密碼
    if ('password' in user) {
      delete (user as any).password;
    }

    return user;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.usersService.findOneByToken(token);
    if (!user) {
      throw new BadRequestException('無效的驗證連結');
    }

    user.isEmailVerified = true;
    user.verificationToken = null; // 讓 token 只能使用一次
    await this.usersService.save(user);
    this.eventEmitter.emit('user.verified', { userId: user.id });

    return true;
  }
}
