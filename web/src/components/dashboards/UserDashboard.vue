<script setup lang="ts">
import StatCard from '@/components/charts/StatCard.vue'
defineProps<{ data: any }>()
</script>
<template>
  <el-card>
    <template #header>
      <h2 class="text-xl font-semibold">個人用量總覽</h2>
    </template>
    <el-row :gutter="20">
      <el-col :span="16">
        <p class="text-lg">本月 Token 用量</p>
        <p class="text-2xl font-bold">
          {{ data.summary.monthlyTokensUsed.toLocaleString() }} /
          <span class="text-base font-normal text-gray-500">{{
            data.summary.monthlyTokenLimit.toLocaleString()
          }}</span>
        </p>
        <el-progress
          class="mt-2"
          :percentage="
            Math.min(100, (data.summary.monthlyTokensUsed / data.summary.monthlyTokenLimit) * 100)
          "
        />
      </el-col>
      <el-col :span="8">
        <StatCard title="今日消耗 Token" :value="data.summary.todayTokensUsed" />
      </el-col>
    </el-row>

    <el-divider />

    <h3 class="text-lg font-semibold mb-4">最近活動</h3>
    <el-table :data="data.recentActivities" stripe>
      <el-table-column prop="createdAt" label="時間" width="200" />
      <el-table-column prop="action" label="操作" />
      <el-table-column prop="details" label="詳細資訊">
        <template #default="{ row }">
          <pre class="text-xs bg-gray-100 p-2 rounded">{{
            JSON.stringify(row.details, null, 2)
          }}</pre>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
