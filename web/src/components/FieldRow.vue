<script setup lang="ts">
import { computed, watch } from 'vue'
import { generatorOptions, type GeneratorOption } from '@/config/generators'

interface Field {
  id: number
  name: string
  type: string
  options: Record<string, any>
}

const props = defineProps<{
  field: Field
  index: number
}>()

const emit = defineEmits(['remove', 'update'])

const localField = computed({
  get: () => props.field,
  set: (value) => emit('update', value),
})

const currentGeneratorOptions = computed<GeneratorOption[]>(() => {
  return generatorOptions[localField.value.type]?.options || []
})

// 當生成類型改變時，重設 options
watch(
  () => localField.value.type,
  (newType) => {
    const newOptionsConfig = generatorOptions[newType]?.options || []
    const newOptions: Record<string, any> = {}
    newOptionsConfig.forEach((opt) => {
      newOptions[opt.key] = opt.defaultValue
    })
    localField.value.options = newOptions
  },
)

// 將 textarea 的字串轉換為陣列
const getChoicesAsArray = (choicesString: string) => {
  if (!choicesString || typeof choicesString !== 'string') return []
  return choicesString.split(',').map((s) => s.trim())
}
</script>

<template>
  <div class="p-4 border rounded-md bg-gray-50">
    <el-row :gutter="20" align="middle">
      <el-col :span="8">
        <el-input v-model="localField.name" placeholder="欄位名稱" />
      </el-col>
      <el-col :span="8">
        <el-select v-model="localField.type" placeholder="生成類型" class="w-full">
          <el-option
            v-for="(config, key) in generatorOptions"
            :key="key"
            :label="config.label"
            :value="key"
          />
        </el-select>
      </el-col>
      <el-col :span="8" class="text-right">
        <el-button @click="$emit('remove')" type="danger" link>移除</el-button>
      </el-col>
    </el-row>

    <div v-if="currentGeneratorOptions.length > 0" class="mt-4 pt-4 border-t">
      <el-row :gutter="20">
        <el-col :span="8" v-for="option in currentGeneratorOptions" :key="option.key">
          <el-form-item :label="option.label">
            <el-input
              v-if="option.type === 'text' || option.type === 'number'"
              v-model="localField.options[option.key]"
              :type="option.type"
              :placeholder="option.placeholder"
            />
            <el-select
              v-if="option.type === 'select'"
              v-model="localField.options[option.key]"
              class="w-full"
            >
              <el-option v-for="item in option.items" :key="item" :label="item" :value="item" />
            </el-select>
            <el-input
              v-if="option.type === 'textarea'"
              v-model="localField.options[option.key]"
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
