// 來自 GeneratorView.vue
export interface Field {
  id: number
  name: string
  type: string
  options: Record<string, any>
}

export interface Question {
  id: number
  name: string
  question?: string
  generatorType: string
  answerType: string
  options: Record<string, any>
}

// 來自 api.ts
export interface PromptTemplate {
  id: string
  name: string
  template: string
  type: 'independent' | 'coherent'
  userId: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type PromptTemplatePayload = Omit<
  PromptTemplate,
  'id' | 'isDefault' | 'createdAt' | 'updatedAt'
>

// API Payloads
export interface FieldPayload {
  rows: number
  fields: {
    name: string
    type: string
    options: Record<string, any>
  }[]
}

export interface SurveyPayload {
  rows: number
  questions: {
    name: string
    question?: string
    generatorType: string
    answerType: string
    options: Record<string, any>
  }[]
}
