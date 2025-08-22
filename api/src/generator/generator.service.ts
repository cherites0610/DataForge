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

@Injectable()
export class GeneratorService {
  private strategies: Map<string, IGeneratorStrategy> = new Map();
  private llmCache = new Map<string, string[]>();

  constructor(
    private readonly serialNumberGenerator: SerialNumberGenerator,
    private readonly llmCustomGenerator: LlmCustomPromptGenerator,
    private readonly taiwanIdCardGenerator: TaiwanIdCardGenerator,
    private readonly taiwanMobilePhoneGenerator: TaiwanMobilePhoneGenerator,
    private readonly scaleGenerator: ScaleGenerator,
    private readonly singleChoiceGenerator: SingleChoiceGenerator,
    private readonly llmService: LlmService,
  ) {
    this.strategies.set('serial-number', this.serialNumberGenerator);
    this.strategies.set('llm-custom-prompt', this.llmCustomGenerator);
    this.strategies.set('taiwan-id-card', this.taiwanIdCardGenerator);
    this.strategies.set('taiwan-mobile-phone', this.taiwanMobilePhoneGenerator);
    this.strategies.set('scale', this.scaleGenerator);
    this.strategies.set('single-choice', this.singleChoiceGenerator);
  }

  public async generateDataSet(payload: GenerateDataDto): Promise<Buffer> {
    // 每次請求開始時，清空快取
    this.llmCache.clear();
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
        this.llmCache.set(type, results); // 將結果存入快取
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
        const cachedResults = this.llmCache.get(type) || [];
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
    const { rows, questions } = payload;

    // 1. 建立一個批次請求的 Prompt
    const prompt = this._buildCoherentSurveyPrompt(questions, rows);

    // 2. 進行單次的 LLM API 呼叫
    const llmResponse = await this.llmService.generateWithPrompt(prompt);

    let surveyResponses: object[] = [];
    try {
      // 3. 增強的解析邏輯，這次用來提取 [...] 陣列
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);

      if (jsonMatch && jsonMatch[0]) {
        const jsonString = jsonMatch[0];
        surveyResponses = JSON.parse(jsonString);
      } else {
        throw new Error('No valid JSON array found in LLM response.');
      }

      // 驗證回傳的數量是否足夠
      if (surveyResponses.length < rows) {
        console.warn(
          `LLM was asked for ${rows} responses, but returned only ${surveyResponses.length}.`,
        );
      }
    } catch (error) {
      console.error(
        'Failed to parse LLM survey response as JSON array. Content:',
        llmResponse,
      );
      // 如果解析失敗，可以回傳一個包含錯誤訊息的 Excel
      const errorResponse = [
        {
          error: '無法解析 LLM 回傳的問卷數據',
          originalResponse: llmResponse,
        },
      ];
      return this._convertToExcelBuffer(errorResponse);
    }

    // 4. 將成功解析的陣列直接傳給 Excel 生成器
    return this._convertToExcelBuffer(surveyResponses);
  }

  private _buildCoherentSurveyPrompt(questions: any[], rows: number): string {
    const questionLines = questions
      .map(
        (q, index) =>
          `${index + 1}. ${q.question} (欄位名: ${q.name}, 類型: ${q.type}${q.options ? ', 選項: ' + q.options.join('/') : ''})`,
      )
      .join('\n');

    const jsonFormatExample = questions.reduce((acc, q) => {
      acc[q.name] = '你的答案';
      return acc;
    }, {});

    const promptTemplate = `
      你現在是一位虛構人物生成器。請根據以下的問卷題目，生成 ${rows} 份完整、符合邏輯、且**各自不同**的受訪者回答。

      問卷題目:
      ${questionLines}

      重要規則:
      1. 生成的 ${rows} 份回答必須代表 ${rows} 個**不同**的人物畫像，展現多樣性。
      2. 每一份回答內部都必須前後連貫，符合常理。例如，如果「性別」回答為「男」，則「是否懷孕」的回答必須為「否」。
      3. 請嚴格按照下面的 JSON 陣列格式回傳你的答案，不要包含任何額外的解釋或文字。

      JSON 格式範例 (一個包含 ${rows} 個物件的陣列):
      [
        ${JSON.stringify(jsonFormatExample, null, 2)},
        {
          "gender": "...",
          "age": "...",
          "is_pregnant": "...",
          "occupation": "..."
        },
        ...
      ]
    `;

    return promptTemplate.trim();
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
