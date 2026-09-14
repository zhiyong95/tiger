<template>
  <div class="tutu-empty">
    <TutuLogo :size="96" class="empty-logo" />
    <h2 class="empty-title">你好，我是<span class="empty-name">途途</span></h2>
    <p class="empty-welcome">{{ welcome }}</p>
    <div class="empty-questions">
      <button v-for="q in questions" :key="q" type="button" class="empty-q" @click="onAsk(q)">{{ q }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import TutuLogo from './TutuLogo.vue'

defineProps<{
  welcome: string
  questions: string[]
  onAsk: (q: string) => void
}>()
</script>

<style scoped>
.tutu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 420px;
  text-align: center;
  padding: 24px;
}
.empty-logo { margin-bottom: 24px; }
.empty-title {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px;
}
.empty-name { color: #2563eb; }
.empty-welcome {
  font-size: 15px;
  color: #4b5563;
  max-width: 480px;
  line-height: 1.7;
  margin: 0 0 28px;
}
.empty-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 560px;
}
.empty-q {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px 18px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
}
.empty-q:hover {
  background: #e8f0fe;
  border-color: #2563eb;
  color: #2563eb;
}
</style>