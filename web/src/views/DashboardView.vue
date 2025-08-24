<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getDashboardData, getPublicStats } from '@/services/api'
import { MagicStick, Files, CollectionTag, Compass } from '@element-plus/icons-vue'
import UserDashboard from '@/components/dashboards/UserDashboard.vue'
import AdminDashboard from '@/components/dashboards/AdminDashboard.vue'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const dashboardData = ref(null)
const isLoading = ref(true)
const publicStats = ref<any>(null)

onMounted(async () => {
  try {
    if (authStore.isAuthenticated) {
      dashboardData.value = await getDashboardData()
    } else {
      publicStats.value = await getPublicStats()
    }
  } catch (error) {
    console.error('無法載入儀表板數據:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div v-loading="isLoading" class="min-h-[60vh]">
    <div v-if="authStore.isAuthenticated && dashboardData">
      <AdminDashboard v-if="authStore.user?.role === 'admin'" :data="dashboardData" />
      <UserDashboard v-else :data="dashboardData" />
    </div>

    <div v-if="!authStore.isAuthenticated && publicStats" class="space-y-12">
      <div class="text-center py-16">
        <h1 class="text-4xl md:text-5xl font-extrabold text-gray-800">歡迎來到數造工坊</h1>
        <p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          釋放您的數據潛力。無論是精確的規則生成，還是富有邏輯的 AI
          模擬，我們都能為您一鍵產出高品質的偽造數據。
        </p>
        <div class="mt-8 space-x-4">
          <RouterLink to="/register">
            <el-button type="primary" size="large">立即免費註冊</el-button>
          </RouterLink>
          <RouterLink to="/login">
            <el-button size="large">登入</el-button>
          </RouterLink>
        </div>
      </div>

      <el-row :gutter="30">
        <el-col :md="8">
          <el-card shadow="hover" class="text-center p-6">
            <el-icon :size="40" class="text-blue-500 mb-4"><Files /></el-icon>
            <h3 class="text-xl font-semibold mb-2">多樣化規則生成</h3>
            <p class="text-gray-500">從序列號、手機號到地區身分證，滿足您對精確格式數據的需求。</p>
          </el-card>
        </el-col>
        <el-col :md="8">
          <el-card shadow="hover" class="text-center p-6">
            <el-icon :size="40" class="text-green-500 mb-4"><MagicStick /></el-icon>
            <h3 class="text-xl font-semibold mb-2">智慧 LLM 引擎</h3>
            <p class="text-gray-500">
              獨創的混合生成模式，讓 AI 為您產出邏輯連貫、上下文一致的複雜問卷數據。
            </p>
          </el-card>
        </el-col>
        <el-col :md="8">
          <el-card shadow="hover" class="text-center p-6">
            <el-icon :size="40" class="text-orange-500 mb-4"><CollectionTag /></el-icon>
            <h3 class="text-xl font-semibold mb-2">彈性範本庫</h3>
            <p class="text-gray-500">
              建立並管理您自己的 Prompt 範本，完全掌控 AI 的語氣與生成風格，實現無限可能。
            </p>
          </el-card>
        </el-col>
      </el-row>

      <div class="text-center py-12">
        <p class="text-gray-500">平台已累計生成</p>
        <p class="text-5xl font-bold text-gray-800 my-2">
          {{ publicStats.totalRowsGenerated.toLocaleString() }}
        </p>
        <p class="text-gray-500">
          筆有效數據，並擁有 {{ publicStats.templateCount }} 個 Prompt 範本
        </p>
      </div>
    </div>
  </div>
</template>
