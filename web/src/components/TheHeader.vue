<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router' // 1. 引入 useRouter
import UsageGuideDialog from './UsageGuideDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { ArrowDown } from '@element-plus/icons-vue' // 2. 引入 dropdown 需要的圖示

const usageGuideDialogRef = ref<InstanceType<typeof UsageGuideDialog> | null>(null)
const authStore = useAuthStore()
const router = useRouter() // 3. 建立 router 實例

const openUsageGuide = () => {
  usageGuideDialogRef.value?.open()
}

// 4. 建立處理 dropdown 命令的函式
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    authStore.logout()
  }
}
</script>

<template>
  <header class="w-full bg-white shadow-sm">
    <div class="max-w-5xl mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <RouterLink to="/" class="flex items-center hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="數造工坊 DataForge Logo" class="h-10 mr-3" />
          <h1 class="text-2xl font-bold text-gray-800">數造工坊 DataForge</h1>
        </RouterLink>

        <div class="flex items-center space-x-4">
          <RouterLink to="/">
            <el-button text bg>首頁</el-button>
          </RouterLink>
          <RouterLink to="/prompts">
            <el-button text bg>Prompt 庫</el-button>
          </RouterLink>
          <el-button text bg @click="openUsageGuide">使用教學</el-button>

          <template v-if="authStore.isAuthenticated">
            <el-dropdown @command="handleCommand">
              <span
                class="el-dropdown-link flex items-center cursor-pointer text-gray-600 hover:text-blue-500"
              >
                歡迎, {{ authStore.user?.email }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">個人資料與用量</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>登出</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template v-else>
            <RouterLink to="/login"><el-button plain>登入</el-button></RouterLink>
            <RouterLink to="/register"><el-button type="primary">註冊</el-button></RouterLink>
          </template>
        </div>
      </div>
    </div>

    <UsageGuideDialog ref="usageGuideDialogRef" />
  </header>
</template>

<style scoped>
/* 讓 dropdown 的觸發器有更好的外觀 */
.el-dropdown-link {
  outline: none; /* 移除點擊時的藍色外框 */
}

/* 確保 RouterLink 在 dropdown-item 中能正常運作 (如果未來改回用 RouterLink 的話) */
.el-dropdown-menu__item a {
  color: inherit;
  text-decoration: none;
  display: block;
  width: 100%;
}
</style>
