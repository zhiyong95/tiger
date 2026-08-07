<template>
  <div class="feedback-page">
    <div class="page-header">
      <h2>知识反馈运营</h2>
      <span class="subtitle">问答反馈处理与知识优化</span>
    </div>
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="s in fstats" :key="s.label">
        <div class="fstat-card" :style="{ background: s.bg }">
          <div class="fstat-label">{{ s.label }}</div>
          <div class="fstat-value" :style="{ color: s.color }">{{ s.value }}</div>
        </div>
      </el-col>
    </el-row>
    <el-card shadow="never" class="mt-4">
      <template #header>
        <div class="card-header">
          <span>用户反馈列表</span>
          <el-select v-model="filterType" size="small" placeholder="筛选类型" style="width:140px">
            <el-option label="全部反馈" value="" />
            <el-option label="有用" value="useful" />
            <el-option label="无用" value="useless" />
            <el-option label="需修正" value="fix" />
          </el-select>
        </div>
      </template>
      <el-table :data="feedbackList" stripe style="width:100%">
        <el-table-column prop="question" label="问题" min-width="200" />
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="feedback" label="反馈" width="80">
          <template #default="{ row }">
            <el-tag :type="row.feedback === '有用' ? 'success' : row.feedback === '无用' ? 'danger' : 'warning'" size="small">{{ row.feedback }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" text type="primary">修正知识</el-button>
            <el-button size="small" text type="info">忽略</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const filterType = ref('')
const fstats = [
  { label: '总反馈数', value: '1,284', color: '#2563eb', bg: '#eff6ff' },
  { label: '有用反馈', value: '856', color: '#059669', bg: '#f0fdf4' },
  { label: '无用反馈', value: '312', color: '#dc2626', bg: '#fef2f2' },
  { label: '需修正', value: '116', color: '#d97706', bg: '#fffbeb' },
]
const feedbackList = [
  { question: '灵活就业人员社保补贴申请条件是什么？', time: '2026-08-07 09:32', feedback: '有用' },
  { question: '失业保险金领取期限如何计算？', time: '2026-08-07 08:15', feedback: '无用' },
  { question: '企业吸纳就业困难人员补贴标准', time: '2026-08-06 16:42', feedback: '需修正' },
  { question: '高校毕业生就业见习补贴如何申请？', time: '2026-08-06 14:20', feedback: '有用' },
  { question: '城乡居民养老保险缴费档次有哪些？', time: '2026-08-06 11:08', feedback: '有用' },
  { question: '工伤认定申请需要哪些材料？', time: '2026-08-06 09:35', feedback: '需修正' },
  { question: '就业困难人员认定标准是什么？', time: '2026-08-05 17:00', feedback: '无用' },
]
</script>
<style scoped>
.feedback-page { padding: 0; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; }
.subtitle { font-size: 13px; color: #9ca3af; }
.stats-row { margin-bottom: 16px !important; }
.fstat-card { padding: 16px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.05); }
.fstat-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.fstat-value { font-size: 22px; font-weight: 700; }
.mt-4 { margin-top: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
</style>