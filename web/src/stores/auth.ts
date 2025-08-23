import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as api from '@/services/api' // 引入我們的 API 服務
import type { CreateUserDto } from '@/types' // 引入類型

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'))
  const user = ref<any>(null) // 可以定義更精確的 User 類型
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('authToken', newToken)
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('authToken')
  }

  async function login(credentials: CreateUserDto) {
    const response = await api.login(credentials)
    setToken(response.access_token)
    await fetchUserProfile()
    router.push('/')
  }

  async function register(userInfo: CreateUserDto) {
    await api.register(userInfo)
    // 註冊後不自動登入，等待郵件驗證
  }

  async function fetchUserProfile() {
    if (!token.value) return // 如果沒有 token，直接返回

    try {
      const userData = await api.getMe()
      user.value = userData
    } catch (error) {
      // 如果獲取失敗 (例如 token 過期導致 401 錯誤)
      console.error('Failed to fetch user profile:', error)
      // 自動清理無效的 token 和登入狀態
      clearAuth()
      // 拋出錯誤，讓呼叫者知道恢復 session 失敗
      throw error
    }
  }

  function logout() {
    clearAuth()
    router.push('/login')
  }

  async function verifyEmail(token: string) {
    return api.verifyEmail(token)
  }

  return { token, user, isAuthenticated, login, register, logout, fetchUserProfile, verifyEmail }
})
