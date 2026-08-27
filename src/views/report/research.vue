<template>
  <div class="research-report-page">
    <!-- 空状态 -->
    <div v-if="!reportGenerated" class="research-empty">
      <div class="empty-icon">
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="30" width="120" height="100" rx="6" fill="#e8f0fe" stroke="#2563eb" stroke-width="2"/>
          <rect x="35" y="45" width="50" height="8" rx="4" fill="#2563eb" opacity="0.3"/>
          <rect x="35" y="60" width="70" height="6" rx="3" fill="#2563eb" opacity="0.15"/>
          <rect x="35" y="72" width="55" height="6" rx="3" fill="#2563eb" opacity="0.15"/>
          <rect x="35" y="84" width="60" height="6" rx="3" fill="#2563eb" opacity="0.15"/>
          <rect x="35" y="100" width="40" height="6" rx="3" fill="#2563eb" opacity="0.15"/>
          <circle cx="120" cy="110" r="24" fill="#2563eb" opacity="0.08"/>
          <path d="M112 110h16M120 102v16" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="80" y="20" width="28" height="28" rx="14" fill="#2563eb" opacity="0.1"/>
          <path d="M90 34l4 4 8-8" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 class="empty-title">调研分析报告</h2>
      <p class="empty-desc">基于辖区就业市场、人力资源情况、就业形势变化等多维度信息，智能生成各类数据调研分析报告</p>

      <!-- 配置区 -->
      <div class="config-area">
        <div class="config-section">
          <div class="section-title">调研主题</div>
          <el-select v-model="researchTopic" placeholder="请选择调研主题" class="full-width">
            <el-option label="本市高校毕业生就业调研报告" value="graduate" />
            <el-option label="本地农民工就业工作调研分析报告" value="migrant" />
            <el-option label="重点群体就业帮扶情况调研报告" value="keygroup" />
            <el-option label="零工市场运行情况分析报告" value="gig" />
            <el-option label="企业用工需求调研报告" value="enterprise" />
            <el-option label="自定义调研主题" value="custom" />
          </el-select>
          <el-input v-if="researchTopic === 'custom'" v-model="customTopic" placeholder="请输入调研主题名称" class="custom-input" />
        </div>

        <div class="config-section">
          <div class="section-title">调研周期</div>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="full-width"
            value-format="YYYY-MM-DD"
          />
          <div class="quick-btns">
            <el-button size="small" :type="quickBtn === 'month' ? 'primary' : 'default'" @click="setQuickDate('month')">本月</el-button>
            <el-button size="small" :type="quickBtn === 'quarter' ? 'primary' : 'default'" @click="setQuickDate('quarter')">本季度</el-button>
            <el-button size="small" :type="quickBtn === 'half' ? 'primary' : 'default'" @click="setQuickDate('half')">上半年</el-button>
            <el-button size="small" :type="quickBtn === 'year' ? 'primary' : 'default'" @click="setQuickDate('year')">本年度</el-button>
          </div>
        </div>

        <div class="config-section">
          <div class="section-title">数据来源</div>
          <el-radio-group v-model="dataSource" class="source-group">
            <el-radio value="system" class="source-radio">
              <span class="source-label">系统业务数据</span>
              <span class="source-desc">基于就业、社保等业务库生成</span>
            </el-radio>
            <el-radio value="upload" class="source-radio">
              <span class="source-label">上传台账数据</span>
              <span class="source-desc">上传本地 Excel/CSV 数据源</span>
            </el-radio>
          </el-radio-group>
          <div v-if="dataSource === 'upload'" class="upload-area">
            <el-upload
              drag
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls,.csv"
              @change="handleUploadChange"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">将文件拖拽到此处，或 <em>点击上传</em></div>
              <template #tip><div class="upload-hint">支持 .xlsx、.csv 格式，单个文件不超过 10MB</div></template>
            </el-upload>
            <div v-if="uploadFileName" class="uploaded-file">
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ uploadFileName }}</span>
              <el-button text type="danger" size="small" @click="removeFile">移除</el-button>
            </div>
          </div>
        </div>

        <div class="config-section">
          <div class="section-title">输出格式</div>
          <el-checkbox-group v-model="outputFormats">
            <el-checkbox value="word">Word 文档</el-checkbox>
            <el-checkbox value="pdf">PDF 文档</el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="config-section">
          <div class="section-title">附加内容</div>
          <el-checkbox-group v-model="extraContent">
            <el-checkbox value="chart">可视化图表</el-checkbox>
            <el-checkbox value="table">明细数据表</el-checkbox>
            <el-checkbox value="suggestion">AI 工作建议</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <div class="action-bar">
        <el-button :disabled="!canGenerate" type="primary" size="large" @click="generateReport" :loading="generating">
          <el-icon style="margin-right:6px"><MagicStick /></el-icon>
          {{ generating ? '正在生成调研分析报告...' : '生成调研分析报告' }}
        </el-button>
        <el-button v-if="!canGenerate" size="large" disabled class="disabled-hint">
          请选择调研主题和周期
        </el-button>
      </div>
    </div>

    <!-- 生成结果 -->
    <div v-else class="research-result">
      <div class="result-header">
        <div class="header-left">
          <h2>{{ reportTitle }}</h2>
          <span class="report-period">调研周期：{{ dateRange?.[0] }} ~ {{ dateRange?.[1] }}</span>
        </div>
        <div class="header-actions">
          <el-button @click="exportReport('word')"><el-icon><Download /></el-icon>导出 Word</el-button>
          <el-button @click="exportReport('pdf')"><el-icon><Download /></el-icon>导出 PDF</el-button>
          <el-button @click="backToConfig" text><el-icon><Back /></el-icon>返回配置</el-button>
        </div>
      </div>

      <div class="report-content">
        <!-- 关键指标 -->
        <div class="metrics-row">
          <div class="metric-card" v-for="m in reportMetrics" :key="m.label">
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
          <div class="body-section" v-for="(section, i) in reportSections" :key="i">
            <h3 class="section-title">{{ section.title }}</h3>
            <div class="section-content" v-html="section.content"></div>
          </div>
        </div>
      </div>

      <!-- 底部AI对话 -->
      <div class="qa-panel">
        <div class="qa-header">
          <el-icon><ChatLineSquare /></el-icon>
          <span>途途报告调整助手</span>
        </div>
        <div class="qa-messages" ref="qaMessagesRef">
          <div v-for="(msg, i) in qaMessages" :key="i" :class="['qa-msg', msg.role]">
            <div class="qa-bubble">{{ msg.content }}</div>
          </div>
        </div>
        <div class="qa-input">
          <el-input
            v-model="qaInput"
            placeholder="例如：对报告内容进行精简、补充高校毕业生就业风险研判..."
            @keyup.enter="sendQaMessage"
          >
            <template #append>
              <el-button @click="sendQaMessage" type="primary">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { UploadFilled, Document, MagicStick, Download, Back, ChatLineSquare } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const researchTopic = ref('')
