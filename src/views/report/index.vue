<template>
  <div class="report-page">
    <div class="report-layout">
      <!-- ===== 左侧侧边栏 ===== -->
      <aside class="sidebar">
        <!-- 1. 报告配置 -->
        <div class="config-section">
          <div class="section-header">
            <el-icon color="#2563eb"><Setting /></el-icon>
            <span>报告配置</span>
          </div>

          <!-- ===== 第一区块：数据源选择（必选，标签切换互斥） ===== -->
          <div class="block-title">一、数据源选择</div>
          <div class="ds-tab-group">
            <div
              class="ds-tab-item"
              :class="{ active: dataSourceMode === 'system' }"
              @click="dataSourceMode = 'system'"
            >
              <el-icon :size="16"><DataAnalysis /></el-icon>
              <span>系统业务数据</span>
            </div>
            <div
              class="ds-tab-item"
              :class="{ active: dataSourceMode === 'upload' }"
              @click="dataSourceMode = 'upload'"
            >
              <el-icon :size="16"><Upload /></el-icon>
              <span>台账数据</span>
            </div>
          </div>

          <!-- 方式一：系统数据源 -->
          <div v-if="dataSourceMode === 'system'" class="ds-config-body">
            <div class="date-picker-row">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width:100%"
                value-format="YYYY-MM-DD"
              />
            </div>
            <div class="quick-btns">
              <el-button
                v-for="btn in quickBtns"
                :key="btn.label"
                size="small"
                :type="quickActive === btn.label ? 'primary' : 'default'"
                @click="handleQuickBtn(btn.label)"
              >{{ btn.label }}</el-button>
            </div>
          </div>

          <!-- 方式二：上传台账 -->
          <div v-if="dataSourceMode === 'upload'" class="ds-config-body">
            <div
              class="upload-area"
              :class="{ 'is-active': !!uploadedLedger }"
              @click="triggerUploadLedger"
              @dragover.prevent
              @drop.prevent="onDropLedger"
            >
              <input ref="ledgerInputRef" type="file" accept=".xlsx,.csv,.docx,.pdf" style="display:none" @change="onLedgerChange" />
              <template v-if="!uploadedLedger">
                <el-icon :size="28" color="#2563eb"><UploadFilled /></el-icon>
                <p class="upload-text">上传本地台账 Excel/CSV 数据源</p>
                <p class="upload-hint">AI 读取台账内容生成报告，支持 .xlsx .csv .docx .pdf</p>
              </template>
              <template v-else>
                <el-icon :size="20" color="#10b981"><Document /></el-icon>
                <span class="uploaded-name">{{ uploadedLedger.name }}</span>
                <el-button text type="danger" size="small" @click.stop="removeLedger">移除文件</el-button>
              </template>
            </div>
          </div>

          <!-- ===== 第二区块：参考素材（独立选填，三选一互斥） ===== -->
          <div class="ref-section">
            <div class="block-title ref-title">📎 参考素材 <el-tag size="small" type="warning" effect="plain" class="opt-tag">选填</el-tag></div>
            <p class="ref-desc">用于定义报告框架、公文文风、章节结构，素材不作为业务数据源</p>

            <el-radio-group v-model="refMaterialMode" class="ref-btn-group">
              <el-radio-button value="system">使用系统内置模板</el-radio-button>
              <el-radio-button value="custom">上传自定义参考模板</el-radio-button>
            </el-radio-group>

            <!-- 系统内置模板下拉 -->
            <div v-if="refMaterialMode === 'system'" class="ref-config-body">
              <el-select v-model="systemTemplateId" placeholder="请选择系统内置模板" style="width:100%">
                <el-option label="就业形势月度分析报告" value="monthly" />
                <el-option label="社保运行季报" value="quarterly" />
                <el-option label="重点群体就业监测报告" value="monitor" />
                <el-option label="零工市场运行分析报告" value="gig" />
                <el-option label="自定义专题报告" value="custom" />
              </el-select>
            </div>

            <!-- 自定义上传 -->
            <div v-if="refMaterialMode === 'custom'" class="ref-config-body">
              <div
                class="upload-area small-upload"
                :class="{ 'is-active': !!uploadedRef }"
                @click="triggerUploadRef"
                @dragover.prevent
                @drop.prevent="onDropRef"
              >
                <input ref="refInputRef" type="file" accept=".docx,.pdf" style="display:none" @change="onRefChange" />
                <template v-if="!uploadedRef">
                  <el-icon :size="20" color="#8b5cf6"><Upload /></el-icon>
                  <span class="upload-text-small">上传参考模板文档</span>
                </template>
                <template v-else>
                  <el-icon :size="18" color="#10b981"><Document /></el-icon>
                  <span class="uploaded-name">{{ uploadedRef.name }}</span>
                  <el-button text type="danger" size="small" @click.stop="removeRef">移除</el-button>
                </template>
              </div>
            </div>
          </div>

          <!-- ===== 第三区块：输出格式（多选） ===== -->
          <div class="block-title">三、输出格式</div>
          <div class="form-group">
            <el-checkbox-group v-model="outputFormats" class="checkbox-group">
              <el-checkbox value="word" label="word">Word 文档</el-checkbox>
              <el-checkbox value="pdf" label="pdf">PDF 文档</el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- ===== 第四区块：附加生成内容（选填多选） ===== -->
          <div class="block-title">四、附加生成内容</div>
          <div class="form-group">
            <el-checkbox-group v-model="extras" class="checkbox-group">
              <el-checkbox value="chart" label="chart">可视化图表</el-checkbox>
              <el-checkbox value="table" label="table">明细数据表</el-checkbox>
              <el-checkbox value="suggestion" label="suggestion">AI 工作建议</el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- ===== 底部操作按钮 ===== -->
          <div class="config-actions">
            <el-button @click="handleReset" class="reset-btn">重置配置</el-button>
            <el-button
              type="primary"
              :disabled="!canGenerate"
              :loading="generating"
              class="generate-btn"
              @click="handleGenerate"
            >
              <el-icon v-if="!generating"><MagicStick /></el-icon>
              {{ generating ? 'AI 生成中...' : '生成智能分析报告' }}
            </el-button>
          </div>
        </div>

        <!-- 2. 最近生成报告历史 -->
        <div class="history-section">
          <div class="section-header">
            <el-icon color="#2563eb"><Clock /></el-icon>
            <span>最近生成报告历史</span>
          </div>
          <div v-if="historyList.length > 0" class="history-list">
            <div v-for="(h, idx) in historyList" :key="idx" class="history-item">
              <div class="h-top">
                <span class="h-name">{{ h.name }}</span>
                <span class="h-time">{{ h.genTime }}</span>
              </div>
              <div class="h-meta">
                <el-tag size="small" type="info" effect="plain">{{ h.dataSourceMode === 'system' ? '系统数据' : '台账数据' }}</el-tag>
                <el-tag v-if="h.refMaterialInfo" size="small" type="warning" effect="plain">{{ h.refMaterialInfo }}</el-tag>
              </div>
              <div class="h-actions">
                <el-button text size="small" type="primary" @click="handleOpenHistory(h)">打开</el-button>
                <el-button text size="small" type="primary" @click="handleDownload(h)">下载</el-button>
                <el-button text size="small" type="primary" @click="handleRegenerate(h)">重新生成</el-button>
              </div>
            </div>
          </div>
          <div v-else class="history-empty">暂无生成历史记录</div>
        </div>
      </aside>

      <!-- ===== 右侧主区域 ===== -->
      <main class="main-area">
        <!-- 右上：报告预览 -->
        <div class="preview-section">
          <!-- 空态 -->
          <div v-if="!reportData" class="empty-state">
            <el-icon :size="56" color="#d1d5db"><TrendCharts /></el-icon>
            <p class="empty-title">选择左侧配置生成智能分析报告</p>
            <p class="empty-desc">AI 将基于系统数据或您上传的台账数据，自动生成带关键指标、图表和工作建议的完整分析报告</p>
          </div>

          <!-- 报告内容 -->
          <div v-else class="report-view">
            <!-- 报告头部 -->
            <div class="report-head">
              <div class="rh-top">
                <h2 class="report-title">{{ reportData.title }}</h2>
                <div class="rh-actions">
                  <el-button size="small" @click="handleRefreshReport">
                    <el-icon><Refresh /></el-icon> 重新生成
                  </el-button>
                  <el-button type="primary" size="small" @click="handleExport">
                    <el-icon><Download /></el-icon> 导出
                  </el-button>
                </div>
              </div>
              <div class="rh-meta">
                <el-tag type="info" effect="plain" size="small">统计周期：{{ reportData.period }}</el-tag>
                <el-tag type="success" effect="plain" size="small">生成时间：{{ reportData.genTime }}</el-tag>
                <el-tag v-if="reportData.refTemplate" type="warning" effect="plain" size="small">参考素材：{{ reportData.refTemplate }}</el-tag>
              </div>
            </div>

            <!-- 关键指标卡片 -->
            <div v-if="reportMetrics.length > 0" class="metrics-grid">
              <div
                v-for="(m, idx) in reportMetrics"
                :key="idx"
                class="metric-card"
                :class="m.colorClass"
              >
                <div class="m-label">{{ m.label }}</div>
                <div class="m-value">{{ m.value }}</div>
                <div class="m-change" :class="{ up: m.trend > 0, down: m.trend < 0 }">
                  {{ m.trend > 0 ? '↑' : '↓' }} {{ Math.abs(m.trend) }}%
                  <span class="m-comp">较上期</span>
                </div>
              </div>
            </div>

            <!-- 内置图表 -->
            <div v-if="showChart" class="chart-block">
              <div ref="chartRef" class="chart-container"></div>
            </div>

            <!-- 数据表 -->
            <div v-if="showTable" class="data-table-block">
              <h3 class="block-title">明细数据表</h3>
              <el-table :data="detailTableData" border stripe size="small" max-height="300">
                <el-table-column prop="indicator" label="指标" min-width="140" />
                <el-table-column prop="current" label="本期值" width="120" />
                <el-table-column prop="prev" label="上期值" width="120" />
                <el-table-column prop="change" label="同比变化" width="120">
                  <template #default="{ row }">
                    <span :class="row.change.startsWith('+') ? 'text-green' : row.change.startsWith('-') ? 'text-red' : ''">
                      {{ row.change }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 报告正文 -->
            <div class="report-text">
              <div v-html="formatReport(reportData.content)"></div>
            </div>

            <!-- AI 建议 -->
            <div v-if="showSuggestion" class="ai-suggestions-block">
              <div class="suggest-header">
                <el-icon :size="20" color="#fff"><Promotion /></el-icon>
                <span>AI 智能分析建议</span>
                <el-tag type="warning" size="small" class="ai-tag">智能建议</el-tag>
              </div>
              <ul class="suggest-list">
                <li v-for="(s, i) in reportData.suggestions" :key="i">
                  <span class="s-index">{{ i + 1 }}.</span>
                  <span>{{ s }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 右下：AI 对话调整面板 -->
        <div class="chat-section">
          <div class="chat-header">
            <div class="ch-left">
              <el-icon color="#2563eb"><ChatDotSquare /></el-icon>
              <span>途途报告调整助手</span>
            </div>
            <el-tag size="small" type="info" effect="plain">生成初稿后，可在此对话调整报告</el-tag>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-if="chatMessages.length === 0" class="chat-empty">
              <el-icon :size="32" color="#d1d5db"><ChatLineSquare /></el-icon>
              <p>生成报告后，在此输入调整指令迭代修改报告内容</p>
            </div>
            <div
              v-for="msg in chatMessages"
              :key="msg.id"
              class="chat-msg"
              :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'"
            >
              <div class="msg-avatar">
                <el-avatar :size="32" :style="msg.role === 'user' ? { background: '#2563eb' } : { background: '#f59e0b' }">
                  {{ msg.role === 'user' ? '我' : '途' }}
                </el-avatar>
              </div>
              <div class="msg-bubble">
                <div class="msg-text">{{ msg.content }}</div>
                <div class="msg-time">{{ msg.time }}</div>
              </div>
            </div>
          </div>
          <div class="chat-input-bar">
            <el-input
              v-model="chatInput"
              type="textarea"
              :rows="2"
              placeholder="例如：精简报告第三章节、增加高校毕业生就业风险研判、删除数据表、参照上传的参考模板调整全文框架"
              resize="none"
              :disabled="!reportData"
            />
            <el-button
              type="primary"
              :disabled="!chatInput.trim() || !reportData"
              @click="handleSendChat"
              class="send-btn"
            >
              <el-icon><Promotion /></el-icon> 发送
            </el-button>
          </div>
          <div class="chat-examples">
            <span class="example-label">常见指令：</span>
            <el-tag
              v-for="ex in chatExamples"
              :key="ex"
              size="small"
              effect="plain"
              style="cursor:pointer; margin-right:6px; margin-bottom:4px"
              @click="quickFillExample(ex)"
            >{{ ex }}</el-tag>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  MagicStick,
  UploadFilled,
  Upload,
  Document,
  Clock,
  TrendCharts,
  Download,
  Refresh,
  Promotion,
  ChatDotSquare,
  ChatLineSquare
} from '@element-plus/icons-vue'
import { fetchReportTemplates, generateReport } from '@/api/mock'
import type { ReportTemplate } from '@/types'
import * as echarts from 'echarts'

// ===== 数据源（第一区块） =====
const dataSourceMode = ref<'system' | 'upload'>('system')

// 系统数据源
const dateRange = ref<string[]>([])
const quickBtns = [
  { label: '本月' },
  { label: '本季度' },
  { label: '上半年' },
  { label: '本年度' }
]
const quickActive = ref('')

// 上传台账
const ledgerInputRef = ref<HTMLInputElement | null>(null)
const uploadedLedger = ref<File | null>(null)

// ===== 参考素材（第二区块，三选一互斥） =====
const refMaterialMode = ref<'none' | 'system' | 'custom'>('system')
// 系统内置模板
const systemTemplateId = ref('monthly')
// 自定义上传
const refInputRef = ref<HTMLInputElement | null>(null)
const uploadedRef = ref<File | null>(null)

const systemTemplates = [
  { label: '就业形势月度分析报告', value: 'monthly' },
  { label: '社保运行季报', value: 'quarterly' },
  { label: '重点群体就业监测报告', value: 'monitor' },
  { label: '零工市场运行分析报告', value: 'gig' },
  { label: '自定义专题报告', value: 'custom' }
]

// ===== 输出格式（第三区块） =====
const outputFormats = ref<string[]>(['word'])

// ===== 附加生成内容（第四区块） =====
const extras = ref<string[]>(['chart', 'table', 'suggestion'])

// ===== 生成状态 =====
const generating = ref(false)
const templates = ref<ReportTemplate[]>([])

// ===== 计算属性 =====
const canGenerate = computed(() => {
  const hasDs = dataSourceMode.value === 'system'
    ? true
    : !!uploadedLedger.value
  return hasDs && outputFormats.value.length > 0
})

// ===== 快捷日期按钮 =====
function handleQuickBtn(label: string) {
  quickActive.value = label
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  let start: string, end: string
  switch (label) {
    case '本月':
      start = `${y}-${m}-01`
      end = `${y}-${m}-${d}`
      break
    case '本季度': {
      const q = Math.floor((now.getMonth()) / 3) * 3
      start = `${y}-${String(q + 1).padStart(2, '0')}-01`
      end = `${y}-${m}-${d}`
      break
    }
    case '上半年':
      start = `${y}-01-01`
      end = `${y}-06-30`
      break
    case '本年度':
      start = `${y}-01-01`
      end = `${y}-12-31`
      break
    default:
      return
  }
  dateRange.value = [start, end]
}

// ===== 上传台账 =====
function triggerUploadLedger() { ledgerInputRef.value?.click() }
function onLedgerChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件大小不能超过 10MB'); return }
    uploadedLedger.value = file
    ElMessage.success(`已上传台账数据：${file.name}`)
  }
}
function onDropLedger(e: DragEvent) {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件大小不能超过 10MB'); return }
    uploadedLedger.value = file
    ElMessage.success(`已上传台账数据：${file.name}`)
  }
}
function removeLedger() {
  uploadedLedger.value = null
  if (ledgerInputRef.value) ledgerInputRef.value.value = ''
}

