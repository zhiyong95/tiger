<template>
  <div class="report-page">
    <el-row :gutter="20" class="full-height-row">
      <!-- 左侧边栏 -->
      <el-col :span="6" class="sidebar-col">
        <div class="sidebar-inner">
          <!-- 区块1：报告配置 -->
          <div class="section-card">
            <div class="section-header">
              <el-icon color="#2563eb"><Setting /></el-icon>
              <span class="section-title">报告配置</span>
            </div>
            <el-form label-width="70px" label-position="top">
              <el-form-item label="报告类型">
                <el-select v-model="selectedTemplate" placeholder="请选择报告类型" style="width: 100%">
                  <el-option
                    v-for="tpl in templates"
                    :key="tpl.id"
                    :label="tpl.name"
                    :value="tpl.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="统计周期">
                <el-date-picker
                  v-model="dateRange"
                  type="monthrange"
                  range-separator="至"
                  start-placeholder="开始月份"
                  end-placeholder="结束月份"
                  style="width: 100%"
                  value-format="YYYY-MM"
                />
              </el-form-item>
              <el-form-item label="输出格式">
                <el-radio-group v-model="outputFormat">
                  <el-radio label="word">Word 文档</el-radio>
                  <el-radio label="pdf">PDF 文件</el-radio>
                  <el-radio label="html">网页报告</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="附加内容">
                <el-checkbox-group v-model="extras">
                  <el-checkbox label="包含图表" />
                  <el-checkbox label="包含数据表" />
                  <el-checkbox label="AI工作建议" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="上传数据">
                <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="onDrop">
                  <input ref="fileInputRef" type="file" accept=".csv,.xlsx,.xls,.json" style="display:none" @change="onFileChange" />
                  <template v-if="!uploadedFile">
                    <el-icon :size="28" color="#2563eb"><Upload /></el-icon>
                    <p class="upload-text">点击或拖拽上传数据文件</p>
                    <p class="upload-hint">支持 CSV、Excel、JSON 格式，单个文件不超过 10MB</p>
                  </template>
                  <template v-else>
                    <el-icon :size="24" color="#10b981"><Document /></el-icon>
                    <span class="uploaded-name">{{ uploadedFile.name }}</span>
                    <span class="uploaded-size">({{ formatFileSize(uploadedFile.size) }})</span>
                    <el-button text type="danger" size="small" @click.stop="removeFile" class="remove-btn">移除</el-button>
                  </template>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  @click="handleGenerate"
                  :loading="generating"
                  class="gen-btn"
                  size="large"
                >
                  <el-icon v-if="!generating"><MagicStick /></el-icon>
                  {{ generating ? 'AI生成中...' : '立即生成报告' }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 区块2：报告模板 -->
          <div class="section-card">
            <div class="section-header">
              <el-icon color="#2563eb"><Document /></el-icon>
              <span class="section-title">报告模板</span>
            </div>
            <div class="template-cards">
              <div
                v-for="tpl in templates"
                :key="tpl.id"
                class="template-card"
                :class="{ active: selectedTemplate === tpl.id }"
                @click="handleSelectTemplate(tpl.id)"
              >
                <div class="tpl-icon">
                  <el-icon :size="28"><TrendCharts /></el-icon>
                </div>
                <div class="tpl-body">
                  <div class="tpl-name">{{ tpl.name }}</div>
                  <div class="tpl-cat">{{ tpl.category }}</div>
                  <div class="tpl-tags">
                    <el-tag v-for="ind in tpl.indicators" :key="ind" size="small" type="info" effect="plain">{{ ind }}</el-tag>
                  </div>
                </div>
                <div class="tpl-check" v-if="selectedTemplate === tpl.id">
                  <el-icon color="#2563eb"><CircleCheck /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 区块3：最近生成（从右侧移入左侧边栏） -->
          <div class="section-card history-section">
            <div class="history-header">
              <span class="history-title"><el-icon><Clock /></el-icon> 最近生成</span>
              <el-button text type="danger" size="small" @click="handleClearHistory">清空历史</el-button>
            </div>
            <div class="history-list" v-if="historyList.length > 0">
              <div
                v-for="(h, i) in historyList"
                :key="i"
                class="history-item"
                @click="handleLoadHistory(h)"
              >
                <div class="h-info">
                  <span class="h-type">{{ h.type }}</span>
                  <span class="h-period">{{ h.period }}</span>
                  <span class="h-time">{{ h.genTime }}</span>
                </div>
                <el-button text size="small" type="primary" @click.stop="handleDeleteHistory(i)">删除</el-button>
              </div>
            </div>
            <div v-else class="history-empty">暂无生成历史记录</div>
          </div>
        </div>
      </el-col>

      <!-- 右侧主内容区 -->
      <el-col :span="18" class="main-col">
        <div class="main-inner">
          <!-- 面包屑 -->
          <div class="breadcrumb-bar">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">工作台</el-breadcrumb-item>
              <el-breadcrumb-item>智能分析报告</el-breadcrumb-item>
              <el-breadcrumb-item v-if="reportData">{{ reportData.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>

          <div class="preview-area" ref="previewAreaRef">
            <!-- 空态 -->
            <div v-if="!reportData" class="empty-view">
              <el-icon :size="64" color="#d1d5db"><TrendCharts /></el-icon>
              <p class="empty-title">选择左侧配置生成智能分析报告</p>
              <p class="empty-desc">AI 将基于报告模板自动获取最新数据，生成带关键指标、图表和工作建议的完整分析报告</p>
            </div>

            <!-- 报告内容区 -->
            <div v-else class="report-view">
              <!-- 报告头部 -->
              <div class="report-head">
                <h2 class="report-title">{{ reportData.title }}</h2>
                <div class="report-meta">
                  <el-tag type="info" effect="plain">统计周期：{{ reportData.period }}</el-tag>
                  <el-tag type="success" effect="plain">生成时间：{{ reportData.genTime }}</el-tag>
                  <div class="head-actions">
                    <el-button size="small" @click="handleRefreshReport">
                      <el-icon><Refresh /></el-icon> 重新生成
                    </el-button>
                    <el-button type="primary" size="small" @click="handleExport">
                      <el-icon><Download /></el-icon> 导出{{ formatLabel }}
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 关键指标卡片区域 -->
              <div class="metrics-grid">
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

              <!-- 报告正文 -->
              <div class="report-text">
                <div v-html="formatReport(reportData.content)"></div>
              </div>

              <!-- AI建议渐变色块 -->
              <div class="ai-suggestions-block">
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

              <!-- 底部操作 -->
              <div class="report-bottom-actions">
                <el-button @click="handlePrint">
                  <el-icon><Printer /></el-icon> 打印报告
                </el-button>
                <el-button @click="handleShare">
                  <el-icon><Share /></el-icon> 分享链接
                </el-button>
                <el-button @click="handleSaveAsDraft">
                  <el-icon><DocumentAdd /></el-icon> 保存为草稿
                </el-button>
              </div>
            </div>
          </div>

          <!-- 右侧底部不再保留历史记录 -->
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  TrendCharts,
  Document,
  Setting,
  MagicStick,
  Download,
  Promotion,
  Refresh,
  Clock,
  CircleCheck,
  Printer,
  Share,
  DocumentAdd
} from '@element-plus/icons-vue'
import { fetchReportTemplates, generateReport } from '@/api/mock'
import type { ReportTemplate } from '@/types'

const templates = ref<ReportTemplate[]>([])
const selectedTemplate = ref('')
const dateRange = ref<string[]>([])
const outputFormat = ref('word')
const extras = ref<string[]>(['chart', 'data', 'suggestion'])
const generating = ref(false)

// 上传数据
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const triggerUpload = () => { fileInputRef.value?.click() }
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件大小不能超过 10MB'); return }
    if (!['.csv','.xlsx','.xls','.json'].some(s => file.name.toLowerCase().endsWith(s))) { ElMessage.warning('仅支持 CSV、Excel、JSON 格式'); return }
    uploadedFile.value = file; ElMessage.success(`已上传数据文件：${file.name}`)
  }
}
const onDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件大小不能超过 10MB'); return }
    if (!['.csv','.xlsx','.xls','.json'].some(s => file.name.toLowerCase().endsWith(s))) { ElMessage.warning('仅支持 CSV、Excel、JSON 格式'); return }
    uploadedFile.value = file; ElMessage.success(`已上传数据文件：${file.name}`)
  }
}
const removeFile = () => { uploadedFile.value = null; if (fileInputRef.value) fileInputRef.value.value = '' }
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

