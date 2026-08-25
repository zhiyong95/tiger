<template>
  <div class="dashboard">
    <!-- 1. 顶部通栏导航横幅 -->
    <div class="banner">
      <div class="banner-left">
        <h1 class="banner-title">AI辅助办公工作台</h1>
      </div>
      <div class="banner-right">
        <span class="banner-days">
          <span class="days-icon">✨</span>
          本AI助手已伴您办公 <em class="days-num">{{ dashboardData.workDays }}</em> 天
        </span>
      </div>
    </div>

    <!-- 2. 效益总览指标看板 -->
    <div class="section">
      <div class="stat-grid">
        <div class="stat-card" v-for="item in dashboardData.benefits" :key="item.id">
          <div class="stat-icon" :style="{ background: getIconBg(item.id) }">
            <el-icon :size="24" color="#fff"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-label">{{ item.name }}</div>
            <div class="stat-value">
              {{ formatNumber(item.value) }}
              <span class="stat-unit">{{ item.unit }}</span>
            </div>
            <div class="stat-trend">
              <el-icon><Top /></el-icon>
              <span>较上月增长 {{ item.trend }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 六大AI功能快捷入口 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">AI功能快捷入口</h2>
      </div>
      <div class="func-grid">
        <div
          class="func-card"
          v-for="fn in dashboardData.functionUsage"
          :key="fn.name"
          @click="goToFn(fn.path)"
        >
          <div class="func-icon" :style="{ background: getFuncIconBg(fn.name) }">
            <el-icon :size="22" color="#fff"><component :is="getFuncIcon(fn.name)" /></el-icon>
          </div>
          <div class="func-info">
            <span class="func-name">{{ fn.name }}</span>
            <el-tag size="small" class="func-tag" effect="plain">已使用 {{ fn.count }} 次</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 可视化图表区域 -->
    <div class="section">
      <div class="chart-card">
        <div class="section-header">
          <h2 class="section-title">各AI工具效益贡献分析</h2>
          <el-select
            v-model="chartTimeRange"
            size="small"
            style="width: 120px"
            @change="onChartTimeChange"
          >
            <el-option label="本周" value="thisWeek" />
            <el-option label="本月" value="thisMonth" />
            <el-option label="本季度" value="thisQuarter" />
            <el-option label="全部时段" value="all" />
          </el-select>
        </div>
        <div ref="chartRef" style="height: 300px; width: 100%"></div>
      </div>
    </div>

    <!-- 5. 最近AI使用记录 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">最近AI使用记录</h2>
      </div>
      <el-table :data="dashboardData.recentRecords" stripe style="width: 100%" class="record-table">
        <el-table-column prop="time" label="使用时间" width="170" />
        <el-table-column prop="module" label="AI功能模块" width="150" />
        <el-table-column prop="title" label="成果标题" min-width="240" />
        <el-table-column label="操作" width="240" align="center">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="handleView(row)">查看成果</el-button>
            <el-button text size="small" type="primary" @click="handleEdit(row)">再次编辑</el-button>
            <el-button text size="small" @click="handleFavorite(row)">收藏</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { fetchDashboardData } from '@/api/mock'

const router = useRouter()
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const chartTimeRange = ref('thisWeek')

interface BenefitItem {
  id: string
  name: string
  value: number
  unit: string
  icon: string
  trend: number
}

interface FuncUsage {
  name: string
  count: number
  path: string
}

interface RecordItem {
  id: string
  time: string
  module: string
  title: string
  status: string
}

interface ContributionData {
  name: string
  value: number
}

interface DashboardDataType {
  workDays: number
  benefits: BenefitItem[]
  functionUsage: FuncUsage[]
  contributionData: Record<string, ContributionData[]>
  recentRecords: RecordItem[]
}

const dashboardData = ref<DashboardDataType>({
  workDays: 0,
  benefits: [],
  functionUsage: [],
  contributionData: {},
  recentRecords: [],
})

const formatNumber = (num: number): string => {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return num.toLocaleString()
}

const getIconBg = (id: string): string => {
  const map: Record<string, string> = {
    '1': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    '2': 'linear-gradient(135deg, #10b981, #059669)',
    '3': 'linear-gradient(135deg, #f59e0b, #d97706)',
    '4': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  }
  return map[id] || 'linear-gradient(135deg, #2563eb, #1d4ed8)'
}

const getFuncIcon = (name: string): string => {
  const map: Record<string, string> = {
    '智能问数': 'DataAnalysis',
    '智能分析报告': 'TrendCharts',
    '政策快研': 'Reading',
    '人社知识智能问答': 'ChatDotRound',
    'AI公文助手': 'Document',
    '业务智能审核': 'Checked',
  }
  return map[name] || 'Tools'
}

const getFuncIconBg = (name: string): string => {
  const map: Record<string, string> = {
    '智能问数': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    '智能分析报告': 'linear-gradient(135deg, #10b981, #059669)',
    '政策快研': 'linear-gradient(135deg, #f59e0b, #d97706)',
    '人社知识智能问答': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'AI公文助手': 'linear-gradient(135deg, #ef4444, #dc2626)',
    '业务智能审核': 'linear-gradient(135deg, #06b6d4, #0891b2)',
  }
  return map[name] || 'linear-gradient(135deg, #2563eb, #1d4ed8)'
}

const goToFn = (path: string) => {
  router.push(path)
}

const onChartTimeChange = () => {
  updateChart()
}

const handleView = (row: RecordItem) => {
  // 根据模块跳转到对应页面
  const pathMap: Record<string, string> = {
    'AI公文助手': '/document',
    '智能问数': '/data',
    '政策快研': '/policy',
    '人社知识智能问答': '/qa',
    '智能分析报告': '/report',
    '业务智能审核': '/audit',
  }
  const path = pathMap[row.module] || '/dashboard'
  router.push(path)
}

const handleEdit = (row: RecordItem) => {
  const pathMap: Record<string, string> = {
    'AI公文助手': '/document',
    '智能问数': '/data',
    '政策快研': '/policy',
    '人社知识智能问答': '/qa',
    '智能分析报告': '/report',
    '业务智能审核': '/audit',
  }
  const path = pathMap[row.module] || '/dashboard'
  router.push(path)
}

const handleFavorite = (row: RecordItem) => {
  ElMessage.success('已收藏')
}

const updateChart = () => {
  if (!chartInstance) return
  const data = dashboardData.value.contributionData[chartTimeRange.value] || []
  chartInstance.setOption({
    xAxis: { data: data.map((d) => d.name) },
    series: [{ data: data.map((d) => d.value) }],
  })
}

onMounted(async () => {
  const data = await fetchDashboardData()
  dashboardData.value = data as DashboardDataType

  // 初始化图表
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    const chartData = data.contributionData[chartTimeRange.value] || []
    chartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { name: string; value: number }[]) => {
          const p = params[0]
          return `${p.name}<br/>贡献值：<strong>${p.value}</strong>`
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true, top: '10px' },
      xAxis: {
        type: 'category',
        data: chartData.map((d) => d.name),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          barWidth: '36%',
          data: chartData.map((d) => d.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#60a5fa' },
                { offset: 1, color: '#2563eb' },
              ]),
            },
          },
        },
      ],
    })
  }
})

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

