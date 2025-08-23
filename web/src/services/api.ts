import axios from 'axios'

// 建立一個 Axios 實例，並設定後端 API 的基礎 URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 您的 NestJS 後端位址
})

// 定義請求的資料結構
interface GeneratePayload {
  rows: number
  fields: {
    name: string
    type: string
    options: Record<string, any>
  }[]
}

apiClient.interceptors.request.use(
  (config) => {
    // 從 localStorage 讀取 API Key
    const apiKey = localStorage.getItem('apiKey')

    // 如果 Key 存在，則將其加入到請求的 header 中
    if (apiKey) {
      config.headers['x-api-key'] = apiKey
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 導出一個呼叫生成 Excel API 的函式
export const generateExcelApi = async (payload: GeneratePayload) => {
  // 使用 apiClient 發送 POST 請求
  const response = await apiClient.post('/generator/generate-excel', payload, {
    // 關鍵：設定 responseType 為 'blob'，這樣才能接收檔案流
    responseType: 'blob',
  })
  return response.data
}

interface SurveyPayload {
  rows: number
  questions: {
    name: string
    question?: string // question 是可選的
    generatorType: string
    options: Record<string, any> // 正確的類型是物件
  }[]
}
export const generateCoherentSurveyApi = async (payload: SurveyPayload) => {
  const response = await apiClient.post('/generator/generate-coherent-survey', payload, {
    responseType: 'blob',
  })
  return response.data
}
