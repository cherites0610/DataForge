<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type Status = 'verifying' | 'success' | 'error'

const route = useRoute()
const authStore = useAuthStore()

const status = ref<Status>('verifying')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    status.value = 'error'
    errorMessage.value = '驗證連結無效或遺失。'
    return
  }

  try {
    await authStore.verifyEmail(token)
    status.value = 'success'
  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.message || '驗證失敗，連結可能已過期。'
  }
})
</script>

<template>
  <div class="flex items-center justify-center bg-gray-50 py-24 px-4">
    <el-card class="w-full max-w-md text-center p-8 shadow-xl rounded-lg">
      <transition name="fade" mode="out-in">
        <div v-if="status === 'verifying'" key="verifying">
          <el-icon class="is-loading" :size="50" color="#409EFC"><Loading /></el-icon>
          <h2 class="text-2xl font-semibold mt-4 text-gray-700">正在驗證您的 Email...</h2>
          <p class="text-gray-500 mt-2">請稍候片刻，我們正在處理您的請求。</p>
        </div>

        <div v-else-if="status === 'success'" key="success">
          <el-icon :size="50" class="text-green-500"><CircleCheckFilled /></el-icon>
          <h2 class="text-2xl font-semibold mt-4 text-gray-800">驗證成功！</h2>
          <p class="text-gray-600 mt-2">您的帳號已成功啟用，現在可以開始使用了。</p>
          <RouterLink to="/login">
            <el-button type="primary" size="large" class="mt-8">前往登入</el-button>
          </RouterLink>
        </div>

        <div v-else key="error">
          <el-icon :size="50" class="text-red-500"><CircleCloseFilled /></el-icon>
          <h2 class="text-2xl font-semibold mt-4 text-gray-800">驗證失敗</h2>
          <p class="text-red-600 bg-red-50 p-3 rounded-md mt-4">{{ errorMessage }}</p>
          <RouterLink to="/">
            <el-button class="mt-8">返回首頁</el-button>
          </RouterLink>
        </div>
      </transition>
    </el-card>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
