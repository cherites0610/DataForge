import apiClient from './client'
import type { FieldPayload, SurveyPayload } from '@/types'

export const generateExcelApi = async (payload: FieldPayload) => {
  const response = await apiClient.post('/generator/generate-excel', payload, {
    responseType: 'blob',
  })
  return response.data
}

export const generateCoherentSurveyApi = async (payload: SurveyPayload) => {
  const response = await apiClient.post('/generator/generate-coherent-survey', payload, {
    responseType: 'blob',
  })
  return response.data
}