const reportData = ref<{
  title: string
  period: string
  genTime: string
  content: string
  suggestions: string[]
} | null>(null)
const previewAreaRef = ref<HTMLElement | null>(null)

interface ReportMetric {
  label: string
  value: string
  trend: number
  colorClass: string
}

const reportMetrics = ref<ReportMetric[]>([])

interface HistoryItem {
  type: string
  period: string
  genTime: string
  templateId: string
}

const historyList = ref<HistoryItem[]>([])

const formatLabel = () => {
  const map: Record<string, string> = { word: 'Word', pdf: 'PDF', html: '网页' }
  return map[outputFormat.value]
}

onMounted(async () => {
  templates.value = await fetchReportTemplates()
  if (templates.value.length > 0) {
    selectedTemplate.value = templates.value[0].id
  }
  dateRange.value = ['2025-01', '2025-12']
  // 模拟历史记录
  historyList.value = [
    { type: '就业形势分析报告', period: '2025-01~2025-12', genTime: '2025-12-20 10:30', templateId: '1' },
    { type: '社保运行分析报告', period: '2025-01~2025-11', genTime: '2025-12-18 14:22', templateId: '2' },
    { type: '人才流动分析报告', period: '2025-06~2025-11', genTime: '2025-12-15 09:10', templateId: '3' }
  ]
})