// ===== 参考素材上传 =====
function triggerUploadRef() { refInputRef.value?.click() }
function onRefChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件大小不能超过 10MB'); return }
    uploadedRef.value = file
    ElMessage.success(`已上传参考模板：${file.name}`)
  }
}
function onDropRef(e: DragEvent) {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件大小不能超过 10MB'); return }
    uploadedRef.value = file
    ElMessage.success(`已上传参考模板：${file.name}`)
  }
}
function removeRef() {
  uploadedRef.value = null
  if (refInputRef.value) refInputRef.value.value = ''
}

// ===== 报告数据 =====
const reportData = ref<{
  title: string
  period: string
  genTime: string
  content: string
  suggestions: string[]
  refTemplate?: string
  metrics?: { label: string; value: string; trend: number }[]
  detailTable?: { indicator: string; current: string; prev: string; change: string }[]
  chartData?: { name: string; value: number }[]
} | null>(null)

const reportMetrics = computed(() => {
  return reportData.value?.metrics?.map((m, i) => ({
    ...m,
    colorClass: ['metric-blue', 'metric-green', 'metric-orange', 'metric-red'][i % 4]
  })) || []
})

const showChart = computed(() => extras.value.includes('chart') && reportData.value?.chartData)
const showTable = computed(() => extras.value.includes('table') && reportData.value?.detailTable)
const showSuggestion = computed(() => extras.value.includes('suggestion') && reportData.value?.suggestions?.length)
const detailTableData = computed(() => reportData.value?.detailTable || [])

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// ===== 历史记录 =====
interface HistoryItem {
  name: string
  period: string
  genTime: string
  dataSourceMode: 'system' | 'upload'
  refMaterialMode: 'none' | 'system' | 'custom'
  refMaterialInfo?: string
  systemTemplateId?: string
  ledgerFileName?: string
  refFileName?: string
  metrics?: { label: string; value: string; trend: number }[]
  detailTable?: { indicator: string; current: string; prev: string; change: string }[]
  chartData?: { name: string; value: number }[]
  content: string
  suggestions: string[]
}

