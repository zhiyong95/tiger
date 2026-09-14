<template>
  <div class="research-page">
    <!-- 左侧操作面板 -->
    <div class="left-panel">
      <!-- 统计卡片 2x2 -->
      <div class="stats-grid">
        <div class="stat-card" v-for="s in statsCards" :key="s.label">
          <div class="stat-icon" :style="{ background: s.bg }">
            <el-icon :size="18"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- 查看历史报告 -->
      <el-button class="history-btn" :loading="historyLoading" @click="openHistoryDrawer">
        <el-icon><Clock /></el-icon> 查看历史报告
      </el-button>

      <!-- 选择调研主题 -->
      <div class="section-block">
        <div class="section-title"><el-icon><MagicStick /></el-icon> 选择调研主题</div>
        <div class="topic-list">
          <div
            class="topic-card"
            v-for="(t, i) in topics"
            :key="i"
            :class="{ active: selectedTopic === i }"
            @click="selectedTopic = i"
          >
            <div class="topic-icon" :style="{ background: t.bg }">
              <el-icon :size="18"><component :is="t.icon" /></el-icon>
            </div>
            <div class="topic-info">
              <div class="topic-name">
                {{ t.name }}
                <el-tag v-if="t.tag" size="small" :type="t.tagType as any" effect="plain">{{ t.tag }}</el-tag>
              </div>
              <div class="topic-desc">{{ t.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 配置参数 -->
      <div class="section-block">
        <div class="section-title"><el-icon><Setting /></el-icon> 配置参数</div>

        <!-- 调研周期 -->
        <div class="config-item">
          <div class="config-label"><el-icon><Calendar /></el-icon> 调研周期</div>
          <div class="date-range">
            <el-date-picker v-model="dateRange[0]" type="date" placeholder="开始日期" value-format="YYYY/MM/DD" size="small" style="width:100%" />
            <span class="date-sep">至</span>
            <el-date-picker v-model="dateRange[1]" type="date" placeholder="结束日期" value-format="YYYY/MM/DD" size="small" style="width:100%" @change="onDateManualChange" />
          </div>
          <div class="quick-btns">
            <el-button
              v-for="qb in quickBtns"
              :key="qb.key"
              size="small"
              :type="quickBtn === qb.key ? 'primary' : 'default'"
              @click="setQuickDate(qb.key)"
            >{{ qb.label }}</el-button>
          </div>
        </div>

        <!-- 数据来源 -->
        <div class="config-item">
          <div class="config-label"><el-icon><Folder /></el-icon> 数据来源</div>
          <el-radio-group v-model="dataSource" size="small">
            <el-radio-button value="system">系统业务数据</el-radio-button>
            <el-radio-button value="upload">上传台账数据</el-radio-button>
          </el-radio-group>
          <div v-if="dataSource === 'upload'" class="upload-area">
            <el-upload :auto-upload="false" :limit="1" accept=".xlsx,.xls,.csv" :show-file-list="false" @change="onFileUpload">
              <el-button size="small" :icon="Upload">
                {{ uploadFileName || '选择文件' }}
              </el-button>
            </el-upload>
            <span v-if="uploadFileName" class="file-name">{{ uploadFileName }}</span>
          </div>
        </div>

        <!-- 输出格式 -->
        <div class="config-item">
          <div class="config-label"><el-icon><Document /></el-icon> 输出格式</div>
          <el-checkbox-group v-model="outputFormats">
            <el-checkbox value="word">Word 文档</el-checkbox>
            <el-checkbox value="pdf">PDF 文档</el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 附加内容 -->
        <div class="config-item">
          <div class="config-label"><el-icon><Star /></el-icon> 附加内容</div>
          <el-checkbox-group v-model="additionalContent">
            <el-checkbox value="chart">可视化图表</el-checkbox>
            <el-checkbox value="table">明细数据表</el-checkbox>
            <el-checkbox value="suggestion">AI 工作建议</el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 生成按钮 -->
        <el-button type="primary" class="generate-btn" :loading="generating" @click="onGenerate">
          <el-icon><MagicStick /></el-icon> 生成调研分析报告
        </el-button>
      </div>
    </div>

    <!-- 右侧 AI 对话区 -->
    <div class="right-panel">
      <div class="chat-area" ref="chatAreaRef">

        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <img src="/assistant-tutu.png" alt="途途" class="tutu-logo" />
          <p class="empty-desc">请在左侧选择调研主题并配置参数，点击「生成调研分析报告」即可生成报告，生成后可继续输入调整要求进行优化。</p>
          <div class="feature-cards">
            <div class="feature-card"><el-icon color="#2563eb"><Document /></el-icon><span>结构化报告</span><span class="fc-sub">背景分析到建议完整呈现</span></div>
            <div class="feature-card"><el-icon color="#2563eb"><DataAnalysis /></el-icon><span>AI 智能分析</span><span class="fc-sub">数据洞察与工作建议</span></div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-for="(msg, idx) in messages" :key="idx" class="message-item" :class="msg.role">
          <div v-if="msg.role === 'user'" class="user-bubble">
              <div v-if="msg.content">{{ msg.content }}</div>
              <div v-if="msg.files && msg.files.length" class="bubble-files">
                <div v-for="(f, fi) in msg.files" :key="fi" class="bubble-file">
                  <img v-if="f.url" :src="f.url" class="bf-thumb" alt="" @click.stop />
                  <el-icon v-else><Document /></el-icon>
                  <span class="bf-name">{{ f.name }}</span>
                </div>
              </div>
            </div>
          <div v-else class="ai-bubble">
            <div class="ai-time">{{ msg.time }}</div>
            <div v-if="msg.typing" class="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <div v-else-if="msg.report" class="report-card">
              <!-- 核心指标 -->
              <div class="metrics-grid">
                <div class="metric-card" v-for="m in msg.report.metrics" :key="m.label">
                  <div class="metric-bar" :style="{ background: m.color }"></div>
                  <div class="metric-label">{{ m.label }}</div>
                  <div class="metric-value" :style="{ color: m.color }">{{ m.value }}</div>
                  <div class="metric-change">
                    <span :class="m.change >= 0 ? 'up' : 'down'">{{ m.change >= 0 ? '↑' : '↓' }}{{ Math.abs(m.change) }}%</span>
                    <span class="change-label">较上期</span>
                  </div>
                  <el-progress :percentage="Math.min(100, Math.abs(m.change) * 10 + 50)" :color="m.color" :stroke-width="4" :show-text="false" />
                </div>
              </div>
              <!-- 报告正文 -->
              <div class="report-body">
                <div class="report-section" v-for="(sec, si) in msg.report.sections" :key="si">
                  <h4 class="sec-title">{{ sec.title }}</h4>
                  <div class="sec-content" v-html="sec.content"></div>
                </div>
              </div>
              <div class="report-disclaimer">AI 生成内容仅供参考，请结合实际情况审核使用</div>
            </div>
            <div v-else class="ai-text">{{ msg.content }}</div>
          </div>
        </div>
      </div>

      <!-- 底部输入框 -->
      <div class="chat-input-area">
        <el-input
          v-model="chatInput"
          type="textarea"
          :rows="2"
          placeholder="输入对报告的调整要求，如'补充就业困难人员帮扶建议'..."
          resize="none"
          @keyup.enter.ctrl="onSendChat"
        />
        <div class="input-actions">
          <el-button text :icon="Paperclip" size="small" @click="pickChatFile">附件</el-button>
          <el-button type="primary" :icon="Promotion" size="small" @click="onSendChat" :disabled="!chatInput.trim() && chatFiles.length === 0">发送</el-button>
        </div>
        <input ref="chatFileInput" type="file" multiple style="display:none" @change="onChatFileChange" accept=".doc,.docx,.pdf,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" />
        <div v-if="chatFiles.length > 0" class="chat-files">
          <div v-for="f in chatFiles" :key="f.id" class="chat-file-item">
            <img v-if="f.url" :src="f.url" class="cf-thumb" alt="" />
            <el-icon v-else><Document /></el-icon>
            <div class="cf-info">
              <div class="cf-name">{{ f.name }}</div>
              <div class="cf-size">{{ f.size }}</div>
            </div>
            <el-icon class="cf-del" @click="removeChatFile(f.id)"><Close /></el-icon>
          </div>
        </div>
        <div class="input-hint">AI 生成内容仅供参考，请结合实际情况审核使用</div>
      </div>
    </div>

    <!-- 历史报告抽屉 -->
    <el-drawer v-model="showHistoryDrawer" title="历史报告" size="400px">
      <div class="history-list">
        <div
          v-for="h in historyList"
          :key="h.id"
          class="history-item"
          @click="loadHistory(h)"
        >
          <div class="hi-title">{{ h.title }}</div>
          <div class="hi-meta">
            <span>{{ h.genTime }}</span>
            <el-tag :type="h.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ h.status === 'completed' ? '已完成' : '生成中' }}
            </el-tag>
          </div>
        </div>
        <el-empty v-if="historyList.length === 0" description="暂无历史报告" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {
  Document, Clock, MagicStick, Calendar, Folder, Star, Setting,
  Upload, Download, ArrowDown, DataAnalysis, Paperclip, Promotion, Close,
  School, User, Briefcase, Collection
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { isWorkflowConfigured, queryReportHistoryList, queryReportHistoryDetail } from '@/api/cozeWorkflow'

// ====== 类型定义 ======
interface Topic {
  name: string
  desc: string
  icon: any
  bg: string
  tag?: string
  tagType?: string
}

interface ReportData {
  title: string
  status: 'completed' | 'generating' | 'failed'
  period: string
  genTime: string
  metrics: { label: string; value: string; color: string; change: number }[]
  sections: { title: string; content: string }[]
}

interface MsgFile {
  id: number
  name: string
  size: string
  type: string
  url?: string
}

interface Msg {
  role: 'user' | 'ai'
  content: string
  time?: string
  typing?: boolean
  report?: ReportData
  files?: MsgFile[]
}

interface HistoryItem {
  id: number
  title: string
  genTime: string
  status: 'completed' | 'generating'
  messages: Msg[]
}

// ====== 统计卡片 ======
const statsCards = [
  { label: '调研报告总数', value: '4份', icon: Document, bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  { label: '覆盖调研主题', value: '4类', icon: Collection, bg: 'linear-gradient(135deg, #10b981, #059669)' },
  { label: '近30天新增', value: '2份', icon: Clock, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { label: 'AI 工作建议', value: '11条', icon: MagicStick, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
]

// ====== 主题 ======
const topics: Topic[] = [
  { name: '高校毕业生就业调研', desc: '分析高校毕业生就业形势与意向', icon: School, bg: '#dbeafe', tag: '热门', tagType: 'danger' },
  { name: '农民工就业工作调研', desc: '农民工就业流动与收入状况分析', icon: User, bg: '#fef3c7', tag: '季度', tagType: 'warning' },
  { name: '就业困难人员帮扶调研', desc: '就业困难群体帮扶成效与建议', icon: Briefcase, bg: '#d1fae5', tag: '重点', tagType: 'success' },
  { name: '职业技能培训效能调研', desc: '职业技能培训效果评估分析', icon: Collection, bg: '#e0e7ff' }
]
const selectedTopic = ref<number | null>(null)

// ====== 配置参数 ======
const dateRange = ref<[string, string]>(['', ''])
const quickBtn = ref('')
const quickBtns = [
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'half', label: '上半年' },
  { key: 'year', label: '本年度' }
]

function setQuickDate(key: string) {
  quickBtn.value = key
  const now = dayjs()
  let start: dayjs.Dayjs
  const end = now
  switch (key) {
    case 'month': start = now.startOf('month'); break
    case 'quarter': start = now.month(Math.floor(now.month() / 3) * 3).startOf('month'); break
    case 'half': start = now.month() < 6 ? now.startOf('year') : now.month(6).startOf('month'); break
    case 'year': start = now.startOf('year'); break
    default: start = now
  }
  dateRange.value = [start.format('YYYY/MM/DD'), end.format('YYYY/MM/DD')]
}

function onDateManualChange() {
  quickBtn.value = ''
}

const dataSource = ref('system')
const uploadFileName = ref('')
function onFileUpload(file: any) {
  uploadFileName.value = file.name
}

const outputFormats = ref<string[]>(['word'])
const additionalContent = ref<string[]>(['chart', 'suggestion'])

// ====== 附件 ======
const chatFiles = ref<MsgFile[]>([])
const chatFileInput = ref<HTMLInputElement>()
function pickChatFile() {
  chatFileInput.value?.click()
}
function onChatFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  Array.from(input.files).forEach((file) => {
    const isImg = file.type.startsWith('image/')
    chatFiles.value.push({
      id: Date.now() + Math.random(),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'file',
      url: isImg ? URL.createObjectURL(file) : undefined,
    })
  })
  input.value = ''
}
function removeChatFile(id: number) {
  const f = chatFiles.value.find((x) => x.id === id)
  if (f && f.url) URL.revokeObjectURL(f.url)
  chatFiles.value = chatFiles.value.filter((x) => x.id !== id)
}
function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ====== 生成 ======
const generating = ref(false)
const chatAreaRef = ref<HTMLElement>()
const messages = ref<Msg[]>([])
const historyList = ref<HistoryItem[]>([])

function onGenerate() {
  if (selectedTopic.value === null) { ElMessage.warning('请选择调研主题'); return }
  if (!dateRange.value[0] || !dateRange.value[1]) { ElMessage.warning('请选择调研周期'); return }
  if (outputFormats.value.length === 0) { ElMessage.warning('请选择输出格式'); return }
  if (dataSource.value === 'upload' && !uploadFileName.value) { ElMessage.warning('请上传台账数据文件'); return }

  generating.value = true
  const topic = topics[selectedTopic.value]
  const period = `${dateRange.value[0]} ~ ${dateRange.value[1]}`
  const formats = outputFormats.value.map(f => f === 'word' ? 'Word文档' : 'PDF文档').join('、')
  const extras = additionalContent.value.map(e => {
    if (e === 'chart') return '可视化图表'
    if (e === 'table') return '明细数据表'
    return 'AI工作建议'
  }).join('、')
  const sourceText = dataSource.value === 'system' ? '系统业务数据' : `上传台账数据（${uploadFileName.value}）`

  const userMsg: Msg = {
    role: 'user',
    content: `请生成一份「${topic.name}」调研报告。调研周期：${period}；数据来源：${sourceText}；输出格式：${formats}；附加内容：${extras || '无'}。`
  }
  messages.value.push(userMsg)

  // AI 思考中
  const aiTyping: Msg = { role: 'ai', content: '', time: dayjs().format('HH:mm'), typing: true }
  messages.value.push(aiTyping)
  scrollToBottom()

  setTimeout(() => {
    messages.value.pop()
    const report: ReportData = {
      title: `${topic.name}报告`,
      status: 'completed',
      period,
      genTime: dayjs().format('YYYY-MM-DD HH:mm'),
      metrics: [
        { label: '调研覆盖人数', value: '12,847人', color: '#2563eb', change: 8.5 },
        { label: '有效样本率', value: '94.2%', color: '#10b981', change: 3.2 },
        { label: '重点群体占比', value: '36.8%', color: '#f59e0b', change: -2.1 },
        { label: '就业意向率', value: '67.5%', color: '#ff7c00', change: 5.6 }
      ],
      sections: [
        { title: '一、调研背景与目的', content: '<p>为全面掌握本市就业市场运行情况，深入了解各类群体就业现状与需求，依据《中华人民共和国就业促进法》及相关政策文件，结合本市实际情况，开展本次调研分析工作。本次调研旨在为制定精准就业帮扶政策、优化公共就业服务提供数据支撑和决策参考。</p>' },
        { title: '二、调研对象与方法', content: '<p>本次调研覆盖全市12个区县，涵盖高校毕业生、农民工、城镇失业人员、就业困难人员等群体。采用问卷调查、实地走访、数据采集相结合的方式，共回收有效问卷12,847份，样本覆盖率达94.2%。</p>' },
        { title: '三、核心数据分析', content: `<p>1. <strong>就业总体情况</strong>：调研期内，全市就业形势总体平稳，城镇新增就业人数同比增长3.2%。</p><p>2. <strong>群体分析</strong>：${topic.name}方面，呈现积极发展态势，政策效应持续显现。</p><p>3. <strong>趋势研判</strong>：预计下季度就业市场将继续保持稳定恢复态势。</p>` },
        { title: '四、存在的主要问题', content: '<p>1. 就业结构性矛盾依然突出，部分领域"招工难"与"就业难"并存。</p><p>2. 重点群体就业帮扶精准度有待进一步提升。</p><p>3. 职业技能培训与市场需求衔接不够紧密。</p>' },
        { title: '五、对策建议', content: '<p>1. 加大就业服务力度，开展精准化就业指导和岗位推荐。</p><p>2. 推进职业技能提升工程，增强培训针对性和实效性。</p><p>3. 强化重点群体就业帮扶，确保"零就业家庭"动态清零。</p><p>4. 健全就业形势监测预警机制，及时发现和化解风险隐患。</p>' }
      ]
    }

    const aiMsg: Msg = { role: 'ai', content: '', time: dayjs().format('HH:mm'), report }
    messages.value.push(aiMsg)
    generating.value = false
    scrollToBottom()

    // 加入历史
    historyList.value.unshift({
      id: Date.now(),
      title: report.title,
      genTime: report.genTime,
      status: 'completed',
      messages: messages.value.slice()
    })
  }, 2000)
}

// ====== 对话 / 附件 ======
const chatInput = ref('')

function onSendChat() {
  const text = chatInput.value.trim()
  if (!text && chatFiles.value.length === 0) return
  chatInput.value = ''

  const userMsg: Msg = { role: 'user', content: text }
  if (chatFiles.value.length > 0) {
    userMsg.files = chatFiles.value.map((f) => ({ ...f }))
  }
  messages.value.push(userMsg)
  chatFiles.value = []

  const aiTyping: Msg = { role: 'ai', content: '', time: dayjs().format('HH:mm'), typing: true }
  messages.value.push(aiTyping)
  scrollToBottom()

  setTimeout(() => {
    messages.value.pop()
    messages.value.push({
      role: 'ai',
      content: `已收到您的调整要求：「${text}」。正在基于当前报告内容进行智能调整，调整后的报告将以新卡片形式呈现，您可以再次下载最新版本。`,
      time: dayjs().format('HH:mm')
    })
    scrollToBottom()
  }, 1500)
}

function scrollToBottom() {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

// ====== 历史 ======
const showHistoryDrawer = ref(false)
const historyLoading = ref(false)

// 点击「查看历史报告」→ 工作流「查询历史报告列表」
async function openHistoryDrawer() {
  showHistoryDrawer.value = true
  if (!isWorkflowConfigured()) {
    // 工作流未配置：使用本地历史（含配置提示）
    console.warn('[coze-workflow] 未配置 VITE_WORKFLOW_HISTORY_LIST_ID，历史列表降级为本地数据')
    return
  }
  historyLoading.value = true
  try {
    const data = await queryReportHistoryList('research')
    const list = data?.list || data?.data || (Array.isArray(data) ? data : null)
    if (Array.isArray(list) && list.length >= 0) {
      historyList.value = list.map((item: any) => ({
        id: item.id ?? Date.now() + Math.random(),
        title: item.title || item.name || '未命名报告',
        genTime: item.genTime || item.createdAt || item.createTime || '',
        status: item.status === '已完成' || item.status === 'completed' ? 'completed' : 'generating',
        messages: item.messages || [],
      }))
    }
  } catch (e: any) {
    ElMessage.error(`查询历史报告列表失败：${e?.message || e}`)
  } finally {
    historyLoading.value = false
  }
}

// 点击某条历史报告 → 工作流「查询历史报告详情」，返回完整交互对话
async function loadHistory(h: HistoryItem) {
  showHistoryDrawer.value = false
  if (isWorkflowConfigured() && h.id) {
    try {
      const data = await queryReportHistoryDetail(h.id)
      const detailMessages = data?.messages || data?.conversation || data
      if (Array.isArray(detailMessages)) {
        messages.value = detailMessages.slice()
        scrollToBottom()
        return
      }
    } catch (e: any) {
      ElMessage.error(`查询历史报告详情失败：${e?.message || e}`)
      return
    }
  }
  // 降级：使用本地保存的完整对话
  if (h.messages && h.messages.length) {
    messages.value = h.messages.slice()
  }
  scrollToBottom()
}

// ====== 导出 ======
function onExport(cmd: string, report: ReportData) {
  const extMap: Record<string, string> = { word: 'docx', pdf: 'pdf', markdown: 'md', text: 'txt' }
  const fileName = `${report.title}.${extMap[cmd] || 'txt'}`
  ElMessage.success(`正在导出 ${fileName}，请稍候...`)
}
</script>

<style scoped>
.research-page {
  display: flex;
  height: calc(100vh - 56px);
  background: #f5f7fa;
  overflow: hidden;
}

/* ====== 左侧面板 ====== */
.left-panel {
  width: 380px;
  min-width: 380px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px;
  gap: 16px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
}
.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 18px; font-weight: 700; color: #1f2937; line-height: 1.2; }
.stat-label { font-size: 12px; color: #6b7280; }

/* 历史按钮 */
.history-btn {
  width: 100%;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* 区块 */
.section-block {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

/* 主题列表 */
.topic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.topic-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all .2s;
  position: relative;
}
.topic-card:hover { border-color: #2563eb; background: #f0f5ff; }
.topic-card.active {
  border-color: #2563eb;
  background: #f0f5ff;
  border-left: 3px solid #2563eb;
}
.topic-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;
}
.topic-info { flex: 1; min-width: 0; }
.topic-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
}
.topic-desc { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* 配置项 */
.config-item { margin-bottom: 14px; }
.config-item:last-child { margin-bottom: 0; }
.config-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}
.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.date-sep { font-size: 12px; color: #9ca3af; flex-shrink: 0; }
.quick-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.quick-btns .el-button { font-size: 12px; padding: 4px 10px; }

.upload-area { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.file-name { font-size: 12px; color: #2563eb; }

/* 生成按钮 */
.generate-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  font-size: 14px;
  border-radius: 8px;
}

/* ====== 右侧对话区 ====== */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  margin-bottom: 20px;
}
.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 10px;
}
.empty-desc {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  max-width: 480px;
  line-height: 1.6;
  margin: 0 0 24px;
}
.feature-cards {
  display: flex;
  gap: 16px;
}
.feature-card {
  background: #fff;
  border: 1px solid #e4eaf3;
  border-radius: 12px;
  padding: 20px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 160px;
}
.feature-card .el-icon { font-size: 22px; margin-bottom: 2px; }
.feature-card span { font-size: 13px; color: #1f2937; }
.feature-name { font-size: 14px; font-weight: 600; color: #1f2937; }
.feature-desc { font-size: 12px; color: #9ca3af; }
.fc-sub { font-size: 11px !important; color: #9ca3af !important; }
.tutu-logo { width: 240px; height: auto; max-width: 80%; object-fit: contain; margin-bottom: 16px; }

/* 消息 */
.message-item { margin-bottom: 16px; }
.message-item.user { display: flex; justify-content: flex-end; }
.message-item.ai { display: flex; justify-content: flex-start; }

.user-bubble {
  background: #e8f0fe;
  color: #1f2937;
  padding: 10px 16px;
  border-radius: 12px;
  max-width: 60%;
  font-size: 14px;
  line-height: 1.6;
}

.ai-bubble {
  background: #fff;
  border-left: 3px solid #2563eb;
  border-radius: 0 8px 8px 8px;
  padding: 14px 18px;
  max-width: 80%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ai-time { font-size: 11px; color: #9ca3af; margin-bottom: 8px; }

.typing-dots { display: flex; gap: 4px; padding: 8px 0; }
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #2563eb;
  animation: typing 1.4s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

/* 报告卡片 */
.report-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.report-title-area { display: flex; align-items: center; gap: 8px; }
.report-title { font-size: 16px; font-weight: 700; color: #1f2937; margin: 0; }
.report-meta { font-size: 12px; color: #9ca3af; margin-bottom: 14px; }
.report-meta .sep { margin: 0 6px; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.metric-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}
.metric-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.metric-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
.metric-value { font-size: 18px; font-weight: 700; margin: 4px 0; }
.metric-change { font-size: 11px; margin-bottom: 6px; }
.metric-change .up { color: #10b981; font-weight: 600; }
.metric-change .down { color: #ef4444; font-weight: 600; }
.change-label { color: #9ca3af; margin-left: 2px; }

.report-body { margin-bottom: 12px; }
.report-section { margin-bottom: 14px; }
.sec-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
  padding-left: 10px;
  border-left: 3px solid #2563eb;
}
.sec-content { font-size: 13px; line-height: 1.8; color: #374151; }
.sec-content p { margin: 0 0 6px; }

.report-disclaimer {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

/* 输入区 */
.chat-input-area {
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 12px 20px;
}
.chat-input-area .el-textarea { margin-bottom: 8px; }
.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.input-hint {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  margin-top: 6px;
}

/* 输入区已选附件列表 */
.chat-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  max-height: 96px;
  overflow: auto;
}
.chat-file-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3f6fc;
  border: 1px solid #e3eaf8;
  border-radius: 8px;
  padding: 6px 30px 6px 8px;
  max-width: 220px;
}
.cf-thumb {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.cf-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #e8f0fe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cf-name {
  font-size: 12px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cf-del {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
}
.cf-del:hover { color: #ef4444; }

/* 消息气泡内附件 */
.bubble-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.bubble-file {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3f6fc;
  border: 1px solid #e3eaf8;
  border-radius: 8px;
  padding: 6px 10px;
  max-width: 220px;
}
.bf-thumb {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.bf-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #e8f0fe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bf-name {
  font-size: 12px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 历史抽屉 */
.history-list { padding: 0 16px; }
.history-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background .2s;
}
.history-item:hover { background: #f9fafb; }
.hi-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.hi-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9ca3af; }
</style>
