import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 供 AuthService 註冊時呼叫
  async create(createUserDto: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  // 供 AuthService 驗證使用者時呼叫
  async findOneByEmail(email: string): Promise<User | undefined> {
    const result = await this.usersRepository.findOne({ where: { email } });
    if (!result) return undefined;
    return result;
  }

  // 供 JwtStrategy 驗證 Token 後，查找使用者
  async findOneById(id: string): Promise<User | undefined> {
    const result = await this.usersRepository.findOne({ where: { id } });
    if (!result) return undefined;
    return result;
  }

  async findOneByToken(token: string): Promise<User | undefined> {
    const result = await this.usersRepository.findOne({
      where: { verificationToken: token },
    });
    if (!result) return undefined;
    return result;
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
