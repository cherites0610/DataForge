import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm'; // 引入 IsNull
import { PromptTemplate } from './entities/prompt-template.entity';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PromptTemplatesService {
  constructor(
    @InjectRepository(PromptTemplate)
    private templatesRepository: Repository<PromptTemplate>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createDto: CreatePromptTemplateDto,
    userId: string,
  ): Promise<PromptTemplate> {
    const { isPublic, ...restOfDto } = createDto;
    let finalUserId: string | null = userId;

    if (isPublic) {
      const adminKey = this.configService.get<string>('ADMIN_API_KEY');
      if (userId !== adminKey) {
        throw new ForbiddenException('只有管理員才能建立公共範本。');
      }
      finalUserId = null; // 是管理員，則將 userId 設為 null
    }

    const template = this.templatesRepository.create({
      ...restOfDto,
      userId: finalUserId,
    });

    const newTemplate = await this.templatesRepository.save(template);
    this.eventEmitter.emit('template.created', {
      userId,
      details: { templateId: newTemplate.id, name: newTemplate.name },
    });
    return newTemplate;
  }

  // FindAll: 只尋找屬於該使用者的，以及系統公用的 (userId is NULL)
  findAllForUser(userId: string): Promise<PromptTemplate[]> {
    return this.templatesRepository.find({
      where: [
        { userId: userId }, // 條件一：找到自己的
        { userId: IsNull() }, // 條件二：找到公用的
      ],
    });
  }

  // FindOne: 查找單一項目時也需要權限
  async findOne(id: string, userId: string): Promise<PromptTemplate> {
    const template = await this.templatesRepository.findOneBy({ id });
    if (!template) throw new NotFoundException('找不到指定的範本');
    if (template.userId !== null && template.userId !== userId) {
      throw new ForbiddenException('您沒有權限存取此範本');
    }
    return template;
  }

  async update(
    id: string,
    updateDto: UpdatePromptTemplateDto,
    userId: string,
  ): Promise<PromptTemplate> {
    console.log(userId);

    const template = await this.findOne(id, userId); // 複用 findOne 的權限檢查
    if (template.isDefault)
      throw new ForbiddenException('不可修改系統預設範本');

    await this.templatesRepository.update(id, updateDto);
    this.eventEmitter.emit('template.updated', {
      userId,
      details: { templateId: id, changes: updateDto },
    });
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const template = await this.findOne(id, userId); // 複用 findOne 的權限檢查
    if (template.isDefault)
      throw new ForbiddenException('不可刪除系統預設範本');

    const result = await this.templatesRepository.delete(id);
    this.eventEmitter.emit('template.deleted', {
      userId,
      details: { templateId: id },
    });
    if (result.affected === 0) {
      throw new NotFoundException('找不到指定的範本');
    }
  }
}
