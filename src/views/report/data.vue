<template>
  <div class="data-report-page">
    <!-- 左侧配置面板 -->
    <div class="config-panel">
      <div class="config-inner">
        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card" v-for="(s, i) in overviewStats" :key="i">
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
        <el-button class="history-btn" @click="showHistoryDrawer = true">
          <el-icon><Clock /></el-icon>查看历史报告
        </el-button>

        <!-- 分析方式选择 -->
        <div class="section-title">分析方式</div>
        <div class="mode-tabs">
          <div class="mode-tab" :class="{ active: activeMode === 'upload' }" @click="activeMode = 'upload'">
            <el-icon><UploadFilled /></el-icon>上传本地数据
          </div>
          <div class="mode-tab" :class="{ active: activeMode === 'compare' }" @click="activeMode = 'compare'">
            <el-icon><TrendCharts /></el-icon>系统报表对比
          </div>
        </div>

        <!-- 上传本地数据模式 -->
        <template v-if="activeMode === 'upload'">
          <div class="section-title">上传数据文件</div>
          <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
            <input ref="fileInputRef" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="handleFileChange" />
            <el-icon :size="32" color="#2563eb"><UploadFilled /></el-icon>
            <p class="upload-text">点击上传或拖拽文件至此区域</p>
            <p class="upload-hint">支持 .xlsx .xls .csv 格式，如就业台账、求职登记、技能培训等</p>
          </div>
          <div v-if="uploadFile" class="file-card">
            <div class="file-info">
              <el-icon color="#2563eb"><Document /></el-icon>
              <div class="file-detail">
                <span class="file-name">{{ uploadFile.name }}</span>
                <span class="file-status">{{ uploadFile.parsed ? '解析完成' : '待解析' }}</span>
              </div>
            </div>
            <el-button text type="danger" size="small" @click="uploadFile = null">删除</el-button>
          </div>

          <div class="section-title">报告标题</div>
          <el-input v-model="reportTitle" placeholder="如：就业困难人员帮扶数据分析报告" />

          <div class="section-title">分析重点</div>
          <el-select v-model="analysisFocus" placeholder="选择分析重点" style="width:100%">
            <el-option label="帮扶成效评估" value="帮扶成效评估" />
            <el-option label="就业结构与趋势" value="就业结构与趋势" />
            <el-option label="行业用工情况" value="行业用工情况" />
          </el-select>
        </template>

        <!-- 系统报表对比模式 -->
        <template v-if="activeMode === 'compare'">
          <div class="section-title">选择业务报表</div>
          <el-select v-model="compareReport" placeholder="选择业务报表" style="width:100%">
            <el-option label="城镇新增就业报表" value="城镇新增就业报表" />
            <el-option label="失业登记与就业援助报表" value="失业登记与就业援助报表" />
            <el-option label="公益性岗位安置报表" value="公益性岗位安置报表" />
            <el-option label="职业技能培训报表" value="职业技能培训报表" />
            <el-option label="创业担保贷款发放报表" value="创业担保贷款发放报表" />
            <el-option label="零工市场用工报表" value="零工市场用工报表" />
          </el-select>

          <div class="section-title">对比方式</div>
          <div class="compare-mode-tabs">
            <div class="cmp-tab" :class="{ active: compareMethod === '环比' }" @click="compareMethod = '环比'">环比</div>
            <div class="cmp-tab" :class="{ active: compareMethod === '同比' }" @click="compareMethod = '同比'">同比</div>
            <div class="cmp-tab" :class="{ active: compareMethod === '双对比' }" @click="compareMethod = '双对比'">双对比</div>
          </div>

          <div class="section-title">分析重点</div>
          <el-select v-model="compareFocus" placeholder="选择分析重点" style="width:100%">
            <el-option label="重点群体帮扶成效" value="重点群体帮扶成效" />
            <el-option label="重点行业用工波动" value="重点行业用工波动" />
            <el-option label="城镇新增就业趋势" value="城镇新增就业趋势" />
          </el-select>
        </template>

        <!-- 生成按钮 -->
        <div class="generate-section">
          <el-button type="primary" class="generate-btn" :disabled="!canGenerate" :loading="isGenerating" @click="generateReport">
            <el-icon><MagicStick /></el-icon>{{ isGenerating ? '正在生成...' : '生成数据分析报告' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 右侧AI对话区 -->
    <div class="chat-area">
      <!-- 顶部 -->
      <div class="chat-topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>智能报告</el-breadcrumb-item>
          <el-breadcrumb-item>数据分析报告</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="topbar-right">
          <el-badge :value="3" class="notif-badge">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>
          <div class="user-avatar">
            <el-icon :size="18"><User /></el-icon>
          </div>
        </div>
      </div>

      <!-- 对话内容 -->
      <div class="chat-messages" ref="msgContainerRef">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="56" height="56" viewBox="0 0 56 56"><path d="M28 8C16.954 8 8 16.954 8 28s8.954 20 20 20 20-8.954 20-20S39.046 8 28 8z" fill="url(#g1)"/><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1d4fa8"/></linearGradient></defs><text x="28" y="34" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">AI</text></svg>
          </div>
          <h3 class="empty-title">AI 数据分析报告助手</h3>
          <p class="empty-desc">请在左侧选择分析方式并配置参数，点击「生成数据分析报告」即可生成报告，生成后可继续输入调整要求进行优化。</p>
          <div class="feature-cards">
            <div class="feature-card"><el-icon color="#2563eb"><Document /></el-icon><span>结构化报告</span><span class="fc-sub">完整章节逻辑清晰</span></div>
            <div class="feature-card"><el-icon color="#2563eb"><TrendCharts /></el-icon><span>AI 智能分析</span><span class="fc-sub">深度洞察专业建议</span></div>
          </div>
        </div>

        <!-- 消息流 -->
        <div v-for="(msg, idx) in messages" :key="idx" class="msg-item" :class="msg.role">
          <div v-if="msg.role === 'user'" class="user-msg">
            <div class="msg-bubble user-bubble">{{ msg.content }}</div>
          </div>
          <div v-else class="ai-msg">
            <div class="ai-indicator"></div>
            <div class="msg-bubble ai-bubble">
              <!-- 生成中 -->
              <div v-if="msg.generating" class="generating-indicator">
                <span class="dot-pulse"></span>
                <span>AI 正在生成报告，请稍候…</span>
              </div>
              <!-- 报告卡片 -->
              <div v-else-if="msg.report" class="report-card">
                <div class="rc-header">
                  <h3 class="rc-title">{{ msg.report.title }}</h3>
                  <div class="rc-meta">
                    <span class="rc-tag">数据分析报告</span>
                    <span class="rc-tag rc-tag-blue">AI 自动生成</span>
                    <span class="rc-date">{{ msg.report.createdAt }}</span>
                  </div>
                </div>

                <!-- 关键指标 -->
                <div class="rc-metrics">
                  <div class="rc-metric" v-for="(m, mi) in msg.report.metrics" :key="mi">
                    <div class="rcm-top" :style="{ borderColor: m.color }">
                      <span class="rcm-label">{{ m.label }}</span>
                      <span class="rcm-value" :style="{ color: m.color }">{{ m.value }}</span>
                    </div>
                    <div class="rcm-trend">
                      <span :class="m.trend >= 0 ? 'trend-up' : 'trend-down'">{{ m.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(m.trend) }}%</span>
                      <span class="trend-label">{{ m.trendLabel || '较上期' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 对比图表 -->
                <div v-if="msg.report.chartSvg" class="rc-chart" v-html="msg.report.chartSvg"></div>

                <!-- 正文 -->
                <div class="rc-body" v-html="msg.report.body"></div>

                <!-- AI 建议 -->
                <div v-if="msg.report.suggestions" class="rc-suggestions">
                  <h4 class="sug-title">AI 针对性工作建议</h4>
                  <div class="sug-item" v-for="(s, si) in msg.report.suggestions" :key="si">
                    <div class="sug-bar"></div>
                    <div class="sug-content">
                      <strong>{{ s.title || '建议' + (si + 1) }}</strong>
                      <p>{{ s.detail || s }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 纯文本 -->
              <div v-else class="ai-text">{{ msg.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <div class="input-inner">
          <el-button class="attach-btn" @click="triggerAttach">
            <el-icon><Paperclip /></el-icon>
          </el-button>
          <input ref="attachInputRef" type="file" style="display:none" @change="handleAttach" />
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="2"
            placeholder="输入对报告的调整要求，如'补充就业困难人员帮扶建议'、'把第二部分精简一下'…"
            @keyup.enter.prevent="sendMessage"
          />
          <el-button type="primary" :icon="Promotion" :disabled="!userInput.trim() || isGenerating" @click="sendMessage" class="send-btn">发送</el-button>
        </div>
      </div>
    </div>

    <!-- 历史报告抽屉 -->
    <el-drawer v-model="showHistoryDrawer" title="历史报告" size="400px">
      <el-table :data="historyList" stripe @row-click="openHistoryReport" style="cursor:pointer">
        <el-table-column prop="title" label="报告名称" min-width="160" />
        <el-table-column prop="mode" label="分析方式" width="80">
          <template #default="{ row }">
            <el-tag :type="row.mode === 'upload' ? 'primary' : 'success'" size="small">{{ row.mode === 'upload' ? '上传' : '对比' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" width="150" />
        <el-table-column prop="status" label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { UploadFilled, Document, MagicStick, Download, Back, Clock, EditPen, TrendCharts, ZoomOut, DocumentChecked, ChatLineSquare, Bell, User, Paperclip, Promotion } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const overviewStats = ref([
  { label: '数据分析报告总数', value: '52份', icon: Document, bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  { label: '待生成报告', value: '6份', icon: Clock, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { label: '生成中', value: '2份', icon: ChatLineSquare, bg: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { label: '已完成', value: '30份', icon: UploadFilled, bg: 'linear-gradient(135deg, #10b981, #059669)' }
])

// 模式选择
const activeMode = ref<string>('upload')

// 上传模式
const uploadFile = ref<{ name: string; parsed: boolean } | null>(null)
const reportTitle = ref('')
const analysisFocus = ref('')
const fileInputRef = ref<HTMLInputElement>()

function triggerUpload() { fileInputRef.value?.click() }
function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    uploadFile.value = { name: files[0].name, parsed: false }
    setTimeout(() => { if (uploadFile.value) uploadFile.value.parsed = true }, 1000)
  }
}
function handleDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files && files[0]) {
    uploadFile.value = { name: files[0].name, parsed: false }
    setTimeout(() => { if (uploadFile.value) uploadFile.value.parsed = true }, 1000)
  }
}

// 对比模式
const compareReport = ref('')
const compareMethod = ref('环比')
const compareFocus = ref('')

// 生成
const isGenerating = ref(false)
const canGenerate = computed(() => {
  if (activeMode.value === 'upload') return !!uploadFile.value
  if (activeMode.value === 'compare') return !!compareReport.value
  return false
})

// 消息
const messages = ref<Array<{
  role: 'user' | 'ai'
  content: string
  generating?: boolean
  report?: any
  polished?: boolean
}>>([])
const userInput = ref('')
const msgContainerRef = ref<HTMLElement>()

function scrollToBottom() {
  nextTick(() => {
    const el = msgContainerRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 生成报告
async function generateReport() {
  if (!canGenerate.value) {
    if (activeMode.value === 'upload' && !uploadFile.value) {
      ElMessage.warning('请先上传本地数据文件')
    } else if (activeMode.value === 'compare' && !compareReport.value) {
      ElMessage.warning('请先选择业务报表')
    }
    return
  }

  isGenerating.value = true
  const configDesc = activeMode.value === 'upload'
    ? `数据分析模式：上传本地数据\n文件：${uploadFile.value?.name}\n报告标题：${reportTitle.value || '数据分析报告'}\n分析重点：${analysisFocus.value || '帮扶成效评估'}`
    : `数据分析模式：系统报表对比\n报表：${compareReport.value}\n对比方式：${compareMethod.value}\n分析重点：${compareFocus.value || '重点群体帮扶成效'}`

  messages.value.push({ role: 'user', content: configDesc })
  scrollToBottom()

  const aiMsgIdx = messages.value.length
  messages.value.push({ role: 'ai', content: '', generating: true })
  scrollToBottom()

  await new Promise(r => setTimeout(r, 2000))

  const now = dayjs().format('YYYY-MM-DD HH:mm')
  let report: any

  if (activeMode.value === 'upload') {
    report = generateUploadReportData(now)
  } else {
    report = generateCompareReportData(now)
  }

  messages.value[aiMsgIdx] = { role: 'ai', content: '', generating: false, report }
  isGenerating.value = false
  scrollToBottom()

  // 保存到历史
  historyList.value.unshift({
    title: report.title,
    mode: activeMode.value,
    createdAt: now,
    status: '已完成',
    report
  })
}

function generateUploadReportData(now: string) {
  const title = reportTitle.value || '就业困难人员帮扶数据分析报告'
  return {
    title,
    createdAt: now,
    metrics: [
      { label: '纳入帮扶人数', value: '2,486人', color: '#2563eb', trend: 8.2, trendLabel: '较上期' },
      { label: '实现就业人数', value: '1,872人', color: '#10b981', trend: 12.5, trendLabel: '较上期' },
      { label: '帮扶就业率', value: '75.3%', color: '#f59e0b', trend: 3.8, trendLabel: '较上期' },
      { label: '公益岗安置数', value: '386人', color: '#e07a2f', trend: 5.2, trendLabel: '较上期' }
    ],
    chartSvg: generateChartSvg('社区帮扶就业率对比', [
      { label: '城东社区', values: [86, 72] },
      { label: '城南社区', values: [82, 68] },
      { label: '城中社区', values: [78, 65] },
      { label: '城北社区', values: [74, 60] },
      { label: '兴华社区', values: [62, 48] },
      { label: '滨河社区', values: [58, 45] }
    ], '本期', '上季度'),
    body: `<h4>一、帮扶成效总览</h4><p>根据上传的《${uploadFile.value?.name || '就业困难人员帮扶台账'}》数据分析，本期纳入帮扶就业困难人员共 <strong>2,486人</strong>，其中实现就业 <strong>1,872人</strong>，帮扶就业率达 <strong>75.3%</strong>，较上期提升3.8个百分点。公益性岗位安置386人，兜底帮扶成效显著。</p>
    <h4>二、社区差异分析</h4><p>从各社区帮扶就业率来看，城东社区以86%的帮扶就业率位居首位，城南社区82%紧随其后。而兴华社区（62%）和滨河社区（58%）帮扶就业率明显低于平均水平，与先进社区差距超过20个百分点。</p><p>分析原因：兴华、滨河社区辖区企业资源较少，就业岗位对接渠道单一，且帮扶专员配备不足，导致就业帮扶精准度不够。</p>
    <h4>三、改进建议</h4><p>建议加强对兴华、滨河社区的就业帮扶力度，优先增配帮扶专员并强化岗位对接；同时推广城东社区"一人一档、动态销号"先进帮扶模式，向全区各社区复制推广。</p>`,
    suggestions: [
      { title: '加强薄弱社区帮扶力量', detail: '建议加强对兴华、滨河社区的就业帮扶力度，优先增配帮扶专员并强化岗位对接，力争下季度帮扶就业率提升至70%以上。' },
      { title: '推广先进帮扶模式', detail: '城东社区"一人一档、动态销号"模式成效显著，帮扶就业率86%位居全区首位，建议向全区各社区推广复制。' },
      { title: '强化公益性岗位兜底', detail: '建议进一步拓展公益性岗位开发渠道，重点面向4050人员、零就业家庭等困难群体，确保兜底帮扶全覆盖。' }
    ]
  }
}

function generateCompareReportData(now: string) {
  const reportMap: Record<string, { title: string; metrics: any[]; body: string; suggestions: any[] }> = {
    '城镇新增就业报表': {
      title: `城镇新增就业对比分析报告（${compareMethod.value}）`,
      metrics: [
        { label: '城镇新增就业人数', value: '1.42万人', color: '#2563eb', trend: 10.9, trendLabel: compareMethod.value === '同比' ? '较去年同期' : '较上期' },
        { label: '环比增幅', value: '8.6%', color: '#10b981', trend: 8.6, trendLabel: '较上期' },
        { label: '同比增幅', value: '12.3%', color: '#f59e0b', trend: 12.3, trendLabel: '较去年同期' },
        { label: '失业登记新增', value: '0.48万人', color: '#e07a2f', trend: -7.7, trendLabel: '较上期' }
      ],
      body: `<h4>一、${compareMethod.value}分析</h4><p>本期城镇新增就业1.42万人，${compareMethod.value === '同比' ? '较去年同期增加0.16万人，同比增长12.3%' : '较上期增加0.11万人，环比增长8.6%'}，就业形势保持稳中向好态势。</p>
      <h4>二、趋势研判</h4><p>从近6个月走势来看，城镇新增就业人数呈现稳步上升趋势，服务业和制造业用工需求持续回暖。但住宿餐饮行业用工环比回落明显，需提前做好监测预警。</p>`,
      suggestions: [
        { title: '关注行业用工波动', detail: '服务业用工环比回落明显，建议提前监测岗位流失，做好稳岗与转岗衔接工作。' },
        { title: '统筹区域就业资源', detail: '新增就业集中在城区，部分乡镇增幅有限，建议统筹岗位资源向薄弱区域倾斜。' }
      ]
    },
    '职业技能培训报表': {
      title: `职业技能培训对比分析报告（${compareMethod.value}）`,
      metrics: [
        { label: '培训人数', value: '3,256人', color: '#2563eb', trend: 15.2, trendLabel: '较上期' },
        { label: '合格率', value: '92.8%', color: '#10b981', trend: 2.3, trendLabel: '较上期' },
        { label: '取证率', value: '85.6%', color: '#f59e0b', trend: 4.7, trendLabel: '较上期' },
        { label: '就业转化率', value: '68.2%', color: '#e07a2f', trend: 6.1, trendLabel: '较上期' }
      ],
      body: `<h4>一、${compareMethod.value}分析</h4><p>本期培训3,256人，合格率92.8%，取证率85.6%，就业转化率68.2%，各项指标均较${compareMethod.value === '同比' ? '去年同期' : '上期'}有显著提升。</p>
      <h4>二、趋势研判</h4><p>技能培训与就业联动效果持续增强，建议深化校企合作订单培养模式，提升培训针对性。</p>`,
      suggestions: [
        { title: '深化校企合作', detail: '建议加强技能人才供给，深化校企合作订单培养，提升培训与岗位需求的匹配度。' },
        { title: '强化培训后跟踪', detail: '建议建立培训后就业跟踪机制，对未就业学员提供"一对一"岗位推荐服务。' }
      ]
    },
    '创业担保贷款发放报表': {
      title: `创业担保贷款对比分析报告（${compareMethod.value}）`,
      metrics: [
        { label: '发放笔数', value: '286笔', color: '#2563eb', trend: 18.5, trendLabel: '较上期' },
        { label: '发放金额', value: '4,580万元', color: '#10b981', trend: 22.3, trendLabel: '较上期' },
        { label: '扶持创业人数', value: '312人', color: '#f59e0b', trend: 15.8, trendLabel: '较上期' },
        { label: '带动就业人数', value: '1,256人', color: '#e07a2f', trend: 20.6, trendLabel: '较上期' }
      ],
      body: `<h4>一、${compareMethod.value}分析</h4><p>本期发放创业担保贷款286笔，金额4,580万元，扶持创业312人，带动就业1,256人，创业带动就业倍增效应明显。</p>`,
      suggestions: [
        { title: '优化贷款审批流程', detail: '建议进一步优化创业担保贷款审批流程，缩短放款周期，提高资金使用效率。' },
        { title: '加强贷后服务', detail: '建议建立创业跟踪服务机制，为创业者提供经营指导、市场对接等后续服务。' }
      ]
    }
  }

  // Default to 城镇新增就业 if not found
  const data = reportMap[compareReport.value] || reportMap['城镇新增就业报表']

  return {
    title: data.title,
    createdAt: now,
    metrics: data.metrics,
    chartSvg: generateCompareChartSvg(compareReport.value, compareMethod.value),
    body: data.body,
    suggestions: data.suggestions
  }
}

// 生成柱状图 SVG
function generateChartSvg(title: string, data: Array<{ label: string; values: number[] }>, label1: string, label2: string) {
  const maxVal = Math.max(...data.flatMap(d => d.values)) * 1.2
  const barW = 20
  const gap = 40
  const startX = 60
  const chartW = startX + data.length * gap + 40
  const chartH = 280
  const topMargin = 40

  let bars = ''
  data.forEach((d, i) => {
    const x = startX + i * gap
    const h1 = (d.values[0] / maxVal) * 180
    const h2 = (d.values[1] / maxVal) * 180
    const yBase = chartH - 40
    bars += `
      <rect x="${x}" y="${yBase - h1}" width="${barW}" height="${h1}" fill="#2563eb" rx="2" />
      <rect x="${x + barW + 2}" y="${yBase - h2}" width="${barW}" height="${h2}" fill="#93c5fd" rx="2" />
      <text x="${x + barW}" y="${yBase + 16}" text-anchor="middle" font-size="11" fill="#6b7280">${d.label}</text>
      <text x="${x + barW}" y="${yBase - Math.max(h1, h2) - 6}" text-anchor="middle" font-size="10" fill="#2563eb">${d.values[0]}%</text>
    `
  })

  return `<svg width="100%" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}" style="max-width:100%">
    <text x="${chartW / 2}" y="20" text-anchor="middle" font-size="13" font-weight="600" fill="#374151">${title}</text>
    <rect x="${chartW - 140}" y="8" width="10" height="10" fill="#2563eb" rx="2" />
    <text x="${chartW - 126}" y="17" font-size="11" fill="#6b7280">${label1}</text>
    <rect x="${chartW - 70}" y="8" width="10" height="10" fill="#93c5fd" rx="2" />
    <text x="${chartW - 56}" y="17" font-size="11" fill="#6b7280">${label2}</text>
    ${bars}
  </svg>`
}

function generateCompareChartSvg(reportName: string, method: string) {
  let data: Array<{ label: string; values: number[] }>
  if (reportName.includes('城镇新增就业')) {
    data = ['1月', '2月', '3月', '4月', '5月', '6月'].map((m, i) => ({
      label: m,
      values: [1.1 + i * 0.05, 1.0 + i * 0.04]
    }))
  } else {
    data = ['1月', '2月', '3月', '4月', '5月', '6月'].map((m, i) => ({
      label: m,
      values: [80 + i * 2, 72 + i * 1.5]
    }))
  }
  return generateChartSvg(`${reportName}月度走势（${method}）`, data, '2026年', '2025年')
}

// 发送消息（调整润色）
async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isGenerating.value) return
  userInput.value = ''

  messages.value.push({ role: 'user', content: text })
  scrollToBottom()

  // 识别意图
  let action = '整体润色'
  if (/精简|压缩|缩短/.test(text)) action = '精简压缩'
  else if (/扩写|充实|补充|增加/.test(text)) action = '扩写充实'
  else if (/公文|正式|规范/.test(text)) action = '公文风格'
  else if (/建议|帮扶|社区|岗位/.test(text)) action = '针对性调整'

  const aiMsgIdx = messages.value.length
  messages.value.push({ role: 'ai', content: '', generating: true })
  scrollToBottom()

  await new Promise(r => setTimeout(r, 1500))

  // 找到最近一份报告
  let lastReport: any = null
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === 'ai' && messages.value[i].report) {
      lastReport = messages.value[i].report
      break
    }
  }

  if (lastReport) {
    const polishedReport = JSON.parse(JSON.stringify(lastReport))
    polishedReport.title += '（AI已润色）'
    polishedReport.body = `<p><em>（AI已根据「${action}」要求完成润色调整）</em></p>` + polishedReport.body

    if (action === '精简压缩') {
      polishedReport.body = `<p><em>（已按精简压缩要求优化，去除冗余表述，保留核心数据与结论）</em></p>
      <h4>一、核心数据</h4><p>${polishedReport.metrics.map((m: any) => `${m.label}：${m.value}`).join('；')}</p>
      <h4>二、主要结论</h4><p>各项指标运行在合理区间，${polishedReport.title.includes('就业') ? '就业形势' : '培训工作'}保持稳中向好态势。</p>
      <h4>三、工作建议</h4><ul>${(polishedReport.suggestions || []).map((s: any) => `<li>${s.title || s}</li>`).join('')}</ul>`
    } else if (action === '公文风格') {
      polishedReport.body = `<p><em>（已按公文规范要求调整措辞，统一使用正式政务用语）</em></p>
      <p>为深入贯彻落实党中央、国务院关于稳就业工作的决策部署，全面掌握就业形势运行情况，现就相关数据分析报告如下。</p>
      ${polishedReport.body}`
    }

    messages.value[aiMsgIdx] = {
      role: 'ai',
      content: '',
      generating: false,
      report: polishedReport,
      polished: true
    }
  } else {
    messages.value[aiMsgIdx] = { role: 'ai', content: `已收到您的调整要求「${action}」，但未找到可调整的报告，请先生成一份报告后再进行润色操作。`, generating: false }
  }

  scrollToBottom()
}

// 附件
const attachInputRef = ref<HTMLInputElement>()
function triggerAttach() { attachInputRef.value?.click() }
function handleAttach(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    ElMessage.success(`已上传附件：${files[0].name}`)
  }
}

// 历史
const showHistoryDrawer = ref(false)
const historyList = ref<Array<{ title: string; mode: string; createdAt: string; status: string; report: any }>>([])

function openHistoryReport(row: any) {
  showHistoryDrawer.value = false
  messages.value.push({
    role: 'ai',
    content: '',
    generating: false,
    report: row.report
  })
  scrollToBottom()
}
</script>

<style scoped>
.data-report-page {
  display: flex;
  height: calc(100vh - 56px);
  background: #f2f5fa;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 左侧配置面板 ===== */
.config-panel {
  width: 400px;
  min-width: 400px;
  background: #fff;
  border-right: 1px solid #e4eaf3;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.config-inner { padding: 20px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; gap: 10px; background: #f8fafd; border-radius: 10px; padding: 12px 14px; border: 1px solid #e4eaf3; }
.stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 18px; font-weight: 700; color: #1f2937; line-height: 1.2; }
.stat-label { font-size: 12px; color: #6b7280; }
.history-btn { width: 100%; margin-bottom: 20px; justify-content: center; }
.section-title { font-size: 14px; font-weight: 600; color: #1f2937; margin: 16px 0 8px; }

/* 分析方式切换 */
.mode-tabs { display: flex; gap: 8px; margin-bottom: 4px; }
.mode-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 0; border-radius: 8px; border: 1px solid #e4eaf3; cursor: pointer; font-size: 13px; color: #6b7280; transition: all .2s; }
.mode-tab:hover { border-color: #2563eb; color: #2563eb; }
.mode-tab.active { background: #eaf0fe; border-color: #2563eb; color: #2563eb; font-weight: 600; }

/* 上传区域 */
.upload-area { border: 2px dashed #d1d9e6; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: all .2s; background: #f8fafd; }
.upload-area:hover { border-color: #2563eb; background: #eaf0fe; }
.upload-text { font-size: 13px; color: #1f2937; margin: 8px 0 4px; }
.upload-hint { font-size: 11px; color: #9ca3af; }

.file-card { display: flex; align-items: center; justify-content: space-between; background: #f8fafd; border: 1px solid #e4eaf3; border-radius: 8px; padding: 10px 12px; margin-top: 8px; }
.file-info { display: flex; align-items: center; gap: 8px; }
.file-detail { display: flex; flex-direction: column; }
.file-name { font-size: 13px; color: #1f2937; }
.file-status { font-size: 11px; color: #10b981; }

/* 对比方式切换 */
.compare-mode-tabs { display: flex; gap: 0; border: 1px solid #e4eaf3; border-radius: 8px; overflow: hidden; }
.cmp-tab { flex: 1; text-align: center; padding: 8px 0; font-size: 13px; cursor: pointer; color: #6b7280; border-right: 1px solid #e4eaf3; transition: all .2s; }
.cmp-tab:last-child { border-right: none; }
.cmp-tab:hover { color: #2563eb; }
.cmp-tab.active { background: #2563eb; color: #fff; font-weight: 600; }

/* 生成按钮 */
.generate-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e4eaf3; }
.generate-btn { width: 100%; height: 44px; font-size: 15px; }

/* ===== 右侧AI对话区 ===== */
.chat-area { flex: 1; display: flex; flex-direction: column; background: #f2f5fa; min-width: 0; }

/* 顶部栏 */
.chat-topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: #fff; border-bottom: 1px solid #e4eaf3; flex-shrink: 0; }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.notif-badge { cursor: pointer; }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; }

/* 对话内容 */
.chat-messages { flex: 1; overflow-y: auto; padding: 20px; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; }
.empty-icon { margin-bottom: 16px; }
.empty-title { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px; }
.empty-desc { font-size: 14px; color: #6b7280; max-width: 420px; line-height: 1.6; margin: 0 0 24px; }
.feature-cards { display: flex; gap: 16px; }
.feature-card { display: flex; flex-direction: column; align-items: center; gap: 6px; background: #fff; border: 1px solid #e4eaf3; border-radius: 12px; padding: 20px 28px; min-width: 140px; }
.feature-card span { font-size: 13px; color: #1f2937; }
.fc-sub { font-size: 11px !important; color: #9ca3af !important; }

/* 消息 */
.msg-item { margin-bottom: 16px; }
.msg-item.user { display: flex; justify-content: flex-end; }
.msg-item.ai { display: flex; }
.msg-bubble { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; }
.user-bubble { background: #eaf0fe; color: #1f2937; border-bottom-right-radius: 4px; }
.ai-bubble { background: #fff; border: 1px solid #e4eaf3; box-shadow: 0 1px 4px rgba(0,0,0,0.04); border-bottom-left-radius: 4px; }

/* 生成中动画 */
.generating-indicator { display: flex; align-items: center; gap: 10px; color: #6b7280; font-size: 13px; }
.dot-pulse { width: 8px; height: 8px; border-radius: 50%; background: #2563eb; animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

/* 报告卡片 */
.report-card { width: 100%; }
.rc-header { background: linear-gradient(135deg, #eaf0fe, #f0f5ff); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.rc-title { font-size: 17px; font-weight: 600; color: #1f2937; margin: 0 0 8px; }
.rc-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rc-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #2563eb; color: #fff; font-size: 11px; }
.rc-tag-blue { background: #eaf0fe; color: #2563eb; }
.rc-date { font-size: 12px; color: #6b7280; }

/* 关键指标 */
.rc-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.rc-metric { background: #f8fafd; border: 1px solid #e4eaf3; border-radius: 10px; padding: 12px; }
.rcm-top { border-top: 3px solid; padding-top: 8px; }
.rcm-label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.rcm-value { display: block; font-size: 20px; font-weight: 700; }
.rcm-trend { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 12px; }
.trend-up { color: #10b981; font-weight: 600; }
.trend-down { color: #ef4444; font-weight: 600; }
.trend-label { color: #9ca3af; }

/* 图表 */
.rc-chart { background: #f8fafd; border: 1px solid #e4eaf3; border-radius: 10px; padding: 16px; margin-bottom: 16px; }

/* 正文 */
.rc-body { padding: 0 4px; }
.rc-body h4 { font-size: 15px; font-weight: 600; color: #1f2937; margin: 16px 0 8px; }
.rc-body p { font-size: 14px; color: #374151; line-height: 1.8; margin: 0 0 12px; }
.rc-body ul { margin: 8px 0; padding-left: 20px; }
.rc-body li { font-size: 14px; color: #374151; line-height: 1.8; }

/* AI 建议 */
.rc-suggestions { background: #fcf1e6; border-radius: 10px; padding: 16px; margin-top: 16px; }
.sug-title { font-size: 14px; font-weight: 600; color: #e07a2f; margin: 0 0 12px; }
.sug-item { display: flex; gap: 10px; margin-bottom: 12px; }
.sug-bar { width: 3px; border-radius: 2px; background: #e07a2f; flex-shrink: 0; }
.sug-content { flex: 1; }
.sug-content strong { display: block; font-size: 13px; color: #1f2937; margin-bottom: 4px; }
.sug-content p { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0; }

/* 输入框 */
.chat-input { flex-shrink: 0; padding: 12px 20px; background: #fff; border-top: 1px solid #e4eaf3; }
.input-inner { display: flex; align-items: flex-end; gap: 8px; }
.input-inner .el-textarea__inner { border-radius: 10px; resize: none; }
.attach-btn { margin-bottom: 4px; }
.send-btn { height: 36px; margin-bottom: 4px; }

/* 抽屉表格 */
:deep(.el-drawer__body) { padding: 0; }
:deep(.el-drawer__body .el-table) { border: none; }
</style>