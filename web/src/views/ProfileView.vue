<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getMyUsageLogs } from '@/services/api'
import type { UsageLog } from '@/types'

const authStore = useAuthStore()
const logs = ref<UsageLog[]>([])
const loading = ref(true)
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>()

const fetchLogs = async () => {
  loading.value = true
  try {
    const response = await getMyUsageLogs(currentPage.value, pageSize.value)

    logs.value = response.data
    total.value = response.total
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.fetchUserProfile() // 確保使用者資料是最新
  fetchLogs()
})
</script>
<template>
  <div v-if="authStore.user">
    <h1 class="text-2xl font-semibold mb-6">個人資料與用量</h1>
    <el-card class="mb-8">
      <template #header><div>用量總覽</div></template>
      <p>
        Email: {{ authStore.user.email }} 已驗證:{{ authStore.user.isEmailVerified ? '是' : '否' }}
      </p>
      <p>當前方案 Token 額度: {{ authStore.user.monthlyTokenLimit.toLocaleString() }}</p>
      <div class="mt-4">
        <p>本月已使用 Token: {{ authStore.user.monthlyTokensUsed.toLocaleString() }}</p>
        <el-progress
          :percentage="
            Math.min(
              100,
              (authStore.user.monthlyTokensUsed / authStore.user.monthlyTokenLimit) * 100,
            )
          "
        />
      </div>
    </el-card>

    <el-card>
      <template #header><div>使用紀錄</div></template>
      <el-table :data="logs" v-loading="loading">
        <el-table-column prop="createdAt" label="時間" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="details" label="詳細資訊">
          <template #default="{ row }">
            <pre>{{ JSON.stringify(row.details, null, 2) }}</pre>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
