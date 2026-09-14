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
        <el-button class="history-btn" :loading="historyLoading" @click="openHistoryDrawer">
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

        <!-- 选择报告模板（分析方式选定后展示，两种模式共用） -->
        <div class="section-block" v-if="reportTemplates.length > 0">
          <div class="section-title"><el-icon><MagicStick /></el-icon> 选择报告模板</div>
          <div class="template-list">
            <div
              class="template-card"
              v-for="t in reportTemplates"
              :key="t.id"
              :class="{ active: selectedTemplate?.id === t.id }"
              @click="selectTemplate(t)"
            >
              <div class="template-icon" :style="{ background: t.bg }">
                <el-icon :size="18"><component :is="t.icon" /></el-icon>
              </div>
              <div class="template-info">
                <div class="template-name">
                  {{ t.name }}
                  <el-tag v-if="t.tag" size="small" :type="t.tagType as any" effect="plain">{{ t.tag }}</el-tag>
                  <el-icon v-if="selectedTemplate?.id === t.id" class="template-check"><CircleCheck /></el-icon>
                </div>
                <div class="template-desc">{{ t.desc }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- 无可用模板空态 -->
        <div v-else class="template-empty">
          <el-icon :size="24" color="#9ca3af"><Document /></el-icon>
          <span>暂无可选报告模板，请先在公文模板管理中配置</span>
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
      <!-- 对话内容 -->
      <div class="chat-messages" ref="msgContainerRef">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <TutuEmpty :welcome="welcomeText" :questions="recommendQuestions" :on-ask="onAskRecommend" />
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
              <div v-else-if="msg.report" class="report-card" :id="'data-report-' + idx">
                <div class="rc-header">
                  <h3 class="rc-title">{{ msg.report.title }}</h3>
                  <div class="rc-header-right">
                    <div class="report-actions">
                      <el-button size="small" :icon="Download" @click="exportReport('pdf', msg.report, idx)">下载 PDF</el-button>
                      <el-button size="small" :icon="Document" @click="exportReport('word', msg.report, idx)">下载 Word</el-button>
                    </div>
                    <div class="rc-meta">
                      <span class="rc-tag">数据分析报告</span>
                      <span class="rc-tag rc-tag-blue">AI 自动生成</span>
                      <span class="rc-date">{{ msg.report.createdAt }}</span>
                    </div>
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
import { UploadFilled, Document, MagicStick, Download, Back, Clock, EditPen, TrendCharts, ZoomOut, DocumentChecked, ChatLineSquare, Paperclip, Promotion, CircleCheck } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { isWorkflowConfigured, queryReportHistoryList, queryReportHistoryDetail } from '@/api/cozeWorkflow'
import { exportElementToPdf, exportHtmlToWord } from '@/utils/reportExport'
import { getDataReportTemplates } from '@/api/reportTemplates'
import type { ReportTemplate } from '@/api/reportTemplates'
import TutuEmpty from '@/components/TutuEmpty.vue'

const overviewStats = ref([
  { label: '数据分析报告总数', value: '3份', icon: Document, bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  { label: '本地上传分析', value: '1份', icon: UploadFilled, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { label: '系统报表对比', value: '2份', icon: TrendCharts, bg: 'linear-gradient(135deg, #10b981, #059669)' },
  { label: 'AI 工作建议', value: '6条', icon: MagicStick, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
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

// 报告模板（取自公文模板管理，仅已发布且归属智能报告/数据分析报告）
const reportTemplates = ref<ReportTemplate[]>(getDataReportTemplates())
const selectedTemplate = ref<ReportTemplate | null>(null)

function selectTemplate(t: ReportTemplate) {
  selectedTemplate.value = t
}

// 对比模式
const compareMethod = ref('环比')
const compareFocus = ref('')

// 生成
const isGenerating = ref(false)
const canGenerate = computed(() => {
  if (!selectedTemplate.value) return false
  if (activeMode.value === 'upload') return !!uploadFile.value
  if (activeMode.value === 'compare') return true
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
const welcomeText = '我可以对业务数据做多维统计与趋势分析，自动产出分析报告。'
const recommendQuestions = ['分析近一年城镇新增就业趋势', '各地区社保参保结构对比分析', '本月社保基金收支异动分析报告']

function onAskRecommend(q: string) {
  if (messages.value.length > 0) return
  if (q.includes('城镇新增就业趋势')) {
    activeMode.value = 'compare'
    const tpl = reportTemplates.value.find(t => t.name === '城镇新增就业报表')
    if (tpl) selectedTemplate.value = tpl
    compareMethod.value = '环比'
    compareFocus.value = '城镇新增就业趋势'
  } else if (q.includes('社保参保结构')) {
    activeMode.value = 'compare'
    const tpl = reportTemplates.value.find(t => t.name === '城镇新增就业报表')
    if (tpl) selectedTemplate.value = tpl
    compareMethod.value = '同比'
    compareFocus.value = '重点群体帮扶成效'
  } else if (q.includes('社保基金收支')) {
    activeMode.value = 'compare'
    const tpl = reportTemplates.value.find(t => t.name === '创业担保贷款发放报表')
    if (tpl) selectedTemplate.value = tpl
    compareMethod.value = '双对比'
    compareFocus.value = '重点行业用工波动'
  }
  generateReport()
}

async function generateReport() {
  if (!canGenerate.value) {
    if (!selectedTemplate.value) {
      ElMessage.warning('请先选择报告模板')
    } else if (activeMode.value === 'upload' && !uploadFile.value) {
      ElMessage.warning('请先上传本地数据文件')
    }
    return
  }

  isGenerating.value = true
  const configDesc = activeMode.value === 'upload'
    ? `数据分析模式：上传本地数据\n报告模板：${selectedTemplate.value?.name}\n文件：${uploadFile.value?.name}\n报告标题：${reportTitle.value || '数据分析报告'}\n分析重点：${analysisFocus.value || '帮扶成效评估'}`
    : `数据分析模式：系统报表对比\n报告模板：${selectedTemplate.value?.name}\n对比方式：${compareMethod.value}\n分析重点：${compareFocus.value || '重点群体帮扶成效'}`

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
    report,
    messages: JSON.parse(JSON.stringify(messages.value))
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
  const reportName = selectedTemplate.value?.name || '城镇新增就业报表'
  const data = reportMap[reportName] || reportMap['城镇新增就业报表']

  return {
    title: data.title,
    createdAt: now,
    metrics: data.metrics,
    chartSvg: generateCompareChartSvg(reportName, compareMethod.value),
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

// ====== 报告导出（PDF / Word）======
const exporting = ref(false)
async function exportReport(cmd: string, report: any, idx: number) {
  if (exporting.value) return
  const baseName = `${report.title || '数据分析报告'}_${dayjs().format('YYYYMMDD_HHmm')}`
  if (cmd === 'pdf') {
    const el = document.getElementById(`data-report-${idx}`)
    if (!el) return
    exporting.value = true
    ElMessage.success('正在生成 PDF，请稍候...')
    try {
      await exportElementToPdf(el, report.title || '数据分析报告')
    } catch (e) {
      console.error(e)
      ElMessage.error('PDF 导出失败，请重试')
    } finally {
      exporting.value = false
    }
  } else if (cmd === 'word') {
    exportHtmlToWord(buildDataWordHtml(report), baseName)
    ElMessage.success('Word 文档已开始下载')
  }
}

function buildDataWordHtml(report: any): string {
  const metricRows = (report.metrics || [])
    .map((m: any) => `<tr><td>${m.label}</td><td>${m.value}</td><td>${m.trend >= 0 ? '上升' : '下降'} ${Math.abs(m.trend)}%</td></tr>`)
    .join('')
  const suggestions = (report.suggestions || [])
    .map((s: any, i: number) => `<li><strong>${s.title || '建议' + (i + 1)}：</strong>${s.detail || s}</li>`)
    .join('')
  const chart = report.chartSvg ? `<p style="text-align:center;">（图表请见导出的 PDF 版本）</p>` : ''
  return `
    <h2 class="report-doc-title">${report.title}</h2>
    <div class="report-doc-meta">数据分析报告 ｜ 生成时间：${report.createdAt || ''}</div>
    <h3>一、关键指标</h3>
    <table><thead><tr><th>指标</th><th>数值</th><th>环比情况</th></tr></thead><tbody>${metricRows}</tbody></table>
    ${chart}
    <h3>二、分析正文</h3>
    <div>${report.body || ''}</div>
    ${suggestions ? `<h3>三、AI 针对性工作建议</h3><ul>${suggestions}</ul>` : ''}
    <p class="report-doc-disclaimer">AI 生成内容仅供参考，请结合实际情况审核使用</p>`
}

// 历史
const showHistoryDrawer = ref(false)
const historyLoading = ref(false)
const historyList = ref<Array<{ id?: string | number; title: string; mode: string; createdAt: string; status: string; report: any; messages: any[] }>>([])

// 点击「查看历史报告」→ 工作流「查询历史报告列表」
async function openHistoryDrawer() {
  showHistoryDrawer.value = true
  if (!isWorkflowConfigured()) {
    console.warn('[coze-workflow] 未配置 VITE_WORKFLOW_HISTORY_LIST_ID，历史列表降级为本地数据')
    return
  }
  historyLoading.value = true
  try {
    const data = await queryReportHistoryList('data')
    const list = data?.list || data?.data || (Array.isArray(data) ? data : null)
    if (Array.isArray(list) && list.length >= 0) {
      historyList.value = list.map((item: any) => ({
        id: item.id ?? undefined,
        title: item.title || item.name || '未命名报告',
        mode: item.mode === 'upload' || item.mode === '上传' ? 'upload' : 'compare',
        createdAt: item.createdAt || item.genTime || item.createTime || '',
        status: item.status || '已完成',
        report: item.report || null,
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
async function openHistoryReport(row: any) {
  showHistoryDrawer.value = false
  if (isWorkflowConfigured() && row.id) {
    try {
      const data = await queryReportHistoryDetail(row.id)
      const detailMessages = data?.messages || data?.conversation
      if (Array.isArray(detailMessages)) {
        messages.value = JSON.parse(JSON.stringify(detailMessages))
        scrollToBottom()
        return
      }
    } catch (e: any) {
      ElMessage.error(`查询历史报告详情失败：${e?.message || e}`)
      return
    }
  }
  if (row.messages && row.messages.length > 0) {
    messages.value = JSON.parse(JSON.stringify(row.messages))
  } else {
    messages.value.push({
      role: 'ai',
      content: '',
      generating: false,
      report: row.report
    })
  }
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

/* 报告模板卡片（参考"选择调研主题"卡片） */
.template-list { display: flex; flex-direction: column; gap: 8px; }
.template-card {
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
.template-card:hover { border-color: #2563eb; background: #f0f5ff; }
.template-card.active { border-color: #2563eb; background: #f0f5ff; border-left: 3px solid #2563eb; }
.template-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #2563eb; flex-shrink: 0; }
.template-info { flex: 1; min-width: 0; }
.template-name { font-size: 13px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.template-check { color: #2563eb; font-size: 16px; margin-left: auto; }
.template-desc { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.5; }
.template-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 0; color: #9ca3af; font-size: 13px; text-align: center; }

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
.generate-section { margin-top: 16px; padding-top: 0; border-top: none; }
.generate-btn { width: 100%; height: 44px; font-size: 15px; }

/* ===== 右侧AI对话区 ===== */
.chat-area { flex: 1; display: flex; flex-direction: column; background: #f2f5fa; min-width: 0; }



/* 对话内容 */
.chat-messages { flex: 1; overflow-y: auto; padding: 20px; }
.empty-state { display: flex; height: 100%; }

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
.rc-header { background: linear-gradient(135deg, #eaf0fe, #f0f5ff); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.rc-header .rc-title { flex: 1; }
.rc-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.report-actions { display: flex; gap: 8px; }
.report-actions .el-button { padding: 6px 12px; }
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