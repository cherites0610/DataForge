<script setup lang="ts">
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { LoginCredentials } from '@/types'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const formData = reactive<LoginCredentials>({ email: '', password: '' })
const isLoading = ref(false)

const rules = reactive<FormRules>({
  email: [{ required: true, message: '請輸入 Email', trigger: 'blur' }],
  password: [{ required: true, message: '請輸入密碼', trigger: 'blur' }],
})

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        await authStore.login(formData)
        // 登入成功後，store action 會自動導向
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '登入失敗')
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <el-card class="w-full max-w-md">
      <template #header>
        <h2 class="text-2xl text-center font-semibold">登入</h2>
      </template>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit(formRef)"
      >
        <el-form-item label="Email" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="密碼" prop="password">
          <el-input v-model="formData.password" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" class="w-full" :loading="isLoading"
            >登入</el-button
          >
        </el-form-item>
      </el-form>
      <div class="text-center mt-4">
        <span class="text-gray-600">還沒有帳號？</span>
        <RouterLink to="/register" class="text-blue-500 hover:underline">立即註冊</RouterLink>
      </div>
    </el-card>
  </div>
</template>
