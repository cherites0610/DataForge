<script setup lang="ts">
import { ref } from 'vue'
import { Setting, Key, Collection, DocumentChecked } from '@element-plus/icons-vue'

const dialogVisible = ref(false)

const open = () => {
  dialogVisible.value = true
}

defineExpose({
  open,
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="數造工坊 - 使用教學" width="700px">
    <el-scrollbar max-height="60vh">
      <div class="px-6 py-2">
        <el-steps direction="vertical">
          <el-step status="process" :icon="Key">
            <template #title>
              <h3 class="text-lg font-semibold">第一步：設定您的 API Key</h3>
            </template>
            <template #description>
              <p class="text-gray-600">
                您應該已經從管理員那裡收到一組專屬的 Beta 測試 API Key。請點擊頁面右上角的
                <code><el-button size="small" :icon="Setting" text>設定 API Key</el-button></code>
                按鈕，將您的 Key
                貼入並儲存。此金鑰只會儲存在您的瀏覽器中，確保您的請求能被伺服器識別。
              </p>
            </template>
          </el-step>

          <el-step status="process" :icon="Collection">
            <template #title>
              <h3 class="text-lg font-semibold">第二步：選擇生成模式</h3>
            </template>
            <template #description>
              <p class="text-gray-600 mb-2">
                本工具提供兩種強大的數據生成模式，請在主介面的頁籤中選擇：
              </p>
              <ul class="list-disc pl-5 space-y-2">
                <li>
                  <strong>欄位模式</strong
                  >：適用於生成多個各自獨立的數據欄位。您可以為每一欄選擇不同的生成規則（如序列號、手機號、量表分數等），它們會被獨立生成。
                </li>
                <li>
                  <strong>問卷模式 (LLM)</strong
                  >：適用於模擬真實、邏輯連貫的問卷回覆。您需要定義一份完整的問卷結構，LLM
                  將扮演受訪者，一次性生成所有問題的答案，並確保答案之間符合邏輯（例如，性別為男的受訪者，懷孕狀態會是「否」）。
                </li>
              </ul>
            </template>
          </el-step>

          <el-step status="process" :icon="DocumentChecked">
            <template #title>
              <h3 class="text-lg font-semibold">第三步：設定並生成 Excel</h3>
            </template>
            <template #description>
              <p class="text-gray-600">
                在您選擇的模式下設定好所有欄位或問題後，在頁面底部設定您希望生成的
                <code>生成筆數</code>，然後點擊
                <code><el-button type="success" size="small">生成 Excel</el-button></code>
                按鈕。稍待片刻，您的瀏覽器將會自動下載生成的 Excel 檔案。
              </p>
            </template>
          </el-step>
        </el-steps>
      </div>
    </el-scrollbar>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false"> 我明白了 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
