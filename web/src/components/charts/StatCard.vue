<script setup lang="ts">
defineProps<{
  title: string
  value: number | string
  unit?: string
}>()
</script>
<template>
  <el-card shadow="never">
    <div class="text-gray-500">{{ title }}</div>
    <div class="text-3xl font-bold my-2">
      {{ typeof value === 'number' ? value.toLocaleString() : value }}
      <span v-if="unit" class="text-base font-normal ml-1">{{ unit }}</span>
    </div>
  </el-card>
</template>
