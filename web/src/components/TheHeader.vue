<script setup lang="ts">
import { ref } from 'vue'
import ApiKeyDialog from './ApiKeyDialog.vue'
import UsageGuideDialog from './UsageGuideDialog.vue'

const apiKeyDialogRef = ref<InstanceType<typeof ApiKeyDialog> | null>(null)
const usageGuideDialogRef = ref<InstanceType<typeof UsageGuideDialog> | null>(null)

const openApiKeyDialog = () => {
  apiKeyDialogRef.value?.open()
}

const openUsageGuide = () => {
  // 3. 建立打開教學的方法
  usageGuideDialogRef.value?.open()
}
</script>

<template>
  <header class="w-full max-w-5xl mx-auto px-4 py-4">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">數造工坊 DataForge</h1>
      </div>
      <div class="flex items-center space-x-4">
        <el-button @click="openUsageGuide">使用教學</el-button>
        <el-button @click="openApiKeyDialog">設定 API Key</el-button>
      </div>
    </div>
    <el-divider class="!my-4" />

    <ApiKeyDialog ref="apiKeyDialogRef" />
    <UsageGuideDialog ref="usageGuideDialogRef" />
  </header>
</template>