const customTopic = ref('')
const dateRange = ref<[string, string]>(['', ''])
const quickBtn = ref('')
const dataSource = ref('system')
const uploadFileName = ref('')
const outputFormats = ref<string[]>(['word'])
const extraContent = ref<string[]>(['chart', 'suggestion'])
const generating = ref(false)
const reportGenerated = ref(false)
const qaInput = ref('')
const qaMessages = ref<{ role: string; content: string }[]>([])
const qaMessagesRef = ref<HTMLElement | null>(null)

const reportTitle = computed(() => {
  const topics: Record<string, string> = {
    graduate: '本市高校毕业生就业调研报告',
    migrant: '本地农民工就业工作调研分析报告',
    keygroup: '重点群体就业帮扶情况调研报告',
    gig: '零工市场运行情况分析报告',
    enterprise: '企业用工需求调研报告',
    custom: customTopic.value || '自定义调研报告'
  }
  return customTopic.value && researchTopic.value === 'custom' ? customTopic.value : (topics[researchTopic.value] || '调研分析报告')
})

const canGenerate = computed(() => {
  return researchTopic.value && dateRange.value[0] && dateRange.value[1] && outputFormats.value.length > 0
})

const reportMetrics = ref([
  { label: '调研覆盖人数', value: '12,847人', color: '#2563eb', change: 8.5 },
  { label: '有效样本率', value: '94.2%', color: '#10b981', change: 3.2 },
  { label: '重点群体占比', value: '36.8%', color: '#f59e0b', change: -2.1 },
  { label: '就业意向率', value: '67.5%', color: '#ff7c00', change: 5.6 }
])