const historyList = ref<HistoryItem[]>([])

// ===== AI 对话 =====
interface ChatMessage {
  id: number
  role: 'user' | 'ai'
  content: string
  time: string
}
const chatMessages = ref<ChatMessage[]>([])
const chatInput = ref('')
const chatMessagesRef = ref<HTMLElement | null>(null)
const chatExamples = [
  '精简报告第三章节',
  '增加高校毕业生就业风险研判',
  '删除数据表',
  '重新生成 AI 工作建议',
  '参照上传的参考模板调整全文框架',
  '把语言调整为正式公文风格'
]

function quickFillExample(ex: string) {
  chatInput.value = ex
}

// ===== 生命周期 =====
onMounted(async () => {
  templates.value = await fetchReportTemplates()
  handleQuickBtn('本月')
  // 模拟历史
  historyList.value = [
    {
      name: '就业形势月度分析报告', period: '2025-01~2025-12',
      genTime: '2025-12-20 10:30',
      dataSourceMode: 'system',
      refMaterialMode: 'custom',
      refMaterialInfo: '参考模板：上月报告模板.docx',
      refFileName: '上月报告模板.docx',
      metrics: [
        { label: '总参保人数', value: '428.6万', trend: 5.8 },
        { label: '新增就业人数', value: '18.7万', trend: 8.3 },
        { label: '人才净流入', value: '3.2万', trend: 12.6 },
        { label: '劳动关系立案数', value: '1248件', trend: -9.2 }
      ],
      detailTable: [
        { indicator: '城镇新增就业', current: '12,580人', prev: '11,960人', change: '+5.2%' },
        { indicator: '失业登记人数', current: '3,420人', prev: '3,493人', change: '-2.1%' },
        { indicator: '技能培训人数', current: '4,230人', prev: '3,898人', change: '+8.5%' }
      ],
      chartData: [
        { name: '城镇新增就业', value: 12580 },
        { name: '失业登记', value: 3420 },
        { name: '技能培训', value: 4230 },
        { name: '困难人员帮扶', value: 2156 },
        { name: '灵活就业', value: 5870 }
      ],
      content: `一、总体情况
2025年1-12月，我市就业形势总体稳定，各项指标保持在合理区间，主要指标完成情况良好。

二、主要指标分析
1. 城镇新增就业：全年累计新增就业12,580人，同比增长5.2%，完成年度目标任务的105.3%。
2. 失业登记：全年失业登记3,420人，同比下降2.1%，就业稳定性持续增强。
3. 技能培训：全年开展技能培训4,230人，同比增长8.5%，培训覆盖面和精准度进一步提升。
4. 困难人员帮扶：全年帮扶困难人员就业2,156人，完成目标任务的107.8%。

三、存在问题
1. 部分行业就业压力仍然较大，特别是传统制造业转型升级带来的就业结构调整压力。
2. 结构性矛盾依然突出，高技能人才供给不足与普通劳动力过剩并存。

四、下一步工作建议
1. 加大职业技能培训力度，特别是针对新兴产业和新业态的技能培训。
2. 完善就业服务体系，加强就业信息平台建设，提高人岗匹配效率。
3. 强化重点群体就业帮扶，确保高校毕业生、困难人员等重点群体就业稳定。`,
      suggestions: [
        '建议加强第四季度就业形势监测，重点关注返乡农民工就业情况',
        '建议加大对新业态从业人员社保覆盖力度',
        '建议优化就业服务信息系统，实现"一网通办"'
      ]
    }
  ]
})

