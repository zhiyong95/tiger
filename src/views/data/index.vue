<template>
  <div class="data-page">
    <!-- 左侧边栏 220px -->
    <div class="data-sidebar">
      <!-- 顶部标题栏 56px -->
      <div class="sidebar-header">
        <div class="header-left">
          <el-icon class="header-icon"><DataAnalysis /></el-icon>
          <span class="header-title">人社智能问数</span>
        </div>
        <div class="header-right">
          <el-button link type="primary" :icon="Setting" circle />
          <div class="user-avatar">
            <el-avatar :size="28" style="background: #2563eb">U</el-avatar>
            <span class="online-dot"></span>
          </div>
        </div>
      </div>

      <!-- 数据域 -->
      <div class="data-domain-section">
        <div class="section-label">数据域</div>
        <div
          v-for="domain in dataDomains"
          :key="domain.key"
          class="domain-item"
          :class="{ active: activeDomain === domain.key }"
          @click="selectDomain(domain.key)"
        >
          <div class="active-indicator" v-if="activeDomain === domain.key"></div>
          <el-icon class="domain-icon" :style="{ color: domain.color }">
            <component :is="domain.icon" />
          </el-icon>
          <span class="domain-name">{{ domain.name }}</span>
          <el-badge v-if="domain.count > 0" :value="domain.count" :type="'info'" class="domain-badge" />
        </div>
      </div>

      <!-- 查询历史 -->
      <div class="history-section">
        <div class="section-label history-header" @click="historyExpanded = !historyExpanded">
          <span>查询历史</span>
          <el-icon class="expand-icon" :class="{ rotated: historyExpanded }"><ArrowDown /></el-icon>
        </div>
        <div v-show="historyExpanded" class="history-list">
          <div v-if="queryHistory.length === 0" class="history-empty">
            <el-icon :size="16" color="#d1d5db"><Clock /></el-icon>
            <span class="empty-text">暂无查询记录</span>
          </div>
          <div v-else v-for="(item, idx) in queryHistory" :key="idx" class="history-item" @click="reQuery(item.question)">
            <div class="history-text">{{ item.question.length > 20 ? item.question.slice(0, 20) + '...' : item.question }}</div>
            <div class="history-hover-actions" @click.stop>
              <el-button link type="primary" size="small" @click="reQuery(item.question)">重新查询</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="data-main">
      <div class="main-scroll" ref="mainScrollRef">
        <!-- 欢迎态 -->
        <div v-if="conversationMessages.length === 0 && !isThinking" class="welcome-state">
          <div class="welcome-icon">
            <el-icon :size="64" color="#2563eb"><ChatDotRound /></el-icon>
          </div>
          <h1 class="welcome-title">您好，我是人社数据助手</h1>
          <p class="welcome-subtitle">我可以帮您查询人社各业务领域指标数据，支持自然语言提问、自动生成可视化图表</p>

          <div class="quick-card-grid">
            <div v-for="card in quickCards" :key="card.title" class="quick-card" @click="sendQuickQuestion(card.question)">
              <el-tag size="small" :type="card.tagType" class="quick-card-tag">{{ card.category }}</el-tag>
              <div class="quick-card-question">{{ card.title }}</div>
            </div>
          </div>
        </div>

        <!-- 对话态消息流 -->
        <div v-else class="message-flow">
          <div v-for="(msg, idx) in conversationMessages" :key="idx" class="msg-wrap">
            <!-- 用户气泡 -->
            <div v-if="msg.role === 'user'" class="user-bubble-wrap">
              <div class="user-bubble">
                {{ msg.content }}
              </div>
            </div>

            <!-- AI回复 -->
            <div v-else class="ai-msg-wrap">
              <div class="ai-header-row">
                <el-avatar :size="36" style="background: #2563eb"><el-icon><DataAnalysis /></el-icon></el-avatar>
                <div class="ai-label">数据助手</div>
                <span class="ai-tag">智能分析</span>
              </div>

              <!-- 结论卡片 -->
              <div class="ai-conclusion-card">
                <div class="conclusion-text">{{ msg.conclusion }}</div>
                <div class="source-line">
                  <el-icon :size="14" color="#6b7280"><Document /></el-icon>
                  <span>数据来源：人社核心业务数据库 · 更新时间：{{ msg.updateTime }}</span>
                </div>
              </div>

              <!-- KPI卡片 -->
              <div class="kpi-row" v-if="msg.kpiCards && msg.kpiCards.length > 0">
                <div v-for="(kpi, kidx) in msg.kpiCards" :key="kidx" class="kpi-card" :style="{ borderTop: `3px solid ${kpi.color}` }">
                  <div class="kpi-name">{{ kpi.name }}</div>
                  <div class="kpi-value-line">
                    <span class="kpi-num">{{ kpi.value.toLocaleString() }}</span>
                    <span class="kpi-unit">{{ kpi.unit }}</span>
                  </div>
                  <div class="kpi-trend" :class="kpi.trend >= 0 ? 'kpi-up' : 'kpi-down'">
                    <el-icon><component :is="kpi.trend >= 0 ? ArrowUp : ArrowDown" /></el-icon>
                    {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}% {{ kpi.trend >= 0 ? '同比增长' : '同比下降' }}
                  </div>
                </div>
              </div>

              <!-- 图表区 -->
              <div class="chart-wrap" v-if="msg.chartData">
                <div class="chart-toolbar">
                  <div class="chart-ctrls">
                    <el-radio-group v-model="msg.chartType" size="small" @change="() => renderChartForMsg(idx)">
                      <el-radio-button label="bar">柱状图</el-radio-button>
                      <el-radio-button label="line">折线图</el-radio-button>
                      <el-radio-button label="pie">饼图</el-radio-button>
                    </el-radio-group>
                  </div>
                  <el-button link type="primary" size="small" :icon="Download">导出图表</el-button>
                </div>
                <div :ref="el => setChartRef(idx, el)" class="echart-canvas" style="height: 300px;"></div>
              </div>

              <!-- 数据表格 -->
              <div class="table-wrap" v-if="msg.tableData && msg.tableData.length > 0">
                <el-table :data="msg.tableData" stripe class="data-table" :default-sort="{ prop: 'value', order: 'descending' as any }" @sort-change="onTableSort" style="width: 100%">
                  <el-table-column prop="name" label="指标名称" align="left" sortable />
                  <el-table-column prop="value" label="数值" align="right" sortable>
                    <template #default="{ row }">
                      <span class="cell-num">{{ row.value.toLocaleString() }}</span>
                      <span class="cell-unit">{{ row.unit }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="period" label="统计周期" align="center" />
                  <el-table-column prop="source" label="数据来源" align="center" />
                  <el-table-column label="操作" align="center" width="110">
                    <template #default>
                      <el-button link type="primary" size="small">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-pagination v-model:current-page="msg.page" :page-size="8" :total="msg.tableData.length + 20" layout="total, prev, pager, next" size="small" class="table-pager" />
              </div>
            </div>
          </div>

          <!-- AI思考骨架屏 -->
          <div v-if="isThinking" class="thinking-skeleton">
            <div class="ai-header-row">
              <el-avatar :size="36" style="background: #94a3b8"><el-icon><Loading /></el-icon></el-avatar>
              <div class="ai-label">数据助手</div>
              <span class="ai-tag">分析中...</span>
            </div>
            <div class="skeleton-blocks">
              <div class="skeleton-line shimmer"></div>
              <div class="skeleton-line skeleton-medium shimmer"></div>
              <div class="skeleton-line skeleton-short shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="input-footer">
        <div class="quick-tags-line">
          <el-tag v-for="tag in quickInputTags" :key="tag" class="footer-quick-tag" @click="sendQuickQueryTag(tag)">
            {{ tag }}
          </el-tag>
        </div>
        <div class="input-bar">
          <el-input
            v-model="userInput"
            placeholder="请输入您想查询的人社业务数据问题……"
            class="data-input"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            @keyup.enter="sendQuery"
          >
            <template #prepend>
              <el-button :icon="Microphone" circle text />
            </template>
            <template #append>
              <el-button type="primary" :loading="isThinking" @click="sendQuery" class="send-btn">
                <el-icon><Promotion /></el-icon>
                发送
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import {
  DataAnalysis,
  Setting,
  ArrowDown,
  ChatDotRound,
  Clock,
  Document,
  Download,
  Microphone,
  Promotion,
  ArrowUp,
  ArrowDown as ArrowDownIcon,
  PieChart,
  Histogram,
  User,
  Briefcase,
  OfficeBuilding,
  Coin,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeDomain = ref('social')
const historyExpanded = ref(true)
const queryHistory = ref<Array<{ question: string; ts: number }>>([
  { question: '本月城镇新增就业人数是多少', ts: Date.now() },
  { question: '各区县养老保险参保分布', ts: Date.now() - 3600000 },
  { question: '人才引进入户环比趋势', ts: Date.now() - 7200000 },
])

const conversationMessages = ref<Array<{
  role: 'user' | 'ai'
  content: string
  conclusion?: string
  updateTime?: string
  kpiCards?: Array<{ name: string; value: number; unit: string; trend: number; color: string }>
  chartData?: { labels: string[]; values: number[] }
  chartType?: 'bar' | 'line' | 'pie'
  tableData?: Array<{ name: string; value: number; unit: string; period: string; source: string }>
  page?: number
}>>([])

const isThinking = ref(false)
const userInput = ref('')
const inputFocused = ref(false)
const mainScrollRef = ref<HTMLElement>()
const sortProp = ref<string>('value')
const sortOrder = ref<string>('descending')
const chartMap = new Map<number, echarts.ECharts | null>()

const dataDomains = [
  { key: 'social', name: '社会保险', icon: PieChart, count: 3, color: '#2563eb' },
  { key: 'employment', name: '就业创业', icon: Briefcase, count: 2, color: '#10b981' },
  { key: 'talent', name: '人才人事', icon: User, count: 1, color: '#f59e0b' },
  { key: 'labor', name: '劳动关系', icon: OfficeBuilding, count: 0, color: '#ef4444' },
  { key: 'welfare', name: '工资福利', icon: Coin, count: 4, color: '#8b5cf6' },
]

const quickCards: Array<{ category: string; title: string; question: string; tagType: 'primary' | 'success' | 'warning' | 'danger' | 'info' | undefined }> = [
  { category: '社保', title: '本月养老保险参保人数', question: '本月养老保险参保人数有多少？', tagType: 'primary' },
  { category: '就业', title: '城镇新增就业趋势', question: '近6个月城镇新增就业人数变化趋势？', tagType: 'success' },
  { category: '人才', title: '人才引进数据统计', question: '本年度人才引进数据统计分析', tagType: 'warning' },
  { category: '劳动关系', title: '劳动争议案件分布', question: '各区县劳动争议案件分布情况', tagType: 'danger' },
  { category: '工资福利', title: '最低工资标准执行情况', question: '全市最低工资标准执行情况汇总', tagType: 'info' },
  { category: '综合', title: '人社核心指标概览', question: '本月人社核心业务指标概览', tagType: undefined },
]

const quickInputTags = ['最近一年', '按区县', '同比', '环比', '导出数据']

const selectDomain = (key: string) => {
  activeDomain.value = key
  const domainName = dataDomains.find(d => d.key === key)?.name
  ElMessage.success(`已切换至${domainName}数据域`)
}

const reQuery = (question: string) => {
  userInput.value = question
  sendQuery()
}

const sendQuickQuestion = (question: string) => {
  userInput.value = question
  sendQuery()
}

const sendQuickQueryTag = (tag: string) => {
  userInput.value += userInput.value ? ` ${tag}` : tag
  ElMessage.success(`已追加条件：${tag}`)
}

const sendQuery = async () => {
  const q = userInput.value.trim()
  if (!q) {
    ElMessage.warning('请输入查询问题')
    return
  }
  if (isThinking.value) return

  conversationMessages.value.push({ role: 'user', content: q })
  userInput.value = ''
  isThinking.value = true

  // 加入查询历史
  queryHistory.value.unshift({ question: q, ts: Date.now() })
  if (queryHistory.value.length > 20) queryHistory.value = queryHistory.value.slice(0, 20)

  await nextTick()
  scrollToBottom()

  // 模拟AI思考
  await new Promise(r => setTimeout(r, 1800))

  // 生成AI回复
  const newMsg = {
    role: 'ai' as const,
    content: '',
    conclusion: `根据您的查询「${q}」，系统从人社核心业务数据库中自动检索到了最新统计数据，数据口径符合指标管理配置要求。`,
    updateTime: new Date().toLocaleString(),
    kpiCards: [
      { name: '参保人数', value: 2876542, unit: '人', trend: 6.8, color: '#2563eb' },
      { name: '新增就业', value: 42689, unit: '人', trend: 4.2, color: '#10b981' },
      { name: '登记失业', value: 18754, unit: '人', trend: -5.3, color: '#ef4444' },
      { name: '技能培训', value: 156890, unit: '人', trend: 12.1, color: '#f59e0b' },
    ],
    chartData: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      values: [38000, 41000, 39500, 43200, 45100, 42689],
    },
    chartType: 'bar' as const,
    tableData: [
      { name: '城镇职工养老保险参保', value: 2145678, unit: '人', period: '2026-08', source: '社保库' },
      { name: '城乡居民养老保险参保', value: 730864, unit: '人', period: '2026-08', source: '社保库' },
      { name: '失业保险参保', value: 1456789, unit: '人', period: '2026-08', source: '就业库' },
      { name: '工伤保险参保', value: 1587623, unit: '人', period: '2026-08', source: '工伤库' },
      { name: '新增就业人数', value: 42689, unit: '人', period: '2026-08', source: '就业库' },
    ],
    page: 1,
  }

  conversationMessages.value.push(newMsg)
  isThinking.value = false

  await nextTick()
  scrollToBottom()
  const newMsgIdx = conversationMessages.value.length - 1
  setTimeout(() => renderChartForMsg(newMsgIdx), 120)
}

const setChartRef = (idx: number, el: any) => {
  const htmlEl = el as HTMLElement | null | undefined
  if (!htmlEl) return
  chartMap.set(idx, null)
  nextTick(() => {
    if (!htmlEl) return
    const chart = echarts.init(htmlEl)
    chartMap.set(idx, chart)
  })
}

const renderChartForMsg = (idx: number) => {
  const msg = conversationMessages.value[idx]
  if (!msg?.chartData) return
  const chart = chartMap.get(idx)
  if (!chart) return
  const chartType = msg.chartType || 'bar'
  const labels = msg.chartData.labels
  const values = msg.chartData.values

  let option: echarts.EChartsOption
  if (chartType === 'bar') {
    option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['指标数值'] },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280' } },
      series: [
        {
          name: '指标数值',
          type: 'bar',
          data: values,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4f8ef7' },
              { offset: 1, color: '#2563eb' },
            ]),
          },
          barWidth: '45%',
        },
      ],
    }
  } else if (chartType === 'line') {
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['指标数值'] },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280' } },
      series: [
        {
          name: '指标数值',
          type: 'line',
          data: values,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 2 },
          itemStyle: { color: '#2563eb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(37,99,235,0.3)' },
              { offset: 1, color: 'rgba(37,99,235,0.02)' },
            ]),
          },
        },
      ],
    }
  } else {
    const total = values.reduce((a, b) => a + b, 0)
    const pieNames = labels.map((l, i) => `${l}`)
    option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '2%', left: 'center' },
      series: [
        {
          name: '指标占比',
          type: 'pie',
          radius: ['35%', '70%'],
          center: ['50%', '45%'],
          data: labels.map((l, i) => ({ value: values[i], name: pieNames[i] })),
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        },
      ],
    }
  }
  chart.setOption(option, true)
  chart.on('legendselectchanged', (params: any) => {
    ElMessage.info(`图例切换：${JSON.stringify(params.name)}`)
  })
}

