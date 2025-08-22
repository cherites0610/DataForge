export interface GeneratorOption {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'tags'
  defaultValue: any
  placeholder?: string
  items?: string[] // for select type
}

export interface GeneratorMetadata {
  label: string
  options: GeneratorOption[]
}

export const generatorOptions: Record<string, GeneratorMetadata> = {
  'serial-number': {
    label: '序列號',
    options: [
      {
        key: 'prefix',
        label: '前綴',
        type: 'text',
        defaultValue: 'SN-',
        placeholder: '例如: PROD-',
      },
      { key: 'start', label: '起始值', type: 'number', defaultValue: 1, placeholder: '起始數字' },
      { key: 'step', label: '步長', type: 'number', defaultValue: 1, placeholder: '每次增加的量' },
    ],
  },
  'taiwan-id-card': {
    label: '台灣身分證',
    options: [
      {
        key: 'gender',
        label: '性別',
        type: 'select',
        defaultValue: 'random',
        items: ['random', 'male', 'female'],
      },
    ],
  },
  'taiwan-mobile-phone': {
    label: '台灣手機號',
    options: [],
  },
  'chinese-mobile-phone': {
    label: '大陸手機號',
    options: [],
  },
  scale: {
    label: '數值量表',
    options: [
      { key: 'min', label: '最小值', type: 'number', defaultValue: 1 },
      { key: 'max', label: '最大值', type: 'number', defaultValue: 5 },
    ],
  },

  'single-choice': {
    label: '單選',
    options: [
      {
        key: 'choices',
        label: '選項 (用逗號分隔)',
        type: 'textarea',
        defaultValue: '選項A,選項B,選項C',
      },
    ],
  },
  'llm-custom-prompt': {
    label: 'LLM 自訂指令',
    options: [
      {
        key: 'prompt',
        label: 'Prompt 指令',
        type: 'textarea',
        defaultValue: '請生成一句關於科技的名言',
      },
    ],
  },
  'full-name-tw': {
    label: '姓名 (LLM)',
    options: [],
  },
  'company-name-tw': {
    label: '公司名稱 (LLM)',
    options: [],
  },
}