// ===== 生成报告 =====
async function handleGenerate() {
  // 表单校验
  if (!canGenerate.value) {
    if (!outputFormats.value.length) { ElMessage.warning('请至少选择一种输出格式'); return }
    ElMessage.warning('请完成数据源配置')
    return
  }

  // 素材互斥校验（单选控件已保障，保留防御性检查）
  // 已通过 radio 互斥，无需额外校验

  generating.value = true
  try {
    const periodStr = dateRange.value.length === 2
      ? `${dateRange.value[0]}~${dateRange.value[1]}`
      : '2025年度'

    const result = await generateReport(
      refMaterialMode.value === 'system' ? systemTemplateId.value : 'custom',
      periodStr
    )

    // 构建参考素材信息
    let refMaterialInfo: string | undefined
    if (refMaterialMode.value === 'system') {
      const tpl = systemTemplates.find(t => t.value === systemTemplateId.value)
      refMaterialInfo = tpl?.label || '系统内置模板'
    } else if (refMaterialMode.value === 'custom' && uploadedRef.value) {
      refMaterialInfo = `参考模板：${uploadedRef.value.name}`
    }

    // 模拟指标数据
    const mockMetrics = [
      { label: '总参保人数', value: '428.6万', trend: 5.8 },
      { label: '新增就业人数', value: '18.7万', trend: 8.3 },
      { label: '人才净流入', value: '3.2万', trend: 12.6 },
      { label: '劳动关系立案数', value: '1248件', trend: -9.2 }
    ]

    const mockDetailTable = [
      { indicator: '城镇新增就业', current: '12,580人', prev: '11,960人', change: '+5.2%' },
      { indicator: '失业登记人数', current: '3,420人', prev: '3,493人', change: '-2.1%' },
      { indicator: '技能培训人数', current: '4,230人', prev: '3,898人', change: '+8.5%' },
      { indicator: '困难人员帮扶', current: '2,156人', prev: '2,000人', change: '+7.8%' },
      { indicator: '灵活就业人数', current: '5,870人', prev: '5,200人', change: '+12.9%' }
    ]

    const mockChartData = [
      { name: '城镇新增就业', value: 12580 },
      { name: '失业登记', value: 3420 },
      { name: '技能培训', value: 4230 },
      { name: '困难人员帮扶', value: 2156 },
      { name: '灵活就业', value: 5870 }
    ]

    reportData.value = {
      title: result.title,
      period: periodStr,
      genTime: new Date().toLocaleString('zh-CN'),
      content: result.content,
      suggestions: result.suggestions,
      refTemplate: refMaterialInfo,
      metrics: mockMetrics,
      detailTable: mockDetailTable,
      chartData: mockChartData
    }

    // 加入历史
    const h: HistoryItem = {
      name: reportData.value.title,
      period: periodStr,
      genTime: reportData.value.genTime,
      dataSourceMode: dataSourceMode.value,
      refMaterialMode: refMaterialMode.value,
      refMaterialInfo: refMaterialInfo,
      systemTemplateId: refMaterialMode.value === 'system' ? systemTemplateId.value : undefined,
      ledgerFileName: uploadedLedger.value?.name,
      refFileName: uploadedRef.value?.name,
      metrics: mockMetrics,
      detailTable: mockDetailTable,
      chartData: mockChartData,
      content: result.content,
      suggestions: result.suggestions
    }
    historyList.value.unshift(h)
    if (historyList.value.length > 10) historyList.value = historyList.value.slice(0, 10)

    // 清空对话
    chatMessages.value = []
    chatMessages.value.push({
      id: Date.now(),
      role: 'ai',
      content: '报告已生成！您可以在下方输入调整指令对报告进行迭代修改，例如：精简第三章节、增加同比分析、参照模板调整框架等。',
      time: new Date().toLocaleString('zh-CN')
    })

    ElMessage.success('报告生成成功！')
    await nextTick()
    initChart()
  } catch {
    ElMessage.error('报告生成失败，请重试')
  } finally {
    generating.value = false
  }
}

