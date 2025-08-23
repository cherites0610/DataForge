import { createRouter, createWebHistory } from 'vue-router'
import GeneratorView from '../views/GeneratorView.vue'
import PromptLibraryView from '@/views/PromptLibraryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'generator',
      component: GeneratorView,
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: PromptLibraryView,
    },
  ],
})

export default router
