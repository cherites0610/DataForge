import apiClient from './client'
export const getMyUsageLogs = async (page: number, limit: number) => {
  const response = await apiClient.get('/usage-logs/me', { params: { page, limit } })
  return response.data
}
