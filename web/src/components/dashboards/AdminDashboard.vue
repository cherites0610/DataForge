<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import StatCard from '@/components/charts/StatCard.vue'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const props = defineProps<{ data: any }>()

const chartOptions = computed(() => ({
  title: { text: '最近 30 天 Token 使用趨勢' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: props.data.usageTrend.map((d: any) => new Date(d.date).toLocaleDateString()),
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: 'Tokens',
      type: 'line',
      smooth: true,
      data: props.data.usageTrend.map((d: any) => d.tokens),
    },
  ],
}))
</script>
<template>
  <el-card>
    <template #header>
      <h2 class="text-xl font-semibold">全站數據總覽</h2>
    </template>
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6"
        ><StatCard title="總使用者數" :value="data.summary.totalUsers" unit="人"
      /></el-col>
      <el-col :span="6"
        ><StatCard title="今日新註冊" :value="data.summary.newUsersToday" unit="人"
      /></el-col>
      <el-col :span="6"
        ><StatCard title="近 30 天 Token 消耗" :value="data.summary.totalTokensLast30Days"
      /></el-col>
      <el-col :span="6"
        ><StatCard title="您的今日消耗" :value="data.summary.todayTokensUsed"
      /></el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <v-chart class="chart" :option="chartOptions" autoresize style="height: 400px" />
      </el-col>
      <el-col :span="8">
        <h3 class="text-lg font-semibold mb-4">活躍使用者排行 (近30天)</h3>
        <el-table :data="data.topUsers" stripe>
          <el-table-column prop="email" label="使用者" />
          <el-table-column prop="totalTokens" label="Token 消耗">
            <template #default="{ row }">{{
              parseInt(row.totalTokens, 10).toLocaleString()
            }}</template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </el-card>
</template>
