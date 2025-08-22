<script setup lang="ts">
import { computed } from 'vue'

interface Question {
  id: number
  name: string
  question: string
  type: string
  options: string // 在 UI 層，我們先用字串處理選項
}

const props = defineProps<{
  question: Question
}>()

const emit = defineEmits(['remove', 'update:question'])

const localQuestion = computed({
  get: () => props.question,
  set: (value) => emit('update:question', value),
})

const questionTypes = ['單選', '是非', '數字', '簡答']
</script>

<template>
  <div class="p-4 border rounded-md bg-gray-50">
    <el-row :gutter="20" align="middle">
      <el-col :span="6">
        <el-input v-model="localQuestion.name" placeholder="欄位名 (Key)" />
      </el-col>
      <el-col :span="10">
        <el-input v-model="localQuestion.question" placeholder="問題描述 (給LLM看)" />
      </el-col>
      <el-col :span="6">
        <el-select v-model="localQuestion.type" placeholder="問題類型" class="w-full">
          <el-option v-for="t in questionTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </el-col>
      <el-col :span="2" class="text-right">
        <el-button @click="$emit('remove')" type="danger" link>移除</el-button>
      </el-col>
    </el-row>
    <el-row v-if="localQuestion.type === '單選'" class="mt-4">
      <el-col :span="24">
        <el-form-item label="選項 (用逗號分隔)">
          <el-input
            v-model="localQuestion.options"
            type="textarea"
            :rows="2"
            placeholder="例如: 選項A,選項B,選項C"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>