const handleSelectTemplate = (id: string) => {
  selectedTemplate.value = id
  const tpl = templates.value.find(t => t.id === id)
  ElMessage.info(`已选择模板：${tpl?.name}`)
}

const handleGenerate = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请先选择报告类型')
    return
  }
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择统计周期的起止月份')
    return
  }
  generating.value = true
  try {
    const report = await generateReport(selectedTemplate.value, '')
    const periodStr = `${dateRange.value[0]}~${dateRange.value[1]}`
    reportData.value = {
      title: report.title,
      period: periodStr,
      genTime: new Date().toLocaleString('zh-CN').slice(0, 16),
      content: report.content,
      suggestions: report.suggestions
    }
    // 生成对应指标卡片
    reportMetrics.value = [
      { label: '总参保人数', value: '428.6万', trend: 5.8, colorClass: 'metric-blue' },
      { label: '新增就业人数', value: '18.7万', trend: 8.3, colorClass: 'metric-green' },
      { label: '人才净流入', value: '3.2万', trend: 12.6, colorClass: 'metric-orange' },
      { label: '劳动关系立案数', value: '1248件', trend: -9.2, colorClass: 'metric-red' }
    ]
    // 加入历史记录（最近10条）
    const newHistoryItem: HistoryItem = {
      type: reportData.value.title,
      period: periodStr,
      genTime: reportData.value.genTime,
      templateId: selectedTemplate.value
    }
    historyList.value.unshift(newHistoryItem)
    if (historyList.value.length > 10) {
      historyList.value = historyList.value.slice(0, 10)
    }
    ElMessage.success('报告生成成功！')
    await nextTick()
    previewAreaRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    ElMessage.error('报告生成失败，请重试')
  } finally {
    generating.value = false
  }
}

const formatReport = (content: string) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/^(一|二|三|四|五|六)\u3001/gm, '<h3 class="sec-title">$1、</h3>')
    .replace(/^(\d+)\.\s/gm, '<strong class="num-title">$1. </strong>')
}

const handleRefreshReport = () => {
  ElMessage.info('正在重新生成报告...')
  handleGenerate()
}

const handleExport = () => {
  ElMessage.success(`${formatLabel()} 文件导出成功，已自动下载`)
}

const handlePrint = () => {
  ElMessage.success('正在唤起打印对话框')
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const handleSaveAsDraft = () => {
  ElMessage.success('报告已保存为草稿')
}

const handleLoadHistory = (h: HistoryItem) => {
  selectedTemplate.value = h.templateId
  ElMessage.info(`快速加载历史报告：${h.type}`)
}

const handleDeleteHistory = (idx: number) => {
  ElMessageBox.confirm('确定删除该历史记录？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    historyList.value.splice(idx, 1)
    ElMessage.success('已删除')
  }).catch(() => { /* cancel */ })
}