// ===== 图表渲染 =====
function initChart() {
  if (!chartRef.value || !reportData.value?.chartData) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: reportData.value.chartData.map(d => d.name),
      axisLabel: { fontSize: 12, color: '#6b7280' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 12, color: '#6b7280' }
    },
    series: [{
      type: 'bar',
      data: reportData.value.chartData.map(d => d.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2563eb' },
          { offset: 1, color: '#93c5fd' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: 32
    }]
  })
}

// ===== 重置 =====
function handleReset() {
  dataSourceMode.value = 'system'
  dateRange.value = []
  quickActive.value = ''
  uploadedLedger.value = null
  refMaterialMode.value = 'system'
  systemTemplateId.value = 'monthly'
  uploadedRef.value = null
  outputFormats.value = ['word']
  extras.value = ['chart', 'table', 'suggestion']
  if (ledgerInputRef.value) ledgerInputRef.value.value = ''
  if (refInputRef.value) refInputRef.value.value = ''
  ElMessage.success('配置已重置')
}

// ===== 刷新报告 =====
function handleRefreshReport() {
  ElMessage.info('正在重新生成报告...')
  handleGenerate()
}

// ===== 导出 =====
function handleExport() {
  const formats = outputFormats.value.join('、')
  ElMessage.success(`${formats} 文件导出成功，已自动下载`)
}

