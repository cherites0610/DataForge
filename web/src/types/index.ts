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

export interface CreateUserDto {
  email: string
  password: string
}
export type LoginCredentials = CreateUserDto

// 後端 /auth/login 成功後回傳的資料格式
export interface AuthResponse {
  access_token: string
}

export interface UserProfile {
  id: string
  email: string
  role: 'user' | 'beta_tester' | 'admin' | 'guest'
  monthlyTokenLimit: number
  monthlyTokensUsed: number
  usageCycleStart: Date
}

export interface UsageLog {
  id: string
  userId: string
  action: string
  details: Record<string, any>
  createdAt: string
}
