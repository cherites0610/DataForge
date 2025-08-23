import apiClient from './client'
import type { CreateUserDto, LoginCredentials, AuthResponse } from '@/types'

export const register = async (userInfo: CreateUserDto): Promise<any> => {
  const response = await apiClient.post('/auth/register', userInfo)
  return response.data
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', credentials)
  return response.data
}

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/verify-email', { token })
  return response.data
}
