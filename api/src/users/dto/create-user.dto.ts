import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '請提供有效的 Email 格式' })
  email: string;

  @IsString()
  @MinLength(8, { message: '密碼長度至少需要 8 個字元' })
  password: string;
}
