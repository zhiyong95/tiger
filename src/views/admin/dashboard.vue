<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <h2>后台首页</h2>
      <span class="subtitle">系统运行概览</span>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4" v-for="stat in stats" :key="stat.label">
        <div class="stat-card" :style="{ background: stat.bg }">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-trend">{{ stat.trend }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 待处理事项 -->
    <el-row :gutter="16" class="content-row">
      <el-col :span="12">
        <div class="section-card">
          <div class="section-title">待处理事项</div>
          <div v-for="item in pendingItems" :key="item.title" class="pending-item">
            <el-tag :type="item.type" size="small">{{ item.tag }}</el-tag>
            <span class="pending-text">{{ item.title }}</span>
            <span class="pending-count">{{ item.count }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="section-card">
          <div class="section-title">AI 调用概览</div>
          <div class="ai-call-stats">
            <div class="ai-item" v-for="ai in aiStats" :key="ai.name">
              <div class="ai-name">{{ ai.name }}</div>
              <div class="ai-bar">
                <div class="ai-bar-fill" :style="{ width: ai.pct + '%', background: ai.color }"></div>
              </div>
              <div class="ai-count">{{ ai.count }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
const stats = [
  { label: '用户总数', value: '1,284', color: '#2563eb', trend: '↑ 12 本周新增', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
  { label: '知识文档', value: '3,526', color: '#059669', trend: '↑ 38 本周新增', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
  { label: 'AI 调用量', value: '12.4K', color: '#d97706', trend: '↑ 2.1K 本周', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' },
  { label: '待处理反馈', value: '24', color: '#dc2626', trend: '↑ 6 新增', bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' },
  { label: '公文模板', value: '86', color: '#7c3aed', trend: '稳定', bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' },
  { label: '活跃指标', value: '32', color: '#0891b2', trend: '正常', bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' },
]

const pendingItems = [
  { title: '知识库文档审核待处理', tag: '知识库', type: 'primary' as const, count: 8 },
  { title: '用户问答反馈待修正', tag: '反馈', type: 'warning' as const, count: 12 },
  { title: '公文模板更新申请', tag: '模板', type: 'info' as const, count: 3 },
  { title: '审核规则版本待发布', tag: '规则', type: 'danger' as const, count: 1 },
  { title: '指标口径待确认', tag: '指标', type: 'success' as const, count: 4 },
]

const aiStats = [
  { name: '知识问答', count: '6,842', pct: 100, color: '#2563eb' },
  { name: '公文生成', count: '2,156', pct: 65, color: '#059669' },
  { name: '智能问数', count: '1,892', pct: 55, color: '#d97706' },
  { name: '审核预审', count: '856', pct: 35, color: '#7c3aed' },
  { name: '政策快研', count: '654', pct: 25, color: '#0891b2' },
]
</script>

<style scoped>
.admin-dashboard { padding: 0; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; }
.subtitle { font-size: 13px; color: #9ca3af; }
.stats-row { margin-bottom: 16px !important; }
.stat-card { padding: 16px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.05); }
.stat-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; margin-bottom: 2px; }
.stat-trend { font-size: 11px; color: #9ca3af; }
.content-row { margin-bottom: 0 !important; }
.section-card { background: #fff; border-radius: 10px; border: 1px solid #e5e7eb; padding: 16px; height: 100%; }
.section-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.pending-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f9fafb; }
.pending-item:last-child { border-bottom: none; }
.pending-text { flex: 1; font-size: 13px; color: #374151; }
.pending-count { font-size: 14px; font-weight: 600; color: #2563eb; }
.ai-call-stats { display: flex; flex-direction: column; gap: 12px; }
.ai-item { display: flex; align-items: center; gap: 10px; }
.ai-name { width: 64px; font-size: 12px; color: #6b7280; flex-shrink: 0; }
.ai-bar { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.ai-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.ai-count { width: 48px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; }
</style>