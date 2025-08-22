<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false)
const apiKeyInput = ref('')

const open = () => {
  // 打開時，從 localStorage 讀取現有的 key
  apiKeyInput.value = localStorage.getItem('apiKey') || ''
  dialogVisible.value = true
}

const saveKey = () => {
  // 儲存 key 到 localStorage
  localStorage.setItem('apiKey', apiKeyInput.value)
  ElMessage.success('API Key 已儲存！')
  dialogVisible.value = false
}

// 透過 defineExpose 將 open 方法暴露給父元件
defineExpose({
  open,
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="設定 API Key" width="500px">
    <p class="mb-4 text-gray-600">
      請輸入您的 Beta 測試 API Key。此金鑰將會被儲存在您的瀏覽器中，方便您下次使用。
    </p>
    <el-input v-model="apiKeyInput" placeholder="請在此貼上您的 API Key" show-password />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveKey"> 儲存 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
