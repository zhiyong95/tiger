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
          <!-- AI机器人 + 问候语 -->
          <div class="welcome-header">
            <svg class="welcome-robot" viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">
              <g fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="10" y="14" width="28" height="24" rx="9"></rect>
                <circle cx="19" cy="26" r="2" fill="#2563eb" stroke="none"></circle>
                <circle cx="29" cy="26" r="2" fill="#2563eb" stroke="none"></circle>
                <path d="M18 32c1.5 1.5 3.6 2 6 2s4.5-.5 6-2"></path>
                <line x1="24" y1="8" x2="24" y2="14"></line>
                <circle cx="24" cy="7" r="1.6" fill="#2563eb" stroke="none"></circle>
                <line x1="32" y1="10" x2="37" y2="13"></line>
                <line x1="38" y1="14" x2="38" y2="18"></line>
              </g>
            </svg>
            <div class="welcome-tip">今天需要我帮你做点什么吗？</div>
          </div>
          <!-- 引导示例 -->
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
        <div class="message-flow" v-if="conversationMessages.length > 0">
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

      <!-- 快捷追问标签 -->
      <div class="hotwords-bar" v-if="conversationMessages.length > 0">
        <span class="hotword-label">追问：</span>
        <el-tag
          v-for="word in hotWords"
          :key="word"
          size="small"
          class="hotword-tag"
          :class="userInput === word ? 'active' : ''"
          @click="sendFollowUpQuery(word)"
        >{{ word }}</el-tag>
      </div>

      <!-- 底部输入区 -->
      <div class="input-footer">
        <div class="input-bar-wrapper">
          <!-- 左下角：附件按钮 -->
          <button class="attach-btn" title="添加附件" aria-label="添加附件">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v11.5a.5.5 0 0 1-1 0V6H11v10.5a1.5 1.5 0 0 0 3 0V5a3.5 3.5 0 1 0-7 0v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5Z" fill="currentColor"/>
            </svg>
          </button>

          <!-- 中间：输入区域 -->
          <div class="input-area">
            <!-- 语音模式 -->
            <template v-if="inputMode === 'voice'">
              <!-- 空闲态 -->
              <div v-if="!isRecording && !recordingText" class="voice-idle">
                <button class="mic-btn" @click="startRecording" aria-label="开始录音">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15C13.66 15 15 13.66 15 12V6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15Z" fill="white"/>
                    <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V21H13V18.92C16.39 18.43 19 15.53 19 12H17Z" fill="white"/>
                  </svg>
                </button>
                <span class="guide-text">点击麦克风开始说话，或切换键盘输入文字</span>
              </div>
              <!-- 录音中 -->
              <div v-else-if="isRecording" class="voice-recording">
                <button class="mic-btn recording" @click="stopRecording" aria-label="停止录音">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="7" y="7" width="10" height="10" rx="2" fill="white"/>
                  </svg>
                </button>
                <span class="voice-pulse"></span>
                <span class="recording-text">正在聆听…</span>
                <span class="recording-duration">{{ recordingDuration }}</span>
              </div>
              <!-- 识别完成 -->
              <div v-else class="voice-recognized">
                <span class="recognized-text">{{ recordingText }}</span>
                <el-button link type="primary" size="small" @click="startRecording" class="retry-btn">
                  <el-icon><Refresh /></el-icon> 重录
                </el-button>
              </div>
            </template>

            <!-- 文字模式 -->
            <template v-else>
              <el-input
                v-model="userInput"
                placeholder="今天能帮你做些什么？"
                class="text-input"
                @keyup.enter="sendQuery"
              />
            </template>
          </div>

          <!-- 右下端：麦克风 + 发送按钮 -->
          <button
            class="mic-toggle-btn"
            :class="{ active: inputMode === 'voice' }"
            @click="toggleInputMode"
            :title="inputMode === 'voice' ? '切换到文字输入' : '语音输入'"
            aria-label="语音输入"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2Z" fill="currentColor"/>
              <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" fill="currentColor"/>
            </svg>
          </button>
          <el-button
            type="primary"
            :loading="isThinking"
            @click="sendQuery"
            class="send-btn"
            :disabled="(inputMode === 'voice' && !recordingText) || (inputMode === 'text' && !userInput.trim())"
            :icon="Promotion"
            circle
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

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
  Refresh,
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
const inputMode = ref<'voice' | 'text'>('voice')
const isRecording = ref(false)
const recordingText = ref('')
const recordingDuration = ref('00:00')
let recognition: any = null
let recordingTimer: ReturnType<typeof setInterval> | null = null
let recordingSeconds = 0

