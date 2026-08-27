<template>
  <div class="research-report-page">
    <!-- 顶部概览统计 -->
    <div class="overview-row">
      <div class="overview-card" v-for="item in overviewStats" :key="item.label">
        <div class="overview-icon" :style="{ background: item.bg }">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-value">{{ item.value }}</span>
          <span class="overview-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 调研主题模板卡片 -->
    <div class="template-grid">
      <div
        class="template-card"
        v-for="(tpl, idx) in topicTemplates"
        :key="idx"
        :class="{ active: selectedTemplate === idx }"
        @click="selectedTemplate = idx"
      >
        <div class="tpl-icon" :style="{ background: tpl.bg }">
          <el-icon :size="22"><component :is="tpl.icon" /></el-icon>
        </div>
        <div class="tpl-info">
          <div class="tpl-name">{{ tpl.name }}</div>
          <div class="tpl-desc">{{ tpl.desc }}</div>
        </div>
        <el-tag v-if="tpl.tag" size="small" :type="tpl.tagType as any">{{ tpl.tag }}</el-tag>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" size="large" @click="showWizard = true" :disabled="selectedTemplate === null">
        <el-icon style="margin-right:6px"><MagicStick /></el-icon>
        生成调研分析报告
      </el-button>
      <el-button size="large" @click="showHistory = !showHistory">
        <el-icon><Clock /></el-icon>
        {{ showHistory ? '隐藏报告列表' : '查看历史报告' }}
      </el-button>
    </div>

    <!-- 历史报告列表 -->
    <div v-if="showHistory" class="history-section">
      <div class="section-header">
        <h3>已生成的调研报告</h3>
        <div class="filter-bar">
          <el-select v-model="historyFilter.topic" placeholder="调研主题" clearable style="width:160px">
            <el-option label="全部主题" value="" />
            <el-option v-for="t in topicTemplates" :key="t.name" :label="t.name" :value="t.name" />
          </el-select>
          <el-select v-model="historyFilter.status" placeholder="状态" clearable style="width:120px;margin-left:8px">
            <el-option label="全部状态" value="" />
            <el-option label="已完成" value="completed" />
            <el-option label="生成中" value="generating" />
            <el-option label="待润色" value="polish" />
          </el-select>
        </div>
      </div>
      <el-table :data="filteredHistory" stripe @row-click="loadHistoryReport">
        <el-table-column prop="title" label="报告名称" min-width="200" />
        <el-table-column prop="topic" label="调研主题" width="180" />
        <el-table-column prop="period" label="调研周期" width="200" />
        <el-table-column prop="createdAt" label="生成时间" width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'generating' ? 'warning' : 'info'" size="small">
              {{ row.status === 'completed' ? '已完成' : row.status === 'generating' ? '生成中' : '待润色' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click.stop="loadHistoryReport(row as any)">查看</el-button>
            <el-button text type="danger" size="small" @click.stop="deleteHistory(row as any)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 报告详情 -->
    <div v-if="currentReport" class="report-detail">
      <div class="report-header">
        <div class="rh-left">
          <h2>{{ currentReport.title }}</h2>
          <div class="rh-meta">
            <span>调研周期：{{ currentReport.period }}</span>
            <span class="sep">|</span>
            <span>生成时间：{{ currentReport.createdAt }}</span>
            <el-tag size="small" :type="currentReport.status === 'completed' ? 'success' : 'info'" style="margin-left:8px">
              {{ currentReport.status === 'completed' ? '已完成' : '待润色' }}
            </el-tag>
          </div>
        </div>
        <div class="rh-actions">
          <el-button @click="exportReport('word')"><el-icon><Download /></el-icon>导出 Word</el-button>
          <el-button @click="exportReport('pdf')"><el-icon><Download /></el-icon>导出 PDF</el-button>
          <el-button @click="currentReport = null; showHistory = true" text>
            <el-icon><Back /></el-icon>返回列表
          </el-button>
        </div>
      </div>

      <!-- 关键指标 -->
      <div class="metrics-row">
        <div class="metric-card" v-for="m in currentReport.metrics" :key="m.label">
          <div class="metric-top" :style="{ borderColor: m.color }">
            <span class="metric-label">{{ m.label }}</span>
            <span class="metric-value" :style="{ color: m.color }">{{ m.value }}</span>
          </div>
          <div class="metric-change">
            <span :class="m.change >= 0 ? 'up' : 'down'">
              {{ m.change >= 0 ? '↑' : '↓' }}{{ Math.abs(m.change) }}%
            </span>
            <span class="change-label">较上期</span>
          </div>
        </div>
      </div>

      <!-- 报告正文 -->
      <div class="report-body">
        <div class="body-section" v-for="(section, i) in currentReport.sections" :key="i">
          <h3 class="section-title">{{ section.title }}</h3>
          <div class="section-content" v-html="section.content"></div>
        </div>

        <!-- 对比图表 -->
        <div class="body-section">
          <h3 class="section-title">对比分析图表</h3>
          <div class="chart-area">
            <div class="chart-placeholder" ref="comparisonChartRef"></div>
          </div>
        </div>

        <!-- AI 工作建议 -->
        <div class="body-section">
          <h3 class="section-title">AI 工作建议</h3>
          <div class="ai-suggestions">
            <div class="suggestion-item" v-for="(s, i) in currentReport.aiSuggestions" :key="i">
              <span class="suggestion-num">{{ i + 1 }}</span>
              <span class="suggestion-text">{{ s }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 润色功能 -->
      <div class="polish-section">
        <div class="polish-header">
          <el-icon color="#2563eb"><EditPen /></el-icon>
          <span>AI 润色</span>
          <el-tooltip content="基于当前报告内容进行智能优化" placement="top">
            <el-icon class="polish-help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="polish-btns">
          <el-button size="small" @click="startPolish('overall')" :loading="polishing && polishMode === 'overall'">
            <el-icon><MagicStick /></el-icon>整体润色
          </el-button>
          <el-button size="small" @click="startPolish('compress')" :loading="polishing && polishMode === 'compress'">
            <el-icon><ZoomOut /></el-icon>精简压缩
          </el-button>
          <el-button size="small" @click="startPolish('expand')" :loading="polishing && polishMode === 'expand'">
            <el-icon><ZoomIn /></el-icon>扩展充实
          </el-button>
          <el-button size="small" @click="startPolish('official')" :loading="polishing && polishMode === 'official'">
            <el-icon><DocumentChecked /></el-icon>公文风格
          </el-button>
          <el-button size="small" @click="showCustomPolish = true">
            <el-icon><Edit /></el-icon>自定义润色
          </el-button>
        </div>
        <!-- 润色进度 -->
        <div v-if="polishing" class="polish-progress">
          <el-progress :percentage="polishProgress" :stroke-width="6" color="#2563eb" />
          <span class="polish-status">{{ polishStatusText }}</span>
        </div>
        <!-- 润色结果 -->
        <div v-if="polishResult" class="polish-result">
          <div class="pr-header">
            <el-tag type="success" size="small">润色完成</el-tag>
            <el-button text size="small" @click="restoreOriginal">恢复原文</el-button>
            <el-button text size="small" @click="startPolish(polishMode)">再次润色</el-button>
          </div>
          <div class="pr-content" v-html="polishResult"></div>
        </div>
      </div>
    </div>

    <!-- 生成向导弹窗 -->
    <el-dialog v-model="showWizard" title="生成调研分析报告" width="640px" :close-on-click-modal="false">
      <el-steps :active="wizardStep" finish-status="success" align-center>
        <el-step title="选择主题" />
        <el-step title="配置参数" />
      </el-steps>

      <div v-if="wizardStep === 0" class="wizard-topic">
        <p class="wizard-desc">已选择调研主题：<strong>{{ selectedTemplate !== null ? topicTemplates[selectedTemplate]?.name : '' }}</strong></p>
        <div class="wizard-period">
          <label>调研周期</label>
          <el-date-picker
            v-model="wizardDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
          <div class="quick-btns" style="margin-top:8px">
            <el-button size="small" :type="wizardQuickBtn === 'month' ? 'primary' : 'default'" @click="setWizardQuickDate('month')">本月</el-button>
            <el-button size="small" :type="wizardQuickBtn === 'quarter' ? 'primary' : 'default'" @click="setWizardQuickDate('quarter')">本季度</el-button>
            <el-button size="small" :type="wizardQuickBtn === 'half' ? 'primary' : 'default'" @click="setWizardQuickDate('half')">上半年</el-button>
            <el-button size="small" :type="wizardQuickBtn === 'year' ? 'primary' : 'default'" @click="setWizardQuickDate('year')">本年度</el-button>
          </div>
        </div>
        <div class="wizard-data-source">
          <label>数据来源</label>
          <el-radio-group v-model="wizardDataSource">
            <el-radio value="system">系统业务数据</el-radio>
            <el-radio value="upload">上传台账数据</el-radio>
          </el-radio-group>
          <div v-if="wizardDataSource === 'upload'" class="wizard-upload">
            <el-upload drag :auto-upload="false" :limit="1" accept=".xlsx,.xls,.csv" @change="handleWizardUpload">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">将文件拖拽到此处，或 <em>点击上传</em></div>
            </el-upload>
          </div>
        </div>
      </div>

      <div v-if="wizardStep === 1" class="wizard-config">
        <div class="wizard-field">
          <label>输出格式</label>
          <el-checkbox-group v-model="wizardFormats">
            <el-checkbox value="word">Word 文档</el-checkbox>
            <el-checkbox value="pdf">PDF 文档</el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="wizard-field">
          <label>附加内容</label>
          <el-checkbox-group v-model="wizardExtras">
            <el-checkbox value="chart">可视化图表</el-checkbox>
            <el-checkbox value="table">明细数据表</el-checkbox>
            <el-checkbox value="suggestion">AI 工作建议</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <template #footer>
        <el-button v-if="wizardStep > 0" @click="wizardStep--">上一步</el-button>
        <el-button v-if="wizardStep < 1" type="primary" :disabled="!wizardDateRange?.[0]" @click="wizardStep++">下一步</el-button>
        <el-button v-else type="primary" :loading="generating" :disabled="wizardFormats.length === 0" @click="submitGenerate">
          {{ generating ? '正在生成...' : '确认生成' }}
        </el-button>
        <el-button @click="showWizard = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 自定义润色弹窗 -->
    <el-dialog v-model="showCustomPolish" title="自定义润色指令" width="480px">
      <el-input
        v-model="customPolishText"
        type="textarea"
        :rows="4"
        placeholder="请输入润色要求，例如：将报告语言调整为更正式的公文风格，增加数据支撑，补充对比分析..."
      />
      <template #footer>
        <el-button type="primary" :loading="polishing" @click="startPolish('custom')" :disabled="!customPolishText.trim()">
          {{ polishing ? '润色中...' : '开始润色' }}
        </el-button>
        <el-button @click="showCustomPolish = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {
  UploadFilled, Document, MagicStick, Download, Back, ChatLineSquare,
  Clock, EditPen, QuestionFilled, ZoomOut, ZoomIn, DocumentChecked, Edit,
  TrendCharts, User, Briefcase, School, Collection
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

// ====== 概览统计 ======
const overviewStats = ref([
  { label: '调研报告总数', value: '38份', icon: Document, bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  { label: '待生成报告', value: '6份', icon: Clock, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { label: '生成中', value: '2份', icon: TrendCharts, bg: 'linear-gradient(135deg, #10b981, #059669)' },
  { label: '已完成', value: '30份', icon: EditPen, bg: 'linear-gradient(135deg, #3b82f6, #2563eb)' }
])

// ====== 调研主题模板 ======
const selectedTemplate = ref<number | null>(null)
const topicTemplates = [
  { name: '高校毕业生就业调研', desc: '基于毕业生就业去向、就业率、专业匹配度等数据分析', icon: School, bg: '#dbeafe', tag: '热门', tagType: 'danger' },
  { name: '农民工就业工作调研', desc: '分析农民工就业规模、行业分布、技能培训需求等', icon: User, bg: '#fef3c7', tag: '季度', tagType: 'warning' },
  { name: '就业困难人员帮扶调研', desc: '就业困难人员认定、帮扶措施、公益性岗位安置效果', icon: Briefcase, bg: '#d1fae5', tag: '重点', tagType: 'success' },
  { name: '职业技能培训效能调研', desc: '培训项目覆盖、就业转化率、企业满意度等评估', icon: Collection, bg: '#e0e7ff', tag: null, tagType: '' }
]

// ====== 生成向导 ======
const showWizard = ref(false)
const wizardStep = ref(0)
const wizardDateRange = ref<[string, string]>(['', ''])
const wizardQuickBtn = ref('')
const wizardDataSource = ref('system')
const wizardUploadFile = ref<any>(null)
const wizardFormats = ref<string[]>(['word'])
const wizardExtras = ref<string[]>(['chart', 'suggestion'])
const generating = ref(false)

function setWizardQuickDate(type: string) {
  wizardQuickBtn.value = type
  const now = dayjs()
  let start: dayjs.Dayjs
  const end = now
  switch (type) {
    case 'month': start = now.startOf('month'); break
    case 'quarter': start = now.month(Math.floor(now.month() / 3) * 3).startOf('month'); break
    case 'half': start = now.month() < 6 ? now.startOf('year') : now.month(6).startOf('month'); break
    case 'year': start = now.startOf('year'); break
    default: start = now
  }
  wizardDateRange.value = [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
}

function handleWizardUpload(file: any) {
  wizardUploadFile.value = file
}

async function submitGenerate() {
  generating.value = true
  await new Promise(r => setTimeout(r, 2000))

  const topic = topicTemplates[selectedTemplate.value!]
  const now = dayjs().format('YYYY-MM-DD HH:mm')
  const report: ReportItem = {
    id: Date.now(),
    title: `${topic.name}报告（${wizardDateRange.value[0]} ~ ${wizardDateRange.value[1]}）`,
    topic: topic.name,
    period: `${wizardDateRange.value[0]} ~ ${wizardDateRange.value[1]}`,
    createdAt: now,
    status: 'completed',
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
      { title: '五、对策与建议', content: '<p>1. 加大就业服务力度，开展精准化就业指导和岗位推荐。</p><p>2. 推进职业技能提升工程，增强培训针对性和实效性。</p><p>3. 强化重点群体就业帮扶，确保"零就业家庭"动态清零。</p><p>4. 健全就业形势监测预警机制，及时发现和化解风险隐患。</p>' }
    ],
    aiSuggestions: [
      '建议加强对高校毕业生就业服务的精准对接，深入开展"一对一"职业指导，提高就业匹配效率。',
      '建议重点关注灵活就业群体的劳动权益保障，完善社保补贴政策，扩大政策覆盖范围。',
      '建议推进职业技能培训与产业需求对接，围绕新兴产业和紧缺工种开展定向培训，提升就业转化率。',
      '建议健全就业困难人员动态管理机制，实行"一人一策"精准帮扶，确保帮扶措施落到实处。'
    ]
  }

  reportHistory.value.unshift(report)
  currentReport.value = report
  generating.value = false
  showWizard.value = false
  wizardStep.value = 0
  showHistory.value = false
  nextTick(() => renderComparisonChart())
}

// ====== 历史报告 ======
interface ReportItem {
  id: number
  title: string
  topic: string
  period: string
  createdAt: string
  status: string
  metrics: { label: string; value: string; color: string; change: number }[]
  sections: { title: string; content: string }[]
  aiSuggestions: string[]
}

const showHistory = ref(false)
const reportHistory = ref<ReportItem[]>([])
const currentReport = ref<ReportItem | null>(null)

const historyFilter = ref({ topic: '', status: '' })

const filteredHistory = computed(() => {
  return reportHistory.value.filter(r => {
    if (historyFilter.value.topic && r.topic !== historyFilter.value.topic) return false
    if (historyFilter.value.status && r.status !== historyFilter.value.status) return false
    return true
  })
})

function loadHistoryReport(row: ReportItem) {
  currentReport.value = row
  showHistory.value = false
  nextTick(() => renderComparisonChart())
}

function deleteHistory(row: ReportItem) {
  reportHistory.value = reportHistory.value.filter(r => r.id !== row.id)
  if (currentReport.value?.id === row.id) currentReport.value = null
}

// ====== 对比图表 ======
const comparisonChartRef = ref<HTMLElement | null>(null)

function renderComparisonChart() {
  if (!comparisonChartRef.value) return
  const chart = echarts.init(comparisonChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['本期', '上期', '同比'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['高校毕业生', '农民工', '就业困难人员', '灵活就业', '企业用工'], axisLabel: { color: '#6b7280' } },
    yAxis: { type: 'value', name: '人数/万人', axisLabel: { color: '#6b7280' } },
    series: [
      { name: '本期', type: 'bar', data: [3.2, 18.6, 5.3, 8.7, 12.4], itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] } },
      { name: '上期', type: 'bar', data: [2.9, 17.2, 5.8, 7.9, 11.6], itemStyle: { color: '#93c5fd', borderRadius: [4, 4, 0, 0] } },
      { name: '同比', type: 'line', data: [10.3, 8.1, -8.6, 10.1, 6.9], symbol: 'circle', symbolSize: 8, lineStyle: { color: '#f59e0b' }, itemStyle: { color: '#f59e0b' } }
    ]
  })
  chart.resize()
}

// ====== AI 润色 ======
const polishing = ref(false)
const polishMode = ref('')
const polishProgress = ref(0)
const polishStatusText = ref('')
const polishResult = ref('')
const showCustomPolish = ref(false)
const customPolishText = ref('')

const polishTexts: Record<string, string> = {
  overall: '<p>（润色后）本次调研围绕本市就业市场运行情况展开全面深入的分析，旨在为精准制定就业帮扶政策提供科学依据。调研覆盖全市12个区县，累计回收有效问卷12,847份，样本覆盖率达94.2%，具有较强的代表性。调研结果显示，本市就业形势总体稳定，但在结构性矛盾、重点群体帮扶等方面仍存在改进空间。</p>',
  compress: '<p>调研覆盖12个区县、12,847份有效问卷，样本有效率94.2%。核心结论：就业形势总体稳定，高校毕业生就业率78.5%，同比上升2.3个百分点；农民工就业规模18.6万人，同比增长3.2%；就业困难人员帮扶就业率82.6%。建议加强就业服务精准对接，推进职业技能提升工程。</p>',
  expand: '<p>（扩展后）本次调研通过系统化的数据采集与分析方法，全面掌握了本市就业市场的运行态势。从宏观层面看，全市就业形势总体保持稳定，城镇新增就业持续增长，就业结构不断优化。从微观层面看，不同群体就业状况呈现差异化特征，高校毕业生就业去向呈现多元化趋势，农民工就业领域逐步向服务业转移，就业困难人员帮扶取得积极成效。建议在现有政策框架基础上，进一步加大精准施策力度，推动就业服务提质增效，确保就业大局持续稳定。</p>',
  official: '<p>（公文风格）为深入贯彻党中央、国务院关于稳就业工作的决策部署，全面落实就业优先政策，全面掌握本市就业市场运行情况，特开展本次调研工作。本次调研严格按照《中华人民共和国就业促进法》相关规定，采用科学规范的调研方法，确保调研结果的客观性、准确性和代表性。根据调研结果，本市就业形势总体平稳，各项就业指标运行在合理区间，就业工作取得积极成效。</p>'
}

function startPolish(mode: string) {
  if (mode === 'custom' && !customPolishText.value.trim()) return
  showCustomPolish.value = false
  polishing.value = true
  polishMode.value = mode
  polishProgress.value = 0
  polishStatusText.value = '正在分析报告内容...'

  const timer = setInterval(() => {
    polishProgress.value += 10
    if (polishProgress.value <= 30) polishStatusText.value = '正在分析报告内容...'
    else if (polishProgress.value <= 60) polishStatusText.value = '正在进行智能优化...'
    else if (polishProgress.value <= 90) polishStatusText.value = '正在生成润色结果...'
    if (polishProgress.value >= 100) {
      clearInterval(timer)
      polishStatusText.value = '润色完成'
      setTimeout(() => {
        if (mode === 'custom') {
          polishResult.value = `<p>（自定义润色）根据指令「${customPolishText.value}」，已对报告内容进行了针对性优化调整。优化后的报告更加符合您的需求，建议结合具体使用场景进一步微调。</p>`
        } else {
          polishResult.value = polishTexts[mode] || '<p>润色完成，已对报告内容进行了优化处理。请查看效果，如需进一步调整可继续使用润色功能。</p>'
        }
        polishing.value = false
      }, 500)
    }
  }, 300)
}

function restoreOriginal() {
  polishResult.value = ''
}

// ====== 导出 ======
function exportReport(type: string) {
  if (!currentReport.value) return
  const fileName = `${currentReport.value.title}.${type === 'word' ? 'docx' : 'pdf'}`
  ElMessage.success(`正在导出 ${fileName}，请稍候...`)
}

// ====== 初始化示例数据 ======
onMounted(() => {
  const now = dayjs().format('YYYY-MM-DD HH:mm')
  reportHistory.value = [
    {
      id: 1, title: '高校毕业生就业调研报告（2026年Q2）', topic: '高校毕业生就业调研',
      period: '2026-04-01 ~ 2026-06-30', createdAt: '2026-06-28 15:30', status: 'completed',
      metrics: [
        { label: '调研覆盖人数', value: '8,423人', color: '#2563eb', change: 12.3 },
        { label: '有效样本率', value: '96.1%', color: '#10b981', change: 2.1 },
        { label: '就业去向落实率', value: '78.5%', color: '#f59e0b', change: 2.3 },
        { label: '企业就业占比', value: '52.6%', color: '#ff7c00', change: 4.8 }
      ],
      sections: [
        { title: '一、调研背景与目的', content: '<p>为全面掌握2026届本市高校毕业生就业情况，分析就业形势与趋势，为制定高校毕业生就业政策提供数据支撑，特开展本次调研。</p>' },
        { title: '二、调研对象与方法', content: '<p>调研覆盖全市12所高校，涵盖本科、硕士、博士等学历层次，采用问卷调查、就业系统数据采集、用人单位走访相结合的方式。</p>' },
        { title: '三、核心数据分析', content: '<p>2026届高校毕业生共3.2万人，就业去向落实率78.5%，较去年同期上升2.3个百分点。企业就业占比52.6%，机关事业单位14.8%，灵活就业8.3%，升学深造24.3%。</p>' },
        { title: '四、存在的主要问题', content: '<p>就业结构性矛盾突出，部分专业供大于求；毕业生就业期望与实际岗位存在差距；基层就业吸引力有待提高。</p>' },
        { title: '五、对策与建议', content: '<p>加大就业指导力度，开展精准化岗位推荐；推进校企合作，拓展就业渠道；引导毕业生树立合理就业预期。</p>' }
      ],
      aiSuggestions: ['建议加强高校毕业生就业数据动态监测，建立就业形势预警机制。', '建议针对就业困难毕业生开展"一对一"就业帮扶。']
    },
    {
      id: 2, title: '农民工就业工作调研报告（2026年H1）', topic: '农民工就业工作调研',
      period: '2026-01-01 ~ 2026-06-30', createdAt: '2026-07-02 10:15', status: 'completed',
      metrics: [
        { label: '调研覆盖人数', value: '15,200人', color: '#2563eb', change: 6.8 },
        { label: '有效样本率', value: '92.7%', color: '#10b981', change: 1.5 },
        { label: '就业规模', value: '18.6万人', color: '#f59e0b', change: 3.2 },
        { label: '技能培训覆盖率', value: '45.3%', color: '#ff7c00', change: 8.6 }
      ],
      sections: [
        { title: '一、调研背景与目的', content: '<p>为深入了解本市农民工就业现状、技能水平及就业需求，推进农民工就业服务精准化，特开展本次调研。</p>' },
        { title: '二、调研对象与方法', content: '<p>调研覆盖全市12个区县，涵盖制造业、建筑业、服务业等主要行业，通过问卷调查、企业访谈等方式开展。</p>' },
        { title: '三、核心数据分析', content: '<p>本地农民工就业规模达18.6万人，同比增长3.2%。制造业、建筑业、服务业分别占比28.5%、22.3%和35.6%。技能培训覆盖率达45.3%，较上年提升8.6个百分点。</p>' },
        { title: '四、存在的主要问题', content: '<p>技能培训覆盖面仍需扩大，高技能岗位匹配度有待提高；部分行业用工波动较大。</p>' },
        { title: '五、对策与建议', content: '<p>推进农民工技能提升计划，重点开展紧缺工种培训；完善就业信息服务，促进人岗精准匹配。</p>' }
      ],
      aiSuggestions: ['建议加强农民工技能培训与产业需求对接，提高培训就业转化率。', '建议完善农民工就业动态监测，及时发现和化解规模性失业风险。']
    }
  ]
})
</script>

<style scoped>
.research-report-page {
  padding: 0 0 24px 0;
}

/* 概览统计 */
.overview-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.overview-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
  transition: all .3s;
}
.overview-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
.overview-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.overview-info { display: flex; flex-direction: column; }
.overview-value { font-size: 22px; font-weight: 700; color: #1f2937; line-height: 1.3; }
.overview-label { font-size: 13px; color: #6b7280; margin-top: 2px; }

/* 模板卡片 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.template-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all .3s;
  position: relative;
}
.template-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #2563eb; transform: translateY(-2px); }
.template-card.active { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
.tpl-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  margin-bottom: 12px;
}
.tpl-name { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
.tpl-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }
.template-card .el-tag { position: absolute; top: 12px; right: 12px; }

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 历史报告 */
.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 { margin: 0; font-size: 16px; color: #1f2937; }
.filter-bar { display: flex; }

/* 报告详情 */
.report-detail {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
}
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}
.rh-left h2 { margin: 0 0 6px; font-size: 18px; color: #1f2937; }
.rh-meta { font-size: 13px; color: #6b7280; }
.rh-meta .sep { margin: 0 8px; color: #d1d5db; }
.rh-actions { display: flex; gap: 8px; flex-shrink: 0; }

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
.metric-card {
  background: #f9fafb;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
}
.metric-top { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 8px; border-bottom: 2px solid; margin-bottom: 6px; }
.metric-label { font-size: 13px; color: #6b7280; }
.metric-value { font-size: 20px; font-weight: 700; }
.metric-change { font-size: 13px; }
.metric-change .up { color: #10b981; font-weight: 600; }
.metric-change .down { color: #ef4444; font-weight: 600; }
.change-label { color: #9ca3af; margin-left: 4px; }

.report-body { margin-bottom: 24px; }
.body-section { margin-bottom: 20px; }
.body-section .section-title { font-size: 16px; color: #1f2937; margin: 0 0 10px; padding-left: 12px; border-left: 3px solid #2563eb; }
.section-content { font-size: 14px; line-height: 1.8; color: #374151; }
.section-content p { margin: 0 0 8px; }

.chart-area {
  width: 100%;
  height: 320px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.chart-placeholder { width: 100%; height: 100%; }

.ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f0fe, #f0f5ff);
  border-radius: 8px;
  border-left: 3px solid #2563eb;
}
.suggestion-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.suggestion-text { font-size: 14px; color: #374151; line-height: 1.6; }

/* AI 润色 */
.polish-section {
  background: #f9fafb;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
}
.polish-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}
.polish-help { color: #9ca3af; cursor: help; }
.polish-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.polish-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.polish-progress .el-progress { flex: 1; }
.polish-status { font-size: 13px; color: #6b7280; white-space: nowrap; }
.polish-result {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}
.pr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pr-content { font-size: 14px; line-height: 1.8; color: #374151; }

/* 弹窗 */
.wizard-topic { padding: 20px 0; }
.wizard-desc { font-size: 14px; color: #374151; margin-bottom: 20px; }
.wizard-period label, .wizard-data-source label, .wizard-field label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.wizard-data-source { margin-top: 20px; }
.wizard-upload { margin-top: 12px; }
.wizard-config { padding: 20px 0; }
.wizard-field { margin-bottom: 20px; }
.wizard-field:last-child { margin-bottom: 0; }
</style>