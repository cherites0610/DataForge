import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

export enum PromptType {
  INDEPENDENT = 'independent', // 獨立型 (如 full-name-tw)
  COHERENT = 'coherent', // 連貫型 (用於問卷模式)
}

@Entity('prompt_templates')
export class PromptTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // 範本名稱，如 "奇幻風格姓名"

  @Column({ type: 'uuid', nullable: true }) // 2. 確保類型為 'uuid'
  userId: string | null;

  @ManyToOne(() => User, (user) => user.promptTemplates) // 3. 建立多對一關聯
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  template: string; // Prompt 範本內容

  @Column({
    type: 'enum',
    enum: PromptType,
    default: PromptType.INDEPENDENT,
  })
  type: PromptType;

  @Column({ default: false })
  isDefault: boolean; // 是否為不可刪除的預設範本

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