const hotWords = ['按区县拆分', '同比环比分析', '查看历史趋势', '导出明细', '查看口径说明']

const chartMap = new Map<number, echarts.ECharts | null>()

const quickCards = [
  { title: '本月城镇新增就业人数是多少？', question: '本月城镇新增就业人数是多少？' },
  { title: '今年养老保险参保率同比变化如何？', question: '今年养老保险参保率同比变化如何？' },
  { title: '近半年失业保险金发放人数趋势', question: '近半年失业保险金发放人数趋势' },
  { title: '就业核心指标城镇调查失业率最新数据？', question: '就业核心指标城镇调查失业率最新数据？' },
  { title: '就业质量预警失业人员再就业和困难人员就业完成情况？', question: '就业质量预警失业人员再就业和困难人员就业完成情况？' },
]

const startNewChat = () => {
  conversationMessages.value = []
  activeHistoryIdx.value = -1
}

const deleteHistory = (idx: number) => {
  queryHistory.value.splice(idx, 1)
  if (activeHistoryIdx.value === idx) {
    activeHistoryIdx.value = -1
  } else if (activeHistoryIdx.value > idx) {
    activeHistoryIdx.value--
  }
}

const startRecording = () => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    ElMessage.warning('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
    return
  }
  isRecording.value = true
  recordingText.value = ''
  recordingSeconds = 0
  recordingDuration.value = '00:00'
  if (recordingTimer) clearInterval(recordingTimer)
  recordingTimer = setInterval(() => {
    recordingSeconds++
    const m = String(Math.floor(recordingSeconds / 60)).padStart(2, '0')
    const s = String(recordingSeconds % 60).padStart(2, '0')
    recordingDuration.value = `${m}:${s}`
  }, 1000)
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  recognition = new SpeechRecognitionAPI()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let transcript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    recordingText.value = transcript
  }
  recognition.onerror = () => {
    isRecording.value = false
    if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null }
    ElMessage.warning('语音识别失败，请重试')
  }
  recognition.onend = () => {
    if (isRecording.value) {
      if (recordingText.value) {
        userInput.value = recordingText.value
        recordingText.value = ''
      }
      isRecording.value = false
      if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null }
    }
  }
  recognition.start()
}

const stopRecording = () => {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isRecording.value = false
  if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null }
  if (recordingText.value) {
    userInput.value = recordingText.value
    recordingText.value = ''
  }
}

const toggleInputMode = () => {
  if (isRecording.value) {
    stopRecording()
  }
  if (inputMode.value === 'voice') {
    inputMode.value = 'text'
    recordingText.value = ''
  } else {
    inputMode.value = 'voice'
  }
}