const onTableSort = (sortInfo: any) => {
  sortProp.value = sortInfo.prop || 'value'
  sortOrder.value = (sortInfo.order as string) || 'descending'
  ElMessage.success(`已按「${sortProp.value}」${sortOrder.value === 'ascending' ? '升序' : '降序'}排序`)
}

const scrollToBottom = () => {
  if (mainScrollRef.value) {
    mainScrollRef.value.scrollTop = mainScrollRef.value.scrollHeight
  }
}

onUnmounted(() => {
  chartMap.forEach((c) => c?.dispose())
})
</script>

<style scoped>
.data-page {
  display: flex;
  height: calc(100vh - 96px);
  background: #f8f9fa;
  overflow: hidden;
}

/* 左侧边栏 220px */
.data-sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #2563eb;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  position: relative;
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid white;
}

.data-domain-section,
.history-section {
  padding: 16px 12px;
}

.section-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.history-header {
  cursor: pointer;
}

.expand-icon {
  transition: transform 0.2s;
  font-size: 14px;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.domain-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.domain-item:hover {
  background: #f0f4ff;
}

.domain-item.active {
  background: #e8f0fe;
  font-weight: 600;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #000000;
}

.domain-icon {
  font-size: 18px;
}

.domain-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.history-list {
  padding-left: 4px;
}

.history-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.history-item:hover {
  background: #f8fafc;
}

.history-item:hover .history-hover-actions {
  opacity: 1;
}

.history-text {
  font-size: 13px;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-hover-actions {
  position: absolute;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  background: #f8fafc;
}

.history-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  color: #9ca3af;
}

.empty-text {
  font-size: 13px;
}

/* 主内容区 */
.data-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.main-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 20px;
}

