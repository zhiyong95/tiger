<template>
  <div class="data-page">
    <!-- 左侧侧边栏 -->
    <div class="data-sidebar">
      <div class="sidebar-header">
        <el-icon class="header-icon"><DataAnalysis /></el-icon>
        <span class="header-title">智能问数</span>
      </div>

      <!-- 新建对话按钮 -->
      <div class="new-chat-btn-wrap">
        <el-button type="primary" class="new-chat-btn" :icon="Plus" @click="startNewChat">
          新建对话
        </el-button>
      </div>

      <!-- 历史对话列表 -->
      <div class="history-section">
        <div class="section-label">历史对话</div>
        <div class="history-list">
          <div v-if="queryHistory.length === 0" class="history-empty">
            <el-icon :size="16" color="#d1d5db"><ChatDotRound /></el-icon>
            <span class="empty-text">暂无对话记录</span>
          </div>
          <div
            v-for="(item, idx) in queryHistory"
            :key="idx"
            class="history-item"
            :class="{ active: activeHistoryIdx === idx }"
            @click="switchHistory(idx)"
          >
            <div class="history-text">
              <el-icon class="history-msg-icon"><ChatDotRound /></el-icon>
              <span>{{ item.question.length > 16 ? item.question.slice(0, 16) + '...' : item.question }}</span>
            </div>
            <el-button
              link
              type="danger"
              size="small"
              class="history-del-btn"
              :icon="Delete"
              @click.stop="deleteHistory(idx)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="data-main">
      <div class="main-scroll" ref="mainScrollRef">
        <!-- 欢迎态 -->
        <div v-if="conversationMessages.length === 0 && !isThinking" class="welcome-state">
          <!-- AI 机器人图标 -->
          <div class="welcome-robot">
            <svg class="robot-svg" viewBox="0 0 120 120" width="96" height="96">
              <!-- 机器人身体 -->
              <rect x="28" y="40" width="64" height="48" rx="10" fill="#e8f0fe" stroke="#2563eb" stroke-width="2"/>
              <!-- 显示屏 -->
              <rect x="38" y="50" width="44" height="22" rx="6" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
              <!-- 眼睛 -->
              <circle cx="52" cy="61" r="4" fill="#2563eb"/>
              <circle cx="68" cy="61" r="4" fill="#2563eb"/>
              <!-- 嘴巴 (微笑) -->
              <path d="M50 72 Q60 80 70 72" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
              <!-- 天线 -->
              <line x1="60" y1="30" x2="60" y2="18" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
              <circle cx="60" cy="14" r="5" fill="#2563eb"/>
              <!-- 耳朵 -->
              <rect x="20" y="52" width="8" height="16" rx="4" fill="#2563eb" opacity="0.3"/>
              <rect x="92" y="52" width="8" height="16" rx="4" fill="#2563eb" opacity="0.3"/>
              <!-- 对话气泡 -->
              <path d="M88 38 Q100 30 96 42 Q104 38 100 48" fill="white" stroke="#2563eb" stroke-width="1.5"/>
              <text x="98" y="42" font-size="12" fill="#2563eb" text-anchor="middle" font-weight="bold">AI</text>
            </svg>
          </div>
          <h1 class="welcome-title">你好，我是<span class="welcome-name">途途</span></h1>
          <p class="welcome-subtitle">今天需要我帮你做点什么吗？</p>
          <p class="welcome-desc">
            欢迎进入政务智能问数系统。我可以协助您完成统计数据查询、可视化分析、政策文件解读及数据报告生成等工作。<br />
            系统已启用政务安全模式，您的查询内容及相关数据均受严格保护，不会用于任何模型训练。
          </p>
          <p class="welcome-ask">请问您需要查询哪方面的数据？</p>

          <!-- 引导示例 - 改为参考图片的蓝色链接样式 -->
          <div class="guide-section">
            <div class="guide-label">你可以问我：</div>
            <div class="guide-list">
              <div
                v-for="(card, ci) in quickCards"
                :key="ci"
                class="guide-item"
                @click="sendQuickQuestion(card.question)"
              >
                <el-icon class="guide-icon"><ChatDotRound /></el-icon>
                <span class="guide-text">{{ card.question }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话态消息流 -->
        <div v-else class="message-flow">
          <div v-for="(msg, idx) in conversationMessages" :key="idx" class="msg-wrap">
            <!-- 用户气泡 -->
            <div v-if="msg.role === 'user'" class="user-bubble-wrap">
              <div class="user-bubble">{{ msg.content }}</div>
            </div>

            <!-- AI回复 -->
            <div v-else class="ai-msg-wrap">
              <div class="ai-header-row">
                <el-avatar :size="36" style="background: #2563eb; font-size: 16px; font-weight: 600">途</el-avatar>
                <div class="ai-label">途途</div>
                <span class="ai-tag">智能问数</span>
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
                      <el-radio-button value="bar">柱状图</el-radio-button>
                      <el-radio-button value="line">折线图</el-radio-button>
                      <el-radio-button value="pie">饼图</el-radio-button>
                    </el-radio-group>
                  </div>
                  <el-button link type="primary" size="small" :icon="Download">导出图表</el-button>
                </div>
                <div :ref="el => setChartRef(idx, el)" class="echart-canvas" style="height: 280px;"></div>
              </div>

              <!-- 数据表格 -->
              <div class="table-wrap" v-if="msg.tableData && msg.tableData.length > 0">
                <el-table :data="msg.tableData" stripe class="data-table" style="width: 100%">
                  <el-table-column prop="name" label="指标名称" align="left" />
                  <el-table-column prop="value" label="数值" align="right">
                    <template #default="{ row }">
                      <span class="cell-num">{{ row.value.toLocaleString() }}</span>
                      <span class="cell-unit">{{ row.unit }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="period" label="统计周期" align="center" />
                  <el-table-column prop="source" label="数据来源" align="center" />
                </el-table>
              </div>
            </div>
          </div>

          <!-- AI思考骨架屏 -->
          <div v-if="isThinking" class="thinking-skeleton">
            <div class="ai-header-row">
              <el-avatar :size="36" style="background: #94a3b8; font-size: 16px; font-weight: 600">途</el-avatar>
              <div class="ai-label">途途</div>
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
        <div class="input-hint">直接告诉AI你的问题</div>
        <div class="input-bar">
          <div class="input-left">
            <el-icon class="input-q-icon" :size="18"><ChatDotRound /></el-icon>
            <el-input
              v-model="userInput"
              placeholder="请输入您想查询的人社业务数据问题……"
              class="data-input"
              @keyup.enter="sendQuery"
            />
          </div>
          <div class="input-right">
            <el-button
              type="primary"
              :loading="isThinking"
              @click="sendQuery"
              class="send-btn"
            >
              <el-icon><Promotion /></el-icon>
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  Plus,
  Delete,
  ChatDotRound,
  DataAnalysis,
  Document,
  Download,
  Promotion,
  ArrowUp,
  ArrowDown,
  Loading,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

type MsgType = {
  role: 'user' | 'ai'
  content: string
  conclusion?: string
  updateTime?: string
  kpiCards?: Array<{ name: string; value: number; unit: string; trend: number; color: string }>
  chartData?: { labels: string[]; values: number[] }
  chartType?: 'bar' | 'line' | 'pie'
  tableData?: Array<{ name: string; value: number; unit: string; period: string; source: string }>
}

const activeHistoryIdx = ref(-1)
const queryHistory = ref<Array<{ question: string; messages: MsgType[] }>>([
  { question: '本月城镇新增就业人数是多少', messages: [] },
  { question: '各区县养老保险参保分布', messages: [] },
  { question: '人才引进入户环比趋势', messages: [] },
  { question: '失业保险金申领条件统计', messages: [] },
])

const conversationMessages = ref<MsgType[]>([])

const isThinking = ref(false)
const userInput = ref('')
const mainScrollRef = ref<HTMLElement>()
const chartMap = new Map<number, echarts.ECharts | null>()

const quickCards = [
  { title: '本月城镇新增就业人数是多少？', question: '本月城镇新增就业人数是多少？' },
  { title: '就业核心指标城镇调查失业率最新数据？', question: '就业核心指标城镇调查失业率最新数据？' },
  { title: '就业质量预警失业人员再就业和困难人员就业完成情况？', question: '就业质量预警失业人员再就业和困难人员就业完成情况？' },
  { title: '重点群体帮扶高校毕业生就业去向落实率？', question: '重点群体帮扶高校毕业生就业去向落实率？' },
  { title: '年度攻坚指标农村劳动力转移就业规模及变化？', question: '年度攻坚指标农村劳动力转移就业规模及变化？' },
  { title: '乡村振兴关联就业补助资金支出进度？', question: '乡村振兴关联就业补助资金支出进度？' },
]

const startNewChat = () => {
  conversationMessages.value = []
  activeHistoryIdx.value = -1
}

const switchHistory = (idx: number) => {
  activeHistoryIdx.value = idx
  const item = queryHistory.value[idx]
  if (item.messages && item.messages.length > 0) {
    conversationMessages.value = JSON.parse(JSON.stringify(item.messages))
  } else {
    userInput.value = item.question
    sendQuery()
  }
}

const deleteHistory = (idx: number) => {
  queryHistory.value.splice(idx, 1)
  if (activeHistoryIdx.value === idx) {
    activeHistoryIdx.value = -1
  } else if (activeHistoryIdx.value > idx) {
    activeHistoryIdx.value--
  }
}

const sendQuickQuestion = (question: string) => {
  userInput.value = question
  sendQuery()
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

  // 加入历史
  const existingIdx = queryHistory.value.findIndex(h => h.question === q)
  if (existingIdx >= 0) {
    queryHistory.value.splice(existingIdx, 1)
  }
  queryHistory.value.unshift({ question: q, messages: [] })
  if (queryHistory.value.length > 20) queryHistory.value = queryHistory.value.slice(0, 20)
  activeHistoryIdx.value = 0

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
  }

  conversationMessages.value.push(newMsg)
  isThinking.value = false

  await nextTick()
  scrollToBottom()
  const newMsgIdx = conversationMessages.value.length - 1
  setTimeout(() => renderChartForMsg(newMsgIdx), 120)
  // 保存完整对话到历史记录
  if (activeHistoryIdx.value >= 0 && queryHistory.value[activeHistoryIdx.value]) {
    queryHistory.value[activeHistoryIdx.value].messages = JSON.parse(JSON.stringify(conversationMessages.value))
  } else if (queryHistory.value.length > 0) {
    queryHistory.value[0].messages = JSON.parse(JSON.stringify(conversationMessages.value))
  }
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
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280' } },
      series: [{
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
      }],
    }
  } else if (chartType === 'line') {
    option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280' } },
      series: [{
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
      }],
    }
  } else {
    option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '2%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '45%'],
        data: labels.map((l, i) => ({ value: values[i], name: l })),
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
      }],
    }
  }
  chart.setOption(option, true)
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

