import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { PromptTemplatesService } from 'src/prompt-templates/prompt-templates.service';

@Injectable()
export class GeneratorService {
  private strategies: Map<string, IGeneratorStrategy> = new Map();
  private requestCache = new Map<string, any[]>();

  constructor(
    private readonly llmService: LlmService,
    private readonly promptTemplatesService: PromptTemplatesService,
    private readonly serialNumberGenerator: SerialNumberGenerator,
    private readonly llmCustomGenerator: LlmCustomPromptGenerator,
    private readonly taiwanIdCardGenerator: TaiwanIdCardGenerator,
    private readonly taiwanMobilePhoneGenerator: TaiwanMobilePhoneGenerator,
    private readonly scaleGenerator: ScaleGenerator,
    private readonly singleChoiceGenerator: SingleChoiceGenerator,
    private readonly chinaIdCardGenerator: ChinaIdCardGenerator,
    private readonly chinaMobilePhoneGenerator: ChinaMobilePhoneGenerator,
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

  public async generateDataSet(
    payload: GenerateDataDto,
    userId: string,
  ): Promise<Buffer> {
    // 每次請求開始時，清空快取
    this.requestCache.clear();
    const { rows, fields } = payload;

    // 1. 將欄位分為「規則型」和「獨立 LLM 型」
    const independentLlmFields: any[] = [];
    const ruleBasedFields: any[] = [];
    for (const field of fields) {
      if (this.strategies.has(field.type)) {
        ruleBasedFields.push(field);
      } else {
        independentLlmFields.push(field);
      }
    }

    // 2. 預生成所有「規則型」數據
    const ruleGenPromises = ruleBasedFields.map(async (q) => {
      const strategy = this.strategies.get(q.type);
      if (strategy) {
        const results = await strategy.generate(rows, q.options || {});
        this.requestCache.set(q.name, results);
      }
    });

    // 3. 批次預生成所有「獨立 LLM 型」(包含範本) 數據
    const independentLlmTasks = new Map<string, any[]>();
    // 3.1 聚合相同類型/範本的請求
    for (const q of independentLlmFields) {
      if (!independentLlmTasks.has(q.type)) {
        independentLlmTasks.set(q.type, []);
      }
      independentLlmTasks.get(q.type)!.push(q);
    }

    // 3.2 為聚合後的任務建立批次生成 Promise
    const independentLlmGenPromises = Array.from(
      independentLlmTasks.entries(),
    ).map(async ([type, questionsOfType]) => {
      const totalNeeded = questionsOfType.length * rows;
      // 3.3 解析並渲染 Prompt (無論是預設類型還是資料庫範本)
      const hydratedPrompt = await this._resolveAndHydratePrompt(type, userId, {
        count: totalNeeded,
      });

      // 3.4 使用渲染後的 Prompt 呼叫 LLM
      const results = (await this.llmService.generateWithPrompt(hydratedPrompt))
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (results.length < totalNeeded) {
        console.warn(
          `LLM task for type [${type}] returned fewer items than requested. Expected ${totalNeeded}, got ${results.length}.`,
        );
      }

      // 3.5 將返回的一大批結果，分配給對應的欄位並存入快取
      for (let i = 0; i < questionsOfType.length; i++) {
        const q = questionsOfType[i];
        const startIndex = i * rows;
        const endIndex = startIndex + rows;
        this.requestCache.set(q.name, results.slice(startIndex, endIndex));
      }
    });

    // 4. 並行執行所有預生成任務
    await Promise.all([...ruleGenPromises, ...independentLlmGenPromises]);

    // 5. 從快取中組裝最終的數據欄
    const generatedColumns: { [key: string]: any[] } = {};
    for (const field of fields) {
      generatedColumns[field.name] =
        this.requestCache.get(field.name) || Array(rows).fill('');
    }

    // 6. 轉換為 Excel Buffer 並回傳
    const dataAsRows = this._transposeColumnsToRows(generatedColumns, rows);
    return this._convertToExcelBuffer(dataAsRows);
  }

  public async generateCoherentSurveySet(
    payload: CoherentSurveyDto,
    userId: string,
  ): Promise<Buffer> {
    this.requestCache.clear();
    const { rows, questions, templateId } = payload;

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

    const ruleGenPromises = ruleBasedQuestions.map(async (q) => {
      const strategy = this.strategies.get(q.generatorType);
      if (strategy) {
        const results = await strategy.generate(rows, q.options || {});
        this.requestCache.set(q.name, results);
      }
    });

    const independentLlmTasks = new Map<string, any[]>();
    for (const q of independentLlmQuestions) {
      if (!independentLlmTasks.has(q.generatorType)) {
        independentLlmTasks.set(q.generatorType, []);
      }
      independentLlmTasks.get(q.generatorType)!.push(q);
    }

    const independentLlmGenPromises = Array.from(
      independentLlmTasks.entries(),
    ).map(async ([type, questionsOfType]) => {
      const totalNeeded = questionsOfType.length * rows;
      const hydratedPrompt = await this._resolveAndHydratePrompt(type, userId, {
        count: totalNeeded,
      });
      const results = (await this.llmService.generateWithPrompt(hydratedPrompt))
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      if (results.length < totalNeeded) {
        console.warn(
          `LLM task for type [${type}] returned fewer items. Expected ${totalNeeded}, got ${results.length}.`,
        );
      }

      for (let i = 0; i < questionsOfType.length; i++) {
        const q = questionsOfType[i];
        const startIndex = i * rows;
        const endIndex = startIndex + rows;
        this.requestCache.set(q.name, results.slice(startIndex, endIndex));
      }
    });

    await Promise.all([...ruleGenPromises, ...independentLlmGenPromises]);

    const surveyPromises = Array.from({ length: rows }, (_, index) =>
      this._generateSingleHybridRow(
        questions,
        index,
        coherentLlmQuestions,
        templateId ?? null,
        userId,
      ),
    );

    const surveyResponses = await Promise.all(surveyPromises);

    return this._convertToExcelBuffer(surveyResponses);
  }

  private async _generateSingleHybridRow(
    allQuestions: any[],
    rowIndex: number,
    coherentLlmQuestions: any[],
    templateId: string | null,
    userId: string,
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

      let finalPrompt: string;
      if (templateId) {
        const template = await this.promptTemplatesService.findOne(
          templateId,
          userId,
        );
        if (!template || template.type !== 'coherent') {
          throw new BadRequestException(
            `ID 為 ${templateId} 的範本不存在，或其類型不是'連貫型'。`,
          );
        }
        finalPrompt = this._hydrateCoherentPrompt(
          template.template,
          context,
          coherentLlmQuestions,
        );
      } else {
        finalPrompt = this._buildDefaultHybridPrompt(
          context,
          coherentLlmQuestions,
        );
      }

      const llmResponseString =
        await this.llmService.generateWithPrompt(finalPrompt);

      try {
        const jsonMatch = llmResponseString.match(/{[\s\S]*}/);
        if (!jsonMatch)
          throw new Error('No JSON object found in LLM response.');
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

  private async _resolveAndHydratePrompt(
    generatorType: string,
    userId: string,
    variables: { count?: number; context?: string; questions?: any[] },
  ): Promise<string> {
    let templateString: string;

    // 檢查是否為預設的 LLM 類型 (這部分未來也可以移到範本庫中做為預設範本)
    if (
      ['full-name-tw', 'company-name-tw', 'address-tw'].includes(generatorType)
    ) {
      templateString = `請生成 {{count}} 個不同的、關於 "${generatorType}" 的假數據。請確保每一個結果都是獨一無二的，並且每一個結果佔一行，用換行符分隔。`;
    } else {
      // 否則，假設 generatorType 是一個 UUID，從資料庫查找範本
      try {
        const promptTemplate = await this.promptTemplatesService.findOne(
          generatorType,
          userId,
        );
        if (!promptTemplate) throw new NotFoundException();
        templateString = promptTemplate.template;
      } catch (error) {
        throw new BadRequestException(
          `名為 "${generatorType}" 的生成規則或範本不存在。`,
        );
      }
    }

    // 渲染變數
    if (variables.count) {
      templateString = templateString.replace(
        /{{count}}/g,
        variables.count.toString(),
      );
    }
    // (未來也可以在這裡渲染 {{context}} 等其他變數)

    return templateString;
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

  private _buildDefaultHybridPrompt(
    context: string,
    llmQuestions: any[],
  ): string {
    const questionLines = llmQuestions
      .map((q) => {
        let formatHint = '';
        switch (q.answerType) {
          case '單選':
            const choices = q.options?.choices || [];
            formatHint = `您的回答必須嚴格地從以下選項中選擇一個: [${choices.join(', ')}]`;
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

    // 這就是我們預設的、最完整的 Prompt 範本
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

  private _hydrateCoherentPrompt(
    template: string,
    context: string,
    llmQuestions: any[],
  ): string {
    // 步驟 1: 建構帶有格式要求的「問題列表」字串
    const questionLines = llmQuestions
      .map((q) => {
        let formatHint = '';
        switch (q.answerType) {
          case '單選':
            const choices = q.options?.choices || [];
            formatHint = `您的回答必須嚴格地從以下選項中選擇一個: [${choices.join(', ')}]`;
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

    // 步驟 2: 建構 JSON 格式範例
    const jsonFormatExample = llmQuestions.reduce((acc, q) => {
      acc[q.name] = '你的答案';
      return acc;
    }, {});

    // 步驟 3: 將所有動態內容替換掉範本中的佔位符
    let hydrated = template.replace(/{{context}}/g, context || '無');
    hydrated = hydrated.replace(/{{questionLines}}/g, questionLines);
    hydrated = hydrated.replace(
      /{{jsonFormatExample}}/g,
      JSON.stringify(jsonFormatExample, null, 2),
    );

    return hydrated;
  }
}
