import { createRouter, createWebHistory } from 'vue-router'
import GeneratorView from '../views/GeneratorView.vue'
import PromptLibraryView from '@/views/PromptLibraryView.vue'
import RegisterView from '@/views/RegisterView.vue'
import LoginView from '@/views/LoginView.vue'
import VerifyEmailView from '@/views/VerifyEmailView.vue'
import AuthCallbackView from '@/views/AuthCallbackView.vue'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', redirect: '/dashboard' }, // 將根目錄重導向到儀表板
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      // meta: { requiresAuth: true },
    },
    {
      path: '/generator',
      name: 'generator',
      component: GeneratorView,
      meta: { requiresAuth: true },
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: PromptLibraryView,
    },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/auth/verify-email', name: 'verify-email', component: VerifyEmailView },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackView,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    // 若目標頁面需要認證但使用者未登入，導向到登入頁
    next({ name: 'login' })
  } else {
    // 否則，正常放行
    next()
  }
})

export default router
