import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsageLog } from '../usage-logs/entities/usage-log.entity';
import { Role } from '../common/enums/role.enum';
import { UsageAction } from 'src/common/enums/usage-action.enum';
import { PromptTemplate } from 'src/prompt-templates/entities/prompt-template.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsageLog)
    private usageLogsRepository: Repository<UsageLog>,
    @InjectRepository(PromptTemplate)
    private promptTemplatesRepository: Repository<PromptTemplate>,
  ) {}

  async getDashboardData(user: User) {
    const foundUser = (await this.usersRepository.findOneBy({ id: user.id }))!;
    if (user.role === Role.ADMIN) {
      return this.getAdminDashboardData(user);
    }
    return this.getUserDashboardData(foundUser);
  }

  async getPublicStats() {
    const stats = await this.usageLogsRepository
      .createQueryBuilder('log')
      .select("SUM(CAST(log.details ->> 'rows' AS INT))", 'totalRows')
      .addSelect('COUNT(DISTINCT log.userId)', 'userCount')
      .where('log.action = :action', { action: UsageAction.GENERATE_DATA })
      .getRawOne();

    const templateCount = await this.promptTemplatesRepository.count(); // 假設您已注入 PromptTemplate Repository

    return {
      totalRowsGenerated: parseInt(stats.totalRows, 10) || 0,
      userCount: parseInt(stats.userCount, 10) || 0,
      templateCount: templateCount || 0,
    };
  }

  private async getUserDashboardData(user: User) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await this.usageLogsRepository
      .createQueryBuilder('log')
      .select(
        "SUM(CAST(log.details -> 'tokenUsage' ->> 'totalTokens' AS INT))",
        'totalTokens',
      )
      .where('log.userId = :userId', { userId: user.id })
      .andWhere('log.createdAt >= :today', { today })
      .getRawOne();

    return {
      type: 'user',
      summary: {
        monthlyTokenLimit: user.monthlyTokenLimit,
        monthlyTokensUsed: user.monthlyTokensUsed,
        todayTokensUsed: parseInt(todayStats.totalTokens, 10) || 0,
      },
      // ...
    };
  }

  private async getAdminDashboardData(adminUser: User) {
    const adminPersonalData = await this.getUserDashboardData(adminUser);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await this.usersRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 使用 QueryBuilder 進行聚合
    const usageStats = await this.usageLogsRepository
      .createQueryBuilder('log')
      .select(
        "SUM(CAST(log.details -> 'tokenUsage' ->> 'totalTokens' AS INT))",
        'totalTokens',
      )
      .addSelect('COUNT(log.id)', 'totalCalls')
      .where('log.createdAt > :date', { date: thirtyDaysAgo })
      .getRawOne();

    const usageTrend = await this.usageLogsRepository
      .createQueryBuilder('log')
      .select('DATE(log.createdAt)', 'date')
      .addSelect(
        "SUM(CAST(log.details -> 'tokenUsage' ->> 'totalTokens' AS INT))",
        'tokens',
      )
      .where('log.createdAt > :date', { date: thirtyDaysAgo })
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const topUsers = await this.usageLogsRepository
      .createQueryBuilder('log')
      .select('user.email', 'email')
      .addSelect(
        "SUM(CAST(log.details -> 'tokenUsage' ->> 'totalTokens' AS INT))",
        'totalTokens',
      )
      .innerJoin('log.user', 'user')
      .where("log.action = 'generate_data'")
      .groupBy('user.email')
      .orderBy('"totalTokens"', 'DESC') // 注意PostgreSQL中帶引號的駝峰命名
      .limit(5)
      .getRawMany();

    return {
      type: 'admin',
      summary: {
        ...adminPersonalData.summary,
        totalTokensLast30Days: parseInt(usageStats.totalTokens, 10) || 0,
        totalCallsLast30Days: parseInt(usageStats.totalCalls, 10) || 0,
        totalUsers: await this.usersRepository.count(),
        newUsersToday,
      },
      topUsers,
      usageTrend,
    };
  }
}