/* ====== 左侧侧边栏 ====== */
.data-sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-header {
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
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

.new-chat-btn-wrap {
  padding: 16px 16px 12px;
}

.new-chat-btn {
  width: 100%;
  border-radius: 8px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
}

.history-section {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
}

.section-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  padding: 0 4px;
  margin-bottom: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  color: #9ca3af;
  font-size: 13px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 4px;
}

.history-item:hover {
  background: #f0f4ff;
}

.history-item.active {
  background: #e8f0fe;
}

.history-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-msg-icon {
  font-size: 14px;
  color: #9ca3af;
  flex-shrink: 0;
}

.history-del-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .history-del-btn {
  opacity: 1;
}

/* ====== 主内容区 ====== */
.data-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.main-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 40px 40px 20px;
}

/* ====== 欢迎态 ====== */
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  max-width: 800px;
  margin: 0 auto;
}

.welcome-robot {
  margin-bottom: 24px;
  animation: robotFloat 3s ease-in-out infinite;
}

@keyframes robotFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.robot-svg {
  display: block;
  filter: drop-shadow(0 4px 12px rgba(37,99,235,0.15));
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.welcome-name {
  color: #2563eb;
}

.welcome-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.welcome-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.8;
  text-align: center;
  margin-bottom: 4px;
  max-width: 640px;
}

