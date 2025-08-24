import apiClient from './client'

export const getDashboardData = async (): Promise<any> => {
  const response = await apiClient.get('/dashboard')
  return response.data
}

export const getPublicStats = async (): Promise<any> => {
  const response = await apiClient.get('/dashboard/public-stats')
  return response.data
}
