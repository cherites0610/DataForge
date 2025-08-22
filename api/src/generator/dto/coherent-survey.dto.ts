class QuestionDto {
  // 用於 Excel 欄位名和 JSON key
  name: string;

  // 給 LLM看的實際問題描述
  question: string;

  // 類型，例如 '單選', '多選', '是非', '數字', '簡答'
  type: string;

  // 如果是單選或多選，這裡提供選項
  options?: string[];
}

export class CoherentSurveyDto {
  // 要生成幾份完整的問卷
  rows: number;

  // 問卷中所有問題的陣列
  questions: QuestionDto[];
}