const reportSections = ref([
  { title: '一、调研背景与目的', content: '<p>为全面掌握本市就业市场运行情况，深入了解各类群体就业现状与需求，依据《中华人民共和国就业促进法》及相关政策文件，结合本市实际情况，开展本次调研分析工作。本次调研旨在为制定精准就业帮扶政策、优化公共就业服务提供数据支撑和决策参考。</p>' },
  { title: '二、调研对象与方法', content: '<p>本次调研覆盖全市12个区县，涵盖高校毕业生、农民工、城镇失业人员、就业困难人员等群体。采用问卷调查、实地走访、数据采集相结合的方式，共回收有效问卷12,847份，样本覆盖率达94.2%。</p>' },
  { title: '三、核心数据分析', content: '<p>1. <strong>高校毕业生就业情况</strong>：2026届本市高校毕业生共3.2万人，就业去向落实率78.5%，较去年同期上升2.3个百分点。其中，企业就业占比52.6%，机关事业单位占比14.8%，灵活就业占比8.3%，升学深造占比24.3%。</p><p>2. <strong>农民工就业情况</strong>：本地农民工就业规模达18.6万人，同比增长3.2%。制造业、建筑业、服务业为三大主要就业领域，分别占比28.5%、22.3%和35.6%。</p><p>3. <strong>重点群体就业帮扶</strong>：全市已认定就业困难人员5,328人，帮扶就业率82.6%。公益性岗位安置1,256人，灵活就业社保补贴惠及2,847人。</p>' },
  { title: '四、存在的主要问题', content: '<p>1. 高校毕业生就业结构性矛盾依然突出，部分专业毕业生供大于求。</p><p>2. 农民工技能培训覆盖面不足，高技能岗位匹配度有待提高。</p><p>3. 部分就业困难人员年龄偏大、技能单一，帮扶难度较大。</p><p>4. 零工市场规范化程度不高，灵活就业人员权益保障需加强。</p>' },
  { title: '五、对策与建议', content: '<p>1. 加大高校毕业生就业服务力度，开展"一对一"职业指导和岗位推荐，举办专场招聘活动不少于12场。</p><p>2. 推进农民工技能提升计划，重点开展建筑、家政、养老等领域技能培训，年培训不少于5,000人次。</p><p>3. 强化就业困难人员兜底帮扶，加大公益性岗位开发力度，确保"零就业家庭"动态清零。</p><p>4. 规范零工市场建设，完善灵活就业人员社保、劳动权益保障机制。</p>' }
])

