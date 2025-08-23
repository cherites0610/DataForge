<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateUserDto } from '@/types'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const formData = reactive<CreateUserDto & { confirmPassword: '' }>({
  email: '',
  password: '',
  confirmPassword: '',
})
const isLoading = ref(false)
const registrationSuccess = ref(false)

const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('請再次輸入密碼'))
  } else if (value !== formData.password) {
    callback(new Error('兩次輸入的密碼不一致!'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  email: [{ required: true, type: 'email', message: '請輸入有效的 Email', trigger: 'blur' }],
  password: [{ required: true, min: 8, message: '密碼長度至少 8 個字元', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
})

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true
      try {
        await authStore.register({ email: formData.email, password: formData.password })
        registrationSuccess.value = true
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '註冊失敗')
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
        <h2 class="text-2xl text-center font-semibold">註冊新帳號</h2>
      </template>

      <div v-if="registrationSuccess" class="text-center p-4">
        <el-icon :size="50" class="text-green-500"><CircleCheckFilled /></el-icon>
        <h3 class="text-xl font-semibold mt-4">註冊請求成功！</h3>
        <p class="text-gray-600 mt-2">
          我們已發送一封驗證信至您的信箱，請點擊信中連結以啟用您的帳號。
        </p>
        <el-button type="primary" class="mt-6" @click="router.push('/login')">前往登入</el-button>
      </div>

      <el-form
        v-else
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
        <el-form-item label="確認密碼" prop="confirmPassword">
          <el-input v-model="formData.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" class="w-full" :loading="isLoading"
            >註冊</el-button
          >
        </el-form-item>
      </el-form>

      <div v-if="!registrationSuccess" class="text-center mt-4">
        <span class="text-gray-600">已經有帳號了？</span>
        <RouterLink to="/login" class="text-blue-500 hover:underline">立即登入</RouterLink>
      </div>
    </el-card>
  </div>
</template>