const sendQuery = async () => {
  console.log('sendQuery called, input:', userInput.value)
  const q = userInput.value.trim()
  console.log('sendQuery trimmed:', q)
  if (!q) {
    ElMessage.warning('请输入查询问题')
    return
  }
  if (isThinking.value) {
    console.log('sendQuery: isThinking is true, returning')
    return
  }

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

  // 生成AI回复 - 根据查询内容智能匹配
  const qLower = q.toLowerCase()
  const isFollowUp = conversationMessages.value.length > 1

  let newMsg: MsgType

  if (q.includes('按区县拆分') || q.includes('区县')) {
    newMsg = {
      role: 'ai' as const,
      content: '',
      conclusion: `已按区县维度对数据进行拆分，以下是各区县2026年8月核心指标分布情况：`,
      updateTime: new Date().toLocaleString(),
      kpiCards: [
        { name: 'A区参保', value: 589234, unit: '人', trend: 5.2, color: '#2563eb' },
        { name: 'B区参保', value: 452187, unit: '人', trend: 3.8, color: '#10b981' },
        { name: 'C区参保', value: 376542, unit: '人', trend: 7.1, color: '#f59e0b' },
        { name: 'D区参保', value: 289651, unit: '人', trend: 2.4, color: '#8b5cf6' },
      ],
      chartData: {
        labels: ['A区', 'B区', 'C区', 'D区', 'E区', 'F区'],
        values: [589234, 452187, 376542, 289651, 234567, 187654],
      },
      chartType: 'bar' as const,
      tableData: [
        { name: 'A区', value: 589234, unit: '人', period: '2026-08', source: '社保库' },
        { name: 'B区', value: 452187, unit: '人', period: '2026-08', source: '社保库' },
        { name: 'C区', value: 376542, unit: '人', period: '2026-08', source: '社保库' },
        { name: 'D区', value: 289651, unit: '人', period: '2026-08', source: '社保库' },
        { name: 'E区', value: 234567, unit: '人', period: '2026-08', source: '社保库' },
        { name: 'F区', value: 187654, unit: '人', period: '2026-08', source: '社保库' },
      ],
    }
  } else if (q.includes('同比环比') || q.includes('同比') || q.includes('环比')) {
    newMsg = {
      role: 'ai' as const,
      content: '',
      conclusion: `已将当前数据与去年同期（同比）和上期（环比）进行对比分析，各指标变化趋势如下：`,
      updateTime: new Date().toLocaleString(),
      kpiCards: [
        { name: '新增就业(同比)', value: 42689, unit: '人', trend: 4.2, color: '#2563eb' },
        { name: '新增就业(环比)', value: 42689, unit: '人', trend: -2.1, color: '#10b981' },
        { name: '失业率(同比)', value: 4.8, unit: '%', trend: -0.3, color: '#f59e0b' },
        { name: '失业率(环比)', value: 4.8, unit: '%', trend: 0.1, color: '#ef4444' },
      ],
      chartData: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
        values: [41000, 39500, 42300, 40800, 43600, 45100, 43900, 42689],
      },
      chartType: 'line' as const,
      tableData: [
        { name: '本期(2026年8月)', value: 42689, unit: '人', period: '2026-08', source: '就业库' },
        { name: '上期(2026年7月)', value: 43900, unit: '人', period: '2026-07', source: '就业库' },
        { name: '去年同期(2025年8月)', value: 40980, unit: '人', period: '2025-08', source: '就业库' },
        { name: '环比变化', value: -1211, unit: '人', period: '-2.76%', source: '计算' },
        { name: '同比变化', value: 1709, unit: '人', period: '+4.17%', source: '计算' },
      ],
    }
  } else if (q.includes('历史趋势') || q.includes('趋势')) {
    newMsg = {
      role: 'ai' as const,
      content: '',
      conclusion: `以下为您展示近12个月的历史趋势数据，整体呈稳步上升态势，建议重点关注Q3季度变化。`,
      updateTime: new Date().toLocaleString(),
      kpiCards: [
        { name: '12月均值', value: 40782, unit: '人', trend: 3.5, color: '#2563eb' },
        { name: '最高值', value: 45100, unit: '人', trend: 0, color: '#10b981' },
        { name: '最低值', value: 36800, unit: '人', trend: 0, color: '#f59e0b' },
        { name: '年度累计', value: 489384, unit: '人', trend: 5.8, color: '#8b5cf6' },
      ],
      chartData: {
        labels: ['2025年9月', '10月', '11月', '12月', '2026年1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
        values: [36800, 38200, 37500, 39100, 38000, 39500, 41000, 42300, 43200, 45100, 43900, 42689],
      },
      chartType: 'line' as const,
      tableData: [
        { name: '2025年9月', value: 36800, unit: '人', period: '2025-09', source: '就业库' },
        { name: '2025年10月', value: 38200, unit: '人', period: '2025-10', source: '就业库' },
        { name: '2025年11月', value: 37500, unit: '人', period: '2025-11', source: '就业库' },
        { name: '2025年12月', value: 39100, unit: '人', period: '2025-12', source: '就业库' },
        { name: '2026年1月', value: 38000, unit: '人', period: '2026-01', source: '就业库' },
        { name: '2026年2月', value: 39500, unit: '人', period: '2026-02', source: '就业库' },
        { name: '2026年3月', value: 41000, unit: '人', period: '2026-03', source: '就业库' },
        { name: '2026年4月', value: 42300, unit: '人', period: '2026-04', source: '就业库' },
        { name: '2026年5月', value: 43200, unit: '人', period: '2026-05', source: '就业库' },
        { name: '2026年6月', value: 45100, unit: '人', period: '2026-06', source: '就业库' },
        { name: '2026年7月', value: 43900, unit: '人', period: '2026-07', source: '就业库' },
        { name: '2026年8月', value: 42689, unit: '人', period: '2026-08', source: '就业库' },
      ],
    }
  } else if (q.includes('导出明细') || q.includes('导出')) {
    newMsg = {
      role: 'ai' as const,
      content: `已为您整理当前数据明细，您可以通过以下方式导出：

**1. 下载Excel文件**：包含完整数据明细及统计口径说明
**2. 下载PDF报告**：包含数据表格、图表及分析结论

系统将在数据处理完成后自动生成下载链接。`,
      conclusion: `已为您导出当前查询结果，数据共覆盖6个维度、12条明细记录，文件正在生成中，预计1-2分钟完成。`,
      updateTime: new Date().toLocaleString(),
      kpiCards: [
        { name: '数据维度', value: 6, unit: '个', trend: 0, color: '#2563eb' },
        { name: '明细记录', value: 12, unit: '条', trend: 0, color: '#10b981' },
        { name: '文件大小', value: 2.4, unit: 'MB', trend: 0, color: '#f59e0b' },
        { name: '预计完成', value: 2, unit: '分钟', trend: 0, color: '#8b5cf6' },
      ],
      chartData: {
        labels: ['数据明细', '分析结论', '图表展示', '口径说明', '政策依据', '附注说明'],
        values: [100, 85, 90, 78, 92, 65],
      },
      chartType: 'bar' as const,
      tableData: [
        { name: '数据明细', value: 100, unit: '%', period: '完整', source: '自动生成' },
        { name: '分析结论', value: 85, unit: '%', period: '完整', source: '自动生成' },
        { name: '图表展示', value: 90, unit: '%', period: '完整', source: '自动生成' },
        { name: '口径说明', value: 78, unit: '%', period: '完整', source: '自动生成' },
        { name: '政策依据', value: 92, unit: '%', period: '完整', source: '自动生成' },
        { name: '附注说明', value: 65, unit: '%', period: '完整', source: '自动生成' },
      ],
    }
  } else if (q.includes('口径说明') || q.includes('口径')) {
    newMsg = {
      role: 'ai' as const,
      content: `**数据口径说明（当前数据集）**

**1. 参保人数口径**
- 统计范围：本市行政区域内城镇职工基本养老保险参保人员
- 统计时点：每月最后一日24时
- 数据来源：社保核心业务系统
- 数据更新频率：T+1日更新

**2. 新增就业口径**
- 统计范围：本市城镇新增就业人员（含各类单位就业、灵活就业、自主创业）
- 统计时点：每月累计至当月
- 数据来源：就业信息管理系统
- 数据更新频率：T+3日更新

**3. 登记失业率口径**
- 统计范围：本市城镇登记失业人员/城镇从业人员
- 统计时点：月末时点数
- 数据来源：失业登记管理系统
- 数据更新频率：月度更新

**4. 技能培训口径**
- 统计范围：本市参加职业技能培训并取得证书人员
- 统计时点：累计至当月
- 数据来源：职业技能培训监管平台
- 数据更新频率：T+5日更新

> 如需了解更详细的指标口径定义，请前往后台管理端「指标口径管理」模块查看完整文档。`,
      conclusion: `以上为当前查询数据涉及的核心指标口径说明，数据统计口径均符合国家人社统计报表制度要求。`,
      updateTime: new Date().toLocaleString(),
      kpiCards: [
        { name: '核心指标', value: 4, unit: '个', trend: 0, color: '#2563eb' },
        { name: '数据来源', value: 4, unit: '个', trend: 0, color: '#10b981' },
        { name: '更新频率', value: 1, unit: 'T+1日', trend: 0, color: '#f59e0b' },
        { name: '覆盖范围', value: 100, unit: '%', trend: 0, color: '#8b5cf6' },
      ],
      chartData: {
        labels: ['社保库', '就业库', '失业库', '培训库'],
        values: [2876542, 42689, 18754, 156890],
      },
      chartType: 'bar' as const,
      tableData: [
        { name: '社保核心系统', value: 2876542, unit: '条', period: '实时', source: '数据中台' },
        { name: '就业管理系统', value: 42689, unit: '条', period: 'T+1', source: '数据中台' },
        { name: '失业登记系统', value: 18754, unit: '条', period: 'T+1', source: '数据中台' },
        { name: '培训监管平台', value: 156890, unit: '条', period: 'T+3', source: '数据中台' },
      ],
    }
  } else {
    newMsg = {
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

const sendQuickQuestion = (question: string) => {
  userInput.value = question
  sendQuery()
}

const sendFollowUpQuery = (word: string) => {
  userInput.value = word
  sendQuery()
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
  if (!msg || !msg.chartData) return
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
  chartMap.forEach((c) => { if (c) c.dispose() })
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
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 40px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 0;
}

/* ====== AI机器人 + 问候语 ====== */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.welcome-robot {
  flex-shrink: 0;
}

.welcome-tip {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
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
  padding: 12px 40px 20px;
}

.input-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: 720px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 6px 8px;
  min-height: 56px;
  transition: border-color 0.2s;
}

.input-bar-wrapper:focus-within {
  border-color: #2f6bff;
}

/* 左下角附件按钮 */
.attach-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  flex-shrink: 0;
  transition: all 0.2s;
  margin-left: 2px;
}

.attach-btn:hover {
  color: #2f6bff;
  background: #f5f7ff;
}

/* 右下角麦克风切换按钮 */
.mic-toggle-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #999;
  flex-shrink: 0;
  transition: all 0.2s;
}

