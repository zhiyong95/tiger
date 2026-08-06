<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card" style="border-left: 4px solid #2563eb">
          <div class="stat-value">{{ dashboardData.todoCount.pending }}</div>
          <div class="stat-label">待处理任务</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon> 较昨日 +2
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-left: 4px solid #ef4444">
          <div class="stat-value" style="color: #ef4444">{{ dashboardData.todoCount.overdue }}</div>
          <div class="stat-label">已逾期任务</div>
          <div class="stat-trend down">
            <el-icon><Bottom /></el-icon> 需尽快处理
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-left: 4px solid #f59e0b">
          <div class="stat-value" style="color: #f59e0b">{{ dashboardData.riskAlerts }}</div>
          <div class="stat-label">风险预警</div>
          <div class="stat-trend">
            <el-icon><Warning /></el-icon> 待核实
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="border-left: 4px solid #10b981">
          <div class="stat-value" style="color: #10b981">{{ dashboardData.todoCount.completed }}</div>
          <div class="stat-label">已完成任务</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon> 本周累计
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 左侧：图表 + 常用功能 -->
      <el-col :span="16">
        <!-- 就业趋势图 -->
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div>
              <div class="page-title">城镇新增就业趋势</div>
              <div class="page-subtitle">2024年1月 - 7月</div>
            </div>
          </div>
          <div ref="chartRef" style="height: 300px"></div>
        </div>

        <!-- 常用功能 -->
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">常用功能</div>
          </div>
          <el-row :gutter="16">
            <el-col :span="6" v-for="action in dashboardData.quickActions" :key="action.name">
              <div class="quick-action" @click="$router.push(action.path)">
                <el-icon :size="28" color="#1a56db"><component :is="action.icon" /></el-icon>
                <span class="quick-action-name">{{ action.name }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>

      <!-- 右侧：待办 + 最近记录 -->
      <el-col :span="8">
        <!-- 风险提醒 -->
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">风险提醒</div>
            <el-tag type="danger" size="small">{{ dashboardData.riskAlerts }} 条</el-tag>
          </div>
          <div class="risk-list">
            <div class="risk-item" v-for="i in 3" :key="i">
              <el-icon color="#ef4444"><WarningFilled /></el-icon>
              <div class="risk-content">
                <div class="risk-title">重复领取就业补贴预警</div>
                <div class="risk-time">2小时前</div>
              </div>
              <el-tag size="small" type="danger">高</el-tag>
            </div>
          </div>
        </div>

        <!-- 最近问答 -->
        <div class="page-card">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">最近问答</div>
            <el-link type="primary" @click="$router.push('/qa')">查看全部</el-link>
          </div>
          <div class="recent-list">
            <div class="recent-item" v-for="qa in dashboardData.recentQA" :key="qa.id">
              <el-icon color="#1a56db"><ChatDotRound /></el-icon>
              <div class="recent-content">
                <div class="recent-title">{{ qa.question }}</div>
                <div class="recent-time">{{ qa.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { fetchDashboardData } from '@/api/mock'

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const dashboardData = ref({
  todoCount: { pending: 0, overdue: 0, completed: 0 },
  riskAlerts: 0,
  recentQA: [] as { id: string; question: string; time: string }[],
  quickActions: [] as { name: string; path: string; icon: string }[],
  employmentTrend: [] as { month: string; value: number }[],
})

onMounted(async () => {
  const data = await fetchDashboardData()
  dashboardData.value = data

  // 初始化图表
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.employmentTrend.map((item) => item.month),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' },
      },
      series: [
        {
          name: '新增就业人数',
          type: 'line',
          smooth: true,
          data: data.employmentTrend.map((item) => item.value),
          itemStyle: { color: '#1a56db' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(26, 86, 219, 0.3)' },
              { offset: 1, color: 'rgba(26, 86, 219, 0.02)' },
            ]),
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
.stat-row {
  margin-bottom: 0;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.quick-action:hover {
  background: #e8f0fe;
  transform: translateY(-2px);
}

.quick-action-name {
  font-size: 13px;
  color: #374151;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #fef2f2;
}

.risk-content {
  flex: 1;
}

.risk-title {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.risk-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.2s;
}

.recent-item:hover {
  background: #e8f0fe;
}

.recent-content {
  flex: 1;
}

.recent-title {
  font-size: 13px;
  color: #374151;
}

.recent-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>
