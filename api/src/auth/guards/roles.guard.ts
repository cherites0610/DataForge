import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 獲取路由處理常式上所需的角色
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. 如果沒有設定 @Roles，則預設為開放存取
    if (!requiredRoles) {
      return true;
    }

    // 3. 獲取請求中的 user 物件 (由 JwtAuthGuard 附加)
    const { user } = context.switchToHttp().getRequest();

    // 4. 比對使用者角色是否滿足其中之一
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
