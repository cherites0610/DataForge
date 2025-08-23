import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { Plan } from '../../plans/entities/plan.entity';
import { PromptTemplate } from 'src/prompt-templates/entities/prompt-template.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @OneToMany(() => PromptTemplate, (template) => template.user)
  promptTemplates: PromptTemplate[];

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  lineId: string | null;

  @Column({ type: 'uuid', nullable: true })
  planId: string | null;

  @ManyToOne(() => Plan, { eager: true, nullable: true })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'bigint', default: 100000 })
  monthlyTokenLimit: number;

  @Column({ type: 'bigint', default: 0 })
  monthlyTokensUsed: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  usageCycleStart: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
