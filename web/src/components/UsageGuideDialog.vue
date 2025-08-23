<script setup lang="ts">
import { ref } from 'vue'
import { User, Menu, Collection, Download } from '@element-plus/icons-vue'

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
          <el-step status="process" :icon="User">
            <template #title>
              <h3 class="text-lg font-semibold">第一步：註冊與登入</h3>
            </template>
            <template #description>
              <p class="text-gray-600">
                歡迎使用！首先，您需要一個個人帳號。請點擊頁面右上角的
                <code><el-button type="primary" size="small">註冊</el-button></code>
                按鈕來建立您的帳號。註冊成功後，系統會發送一封驗證信至您的信箱，請務必前往點擊連結以啟用帳號。完成驗證後，您就可以登入平台了。
              </p>
            </template>
          </el-step>

          <el-step status="process" :icon="Menu">
            <template #title>
              <h3 class="text-lg font-semibold">第二步：探索與管理</h3>
            </template>
            <template #description>
              <p class="text-gray-600 mb-2">登入後，您可以探索平台的核心管理功能：</p>
              <ul class="list-disc pl-5 space-y-2">
                <li>
                  <strong>Prompt 庫</strong>：點擊頁首的
                  <code><el-button size="small">Prompt 庫</el-button></code>
                  進入管理介面。在這裡，您可以建立、編輯和刪除專屬於您的 Prompt
                  範本，這是讓生成數據更具個人化風格的關鍵！
                </li>
                <li>
                  <strong>個人資料</strong>：點擊您的
                  Email，在下拉選單中選擇「個人資料」，您可以查看帳號的 Token 使用紀錄與額度詳情。
                </li>
              </ul>
            </template>
          </el-step>

          <el-step status="process" :icon="Collection">
            <template #title>
              <h3 class="text-lg font-semibold">第三步：開始生成數據</h3>
            </template>
            <template #description>
              <p class="text-gray-600 mb-2">在主頁，您可以選擇兩種強大的生成模式：</p>
              <ul class="list-disc pl-5 space-y-2">
                <li>
                  <strong>欄位模式</strong
                  >：適用於快速生成獨立的數據欄位。您可以在「生成類型」下拉選單中，選擇系統內建的規則，或是您在
                  Prompt 庫中建立的「獨立型」範本。
                </li>
                <li>
                  <strong>問卷模式 (LLM)</strong
                  >：適用於模擬邏輯連貫的真人回覆。此模式支援**混合生成**，您可以將部分欄位（如ID、手機號）設為「規則生成」以節省成本，將需要創意和邏輯的欄位設為「交由
                  LLM 回答」。更棒的是，您可以透過「問卷生成風格」下拉選單，套用您在 Prompt
                  庫中建立的「連貫型」範本，來指導 AI 的整體回答風格和語氣！
                </li>
              </ul>
            </template>
          </el-step>

          <el-step status="process" :icon="Download">
            <template #title>
              <h3 class="text-lg font-semibold">第四步：下載您的成果</h3>
            </template>
            <template #description>
              <p class="text-gray-600">
                在您設定好所有欄位或問題後，於頁面底部設定希望生成的
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
