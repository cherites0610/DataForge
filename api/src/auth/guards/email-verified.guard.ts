import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userFromJwt = request.user;

    if (!userFromJwt) return false;

    const user = await this.usersService.findOneById(userFromJwt.id);
    if (!user) return false;

    if (!user.isEmailVerified) {
      throw new ForbiddenException('請先驗證您的 Email 地址');
    }

    return true;
  }
}
