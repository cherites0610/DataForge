<script setup lang="ts">
import { computed, watch } from 'vue'
import { generatorOptions } from '@/config/generators'

// 統一的資料結構
interface Question {
  id: number
  name: string
  question?: string
  generatorType: string
  answerType: string
  options: Record<string, any>
}

const props = defineProps<{
  question: Question
}>()

const emit = defineEmits(['remove', 'update:question'])

// 使用 v-model 語法糖來簡化雙向綁定
const localQuestion = computed({
  get: () => props.question,
  set: (value) => emit('update:question', value),
})

// LLM 模式下的回答格式選項
const answerTypes = ['簡答', '數字', '單選', '是非']

// 監聽「生成方式」的變化，這是最高優先級的狀態切換
watch(
  () => localQuestion.value.generatorType,
  (newType) => {
    // 重置 options 為新類型的預設值
    const newOptionsConfig = generatorOptions[newType]?.options || []
    const newOptions: Record<string, any> = {}
    newOptionsConfig.forEach((opt) => {
      newOptions[opt.key] = opt.defaultValue
    })
    localQuestion.value.options = newOptions

    // 如果切換到 LLM 模式，給予預設的回答格式
    if (newType === 'llm-answer') {
      localQuestion.value.answerType = '簡答'
    }
  },
)

// 監聽 LLM 模式下「回答格式」的變化
watch(
  () => localQuestion.value.answerType,
  (newAnswerType) => {
    // 確保此邏輯只在 LLM 模式下觸發
    if (localQuestion.value.generatorType === 'llm-answer') {
      // 當回答格式變為'單選'時，為其初始化 choices 選項
      if (newAnswerType === '單選') {
        const singleChoiceConfig = generatorOptions['single-choice'].options[0]
        localQuestion.value.options = {
          [singleChoiceConfig.key]: singleChoiceConfig.defaultValue,
        }
      } else {
        // 其他格式則清空 options
        localQuestion.value.options = {}
      }
    }
  },
)
</script>

<template>
  <div class="p-4 border rounded-md bg-gray-50 space-y-4">
    <el-row :gutter="20" align="middle">
      <el-col :span="6">
        <el-input v-model="localQuestion.name" placeholder="欄位名 (Key)" />
      </el-col>
      <el-col :span="16">
        <el-select v-model="localQuestion.generatorType" placeholder="生成方式" class="w-full">
          <el-option
            v-for="(config, key) in generatorOptions"
            :key="key"
            :label="config.label"
            :value="key"
          />
        </el-select>
      </el-col>
      <el-col :span="2" class="text-right">
        <el-button @click="$emit('remove')" type="danger" link>移除</el-button>
      </el-col>
    </el-row>

    <div v-if="localQuestion.generatorType === 'llm-answer'" class="space-y-4">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <el-select v-model="localQuestion.answerType" placeholder="回答格式" class="w-full">
            <el-option v-for="t in answerTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-input v-model="localQuestion.question" placeholder="問題描述 (給LLM看)" />
        </el-col>
      </el-row>
      <el-row v-if="localQuestion.answerType === '單選'">
        <el-col :span="24">
          <el-form-item :label="generatorOptions['single-choice'].options[0].label">
            <el-input
              v-model="localQuestion.options.choices"
              type="textarea"
              :rows="2"
              :placeholder="generatorOptions['single-choice'].options[0].placeholder"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div
      v-else-if="generatorOptions[localQuestion.generatorType]?.options.length > 0"
      class="pt-4 border-t"
    >
      <el-row :gutter="20">
        <el-col
          :span="8"
          v-for="option in generatorOptions[localQuestion.generatorType].options"
          :key="option.key"
        >
          <el-form-item :label="option.label">
            <el-input
              v-if="['text', 'number'].includes(option.type)"
              v-model="localQuestion.options[option.key]"
              :type="option.type"
              :placeholder="option.placeholder"
            />
            <el-select
              v-if="option.type === 'select'"
              v-model="localQuestion.options[option.key]"
              class="w-full"
            >
              <el-option v-for="item in option.items" :key="item" :label="item" :value="item" />
            </el-select>
            <el-input
              v-if="option.type === 'textarea'"
              v-model="localQuestion.options[option.key]"
              type="textarea"
              :rows="2"
              :placeholder="option.placeholder"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