.welcome-ask {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 36px;
}

/* ====== 引导示例区 ====== */
.guide-section {
  width: 100%;
  max-width: 640px;
}

.guide-label {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 14px;
  font-weight: 500;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8faff;
  border: 1px solid transparent;
}

.guide-item:hover {
  background: #eef4ff;
  border-color: #2563eb;
  transform: translateX(4px);
}

.guide-icon {
  color: #2563eb;
  font-size: 16px;
  flex-shrink: 0;
}

.guide-text {
  font-size: 14px;
  color: #2563eb;
  line-height: 1.5;
}

/* ====== 对话态 ====== */
.message-flow {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 16px;
  width: 100%;
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
  padding: 12px 18px;
  border-radius: 16px 16px 4px 16px;
  font-size: 14px;
  line-height: 1.7;
}

.ai-msg-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  font-size: 11px;
  color: #2563eb;
  background: #e8f0fe;
  padding: 2px 8px;
  border-radius: 4px;
}

.ai-conclusion-card {
  background: white;
  padding: 16px 20px;
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
  gap: 12px;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-top: 3px solid #2563eb;
}

.kpi-name {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

.kpi-value-line {
  margin-bottom: 6px;
}

.kpi-num {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.kpi-unit {
  font-size: 12px;
  color: #6b7280;
  margin-left: 4px;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.kpi-up { color: #10b981; }
.kpi-down { color: #ef4444; }

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

/* 骨架屏 */
.thinking-skeleton {
  padding-left: 0;
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

.skeleton-medium { width: 70%; }
.skeleton-short { width: 45%; }

.shimmer {
  animation: shimmer 1.5s infinite ease-in-out;
}

@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* ====== 底部输入区 ====== */
.input-footer {
  border-top: 1px solid #e5e7eb;
  background: white;
  padding: 8px 40px 20px;
}

.input-hint {
  max-width: 900px;
  margin: 0 auto 8px;
  font-size: 13px;
  color: #9ca3af;
  padding-left: 4px;
}

.input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.input-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  border: 1px solid #e5e7eb;
  transition: border-color 0.2s;
}

.input-left:focus-within {
  border-color: #2563eb;
}

.input-q-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.data-input {
  flex: 1;
}

.data-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none !important;
  padding: 0 8px;
}

.data-input :deep(.el-input__inner) {
  border: none;
  background: transparent;
  font-size: 14px;
}

.send-btn {
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 14px;
  background: #2563eb;
  border-color: #2563eb;
}

.send-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}
</style>