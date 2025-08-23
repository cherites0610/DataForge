import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 例如 'Free', 'Pro', 'Enterprise'

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  // Plan-specific rate limits
  @Column({ default: 100 })
  rpmLimit: number; // 每分鐘請求上限

  @Column({ default: 1000 })
  rpdLimit: number; // 每日請求上限

  // 使用 simple-array 來儲存權限列表
  @Column({ type: 'simple-array', default: '' })
  permissions: string[]; // 例如 ['USE_ADVANCED_MODELS', 'CREATE_TEMPLATES']
}
