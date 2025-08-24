import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageLog } from 'src/usage-logs/entities/usage-log.entity';
import { User } from 'src/users/entities/user.entity';
import { PromptTemplate } from 'src/prompt-templates/entities/prompt-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsageLog, User, PromptTemplate])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
