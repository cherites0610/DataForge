import { User } from '../../users/entities/user.entity';

export interface IEmailStrategy {
  sendVerificationEmail(user: User, token: string): Promise<void>;
}