function setQuickDate(type: string) {
  quickBtn.value = type
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
  dateRange.value = [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
}

function handleUploadChange(file: any) {
  if (file.name) uploadFileName.value = file.name
}

function removeFile() {
  uploadFileName.value = ''
}

function generateReport() {
  generating.value = true
  setTimeout(() => {
    generating.value = false
    reportGenerated.value = true
    qaMessages.value = [{
      role: 'ai',
      content: `您好！${reportTitle.value}已生成完成。如需调整内容、补充分析或修改措辞，请直接告诉我，我会为您重新优化。`
    }]
  }, 2000)
}

function backToConfig() {
  reportGenerated.value = false
  qaMessages.value = []
}

function exportReport(type: string) {
  alert(`报告已导出为${type.toUpperCase()}格式，请查看下载目录。`)
}

function sendQaMessage() {
  if (!qaInput.value.trim()) return
  qaMessages.value.push({ role: 'user', content: qaInput.value })
  const q = qaInput.value
  qaInput.value = ''
  setTimeout(() => {
    const responses: Record<string, string> = {
      '精简': '已按照您的要求对报告内容进行精简，保留了核心数据和分析结论，删除了冗余表述。',
      '补充': '已为您补充相关分析内容，请查看上方报告更新。',
      '删除': '已按照您的要求删除相关模块。',
      '修改': '已按照您的要求修改了相关表述，语言风格已调整为正式公文风格。',
      '默认': '收到您的指令，已对报告进行相应调整。如需进一步修改，请继续提出。'
    }
    let reply = responses['默认']
    for (const [key, val] of Object.entries(responses)) {
      if (q.includes(key)) { reply = val; break }
    }
    qaMessages.value.push({ role: 'ai', content: reply + ' 报告预览区已同步更新。' })
    nextTick(() => {
      if (qaMessagesRef.value) {
        qaMessagesRef.value.scrollTop = qaMessagesRef.value.scrollHeight
      }
    })
  }, 1000)
}
</script>

<style scoped>
.research-report-page {
  height: 100%;
  overflow-y: auto;
  padding: 0;
}

.research-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 60px;
  max-width: 800px;
  margin: 0 auto;
}

.empty-icon svg {
  width: 120px;
  height: 120px;
}

.empty-title {
  font-size: 20px;
  color: #1f2937;
  margin: 16px 0 8px;
  font-weight: 600;
}

.empty-desc {
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 24px;
}

.config-area {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #e5e7eb;
}

.config-section {
  margin-bottom: 20px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.full-width {
  width: 100%;
}

.custom-input {
  margin-top: 8px;
}

.quick-btns {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.source-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-radio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 100%;
}

.source-radio.is-checked {
  border-color: #2563eb;
  background: #e8f0fe;
}

.source-label {
  font-weight: 500;
  color: #1f2937;
}

.source-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.upload-area {
  margin-top: 10px;
}

.upload-icon {
  font-size: 28px;
  color: #2563eb;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 13px;
  color: #6b7280;
}

.upload-text em {
  color: #2563eb;
  font-style: normal;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  margin-top: 8px;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #374151;
}

.action-bar {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.disabled-hint {
  opacity: 0.5;
}

/* 结果样式 */
.research-result {
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-left h2 {
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 4px;
  font-weight: 600;
}

.report-period {
  font-size: 12px;
  color: #9ca3af;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.metric-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.metric-top {
  border-left: 3px solid;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
}

.metric-change {
  margin-top: 8px;
  font-size: 12px;
}

.metric-change .up { color: #10b981; }
.metric-change .down { color: #ef4444; }
.change-label { color: #9ca3af; margin-left: 4px; }

.report-body {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.body-section {
  margin-bottom: 20px;
}

.body-section:last-child { margin-bottom: 0; }

.body-section .section-title {
  font-size: 15px;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
}

.section-content {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
}

.section-content p {
  margin-bottom: 8px;
}

.qa-panel {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.qa-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f0fe, #dbeafe);
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.qa-messages {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px 16px;
}

.qa-msg {
  margin-bottom: 10px;
  display: flex;
}

.qa-msg.user {
  justify-content: flex-end;
}

.qa-bubble {
  max-width: 75%;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.qa-msg.user .qa-bubble {
  background: #2563eb;
  color: #fff;
  border-bottom-right-radius: 2px;
}

.qa-msg.ai .qa-bubble {
  background: #f3f4f6;
  color: #374151;
  border-bottom-left-radius: 2px;
}

.qa-input {
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px;
}
</style>