// ===== 历史操作 =====
function handleOpenHistory(h: HistoryItem) {
  reportData.value = {
    title: h.name,
    period: h.period,
    genTime: h.genTime,
    content: h.content,
    suggestions: h.suggestions,
    refTemplate: h.refMaterialInfo,
    metrics: h.metrics,
    detailTable: h.detailTable,
    chartData: h.chartData
  }
  ElMessage.success(`已加载报告：${h.name}`)
  nextTick(() => initChart())
}

function handleDownload(h: HistoryItem) {
  ElMessage.success(`"${h.name}" 导出成功`)
}

function handleRegenerate(h: HistoryItem) {
  // 回填数据源配置
  dataSourceMode.value = h.dataSourceMode
  if (h.dataSourceMode === 'system') {
    handleQuickBtn('本月')
  }
  // 回填参考素材配置
  refMaterialMode.value = h.refMaterialMode
  if (h.refMaterialMode === 'system' && h.systemTemplateId) {
    systemTemplateId.value = h.systemTemplateId
  } else if (h.refMaterialMode === 'custom' && h.refFileName) {
    uploadedRef.value = new File([], h.refFileName)
  }
  // 回填台账
  if (h.ledgerFileName) {
    uploadedLedger.value = new File([], h.ledgerFileName)
  }
  ElMessage.info(`正在复用"${h.name}"的配置重新生成...`)
  handleGenerate()
}

