import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PromptTemplatesService } from './prompt-templates.service';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { AuthGuard } from '../auth/auth.guard'; // 引入我們之前的 AuthGuard

@Controller('prompt-templates')
@UseGuards(AuthGuard) // 為整個控制器加上認證守衛
export class PromptTemplatesController {
  constructor(private readonly templatesService: PromptTemplatesService) {}

  @Post()
  create(@Body() createDto: CreatePromptTemplateDto, @Req() req) {
    const userId = req.user.apiKey; // 從 AuthGuard 附加的 user 物件中獲取 apiKey
    return this.templatesService.create(createDto, userId);
  }

  @Get()
  findAll(@Req() req) {
    const userId = req.user.apiKey;
    return this.templatesService.findAllForUser(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePromptTemplateDto,
    @Req() req,
  ) {
    const userId = req.user.apiKey;
    return this.templatesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const userId = req.user.apiKey;
    return this.templatesService.remove(id, userId);
  }
}
