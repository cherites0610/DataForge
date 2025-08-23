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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('prompt-templates')
@UseGuards(JwtAuthGuard) // 為整個控制器加上認證守衛
export class PromptTemplatesController {
  constructor(private readonly templatesService: PromptTemplatesService) {}

  @Post()
  create(@Body() createDto: CreatePromptTemplateDto, @Req() req) {
    const userId = req.user.id;
    return this.templatesService.create(createDto, userId);
  }

  @Get()
  findAll(@Req() req) {
    const userId = req.user.id;
    return this.templatesService.findAllForUser(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePromptTemplateDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.templatesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const userId = req.user.id;
    return this.templatesService.remove(id, userId);
  }
}
