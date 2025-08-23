class QuestionDto {
  name: string;
  question?: string; // 變為可選
  generatorType: string; // 新增此欄位
  answerType?: string;
  options?: any; // 選項
}

export class CoherentSurveyDto {
  rows: number;
  questions: QuestionDto[];
}
