<template>
  <div class="data-report-page">
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

    <!-- 模式选择卡片 -->
    <div v-if="!activeMode" class="mode-grid">
      <div class="mode-card" @click="activeMode = 'upload'">
        <div class="mode-icon" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe)">
          <el-icon :size="32" color="#2563eb"><UploadFilled /></el-icon>
        </div>
        <h3>上传数据生成分析</h3>
        <p>支持上传本地 Excel/CSV 报表数据，AI 自动生成数据分析报告，并提供针对性的工作建议</p>
        <el-tag type="primary" size="small">推荐</el-tag>
      </div>
      <div class="mode-card" @click="activeMode = 'compare'">
        <div class="mode-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
          <el-icon :size="32" color="#f59e0b"><TrendCharts /></el-icon>
        </div>
        <h3>系统数据对比分析</h3>
        <p>基于系统业务数据，通过同比、环比分析，自动生成数据对比分析报告及针对性工作建议</p>
        <el-tag type="warning" size="small">系统数据</el-tag>
      </div>
    </div>

    <!-- ====== 上传数据生成分析 ====== -->
    <div v-if="activeMode === 'upload'" class="workspace">
      <div class="workspace-header">
        <el-button text @click="activeMode = null; currentReport = null; uploadReportGenerated = false">
          <el-icon><Back /></el-icon>返回
        </el-button>
        <h3 style="margin:0">📤 上传数据生成分析</h3>
      </div>

      <div v-if="!uploadReportGenerated" class="upload-config">
        <div class="upload-main">
          <el-upload drag :auto-upload="false" :limit="1" accept=".xlsx,.xls,.csv,.docx,.pdf" @change="handleFileChange" class="upload-box">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">将本地报表数据拖拽到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="upload-hint">支持 .xlsx、.csv、.docx、.pdf 格式，AI 基于上传数据生成分析报告及工作建议</div>
            </template>
          </el-upload>
          <div v-if="uploadFileName" class="uploaded-file-info">
            <el-icon><Document /></el-icon>
            <span class="file-name">{{ uploadFileName }}</span>
            <el-button text type="danger" size="small" @click="removeUploadFile">移除</el-button>
          </div>
        </div>
        <div class="config-row">
          <div class="config-item">
            <div class="item-label">输出格式</div>
            <el-checkbox-group v-model="outputFormats">
              <el-checkbox value="word">Word</el-checkbox>
              <el-checkbox value="pdf">PDF</el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="config-item">
            <div class="item-label">附加内容</div>
            <el-checkbox-group v-model="extraContent">
              <el-checkbox value="chart">可视化图表</el-checkbox>
              <el-checkbox value="suggestion">AI 工作建议</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
        <div class="action-bar">
          <el-button type="primary" size="large" :disabled="!uploadFileName" :loading="generating" @click="generateUploadReport">
            <el-icon><MagicStick /></el-icon>{{ generating ? '正在生成...' : '开始分析' }}
          </el-button>
          <el-button size="large" @click="showUploadHistory = !showUploadHistory">
            <el-icon><Clock /></el-icon>{{ showUploadHistory ? '隐藏历史' : '查看历史' }}
          </el-button>
        </div>
      </div>

      <!-- 上传历史列表 -->
      <div v-if="showUploadHistory && !uploadReportGenerated" class="history-section">
        <h3 class="hs-title">历史上传分析报告</h3>
        <el-table :data="uploadHistory" stripe @row-click="r => { currentReport = r; uploadReportGenerated = true; showUploadHistory = false }">
          <el-table-column prop="title" label="报告名称" min-width="200" />
          <el-table-column prop="createdAt" label="生成时间" width="170" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click.stop="currentReport = row; uploadReportGenerated = true">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 上传报告详情 -->
      <div v-if="uploadReportGenerated && currentReport" class="report-detail">
        <div class="report-header">
          <div class="rh-left">
            <h2>{{ currentReport.title }}</h2>
            <div class="rh-meta"><span>生成时间：{{ currentReport.createdAt }}</span></div>
          </div>
          <div class="rh-actions">
            <el-button @click="exportReport('word')"><el-icon><Download /></el-icon>导出 Word</el-button>
            <el-button @click="exportReport('pdf')"><el-icon><Download /></el-icon>导出 PDF</el-button>
            <el-button @click="currentReport = null; uploadReportGenerated = false; showUploadHistory = true" text>
              <el-icon><Back /></el-icon>返回列表
            </el-button>
          </div>
        </div>
        <div class="metrics-row">
          <div class="metric-card" v-for="(m, i) in currentReport.metrics" :key="i">
            <div class="metric-top" :style="{ borderColor: m.color }">
              <span class="metric-label">{{ m.label }}</span>
              <span class="metric-value" :style="{ color: m.color }">{{ m.value }}</span>
            </div>
            <div class="metric-change">
              <span :class="m.change >= 0 ? 'up' : 'down'">{{ m.change >= 0 ? '↑' : '↓' }}{{ Math.abs(m.change) }}%</span>
              <span class="change-label">较上期</span>
            </div>
          </div>
        </div>
        <div class="report-body" v-html="currentReport.body"></div>
        <div v-if="currentReport.suggestions" class="suggestions-section">
          <h3 class="section-title">AI 工作建议</h3>
          <div class="suggestion-item" v-for="(s, i) in currentReport.suggestions" :key="i">
            <span class="suggestion-num">{{ i + 1 }}</span>
            <span class="suggestion-text">{{ s }}</span>
          </div>
        </div>
        <!-- AI 润色 -->
        <div class="polish-section">
          <div class="polish-header"><el-icon color="#2563eb"><EditPen /></el-icon><span>AI 润色</span></div>
          <div class="polish-btns">
            <el-button size="small" @click="startPolish('overall')" :loading="polishing && polishMode === 'overall'"><el-icon><MagicStick /></el-icon>整体润色</el-button>
            <el-button size="small" @click="startPolish('compress')" :loading="polishing && polishMode === 'compress'"><el-icon><ZoomOut /></el-icon>精简压缩</el-button>
            <el-button size="small" @click="startPolish('official')" :loading="polishing && polishMode === 'official'"><el-icon><DocumentChecked /></el-icon>公文风格</el-button>
          </div>
          <div v-if="polishing" class="polish-progress">
            <el-progress :percentage="polishProgress" :stroke-width="6" color="#2563eb" />
            <span class="polish-status">{{ polishStatusText }}</span>
          </div>
          <div v-if="polishResult" class="polish-result">
            <div class="pr-header"><el-tag type="success" size="small">润色完成</el-tag>
              <el-button text size="small" @click="polishResult = ''">恢复原文</el-button>
            </div>
            <div class="pr-content" v-html="polishResult"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 系统数据对比分析 ====== -->
    <div v-if="activeMode === 'compare'" class="workspace">
      <div class="workspace-header">
        <el-button text @click="activeMode = null; compareReportGenerated = false">
          <el-icon><Back /></el-icon>返回
        </el-button>
        <h3 style="margin:0">📊 系统数据对比分析</h3>
      </div>

      <div v-if="!compareReportGenerated" class="compare-config">
        <div class="config-row">
          <div class="config-item" style="flex:1">
            <div class="item-label">分析主题</div>
            <el-select v-model="compareTopic" placeholder="选择分析主题" style="width:100%">
              <el-option label="就业形势分析" value="就业形势分析" />
              <el-option label="社会保险运行分析" value="社会保险运行分析" />
              <el-option label="人才引进分析" value="人才引进分析" />
              <el-option label="就业帮扶成效分析" value="就业帮扶成效分析" />
              <el-option label="重点群体就业监测" value="重点群体就业监测" />
            </el-select>
          </div>
          <div class="config-item" style="flex:1">
            <div class="item-label">基期</div>
            <el-date-picker v-model="compareBasePeriod" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
          <div class="config-item" style="flex:1">
            <div class="item-label">对比期</div>
            <el-date-picker v-model="compareTargetPeriod" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
        </div>

        <div class="quick-btns">
          <span class="qb-label">快捷对比：</span>
          <el-button size="small" :type="compareQuickBtn === 'yoy' ? 'primary' : 'default'" @click="setCompareQuick('yoy')">同比</el-button>
          <el-button size="small" :type="compareQuickBtn === 'qoq' ? 'primary' : 'default'" @click="setCompareQuick('qoq')">环比</el-button>
        </div>

        <div class="config-row" style="margin-top:16px">
          <div class="config-item" style="flex:1">
            <div class="item-label">对比维度</div>
            <el-checkbox-group v-model="compareDimensions">
              <el-checkbox value="scale">规模变化</el-checkbox>
              <el-checkbox value="structure">结构变化</el-checkbox>
              <el-checkbox value="growth">增长趋势</el-checkbox>
              <el-checkbox value="regional">区域分布</el-checkbox>
            </el-checkbox-group>
          </div>
          <div class="config-item" style="flex:1">
            <div class="item-label">附加内容</div>
            <el-checkbox-group v-model="compareExtras">
              <el-checkbox value="chart">对比图表</el-checkbox>
              <el-checkbox value="suggestion">AI 工作建议</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <div class="action-bar">
          <el-button type="primary" size="large" :disabled="!compareTopic || !compareBasePeriod?.[0] || !compareTargetPeriod?.[0]" :loading="generating" @click="generateCompareReport">
            <el-icon><MagicStick /></el-icon>{{ generating ? '正在生成...' : '开始对比分析' }}
          </el-button>
          <el-button size="large" @click="showCompareHistory = !showCompareHistory">
            <el-icon><Clock /></el-icon>{{ showCompareHistory ? '隐藏历史' : '查看历史' }}
          </el-button>
        </div>
      </div>

      <!-- 对比历史列表 -->
      <div v-if="showCompareHistory && !compareReportGenerated" class="history-section">
        <h3 class="hs-title">历史对比分析报告</h3>
        <el-table :data="compareHistory" stripe @row-click="r => { currentReport = r; compareReportGenerated = true; showCompareHistory = false }">
          <el-table-column prop="title" label="报告名称" min-width="200" />
          <el-table-column prop="createdAt" label="生成时间" width="170" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click.stop="currentReport = row; compareReportGenerated = true">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 对比报告详情 -->
      <div v-if="compareReportGenerated && currentReport" class="report-detail">
        <div class="report-header">
          <div class="rh-left">
            <h2>{{ currentReport.title }}</h2>
            <div class="rh-meta"><span>生成时间：{{ currentReport.createdAt }}</span></div>
          </div>
          <div class="rh-actions">
            <el-button @click="exportReport('word')"><el-icon><Download /></el-icon>导出 Word</el-button>
            <el-button @click="exportReport('pdf')"><el-icon><Download /></el-icon>导出 PDF</el-button>
            <el-button @click="currentReport = null; compareReportGenerated = false; showCompareHistory = true" text>
              <el-icon><Back /></el-icon>返回列表
            </el-button>
          </div>
        </div>
        <div class="metrics-row">
          <div class="metric-card" v-for="(m, i) in currentReport.metrics" :key="i">
            <div class="metric-top" :style="{ borderColor: m.color }">
              <span class="metric-label">{{ m.label }}</span>
              <span class="metric-value" :style="{ color: m.color }">{{ m.value }}</span>
            </div>
            <div class="metric-change">
              <span :class="m.change >= 0 ? 'up' : 'down'">{{ m.change >= 0 ? '↑' : '↓' }}{{ Math.abs(m.change) }}%</span>
              <span class="change-label">较基期</span>
            </div>
          </div>
        </div>

        <!-- 对比表格 -->
        <div class="compare-table-section">
          <h3 class="section-title">核心指标对比</h3>
          <el-table :data="currentReport.compareTable" border>
            <el-table-column prop="indicator" label="指标" width="180" />
            <el-table-column prop="basePeriod" label="基期" width="150" />
            <el-table-column prop="targetPeriod" label="对比期" width="150" />
            <el-table-column prop="change" label="变化量" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.change.includes('-') ? '#ef4444' : '#10b981', fontWeight: 600 }">{{ row.change }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="changeRate" label="变化率" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.changeRate.includes('-') || row.changeRate === '0' ? '#ef4444' : '#10b981', fontWeight: 600 }">{{ row.changeRate }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="analysis" label="简要分析" />
          </el-table>
        </div>

        <div class="report-body" v-html="currentReport.body"></div>

        <div v-if="currentReport.suggestions" class="suggestions-section">
          <h3 class="section-title">AI 针对性工作建议</h3>
          <div class="suggestion-item" v-for="(s, i) in currentReport.suggestions" :key="i">
            <span class="suggestion-num">{{ i + 1 }}</span>
            <span class="suggestion-text">{{ s }}</span>
          </div>
        </div>

        <!-- AI 润色 -->
        <div class="polish-section">
          <div class="polish-header"><el-icon color="#2563eb"><EditPen /></el-icon><span>AI 润色</span></div>
          <div class="polish-btns">
            <el-button size="small" @click="startPolish('overall')" :loading="polishing && polishMode === 'overall'"><el-icon><MagicStick /></el-icon>整体润色</el-button>
            <el-button size="small" @click="startPolish('compress')" :loading="polishing && polishMode === 'compress'"><el-icon><ZoomOut /></el-icon>精简压缩</el-button>
            <el-button size="small" @click="startPolish('official')" :loading="polishing && polishMode === 'official'"><el-icon><DocumentChecked /></el-icon>公文风格</el-button>
          </div>
          <div v-if="polishing" class="polish-progress">
            <el-progress :percentage="polishProgress" :stroke-width="6" color="#2563eb" />
            <span class="polish-status">{{ polishStatusText }}</span>
          </div>
          <div v-if="polishResult" class="polish-result">
            <div class="pr-header"><el-tag type="success" size="small">润色完成</el-tag>
              <el-button text size="small" @click="polishResult = ''">恢复原文</el-button>
            </div>
            <div class="pr-content" v-html="polishResult"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { UploadFilled, Document, MagicStick, Download, Back, Clock, EditPen, TrendCharts, ZoomOut, DocumentChecked, ChatLineSquare } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const overviewStats = ref([
  { label: '数据分析报告总数', value: '52份', icon: Document, bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  { label: '上传数据分析', value: '28份', icon: UploadFilled, bg: 'linear-gradient(135deg, #10b981, #059669)' },
  { label: '对比分析报告', value: '24份', icon: TrendCharts, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { label: '本月新增', value: '6份', icon: ChatLineSquare, bg: 'linear-gradient(135deg, #3b82f6, #2563eb)' }
])

// 模式选择
const activeMode = ref<string | null>(null)

// ====== 上传数据 ======
const uploadFileName = ref('')
const outputFormats = ref<string[]>(['word'])
const extraContent = ref<string[]>(['chart', 'suggestion'])
const generating = ref(false)
const uploadReportGenerated = ref(false)
const showUploadHistory = ref(false)

function handleFileChange(file: any) {
  uploadFileName.value = file.name || '数据文件'
}

function removeUploadFile() {
  uploadFileName.value = ''
}

const uploadHistory = ref<any[]>([])

async function generateUploadReport() {
  generating.value = true
  await new Promise(r => setTimeout(r, 2000))
  const now = dayjs().format('YYYY-MM-DD HH:mm')
  currentReport.value = {
    id: Date.now(),
    title: `上传数据分析报告（${uploadFileName.value || '本地数据'}）`,
    createdAt: now,
    type: 'upload',
    metrics: [
      { label: '数据记录数', value: '15,832条', color: '#2563eb', change: 8.2 },
      { label: '数据完整率', value: '97.6%', color: '#10b981', change: 2.5 },
      { label: '有效字段', value: '24项', color: '#f59e0b', change: 0 },
      { label: '异常数据', value: '0.3%', color: '#ff7c00', change: -1.2 }
    ],
    body: `<h3>一、数据概况</h3><p>本次上传数据共包含15,832条记录，涵盖参保人数、缴费基数、待遇发放等核心指标，数据完整率97.6%。</p><h3>二、核心指标分析</h3><p>1. 养老保险参保人数较上期增长2.3%，参保结构持续优化。</p><p>2. 失业保险待遇发放人数环比下降1.8%，就业形势保持稳定。</p><p>3. 工伤保险参保覆盖面持续扩大，新增参保企业126家。</p><h3>三、趋势研判</h3><p>综合数据分析，各项指标运行在合理区间，社保制度运行平稳有序。</p>`,
    suggestions: [
      '建议重点关注养老保险参保率提升空间较大的区县，加大政策宣传力度。',
      '建议优化失业保险待遇申领流程，提升经办服务效率。',
      '建议加强对XX社区就业帮扶力度，重点关注灵活就业人员社保覆盖。'
    ]
  }
  uploadReportGenerated.value = true
  generating.value = false
  uploadHistory.value.unshift({ ...currentReport.value })
}

// ====== 对比分析 ======
const compareTopic = ref('')
const compareBasePeriod = ref<[string, string]>(['', ''])
const compareTargetPeriod = ref<[string, string]>(['', ''])
const compareQuickBtn = ref('')
const compareDimensions = ref<string[]>(['scale', 'growth'])
const compareExtras = ref<string[]>(['chart', 'suggestion'])
const compareReportGenerated = ref(false)
const showCompareHistory = ref(false)

function setCompareQuick(type: string) {
  compareQuickBtn.value = type
  const now = dayjs()
  const end = now
  if (type === 'yoy') {
    const baseStart = now.subtract(1, 'year').startOf('month')
    const baseEnd = now.subtract(1, 'year').endOf('month')
    compareBasePeriod.value = [baseStart.format('YYYY-MM-DD'), baseEnd.format('YYYY-MM-DD')]
    compareTargetPeriod.value = [now.startOf('month').format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
  } else {
    const baseStart = now.subtract(1, 'month').startOf('month')
    const baseEnd = now.subtract(1, 'month').endOf('month')
    compareBasePeriod.value = [baseStart.format('YYYY-MM-DD'), baseEnd.format('YYYY-MM-DD')]
    compareTargetPeriod.value = [now.startOf('month').format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
  }
}

const compareHistory = ref<any[]>([])

async function generateCompareReport() {
  generating.value = true
  await new Promise(r => setTimeout(r, 2500))
  const now = dayjs().format('YYYY-MM-DD HH:mm')
  currentReport.value = {
    id: Date.now(),
    title: `${compareTopic.value}对比分析报告（${compareBasePeriod.value[0]} ~ ${compareTargetPeriod.value[1]}）`,
    createdAt: now,
    type: 'compare',
    metrics: [
      { label: '覆盖指标', value: '18项', color: '#2563eb', change: 5.3 },
      { label: '增长指标数', value: '12项', color: '#10b981', change: 8.6 },
      { label: '下降指标数', value: '6项', color: '#ef4444', change: -3.2 },
      { label: '综合评分', value: '87.6分', color: '#f59e0b', change: 2.4 }
    ],
    compareTable: [
      { indicator: '城镇新增就业人数', basePeriod: '1.28万人', targetPeriod: '1.42万人', change: '+0.14万人', changeRate: '+10.9%', analysis: '就业形势稳中向好' },
      { indicator: '失业人员再就业', basePeriod: '0.86万人', targetPeriod: '0.92万人', change: '+0.06万人', changeRate: '+7.0%', analysis: '帮扶效果持续显现' },
      { indicator: '就业困难人员就业', basePeriod: '0.35万人', targetPeriod: '0.38万人', change: '+0.03万人', changeRate: '+8.6%', analysis: '重点群体帮扶有力' },
      { indicator: '养老保险参保人数', basePeriod: '86.5万人', targetPeriod: '88.9万人', change: '+2.4万人', changeRate: '+2.8%', analysis: '参保覆盖面持续扩大' },
      { indicator: '失业保险金申领人数', basePeriod: '0.52万人', targetPeriod: '0.48万人', change: '-0.04万人', changeRate: '-7.7%', analysis: '就业形势持续改善' }
    ],
    body: `<h3>一、对比分析总览</h3><p>从${compareBasePeriod.value[0]}至${compareTargetPeriod.value[1]}，通过对${compareTopic.value}相关指标的对比分析，核心指标呈稳中向好态势。</p><h3>二、结构变化分析</h3><p>从产业结构看，第三产业就业占比持续提升，吸纳就业能力增强。</p><p>从区域分布看，各区县就业形势总体均衡，但个别区县仍需加强关注。</p><h3>三、增长趋势研判</h3><p>综合基期与对比期数据，就业形势将继续保持稳定恢复态势，但需关注外部环境变化带来的不确定性。</p>`,
    suggestions: [
      '建议加强对XX社区的就业帮扶力度，重点关注离校未就业高校毕业生。',
      '建议重点关注XX行业用工波动，建立用工监测预警机制。',
      '建议加大技能培训力度，提升就业结构性匹配度。',
      '建议完善就业困难人员动态管理台账，实行"一人一策"精准帮扶。'
    ]
  }
  compareReportGenerated.value = true
  generating.value = false
  compareHistory.value.unshift({ ...currentReport.value })
}

// 润色
const currentReport = ref<any>(null)
const polishing = ref(false)
const polishMode = ref('')
const polishProgress = ref(0)
const polishStatusText = ref('')
const polishResult = ref('')

const polishTexts: Record<string, string> = {
  overall: '<p>（润色后）经全面数据采集与分析，本次报告对相关指标进行了系统化梳理。数据表明，各项指标运行在合理区间，社保制度运行平稳有序，就业形势总体稳定。建议持续加强政策引导，优化经办服务，确保各项指标持续向好。</p>',
  compress: '<p>核心结论：数据完整率97.6%，有效字段24项，异常数据0.3%。就业形势稳中向好，城镇新增就业+10.9%，养老参保+2.8%。建议：加强社区帮扶力度，关注行业用工波动。</p>',
  official: '<p>（公文风格）为深入贯彻落实党中央、国务院关于稳就业工作的决策部署，全面掌握就业形势运行情况，现就相关数据分析报告如下。根据数据监测结果，各项就业指标运行在合理区间，就业形势总体稳定，社会保障制度运行平稳有序。各地各部门要持续抓好稳就业政策落实，确保就业大局持续稳定。</p>'
}

function startPolish(mode: string) {
  polishing.value = true
  polishMode.value = mode
  polishProgress.value = 0
  polishStatusText.value = '正在分析报告内容...'
  const timer = setInterval(() => {
    polishProgress.value += 10
    if (polishProgress.value <= 30) polishStatusText.value = '正在分析报告内容...'
    else if (polishProgress.value <= 60) polishStatusText.value = '正在进行智能优化...'
    else if (polishProgress.value <= 90) polishStatusText.value = '正在生成结果...'
    if (polishProgress.value >= 100) {
      clearInterval(timer)
      polishStatusText.value = '润色完成'
      setTimeout(() => {
        polishResult.value = polishTexts[mode] || '<p>润色完成，已优化报告内容。</p>'
        polishing.value = false
      }, 500)
    }
  }, 300)
}

function exportReport(type: string) {
  if (!currentReport.value) return
  ElMessage.success(`正在导出 ${currentReport.value.title}.${type === 'word' ? 'docx' : 'pdf'}，请稍候...`)
}
</script>

<style scoped>
.data-report-page { padding: 0 0 24px 0; }
.overview-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.overview-card { display: flex; align-items: center; gap: 14px; background: #fff; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #e5e7eb; transition: all .3s; }
.overview-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
.overview-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.overview-info { display: flex; flex-direction: column; }
.overview-value { font-size: 22px; font-weight: 700; color: #1f2937; line-height: 1.3; }
.overview-label { font-size: 13px; color: #6b7280; margin-top: 2px; }
.mode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 800px; margin: 0 auto; padding: 40px 0; }
.mode-card { background: #fff; border-radius: 16px; padding: 36px 28px; text-align: center; border: 1px solid #e5e7eb; cursor: pointer; transition: all .3s; position: relative; }
.mode-card:hover { border-color: #2563eb; box-shadow: 0 4px 16px rgba(37,99,235,0.12); transform: translateY(-4px); }
.mode-icon { width: 72px; height: 72px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.mode-card h3 { font-size: 17px; color: #1f2937; margin: 0 0 10px; }
.mode-card p { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 12px; }
.mode-card .el-tag { position: absolute; top: 16px; right: 16px; }
.workspace { }
.workspace-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.upload-config { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
.upload-box { margin-bottom: 12px; }
.upload-text { font-size: 14px; color: #6b7280; }
.upload-text em { color: #2563eb; font-style: normal; }
.upload-hint { font-size: 12px; color: #9ca3af; margin-top: 8px; }
.uploaded-file-info { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f0f5ff; border-radius: 8px; margin-top: 10px; }
.file-name { flex: 1; font-size: 14px; color: #374151; }
.config-row { display: flex; gap: 20px; margin-top: 16px; }
.config-item { display: flex; flex-direction: column; gap: 8px; }
.item-label { font-size: 14px; font-weight: 600; color: #374151; }
.action-bar { margin-top: 20px; display: flex; gap: 12px; }
.history-section { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-top: 16px; }
.hs-title { margin: 0 0 16px; font-size: 15px; color: #1f2937; }
.report-detail { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; margin-top: 16px; }
.report-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
.rh-left h2 { margin: 0 0 6px; font-size: 18px; color: #1f2937; }
.rh-meta { font-size: 13px; color: #6b7280; }
.rh-actions { display: flex; gap: 8px; }
.metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.metric-card { background: #f9fafb; border-radius: 10px; padding: 14px 16px; border: 1px solid #e5e7eb; }
.metric-top { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 8px; border-bottom: 2px solid; margin-bottom: 6px; }
.metric-label { font-size: 13px; color: #6b7280; }
.metric-value { font-size: 20px; font-weight: 700; }
.metric-change { font-size: 13px; }
.metric-change .up { color: #10b981; font-weight: 600; }
.metric-change .down { color: #ef4444; font-weight: 600; }
.change-label { color: #9ca3af; margin-left: 4px; }
.report-body { margin-bottom: 20px; font-size: 14px; line-height: 1.8; color: #374151; }
.report-body h3 { font-size: 16px; color: #1f2937; margin: 0 0 8px; padding-left: 12px; border-left: 3px solid #2563eb; }
.section-title { font-size: 16px; color: #1f2937; margin: 0 0 12px; padding-left: 12px; border-left: 3px solid #2563eb; }
.suggestions-section { margin-bottom: 20px; }
.suggestion-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: linear-gradient(135deg, #e8f0fe, #f0f5ff); border-radius: 8px; border-left: 3px solid #2563eb; margin-bottom: 8px; }
.suggestion-num { width: 22px; height: 22px; border-radius: 50%; background: #2563eb; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.suggestion-text { font-size: 14px; color: #374151; line-height: 1.6; }
.compare-table-section { margin-bottom: 20px; }
.compare-config { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb; }
.quick-btns { display: flex; align-items: center; gap: 6px; margin-top: 12px; }
.qb-label { font-size: 13px; color: #6b7280; white-space: nowrap; }
.polish-section { background: #f9fafb; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb; margin-top: 20px; }
.polish-header { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
.polish-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.polish-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.polish-progress .el-progress { flex: 1; }
.polish-status { font-size: 13px; color: #6b7280; white-space: nowrap; }
.polish-result { background: #fff; border-radius: 8px; padding: 14px; border: 1px solid #e5e7eb; }
.pr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pr-content { font-size: 14px; line-height: 1.8; color: #374151; }
</style>