/* 欢迎态 */
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.welcome-icon {
  margin-bottom: 20px;
}

.welcome-title {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.welcome-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 40px;
  text-align: center;
}

.quick-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  max-width: 720px;
}

.quick-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  border-color: #2563eb;
}

.quick-card-tag {
  margin-bottom: 10px;
}

.quick-card-question {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.5;
}

/* 对话态 */
.message-flow {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 16px;
}

.msg-wrap {
  display: flex;
  flex-direction: column;
}

.user-bubble-wrap {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  max-width: 70%;
  background: #1f2937;
  color: white;
  padding: 14px 20px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
}

.ai-msg-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-label {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.ai-tag {
  font-size: 12px;
  color: #2563eb;
  background: #e8f0fe;
  padding: 2px 8px;
  border-radius: 4px;
}

.ai-conclusion-card {
  background: white;
  padding: 18px 22px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.conclusion-text {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.8;
  margin-bottom: 10px;
}

.source-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-top: 3px solid #2563eb;
}

.kpi-name {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.kpi-value-line {
  margin-bottom: 8px;
}

.kpi-num {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.kpi-unit {
  font-size: 13px;
  color: #6b7280;
  margin-left: 4px;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}

.kpi-up {
  color: #10b981;
}

.kpi-down {
  color: #ef4444;
}

.chart-wrap {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px;
}

.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-ctrls {
  display: flex;
  gap: 8px;
}

.echart-canvas {
  width: 100%;
}

.table-wrap {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px;
}

.data-table :deep(th.el-table__cell) {
  background-color: #f8fafc;
}

.data-table .cell-num {
  font-weight: 600;
  color: #1f2937;
}

.cell-unit {
  font-size: 12px;
  color: #6b7280;
  margin-left: 4px;
}

.table-pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

/* 骨架屏 */
.thinking-skeleton {
  padding-left: 46px;
}

.skeleton-blocks {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  border-radius: 6px;
  width: 100%;
  background: #f0f0f0;
}

.skeleton-medium {
  width: 70%;
}

.skeleton-short {
  width: 45%;
}

.shimmer {
  animation: shimmer 1.5s infinite ease-in-out;
}

@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 底部输入区 */
.input-footer {
  border-top: 1px solid #e5e7eb;
  background: white;
  padding: 14px 24px 18px;
}

.quick-tags-line {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.footer-quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.footer-quick-tag:hover {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.data-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  box-shadow: none !important;
}

.data-input :deep(.el-input__wrapper.is-focus) {
  border: 2px solid #000000;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.06);
}

.send-btn {
  border-radius: 0 20px 20px 0;
  background: #1f2937;
  border-color: #1f2937;
}
</style>