// ===== AI 对话 =====
function handleSendChat() {
  if (!chatInput.value.trim() || !reportData.value) return
  const userMsg: ChatMessage = {
    id: Date.now(),
    role: 'user',
    content: chatInput.value.trim(),
    time: new Date().toLocaleString('zh-CN')
  }
  chatMessages.value.push(userMsg)
  chatInput.value = ''

  setTimeout(() => {
    const aiMsg: ChatMessage = {
      id: Date.now() + 1,
      role: 'ai',
      content: `已根据您的指令"${userMsg.content}"对报告进行了调整。预览区已同步更新最新版本，请查看。如需进一步修改，请继续提出调整要求。`,
      time: new Date().toLocaleString('zh-CN')
    }
    chatMessages.value.push(aiMsg)
    nextTick(() => {
      chatMessagesRef.value?.scrollTo({ top: chatMessagesRef.value.scrollHeight, behavior: 'smooth' })
    })
  }, 800)

  nextTick(() => {
    chatMessagesRef.value?.scrollTo({ top: chatMessagesRef.value.scrollHeight, behavior: 'smooth' })
  })
}

// ===== 格式化报告 =====
function formatReport(content: string) {
  return content
    .replace(/\n/g, '<br>')
    .replace(/^(一|二|三|四|五|六|七|八)\u3001/gm, '<h3 class="sec-title">$1、</h3>')
    .replace(/^(\d+)\.\s/gm, '<strong class="num-title">$1. </strong>')
}

// 监听数据源切换 → 清空对方
watch(dataSourceMode, (val) => {
  if (val === 'system') {
    uploadedLedger.value = null
    if (ledgerInputRef.value) ledgerInputRef.value.value = ''
  } else {
    dateRange.value = []
    quickActive.value = ''
  }
})
</script>

<style scoped>
.report-page {
  height: calc(100vh - 96px);
  overflow: hidden;
}
.report-layout {
  display: flex;
  height: 100%;
  gap: 16px;
}

/* ===== 左侧侧边栏 ===== */
.sidebar {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
}

.config-section,
.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

/* 区块标题 */
.block-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10px;
  margin-top: 4px;
}

/* 数据源标签切换 */
.ds-tab-group {
  display: flex;
  background: #f0f4ff;
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 12px;
  gap: 2px;
}
.ds-tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}
.ds-tab-item:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}
.ds-tab-item.active {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}
.ds-tab-item.active .el-icon {
  color: #ffffff;
}
.ds-tab-item .el-icon {
  transition: color 0.25s ease;
}
.ds-config-body {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.date-picker-row {
  width: 100%;
}
.quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbfc;
}
.upload-area:hover {
  border-color: #2563eb;
  background: #eff6ff;
}
.upload-area.is-active {
  border-color: #10b981;
  background: #f0fdf4;
}
.upload-text {
  font-size: 13px;
  color: #374151;
  margin: 8px 0 4px;
}
.upload-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
.uploaded-name {
  font-size: 13px;
  color: #374151;
  margin-left: 6px;
}
.small-upload {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.upload-text-small {
  font-size: 13px;
  color: #6b7280;
}

/* 参考素材区块 */
.ref-section {
  margin-bottom: 16px;
  padding: 14px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.ref-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.opt-tag {
  font-size: 11px;
}
.ref-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 12px;
}
.ref-radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.ref-btn-group {
  display: flex;
  gap: 0;
  margin: 10px 0 4px;
  width: 100%;
}
.ref-btn-group .el-radio-button {
  flex: 1;
}
.ref-btn-group .el-radio-button__inner {
  width: 100%;
  font-size: 13px;
  padding: 8px 4px;
  border-color: #d1d5db;
  color: #374151;
}
.ref-btn-group .el-radio-button.is-active .el-radio-button__inner {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-color: #2563eb;
  color: #fff;
  box-shadow: none;
}
.ref-config-body {
  margin-top: 10px;
  padding-left: 22px;
}

/* 表单组 */
.form-group {
  margin-bottom: 14px;
}
.checkbox-group {
  display: flex;
  gap: 16px;
}

/* 操作按钮 */
.config-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.reset-btn {
  flex: 1;
  border-color: #d1d5db;
}
.generate-btn {
  flex: 2;
  background: #2563eb;
  border-color: #2563eb;
  font-weight: 600;
}
.generate-btn:disabled {
  background: #93c5fd;
  border-color: #93c5fd;
}

/* 历史记录 */
.history-section {
  flex-shrink: 0;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}
.history-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
}
.history-item:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.h-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.h-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}
.h-time {
  font-size: 11px;
  color: #9ca3af;
}
.h-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.h-actions {
  display: flex;
  gap: 4px;
}
.history-empty {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
}

