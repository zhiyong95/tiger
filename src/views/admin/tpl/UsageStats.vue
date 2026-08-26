<template>
  <div class="usage-stats">
    <div class="section-title">使用热度 TOP 10</div>
    <div class="top-list">
      <div v-for="(item, idx) in topTemplates" :key="item.id" class="top-item">
        <div class="top-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</div>
        <div class="top-info">
          <div class="top-name">{{ item.name }}</div>
          <div class="top-meta">{{ item.type }} · {{ item.createdBy }}</div>
        </div>
        <div class="top-bar-wrapper">
          <div class="top-bar" :style="{ width: (item.usage / maxUsage) * 100 + '%' }" />
        </div>
        <div class="top-count">{{ item.usage }} 次</div>
      </div>
    </div>

    <div class="section-title" style="margin-top:28px">各科室模板产出</div>
    <div class="dept-stats">
      <div v-for="dept in deptStats" :key="dept.id" class="dept-stat-card">
        <div class="dept-stat-name">{{ dept.name }}</div>
        <div class="dept-stat-num">{{ dept.count }}</div>
        <div class="dept-stat-label">个模板</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  templates: any[]
  departments: any[]
  users: any[]
}>()

const room: Record<string, string> = { u1: '赵磊', u2: '张伟', u3: '王芳', u4: '李明', u5: '孙悦', u6: '陈静' }

const topTemplates = computed(() => {
  return [...props.templates]
    .sort((a, b) => (b.usage || 0) - (a.usage || 0))
    .slice(0, 10)
    .map(t => ({
      ...t,
      createdBy: room[t.createdBy] || t.createdBy,
    }))
})

const maxUsage = computed(() => {
  return Math.max(...topTemplates.value.map(t => t.usage || 0), 1)
})

const deptStats = computed(() => {
  return props.departments.map(d => {
    const deptUsers = props.users.filter(u => u.dept === d.id)
    const count = props.templates.filter(t => deptUsers.some(u => u.id === t.createdBy)).length
    return { ...d, count }
  })
})
</script>

<style scoped>
.usage-stats { padding: 4px 0; }
.section-title { font-size: 16px; font-weight: 600; color: #0a1e5c; margin-bottom: 16px; }
.top-list { display: flex; flex-direction: column; gap: 8px; }
.top-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 10px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.top-rank {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.rank-1 { background: linear-gradient(135deg, #f59e0b, #ef4444); }
.rank-2 { background: linear-gradient(135deg, #94a3b8, #64748b); }
.rank-3 { background: linear-gradient(135deg, #d97706, #92400e); }
.rank-1, .rank-2, .rank-3 { min-width: 28px; }
.top-info { flex: 1; min-width: 0; }
.top-name { font-size: 13px; font-weight: 600; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
.top-bar-wrapper { flex: 1; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; max-width: 200px; }
.top-bar { height: 100%; background: linear-gradient(90deg, #2563eb, #60a5fa); border-radius: 3px; transition: width 0.6s ease; }
.top-count { font-size: 13px; font-weight: 600; color: #2563eb; white-space: nowrap; }
.dept-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.dept-stat-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.dept-stat-name { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
.dept-stat-num { font-size: 32px; font-weight: 700; color: #2563eb; }
.dept-stat-label { font-size: 12px; color: #9ca3af; margin-top: 4px; }
</style>