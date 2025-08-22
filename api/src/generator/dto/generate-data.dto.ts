class FieldDefinitionDto {
  name: string;
  type: string;
  options: { [key: string]: any };
}

export class GenerateDataDto {
  rows: number;
  fields: FieldDefinitionDto[];
}
