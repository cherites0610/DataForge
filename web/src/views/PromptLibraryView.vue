<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPromptTemplates,
  deletePromptTemplate,
  createPromptTemplate,
  updatePromptTemplate,
} from '@/services/api'
import type { PromptTemplate, PromptTemplatePayload } from '@/types'

// --- 狀態管理 ---
const templates = ref<PromptTemplate[]>([])
const isLoading = ref(true)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')

const formRef = ref()
const formData = reactive<Partial<PromptTemplate> & { isPublic?: boolean }>({})

const dialogTitle = computed(() =>
  dialogMode.value === 'create' ? '新增 Prompt 範本' : '編輯 Prompt 範本',
)

// --- API 邏輯 ---
const fetchTemplates = async () => {
  isLoading.value = true
  try {
    templates.value = await getPromptTemplates()
  } catch (error) {
    ElMessage.error('載入範本失敗')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTemplates)

// --- 事件處理 ---
const handleCreate = () => {
  Object.assign(formData, {
    name: '',
    template: '',
    type: 'independent',
    isPublic: false,
  })
  dialogMode.value = 'create'
  dialogVisible.value = true
}

const handleEdit = (row: PromptTemplate) => {
  const isPublic = row.userId === null
  Object.assign(formData, row, { isPublic })
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

const handleDelete = (row: PromptTemplate) => {
  ElMessageBox.confirm(`確定要刪除範本「${row.name}」嗎？此操作無法復原。`, '警告', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deletePromptTemplate(row.id)
      ElMessage.success('刪除成功')
      fetchTemplates() // 重新整理列表
    } catch (error) {
      ElMessage.error('刪除失敗')
    }
  })
}

const handleSubmit = async () => {
  await formRef.value.validate()
  const payload = {
    name: formData.name!,
    template: formData.template!,
    type: formData.type!,
    userId: localStorage.getItem('apiKey'),
    isPublic: formData.isPublic || false,
  }

  try {
    if (dialogMode.value === 'create') {
      await createPromptTemplate(payload)
      ElMessage.success('新增成功')
    } else {
      const updatePayload = {
        name: formData.name!,
        template: formData.template!,
        type: formData.type!,
      }
      await updatePromptTemplate(formData.id!, updatePayload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    fetchTemplates()
  } catch (error) {
    ElMessage.error(dialogMode.value === 'create' ? '新增失敗' : '更新失敗')
  }
}
</script>

<template>
  <div class="p-8 bg-white rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Prompt 庫</h1>
      <el-button type="primary" @click="handleCreate">新增範本</el-button>
    </div>

    <el-table :data="templates" v-loading="isLoading" stripe>
      <el-table-column prop="name" label="範本名稱" width="200" />
      <el-table-column prop="type" label="類型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 'independent' ? 'info' : 'success'">
            {{ row.type === 'independent' ? '獨立型' : '連貫型' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="template" label="範本內容" show-overflow-tooltip />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button @click="handleEdit(row)" type="primary" link size="small">編輯</el-button>
          <el-button
            v-if="!row.isDefault"
            @click="handleDelete(row)"
            type="danger"
            link
            size="small"
            >刪除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%">
      <el-form ref="formRef" :model="formData" label-position="top">
        <el-form-item
          label="範本名稱"
          prop="name"
          :rules="[{ required: true, message: '請輸入名稱' }]"
        >
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="類型" prop="type" :rules="[{ required: true, message: '請選擇類型' }]">
          <el-select v-model="formData.type" placeholder="請選擇範本類型">
            <el-option label="獨立型 (用於欄位模式)" value="independent" />
            <el-option label="連貫型 (用於問卷模式)" value="coherent" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="範本內容"
          prop="template"
          :rules="[{ required: true, message: '請輸入內容' }]"
        >
          <el-input
            v-model="formData.template"
            type="textarea"
            :rows="10"
            placeholder="請輸入 Prompt 範本，可使用 {{count}} 或 {{context}} 等變數..."
          />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'create'" label="範本權限">
          <el-switch
            v-model="formData.isPublic"
            active-text="公共 (所有使用者可見)"
            inactive-text="私有 (僅自己可見)"
          />
          <p class="text-xs text-gray-400 mt-1">
            注意：公共範本只能由管理員建立。若您非管理員，此請求將會失敗。
          </p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