.mic-toggle-btn:hover {
  color: #2f6bff;
  background: #f5f7ff;
}

.mic-toggle-btn.active {
  color: #2f6bff;
  background: #eef4ff;
}

/* 中间输入区域 */
.input-area {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 44px;
  margin: 0 6px;
  position: relative;
}

/* 语音-空闲态 */
.voice-idle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
}

.guide-text {
  font-size: 14px;
  color: #999;
  white-space: nowrap;
}

/* 麦克风按钮 */
.mic-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2f6bff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(47,107,255,0.3);
}

.mic-btn:hover {
  background: #1d4ed8;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(47,107,255,0.4);
}

.mic-btn.recording {
  background: #ff4d4f;
  box-shadow: 0 0 0 0 rgba(255,77,79,0.4);
  animation: micPulse 1.5s infinite;
}

@keyframes micPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,77,79,0.4); }
  70% { box-shadow: 0 0 0 12px rgba(255,77,79,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,77,79,0); }
}

/* 语音-录音中 */
.voice-recording {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.voice-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  animation: voicePulse 1s ease-in-out infinite;
}

@keyframes voicePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.recording-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.recording-duration {
  font-size: 13px;
  color: #999;
  font-variant-numeric: tabular-nums;
}

/* 语音-识别完成 */
.voice-recognized {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 0 4px;
}

.recognized-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.retry-btn {
  flex-shrink: 0;
  font-size: 12px;
}

/* 文字输入模式 */
.text-input {
  width: 100%;
}

.text-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none !important;
  padding: 0 4px;
}

.text-input :deep(.el-input__inner) {
  border: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  height: 36px;
}

.text-input :deep(.el-input__inner::placeholder) {
  color: #999;
  font-size: 14px;
}

/* 发送按钮 */
.send-btn {
  width: 36px;
  height: 36px;
  background: #2f6bff;
  border-color: #2f6bff;
  flex-shrink: 0;
  margin-right: 4px;
}

.send-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.send-btn:disabled {
  background: #d1d5db;
  border-color: #d1d5db;
}
</style>