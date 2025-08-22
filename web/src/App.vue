<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from './components/TheHeader.vue'
import TheFooter from './components/TheFooter.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center">
    <TheHeader />

    <main class="w-full max-w-5xl mx-auto px-4 flex-grow">
      <RouterView />
    </main>

    <TheFooter />
  </div>
</template>
