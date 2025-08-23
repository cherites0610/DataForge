import { Injectable, NotFoundException } from '@nestjs/common';
import { IGeneratorStrategy } from './strategies/generator.strategy.interface';
import { SerialNumberGenerator } from './strategies/serial-number.generator';
import { GenerateDataDto } from './dto/generate-data.dto';
import * as XLSX from 'xlsx';
import { LlmService } from 'src/llm/llm.service';
import { LlmCustomPromptGenerator } from './strategies/llm-custom-prompt.generator';
import { TaiwanIdCardGenerator } from './strategies/taiwan-id-card.generator';
import { TaiwanMobilePhoneGenerator } from './strategies/taiwan-mobile-phone.generator';
import { ScaleGenerator } from './strategies/scale.generator';
import { SingleChoiceGenerator } from './strategies/single-choice.generator';
import { CoherentSurveyDto } from './dto/coherent-survey.dto';
import { ChinaIdCardGenerator } from './strategies/china-id-card.generator';
import { ChinaMobilePhoneGenerator } from './strategies/china-mobile-phone.generator';

@Injectable()
export class GeneratorService {
  private strategies: Map<string, IGeneratorStrategy> = new Map();
  private requestCache = new Map<string, any[]>();

  constructor(
    private readonly serialNumberGenerator: SerialNumberGenerator,
    private readonly llmCustomGenerator: LlmCustomPromptGenerator,
    private readonly taiwanIdCardGenerator: TaiwanIdCardGenerator,
    private readonly taiwanMobilePhoneGenerator: TaiwanMobilePhoneGenerator,
    private readonly scaleGenerator: ScaleGenerator,
    private readonly singleChoiceGenerator: SingleChoiceGenerator,
    private readonly chinaIdCardGenerator: ChinaIdCardGenerator,
    private readonly chinaMobilePhoneGenerator: ChinaMobilePhoneGenerator,
    private readonly llmService: LlmService,
  ) {
    this.strategies.set('serial-number', this.serialNumberGenerator);
    this.strategies.set('llm-custom-prompt', this.llmCustomGenerator);
    this.strategies.set('taiwan-id-card', this.taiwanIdCardGenerator);
    this.strategies.set('taiwan-mobile-phone', this.taiwanMobilePhoneGenerator);
    this.strategies.set('scale', this.scaleGenerator);
    this.strategies.set('single-choice', this.singleChoiceGenerator);
    this.strategies.set('china-id-card', this.chinaIdCardGenerator);
    this.strategies.set('china-mobile-phone', this.chinaMobilePhoneGenerator);
  }

  public async generateDataSet(payload: GenerateDataDto): Promise<Buffer> {
    // 每次請求開始時，清空快取
    this.requestCache.clear();
    const { rows, fields } = payload;

    // --- 步驟 A: 預先處理並批次獲取所有 LLM 數據 ---
    const llmTasks = new Map<string, number>();
    // 1. 統計所有需要的 LLM 類型和總數
    for (const field of fields) {
      if (!this.strategies.has(field.type)) {
        // 這是一個 LLM 類型
        llmTasks.set(field.type, (llmTasks.get(field.type) || 0) + rows);
      }
    }

    // 2. 為每個 LLM 類型建立一個批次獲取 Promise
    const fetchPromises = Array.from(llmTasks.entries()).map(([type, count]) =>
      this.llmService.generateBatchForType(type, count).then((results) => {
        this.requestCache.set(type, results); // 將結果存入快取
      }),
    );

    // 3. 並行執行所有 LLM API 呼叫
    await Promise.all(fetchPromises);

    // --- 步驟 B: 填充所有欄位的數據 ---
    const generatedColumns: { [key: string]: any[] } = {};

    for (const field of fields) {
      const { name, type, options } = field;
      const strategy = this.strategies.get(type);

      if (strategy) {
        // 如果是本地規則生成器，照常執行
        generatedColumns[name] = await strategy.generate(rows, options);
      } else {
        // 如果是 LLM 類型，從快取中提取數據
        const cachedResults = this.requestCache.get(type) || [];
        // 使用 splice 來取出所需數量，並從快取中移除，避免重複使用
        const columnData = cachedResults.splice(0, rows);
        generatedColumns[name] = columnData;

        if (columnData.length < rows) {
          console.warn(
            `LLM type [${type}] cache depleted. Requested ${rows}, but only got ${columnData.length}.`,
          );
        }
      }
    }

    const dataAsRows = this._transposeColumnsToRows(generatedColumns, rows);
    return this._convertToExcelBuffer(dataAsRows);
  }

