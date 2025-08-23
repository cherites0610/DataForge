import apiClient from './client'
import type { PromptTemplate, PromptTemplatePayload } from '@/types'

export const getPromptTemplates = async (): Promise<PromptTemplate[]> => {
  const response = await apiClient.get('/prompt-templates')
  return response.data
}

export const createPromptTemplate = async (
  payload: PromptTemplatePayload,
): Promise<PromptTemplate> => {
  const response = await apiClient.post('/prompt-templates', payload)
  return response.data
}

export const updatePromptTemplate = async (
  id: string,
  payload: Partial<PromptTemplatePayload>,
): Promise<PromptTemplate> => {
  const response = await apiClient.patch(`/prompt-templates/${id}`, payload)
  return response.data
}

export const deletePromptTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/prompt-templates/${id}`)
}
