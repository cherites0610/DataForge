import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageLog } from './entities/usage-log.entity';
import { UsageAction } from '../common/enums/usage-action.enum';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UsageLogsService {
  constructor(
    @InjectRepository(UsageLog)
    private logsRepository: Repository<UsageLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUserId(userId: string, page: number = 1, limit: number = 10) {
    const [results, total] = await this.logsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: results,
      total,
      page,
      limit,
    };
  }

  private async logAction(
    userId: string,
    action: UsageAction,
    details: object,
  ) {
    const log = this.logsRepository.create({ userId, action, details });
    await this.logsRepository.save(log);
  }

  @OnEvent('data.generated')
  async handleDataGeneratedEvent(payload: { userId: string; details: any }) {
    const user = await this.usersRepository.findOneBy({ id: payload.userId });
    if (!user) return;

    // 檢查週期是否需要重置
    const now = new Date();
    const cycleStart = new Date(user.usageCycleStart);
    const nextCycleStart = new Date(
      cycleStart.setMonth(cycleStart.getMonth() + 1),
    );
    if (now > nextCycleStart) {
      user.monthlyTokensUsed = 0;
      user.usageCycleStart = now;
    }

    const tokensConsumed = payload.details.tokenUsage?.totalTokens || 0;
    user.monthlyTokensUsed =
      Number(user.monthlyTokensUsed) + Number(tokensConsumed);

    // 檢查額度
    if (
      user.monthlyTokenLimit !== -1 &&
      user.monthlyTokensUsed > user.monthlyTokenLimit
    ) {
      // 雖然是事後檢查，但可以發出警告或標記帳號
      // 為了實現「事前攔截」，這個檢查需要放在 GeneratorService 中
      // 但作為過渡功能，事後更新並記錄是可行的第一步
      console.warn(`User ${user.id} has exceeded their token limit.`);
    }

    // 更新用量並記錄日誌
    await this.usersRepository.save(user);
    await this.logAction(
      payload.userId,
      UsageAction.GENERATE_DATA,
      payload.details,
    );
  }

  @OnEvent('template.created')
  async handleTemplateCreatedEvent(payload: { userId: string; details: any }) {
    await this.logAction(
      payload.userId,
      UsageAction.CREATE_TEMPLATE,
      payload.details,
    );
  }

  @OnEvent('template.updated')
  async handleTemplateUpdatedEvent(payload: { userId: string; details: any }) {
    await this.logAction(
      payload.userId,
      UsageAction.UPDATE_TEMPLATE,
      payload.details,
    );
  }

  @OnEvent('template.deleted')
  async handleTemplateDeletedEvent(payload: { userId: string; details: any }) {
    await this.logAction(
      payload.userId,
      UsageAction.DELETE_TEMPLATE,
      payload.details,
    );
  }

  @OnEvent('user.login')
  async handleUserLoginEvent(payload: { userId: string }) {
    await this.logAction(payload.userId, UsageAction.USER_LOGIN, {});
  }

  @OnEvent('user.registered')
  async handleUserRegisteredEvent(payload: { userId: string }) {
    await this.logAction(payload.userId, UsageAction.USER_REGISTER, {});
  }

  @OnEvent('user.verified')
  async handleUserVerifiedEvent(payload: { userId: string }) {
    await this.logAction(payload.userId, UsageAction.USER__VERIFIED, {});
  }
}