/* ===== 右侧主区域 ===== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}

/* 预览区 */
.preview-section {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  overflow-y: auto;
  min-height: 0;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #9ca3af;
}
.empty-title {
  font-size: 17px;
  color: #6b7280;
  margin-top: 16px;
  font-weight: 600;
}
.empty-desc {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 8px;
  text-align: center;
  max-width: 400px;
}

/* 报告头部 */
.report-head {
  padding-bottom: 16px;
  border-bottom: 2px solid #2563eb;
  margin-bottom: 20px;
}
.rh-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.report-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}
.rh-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.rh-meta {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

/* 指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.metric-card {
  padding: 16px;
  border-radius: 10px;
  border-left: 4px solid;
  background: #fafbfc;
}
.metric-card.metric-blue { border-left-color: #2563eb; }
.metric-card.metric-green { border-left-color: #10b981; }
.metric-card.metric-orange { border-left-color: #f59e0b; }
.metric-card.metric-red { border-left-color: #ef4444; }
.m-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}
.m-value {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
}
.m-change {
  font-size: 12px;
  margin-top: 4px;
  color: #9ca3af;
}
.m-change.up { color: #10b981; }
.m-change.down { color: #ef4444; }
.m-comp { color: #9ca3af; margin-left: 4px; }

/* 图表 */
.chart-block {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
}
.chart-container {
  height: 260px;
  width: 100%;
}

/* 数据表 */
.data-table-block {
  margin-bottom: 20px;
}
.data-table-block .block-title {
  font-size: 15px;
  margin-bottom: 10px;
}

/* 报告正文 */
.report-text {
  margin-bottom: 20px;
  font-family: SimSun, '宋体', serif;
  line-height: 2;
  font-size: 15px;
  color: #1f2937;
}
.report-text :deep(.sec-title) {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 16px 0 10px;
}
.report-text :deep(.num-title) {
  font-weight: 600;
  color: #374151;
}

/* AI 建议 */
.ai-suggestions-block {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 10px;
  padding: 18px 20px;
  margin-top: 16px;
}
.suggest-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 12px;
}
.ai-tag {
  font-size: 11px;
}
.suggest-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.suggest-list li {
  display: flex;
  gap: 6px;
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 4px;
}
.s-index {
  font-weight: 600;
  color: #2563eb;
  flex-shrink: 0;
}

/* ===== AI 对话面板 ===== */
.chat-section {
  flex-shrink: 0;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 14px 18px;
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 8px;
}
.ch-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  min-height: 60px;
  max-height: 120px;
  margin-bottom: 8px;
}
.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
  color: #9ca3af;
  font-size: 13px;
}
.chat-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.msg-user { justify-content: flex-end; }
.msg-ai { justify-content: flex-start; }
.msg-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.msg-user .msg-bubble {
  background: #2563eb;
  color: #fff;
  border-top-right-radius: 2px;
}
.msg-ai .msg-bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-top-left-radius: 2px;
}
.msg-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}
.msg-user .msg-time { text-align: right; }
.chat-input-bar {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.send-btn {
  flex-shrink: 0;
  height: 46px;
}
.chat-examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 6px;
}
.example-label {
  font-size: 12px;
  color: #9ca3af;
  margin-right: 6px;
  flex-shrink: 0;
}

/* 文本颜色 */
.text-green { color: #10b981; }
.text-red { color: #ef4444; }
</style>