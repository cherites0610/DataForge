import apiClient from './client'
import type { UserProfile } from '@/types'

export const getMe = async (): Promise<UserProfile> => {
  const response = await apiClient.get('/users/me')
  return response.data
}