const handleClearHistory = () => {
  if (historyList.value.length === 0) {
    ElMessage.info('当前没有历史记录可清空')
    return
  }
  ElMessageBox.confirm('确定清空全部生成历史记录？此操作不可恢复。', '确认清空', {
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    historyList.value = []
    ElMessage.success('已清空所有历史记录')
  }).catch(() => { /* cancel */ })
}
</script>

<style scoped>
.report-page {
  height: calc(100vh - 96px);
  overflow: hidden;
}
.full-height-row {
  height: 100%;
}
.sidebar-col {
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}
.sidebar-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-card {
  background: #ffffff;
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
.gen-btn {
  width: 100%;
  background: #2563eb;
  border-color: #2563eb;
  height: 42px;
  font-weight: 600;
}
.template-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.template-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.25s ease;
}
.template-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
}
.template-card.active {
  border-color: #2563eb;
  background: #e8f0fe;
}
.tpl-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.tpl-body {
  flex: 1;
}
.tpl-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}
.tpl-cat {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}
.tpl-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.tpl-check {
  flex-shrink: 0;
}
.main-col {
  height: 100%;
  overflow-y: auto;
}
.main-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.breadcrumb-bar {
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.preview-area {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  overflow-y: auto;
  min-height: 300px;
}
.empty-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #9ca3af;
}
.empty-title {
  font-size: 18px;
  color: #6b7280;
  margin-top: 20px;
  font-weight: 600;
}
.empty-desc {
  font-size: 14px;
  color: #9ca3af;
  margin-top: 8px;
}
.report-head {
  padding-bottom: 20px;
  border-bottom: 2px solid #2563eb;
  margin-bottom: 24px;
}
.report-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px;
}
.report-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.head-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.metric-card {
  padding: 20px;
  border-radius: 12px;
  background: #fafbfc;
  border-top: 4px solid #94a3b8;
  transition: all 0.2s;
}
.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}
.metric-blue {
  border-top-color: #2563eb;
  background: linear-gradient(180deg, #eff6ff 0%, #fff 100%);
}
.metric-green {
  border-top-color: #10b981;
  background: linear-gradient(180deg, #ecfdf5 0%, #fff 100%);
}
.metric-orange {
  border-top-color: #f59e0b;
  background: linear-gradient(180deg, #fffbeb 0%, #fff 100%);
}
.metric-red {
  border-top-color: #ef4444;
  background: linear-gradient(180deg, #fef2f2 0%, #fff 100%);
}
.m-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}
.m-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}
.m-change {
  font-size: 13px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.m-change.up {
  color: #10b981;
}
.m-change.down {
  color: #ef4444;
}
.m-comp {
  color: #9ca3af;
  font-size: 12px;
}
.report-text {
  font-size: 15px;
  line-height: 2.1;
  color: #374151;
  font-family: SimSun, serif;
  margin-bottom: 24px;
}
.report-text :deep(.sec-title) {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  margin: 20px 0 8px;
}
.report-text :deep(.num-title) {
  color: #2563eb;
  font-weight: 600;
}
.ai-suggestions-block {
  padding: 20px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a56db 0%, #3b82f6 50%, #60a5fa 100%);
  color: #ffffff;
}
.suggest-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 16px;
}
.ai-tag {
  margin-left: auto;
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: #fff;
}
.suggest-list {
  padding-left: 0;
  list-style: none;
}
.suggest-list li {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.15);
  font-size: 15px;
  line-height: 2;
}
.suggest-list li:last-child {
  border-bottom: none;
}
.s-index {
  font-weight: 700;
  margin-right: 6px;
  opacity: 0.9;
}
.report-bottom-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}
.history-footer {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}
.history-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
}
.history-item:hover {
  background: #eff6ff;
}
.h-info {
  flex: 1;
  min-width: 0;
}
.h-type {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.h-period {
  font-size: 12px;
  color: #6b7280;
  margin-right: 6px;
}
.h-time {
  font-size: 12px;
  color: #9ca3af;
}
.history-empty {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 12px;
}
.history-section {
  background: #fafafa;
}
</style>
