<template>
  <div class="usage-stats-page">
    <!-- 顶部概览卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #2563eb, #0a1e5c)">
            <el-icon :size="22"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statTotalTemplates }}</div>
            <div class="stat-label">模板总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #059669)">
            <el-icon :size="22"><DocumentCopy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statTotalUsage }}</div>
            <div class="stat-label">累计使用次数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
            <el-icon :size="22"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statTodayUsage }}</div>
            <div class="stat-label">今日生成数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
            <el-icon :size="22"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ statActiveUsers }}</div>
            <div class="stat-label">活跃用户数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header-flex">
              <span>各类型模板使用分布</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>近30天使用趋势</span>
          </template>
          <div ref="lineChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top:20px">
      <template #header>
        <span>使用排行榜（TOP 10）</span>
      </template>
      <el-table :data="topList" stripe>
        <el-table-column prop="rank" label="排名" width="80" align="center" />
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="type" label="公文类型" width="120" />
        <el-table-column prop="usage" label="使用次数" width="140" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.usage }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Document, DocumentCopy, TrendCharts, User } from '@element-plus/icons-vue'

const statTotalTemplates = ref(127)
const statTotalUsage = ref(3842)
const statTodayUsage = ref(16)
const statActiveUsers = ref(47)

const pieChartRef = ref<HTMLElement | null>(null)
const lineChartRef = ref<HTMLElement | null>(null)
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

const topList = ref([
  { rank: 1, name: '关于就业补贴申请审批表', type: '审批表', usage: 523 },
  { rank: 2, name: '关于XX工作的通知', type: '通知', usage: 412 },
  { rank: 3, name: '就业形势月度分析报告', type: '报告', usage: 387 },
  { rank: 4, name: '关于申请就业资金的请示', type: '请示', usage: 301 },
  { rank: 5, name: '劳动监察整改告知书', type: '告知书', usage: 276 },
  { rank: 6, name: '关于确认劳动关系的函', type: '函', usage: 221 },
  { rank: 7, name: '社保补缴业务审核批复', type: '批复', usage: 198 },
  { rank: 8, name: '农民工就业情况统计表', type: '审批表', usage: 172 },
  { rank: 9, name: '年度工作总结报告', type: '报告', usage: 156 },
  { rank: 10, name: '业务培训通知', type: '通知', usage: 141 },
])

function initCharts() {
  if (!pieChartRef.value || !lineChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: true },
      data: [
        { value: 32, name: '审批表' },
        { value: 28, name: '通知' },
        { value: 19, name: '报告' },
        { value: 15, name: '函' },
        { value: 12, name: '请示' },
        { value: 10, name: '批复' },
        { value: 11, name: '告知书' },
      ]
    }]
  })

  const xData = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value' },
    series: [{
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50 + 10)),
      type: 'line',
      smooth: true,
      color: '#2563eb'
    }]
  })
}

function onResize() {
  pieChart?.resize()
  lineChart?.resize()
}

onMounted(() => {
  setTimeout(() => {
    initCharts()
    window.addEventListener('resize', onResize)
  }, 50)
})

onUnmounted(() => {
  pieChart?.dispose()
  lineChart?.dispose()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.usage-stats-page {
  padding: 0;
}
.stat-cards {
  margin-bottom: 0;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-content {
  flex: 1;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}
.chart-box {
  height: 300px;
}
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
