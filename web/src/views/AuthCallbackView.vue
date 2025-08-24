<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()
const error = ref<string | null>(null)

onMounted(async () => {
  const token = route.query.token as string
  try {
    await authStore.handleSocialLoginCallback(token)
    // 成功後，store action 會自動導向，此頁面會被銷毀
  } catch (e: any) {
    error.value = e.message || '登入失敗，無效的 token。'
    ElMessage.error(error.value as string)
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <el-card class="w-full max-w-md text-center p-6">
      <div v-if="!error">
        <el-icon class="is-loading" :size="50"><Loading /></el-icon>
        <h2 class="text-xl font-semibold mt-4">正在為您登入...</h2>
        <p class="text-gray-500 mt-2">請稍候，正在為您設定帳號。</p>
      </div>
      <div v-else>
        <el-icon :size="50" class="text-red-500"><CircleCloseFilled /></el-icon>
        <h2 class="text-xl font-semibold mt-4">登入失敗</h2>
        <p class="text-gray-600 mt-2">{{ error }}</p>
        <RouterLink to="/login">
          <el-button type="primary" class="mt-6">返回登入頁</el-button>
        </RouterLink>
      </div>
    </el-card>
  </div>
</template>
