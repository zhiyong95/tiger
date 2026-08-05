<template>
  <div class="data-page">
    <el-row :gutter="20">
      <!-- 左侧：问数输入 -->
      <el-col :span="8">
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">自然语言问数</div>
          </div>
          <el-input
            v-model="queryInput"
            placeholder="例如：本月就业困难人员补贴发放人数是多少？"
            @keyup.enter="handleQuery"
            class="query-input"
          >
            <template #append>
              <el-button @click="handleQuery" :loading="querying">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>

          <div class="quick-queries">
            <div class="quick-q-title">常见问题</div>
            <el-tag
              v-for="q in quickQueries"
              :key="q"
              class="quick-q-tag"
              @click="queryInput = q; handleQuery()"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>

        <!-- 指标列表 -->
        <div class="page-card">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">已配置指标</div>
          </div>
          <div class="metric-list">
            <div v-for="metric in metrics" :key="metric.id" class="metric-item">
              <div class="metric-info">
                <div class="metric-name">{{ metric.name }}</div>
                <div class="metric-source">{{ metric.source }}</div>
              </div>
              <div class="metric-value">
                <span class="value-num">{{ metric.value.toLocaleString() }}</span>
                <span class="value-unit">{{ metric.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：结果展示 -->
      <el-col :span="16">
        <div class="page-card result-panel" style="height: calc(100vh - 136px)">
          <div v-if="!queryResult" class="result-empty">
            <el-icon :size="48" color="#c0c4cc"><DataAnalysis /></el-icon>
            <p class="empty-title">输入问题开始数据查询</p>
            <p class="empty-desc">支持自然语言提问，系统将自动匹配指标并返回结果</p>
          </div>

          <div v-else class="result-content">
            <!-- 口径说明 -->
            <div class="explanation-box">
              <el-icon color="#1a56db"><InfoFilled /></el-icon>
              <span>{{ queryResult.explanation }}</span>
            </div>

            <!-- 图表 -->
            <div class="chart-section">
              <div class="section-title">数据可视化</div>
              <div ref="chartRef" style="height: 300px"></div>
            </div>

            <!-- 数据表格 -->
            <div class="table-section">
              <div class="section-title">数据明细</div>
              <el-table :data="queryResult.data" stripe style="width: 100%">
                <el-table-column prop="name" label="指标名称" />
                <el-table-column prop="value" label="数值">
                  <template #default="{ row }">
                    <span class="table-value">{{ row.value.toLocaleString() }}</span>
                    <span class="table-unit">{{ row.unit }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="period" label="统计周期" />
                <el-table-column prop="trend" label="同比变化">
                  <template #default="{ row }">
                    <span :class="row.trend >= 0 ? 'trend-up' : 'trend-down'">
                      {{ row.trend >= 0 ? '+' : '' }}{{ row.trend }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="source" label="数据来源" />
              </el-table>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { queryMetric, fetchMetrics } from '@/api/mock'
import type { MetricData } from '@/types'

const queryInput = ref('')
const querying = ref(false)
const metrics = ref<MetricData[]>([])
const queryResult = ref<{ data: MetricData[]; chartType: string; explanation: string } | null>(null)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const quickQueries = [
  '本月城镇新增就业人数是多少？',
  '本月失业登记人数变化趋势',
  '职业技能培训人数统计',
  '失业保险金发放情况',
]

onMounted(async () => {
  metrics.value = await fetchMetrics()
})

const handleQuery = async () => {
  if (!queryInput.value.trim() || querying.value) return
  querying.value = true
  try {
    queryResult.value = await queryMetric(queryInput.value)
    await nextTick()
    renderChart()
  } catch {
    // error handled
  } finally {
    querying.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value || !queryResult.value) return
  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  const data = queryResult.value.data
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: { rotate: 15, color: '#6b7280' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.value),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4f8ef7' },
            { offset: 1, color: '#1a56db' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '50%',
      },
    ],
  })
}

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<style scoped>
.data-page {
  height: calc(100vh - 96px);
}

.query-input {
  margin-bottom: 16px;
}

.quick-queries {
  margin-top: 12px;
}

.quick-q-title {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.quick-q-tag {
  margin: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-q-tag:hover {
  background: #1a56db;
  color: white;
  border-color: #1a56db;
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  transition: background 0.2s;
}

.metric-item:hover {
  background: #e8f0fe;
}

.metric-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.metric-source {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.metric-value {
  text-align: right;
}

.value-num {
  font-size: 18px;
  font-weight: 700;
  color: #1a56db;
}

.value-unit {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

.result-panel {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #9ca3af;
}

.empty-title {
  font-size: 16px;
  color: #6b7280;
  margin-top: 16px;
}

.empty-desc {
  font-size: 13px;
  margin-top: 8px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.explanation-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f7ff;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.table-value {
  font-weight: 600;
  color: #1a56db;
}

.table-unit {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 4px;
}

.trend-up {
  color: #10b981;
  font-weight: 500;
}

.trend-down {
  color: #ef4444;
  font-weight: 500;
}
</style>