  public async generateCoherentSurveySet(
    payload: CoherentSurveyDto,
  ): Promise<Buffer> {
    this.requestCache.clear();
    const { rows, questions } = payload;

    const coherentLlmQuestions: any[] = [];
    const independentLlmQuestions: any[] = [];
    const ruleBasedQuestions: any[] = [];

    for (const q of questions) {
      if (q.generatorType === 'llm-answer') {
        coherentLlmQuestions.push(q);
      } else if (this.strategies.has(q.generatorType)) {
        ruleBasedQuestions.push(q);
      } else {
        independentLlmQuestions.push(q);
      }
    }

    // 1. 預先處理所有「規則生成」的欄位
    const ruleGenPromises = ruleBasedQuestions.map(async (q) => {
      const strategy = this.strategies.get(q.generatorType);
      if (strategy) {
        const results = await strategy.generate(rows, q.options || {});
        this.requestCache.set(q.name, results);
      }
    });

    const independentLlmTasks = new Map<string, any[]>();
    // 3.1 聚合相同類型的請求
    for (const q of independentLlmQuestions) {
      if (!independentLlmTasks.has(q.generatorType)) {
        independentLlmTasks.set(q.generatorType, []);
      }
      independentLlmTasks.get(q.generatorType)!.push(q);
    }

    // 3.2 為聚合後的任務建立批次生成 Promise
    const independentLlmGenPromises = Array.from(
      independentLlmTasks.entries(),
    ).map(async ([type, questionsOfType]) => {
      const totalNeeded = questionsOfType.length * rows;
      const results = await this.llmService.generateBatchForType(
        type,
        totalNeeded,
      );
      // 3.3 將返回的一大批結果，分配給對應的欄位並存入快取
      for (let i = 0; i < questionsOfType.length; i++) {
        const q = questionsOfType[i];
        const startIndex = i * rows;
        const endIndex = startIndex + rows;
        this.requestCache.set(q.name, results.slice(startIndex, endIndex));
      }
    });
    await Promise.all([...ruleGenPromises, ...independentLlmGenPromises]);

    const surveyPromises = Array.from({ length: rows }, (_, index) =>
      this._generateSingleHybridRow(questions, index, coherentLlmQuestions),
    );

    const surveyResponses = await Promise.all(surveyPromises);

    return this._convertToExcelBuffer(surveyResponses);
  }

  private async _generateSingleHybridRow(
    allQuestions: any[],
    rowIndex: number,
    coherentLlmQuestions: any[],
  ): Promise<object> {
    const currentRow: { [key: string]: any } = {};

    // 步驟 A: 從快取中讀取所有「非連貫性」的數據
    for (const q of allQuestions) {
      if (q.generatorType !== 'llm-answer') {
        const cachedColumn = this.requestCache.get(q.name) || [];
        currentRow[q.name] = cachedColumn[rowIndex];
      }
    }

    // 步驟 B: 處理需要上下文的「連貫性 LLM 型」問題
    if (coherentLlmQuestions.length > 0) {
      const context = Object.entries(currentRow)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

      const prompt = this._buildHybridPrompt(context, coherentLlmQuestions);
      const llmResponseString =
        await this.llmService.generateWithPrompt(prompt);

      try {
        const jsonMatch = llmResponseString.match(/{[\s\S]*}/);
        if (!jsonMatch) throw new Error('No JSON object found');
        const llmAnswers = JSON.parse(jsonMatch[0]);
        Object.assign(currentRow, llmAnswers);
      } catch (error) {
        console.error(
          'Failed to parse coherent LLM response in hybrid mode:',
          llmResponseString,
        );
        coherentLlmQuestions.forEach((q) => {
          currentRow[q.name] = 'LLM PARSE ERROR';
        });
      }
    }

    return currentRow;
  }

  private _buildHybridPrompt(context: string, llmQuestions: any[]): string {
    const questionLines = llmQuestions
      .map((q) => {
        let formatHint = '';
        // 根據前端傳來的 answerType 決定格式提示
        switch (q.answerType) {
          case '單選':
            const choices = q.options?.choices || '[]';
            formatHint = `您的回答必須嚴格地從以下選項中選擇一個: [${choices}]`;
            break;
          case '數字':
            formatHint = '您的回答必須是一個數字。';
            break;
          case '是非':
            formatHint = '您的回答必須是「是」或「否」。';
            break;
          default: // 簡答
            formatHint = '請用一句話簡短回答。';
            break;
        }
        return `- 問題: "${q.question}" (欄位名: ${q.name})\n  格式要求: ${formatHint}`;
      })
      .join('\n');

    const jsonFormatExample = llmQuestions.reduce((acc, q) => {
      acc[q.name] = '你的答案';
      return acc;
    }, {});

    return `
      你是一位正在填寫問卷的受訪者。關於你本人，已經有一些已知資訊，請根據這些資訊，扮演一個符合這些資訊的虛構人物來回答以下問題。

      # 已知資訊:
      ${context || '無'}

      # 需要回答的問題 (包含格式要求):
      ${questionLines}

      # 重要規則:
      1. 你扮演的角色必須與上述「已知資訊」的客觀事實保持一致（例如，身分證號碼所隱含的資訊）。
      2. 你的其餘回答應該圍繞這個角色展開，使其看起來像一個真實的人。
      3. 每個回答都必須嚴格遵守其「格式要求」。
      4. 請嚴格按照下面的 JSON 格式回傳你需要回答問題的答案，不要包含任何額外解釋或文字。
      
      # JSON 格式範例:
      ${JSON.stringify(jsonFormatExample, null, 2)}
    `.trim();
  }

  private _convertToExcelBuffer(dataAsRows: any[]): Buffer {
    // 現在 dataAsRows 是一個物件陣列，可以直接給 json_to_sheet 使用
    const worksheet = XLSX.utils.json_to_sheet(dataAsRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  private _transposeColumnsToRows(
    columns: { [key: string]: any[] },
    rowCount: number,
  ): any[] {
    const result: any[] = [];
    const headers = Object.keys(columns);

    for (let i = 0; i < rowCount; i++) {
      const rowObject: { [key: string]: any } = {};
      for (const header of headers) {
        rowObject[header] = columns[header][i];
      }
      result.push(rowObject);
    }
    return result;
  }
}
