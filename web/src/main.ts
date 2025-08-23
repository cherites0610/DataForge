import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)
const authStore = useAuthStore()

try {
  if (authStore.token) {
    await authStore.fetchUserProfile()
  }
} catch (error) {
  console.log('Session expired or invalid, proceeding as guest.')
}

app.use(ElementPlus)

app.mount('#app')
