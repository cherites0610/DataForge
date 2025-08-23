import { PromptType } from '../entities/prompt-template.entity';
export class CreatePromptTemplateDto {
  name: string;
  template: string;
  type: PromptType;
  isPublic?: boolean;
}
