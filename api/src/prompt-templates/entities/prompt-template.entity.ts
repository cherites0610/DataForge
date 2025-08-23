import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ type: 'varchar', nullable: true }) // 設為 varchar 以儲存 API Key，並允許為空
  userId: string | null;
  // 未來可以加上與 User Entity 的關聯
  // @ManyToOne(() => User)
  // user: User;

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
