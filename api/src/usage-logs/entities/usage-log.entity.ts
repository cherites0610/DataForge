import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UsageAction } from '../../common/enums/usage-action.enum';

@Entity('usage_logs')
export class UsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: UsageAction,
  })
  action: UsageAction;

  // 使用 jsonb 格式儲存詳細的上下文資訊，彈性極高
  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
