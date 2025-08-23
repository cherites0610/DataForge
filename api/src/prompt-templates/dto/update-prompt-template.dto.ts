import { PromptType } from '../entities/prompt-template.entity';
export class UpdatePromptTemplateDto {
  name?: string;
  template?: string;
  type?: PromptType;
}