/* 顶部横幅 */
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0a1e5c 0%, #0f2a78 50%, #1a3a8a 100%);
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 20px;
}

.banner-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 1px;
}

.banner-days {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.12);
  padding: 8px 18px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.days-icon {
  font-size: 16px;
}

.days-num {
  font-style: normal;
  font-weight: 700;
  color: #fbbf24;
  font-size: 18px;
  margin: 0 2px;
}

/* 分区样式 */
.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* 统计卡片网格 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-unit {
  font-size: 13px;
  font-weight: 400;
  color: #9ca3af;
  margin-left: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #10b981;
  margin-top: 4px;
}

.stat-trend .el-icon {
  font-size: 12px;
}

/* 功能卡片网格 */
.func-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.func-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}

.func-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.func-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.func-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.func-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.func-tag {
  flex-shrink: 0;
  font-size: 11px;
  --el-tag-bg-color: #e8f0fe;
  --el-tag-text-color: #2563eb;
  --el-tag-border-color: #c7d7f4;
}

/* 图表卡片 */
.chart-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 记录表格 */
.record-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.record-table :deep(.el-table__header th) {
  background: #f8f9fa;
  color: #6b7280;
  font-weight: 500;
  font-size: 13px;
}

.record-table :deep(.el-table__body td) {
  font-size: 13px;
  color: #374151;
}

.record-table :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #fafbfc;
}
</style>