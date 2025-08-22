<script setup lang="ts">
import { ref } from 'vue'
import FieldRow from '@/components/FieldRow.vue'
import QuestionRow from '@/components/QuestionRow.vue'
import { generatorOptions } from '@/config/generators'
import { generateCoherentSurveyApi, generateExcelApi } from '@/services/api'
import { ElMessage } from 'element-plus'

interface Field {
  id: number
  name: string
  type: string
  options: Record<string, any>
}

interface Question {
  id: number
  name: string
  question: string
  type: string
  options: string // UI層用字串
}

const questions = ref<Question[]>([])
const fields = ref<Field[]>([])
const isLoading = ref(false)
const totalRows = ref(10)
const activeTab = ref('fieldMode')

const addField = () => {
  const defaultType = Object.keys(generatorOptions)[0]
  const defaultOptions = generatorOptions[defaultType].options.reduce(
    (acc, opt) => {
      acc[opt.key] = opt.defaultValue
      return acc
    },
    {} as Record<string, any>,
  )

  fields.value.push({
    id: Date.now(),
    name: `欄位_${fields.value.length + 1}`,
    type: defaultType,
    options: defaultOptions,
  })
}

const removeField = (id: number) => {
  fields.value = fields.value.filter((field) => field.id !== id)
}

const updateField = (newField: Field) => {
  const index = fields.value.findIndex((f) => f.id === newField.id)
  if (index !== -1) {
    fields.value[index] = newField
  }
}

const addQuestion = () => {
  questions.value.push({
    id: Date.now(),
    name: `q_${questions.value.length + 1}`,
    question: '',
    type: '單選',
    options: '',
  })
}
const removeQuestion = (id: number) => {
  questions.value = questions.value.filter((q) => q.id !== id)
}
const updateQuestion = (newQuestion: Question) => {
  const index = questions.value.findIndex((q) => q.id === newQuestion.id)
  if (index !== -1) {
    questions.value[index] = newQuestion
  }
}

const handleGenerate = async () => {
  isLoading.value = true
  try {
    let blob
    if (activeTab.value === 'fieldMode') {
      if (fields.value.length === 0) {
        ElMessage.warning('請至少新增一個欄位')
        isLoading.value = false
        return
      }
      // Field Mode Logic
      const cleanFields = fields.value.map((field) => {
        // 處理 'single-choice' 的特殊情況：將字串轉為陣列
        if (field.type === 'single-choice' && typeof field.options.choices === 'string') {
          return {
            name: field.name,
            type: field.type,
            options: {
              ...field.options,
              choices: field.options.choices.split(',').map((s) => s.trim()),
            },
          }
        }
        return {
          name: field.name,
          type: field.type,
          options: field.options,
        }
      })
      blob = await generateExcelApi({ rows: totalRows.value, fields: cleanFields })
    } else {
      // Survey Mode Logic
      if (questions.value.length === 0) {
        ElMessage.warning('請至少新增一個問題')
        isLoading.value = false
        return
      }
      const cleanQuestions = questions.value.map((q) => ({
        name: q.name,
        question: q.question,
        type: q.type,
        options: q.type === '單選' ? q.options.split(',').map((s) => s.trim()) : undefined,
      }))
      blob = await generateCoherentSurveyApi({ rows: totalRows.value, questions: cleanQuestions })
    }

    // Common Download Logic
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `data-forge-output-${Date.now()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('Excel 檔案已成功生成並開始下載！')
  } catch (error: any) {
    console.error('生成失敗:', error)

    // 檢查是否是 401 錯誤
    if (error.response && error.response.status === 401) {
      ElMessage.error('API Key 驗證失敗！請點擊右上角按鈕，檢查您的 Key 是否正確。')
    } else {
      ElMessage.error('生成失敗，請檢查後端服務是否正常或查看主控台錯誤訊息。')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-8 bg-white rounded-lg shadow-md">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="欄位模式" name="fieldMode">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">獨立欄位設定</h2>
          <el-button @click="addField" type="primary">新增欄位</el-button>
        </div>
        <div class="space-y-4">
          <FieldRow
            v-for="(field, index) in fields"
            :key="field.id"
            :field="field"
            :index="index"
            @remove="removeField(field.id)"
            @update="updateField"
          />
        </div>
        <el-empty v-if="fields.length === 0" description="尚未新增任何欄位" />
      </el-tab-pane>

      <el-tab-pane label="問卷模式 (LLM)" name="surveyMode">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">連貫性問卷設定</h2>
          <el-button @click="addQuestion" type="primary">新增問題</el-button>
        </div>
        <div class="space-y-4">
          <QuestionRow
            v-for="q in questions"
            :key="q.id"
            :question="q"
            @remove="removeQuestion(q.id)"
            @update:question="updateQuestion"
          />
        </div>
        <el-empty v-if="questions.length === 0" description="尚未新增任何問題" />
      </el-tab-pane>
    </el-tabs>

    <div class="mt-8 pt-6 border-t flex justify-between items-center">
      <div>
        <span class="mr-4 text-gray-600">生成筆數:</span>
        <el-input-number v-model="totalRows" :min="1" :max="1000" />
      </div>
      <el-button
        type="success"
        size="large"
        @click="handleGenerate"
        :loading="isLoading"
        :disabled="isLoading"
      >
        {{ isLoading ? '生成中...' : '生成 Excel' }}
      </el-button>
    </div>
  </div>
</template>
