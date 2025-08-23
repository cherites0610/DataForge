import { Module } from '@nestjs/common';
import { UsageLogsService } from './usage-logs.service';
import { UsageLogsController } from './usage-logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageLog } from './entities/usage-log.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsageLog, User])],
  providers: [UsageLogsService],
  controllers: [UsageLogsController],
})
export class UsageLogsModule {}
