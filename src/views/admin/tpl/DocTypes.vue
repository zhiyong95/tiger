<template>
  <div class="doc-types">
    <div class="section-title">按公文类型归档统计</div>
    <div class="type-grid">
      <div v-for="item in typeStats" :key="item.type" class="type-card">
        <div class="type-icon" :style="{ background: item.color }">{{ item.type.slice(0,1) }}</div>
        <div class="type-info">
          <div class="type-name">{{ item.type }}</div>
          <div class="type-count">{{ item.count }} 个模板</div>
        </div>
        <div class="type-bar">
          <div class="type-bar-fill" :style="{ width: item.percent + '%', background: item.color }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ templates: any[] }>()

const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const typeStats = computed(() => {
  const map: Record<string, number> = {}
  props.templates.forEach(t => { map[t.type] = (map[t.type] || 0) + 1 })
  const types = Object.keys(map)
  const max = Math.max(...Object.values(map), 1)
  return types.map((type, i) => ({
    type,
    count: map[type],
    percent: (map[type] / max) * 100,
    color: colors[i % colors.length],
  }))
})
</script>

<style scoped>
.doc-types { padding: 4px 0; }
.section-title { font-size: 16px; font-weight: 600; color: #0a1e5c; margin-bottom: 16px; }
.type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.type-card {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.type-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; font-weight: 700; flex-shrink: 0;
}
.type-info { flex: 1; }
.type-name { font-size: 14px; font-weight: 600; color: #1f2937; }
.type-count { font-size: 12px; color: #6b7280; margin-top: 2px; }
.type-bar { width: 80px; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
.type-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
</style>