<template>
  <div class="data-report-page">
    <div class="page-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="📤 上传数据生成分析" name="upload">
          <div class="tab-content">
            <!-- 上传区 -->
            <div v-if="!uploadReportGenerated" class="upload-config">
              <div class="upload-main">
                <el-upload
                  drag
                  :auto-upload="false"
                  :limit="1"
                  accept=".xlsx,.xls,.csv,.docx,.pdf"
                  @change="handleFileChange"
                  class="upload-box"
                >
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
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!uploadFileName"
                  @click="generateUploadReport"
                  :loading="generatingUpload"
                >
                  <el-icon style="margin-right:6px"><MagicStick /></el-icon>
                  {{ generatingUpload ? '正在生成分析报告...' : '基于上传数据生成分析报告' }}
                </el-button>
              </div>
            </div>

            <!-- 上传结果 -->
            <div v-else class="report-result">
              <div class="result-header">
                <div class="header-left">
                  <h3>上传数据智能分析报告</h3>
                  <span class="file-source">数据来源：{{ uploadFileName }}</span>
                </div>
                <div class="header-actions">
                  <el-button @click="exportUploadReport('word')"><el-icon><Download /></el-icon>导出 Word</el-button>
                  <el-button @click="exportUploadReport('pdf')"><el-icon><Download /></el-icon>导出 PDF</el-button>
                  <el-button @click="uploadReportGenerated = false" text><el-icon><Back /></el-icon>重新上传</el-button>
                </div>
              </div>
              <div class="report-body">
                <div class="body-section">
                  <h4>一、数据概况</h4>
                  <div class="metrics-row">
                    <div class="metric-card">
                      <span class="metric-label">数据记录数</span>
                      <span class="metric-value" style="color:#2563eb">8,426 条</span>
                    </div>
                    <div class="metric-card">
                      <span class="metric-label">涉及指标</span>
                      <span class="metric-value" style="color:#10b981">12 项</span>
                    </div>
                    <div class="metric-card">
                      <span class="metric-label">时间跨度</span>
                      <span class="metric-value" style="color:#f59e0b">6 个月</span>
                    </div>
                    <div class="metric-card">
                      <span class="metric-label">数据完整性</span>
                      <span class="metric-value" style="color:#ff7c00">97.3%</span>
                    </div>
                  </div>
                </div>
                <div class="body-section">
                  <h4>二、核心分析结论</h4>
                  <p>通过对上传数据的全面分析，发现以下关键趋势：</p>
                  <ul>
                    <li><strong>就业总量稳定</strong>：辖区内就业总人数较上期增长 2.3%，呈稳步增长态势。</li>
                    <li><strong>重点群体就业</strong>：高校毕业生就业去向落实率达 78.5%，较去年同期上升 2.3 个百分点。</li>
                    <li><strong>产业结构优化</strong>：第三产业就业占比持续提升，已从 48.2% 上升至 52.6%。</li>
                    <li><strong>技能培训成效</strong>：参加职业技能培训人员就业率提升 15.6%，培训与就业联动效果显著。</li>
                  </ul>
                </div>
                <div class="body-section">
                  <h4>三、AI 工作建议</h4>
                  <div class="suggestion-card">
                    <div class="suggestion-item">
                      <span class="suggestion-tag">建议一</span>
                      <p>建议加强对XX社区的就业帮扶力度，该社区失业人员占比高于全区平均水平 3.2 个百分点，建议优先配置就业服务资源。</p>
                    </div>
                    <div class="suggestion-item">
                      <span class="suggestion-tag">建议二</span>
                      <p>建议重点关注制造业行业用工波动，近三个月该行业岗位需求下降 8.5%，建议提前做好转岗培训和就业对接。</p>
                    </div>
                    <div class="suggestion-item">
                      <span class="suggestion-tag">建议三</span>
                      <p>建议加大高校毕业生就业服务力度，特别是计算机、金融等专业的就业匹配度有待提升，建议组织专场招聘活动。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="📊 系统数据对比分析" name="system">
          <div class="tab-content">
            <div v-if="!systemReportGenerated" class="system-config">
              <div class="config-section">
                <div class="section-title">分析主题</div>
                <el-select v-model="systemTopic" placeholder="请选择分析主题" class="full-width">
                  <el-option label="就业数据同比环比分析" value="employment" />
                  <el-option label="社保参保数据分析" value="social" />
                  <el-option label="失业登记数据分析" value="unemployment" />
                  <el-option label="补贴发放数据分析" value="subsidy" />
                  <el-option label="劳动力市场分析" value="labor" />
                </el-select>
              </div>

              <div class="config-section">
                <div class="section-title">分析周期</div>
                <div class="period-row">
                  <div class="period-item">
                    <label class="period-label">基期</label>
                    <el-date-picker v-model="basePeriod" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" class="full-width" value-format="YYYY-MM-DD" />
                  </div>
                  <div class="period-item">
                    <label class="period-label">对比期</label>
                    <el-date-picker v-model="comparePeriod" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" class="full-width" value-format="YYYY-MM-DD" />
                  </div>
                </div>
                <div class="quick-btns">
                  <el-button size="small" :type="quickBtn === 'yoy' ? 'primary' : 'default'" @click="setYoY">同比（去年同期）</el-button>
                  <el-button size="small" :type="quickBtn === 'qoq' ? 'primary' : 'default'" @click="setQoQ">环比（上期）</el-button>
                </div>
              </div>

              <div class="config-section">
                <div class="section-title">对比维度</div>
                <el-checkbox-group v-model="compareDimensions">
                  <el-checkbox value="total">总量对比</el-checkbox>
                  <el-checkbox value="rate">增长率对比</el-checkbox>
                  <el-checkbox value="structure">结构变化对比</el-checkbox>
                  <el-checkbox value="regional">区域分布对比</el-checkbox>
                </el-checkbox-group>
              </div>

              <div class="config-section">
                <div class="section-title">输出格式</div>
                <el-checkbox-group v-model="systemOutputFormats">
                  <el-checkbox value="word">Word 文档</el-checkbox>
                  <el-checkbox value="pdf">PDF 文档</el-checkbox>
                </el-checkbox-group>
              </div>

              <div class="action-bar">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!canGenerateSystem"
                  @click="generateSystemReport"
                  :loading="generatingSystem"
                >
                  <el-icon style="margin-right:6px"><MagicStick /></el-icon>
                  {{ generatingSystem ? '正在生成对比分析报告...' : '生成对比分析报告' }}
                </el-button>
              </div>
            </div>

            <div v-else class="report-result">
              <div class="result-header">
                <div class="header-left">
                  <h3>{{ systemTopicLabel }}对比分析报告</h3>
                  <span class="file-source">基于系统业务数据生成</span>
                </div>
                <div class="header-actions">
                  <el-button @click="exportSystemReport('word')"><el-icon><Download /></el-icon>导出 Word</el-button>
                  <el-button @click="exportSystemReport('pdf')"><el-icon><Download /></el-icon>导出 PDF</el-button>
                  <el-button @click="systemReportGenerated = false" text><el-icon><Back /></el-icon>重新配置</el-button>
                </div>
              </div>

              <div class="report-body">
                <div class="body-section">
                  <h4>一、核心指标对比</h4>
                  <div class="compare-table-wrapper">
                    <table class="compare-table">
                      <thead>
                        <tr>
                          <th>指标名称</th>
                          <th>基期</th>
                          <th>对比期</th>
                          <th>变化量</th>
                          <th>变化率</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in compareData" :key="row.name">
                          <td>{{ row.name }}</td>
                          <td>{{ row.base }}</td>
                          <td>{{ row.compare }}</td>
                          <td :class="row.change >= 0 ? 'up' : 'down'">{{ row.change >= 0 ? '+' : '' }}{{ row.change }}</td>
                          <td :class="row.rate >= 0 ? 'up' : 'down'">{{ row.rate >= 0 ? '+' : '' }}{{ row.rate }}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="body-section">
                  <h4>二、结构变化分析</h4>
                  <p>对比期内，各维度结构发生如下变化：</p>
                  <ul>
                    <li>城镇登记失业率较去年同期 <strong>下降 0.3 个百分点</strong>，就业形势总体稳定。</li>
                    <li>第三产业就业占比 <strong>提升 2.1 个百分点</strong>，产业结构持续优化。</li>
                    <li>灵活就业人员社保参保人数 <strong>增长 15.6%</strong>，社保覆盖范围进一步扩大。</li>
                    <li>重点群体就业帮扶成功率 <strong>提升 5.2 个百分点</strong>，帮扶政策成效显著。</li>
                  </ul>
                </div>
                <div class="body-section">
                  <h4>三、AI 针对性工作建议</h4>
                  <div class="suggestion-card">
                    <div class="suggestion-item" v-for="(s, i) in systemSuggestions" :key="i">
                      <span class="suggestion-tag">建议{{ '一二三四五'[i] }}</span>
                      <p>{{ s }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadFilled, Document, MagicStick, Download, Back } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const activeTab = ref('upload')

// Upload tab
const uploadFileName = ref('')
const outputFormats = ref<string[]>(['word'])
const extraContent = ref<string[]>(['chart', 'suggestion'])
const generatingUpload = ref(false)
const uploadReportGenerated = ref(false)

// System tab
const systemTopic = ref('')
const basePeriod = ref<[string, string]>(['', ''])
const comparePeriod = ref<[string, string]>(['', ''])
const quickBtn = ref('')
const compareDimensions = ref<string[]>(['total', 'rate'])
const systemOutputFormats = ref<string[]>(['word'])
const generatingSystem = ref(false)
const systemReportGenerated = ref(false)

const topicLabels: Record<string, string> = {
  employment: '就业数据',
  social: '社保参保数据',
  unemployment: '失业登记数据',
  subsidy: '补贴发放数据',
  labor: '劳动力市场'
}

const systemTopicLabel = computed(() => topicLabels[systemTopic.value] || '')

const canGenerateSystem = computed(() => {
  return systemTopic.value && basePeriod.value[0] && basePeriod.value[1] && comparePeriod.value[0] && comparePeriod.value[1] && systemOutputFormats.value.length > 0
})

const compareData = ref([
  { name: '城镇新增就业人数', base: '12,847人', compare: '14,256人', change: 1409, rate: 10.97 },
  { name: '城镇调查失业率', base: '5.2%', compare: '4.9%', change: -0.3, rate: -5.77 },
  { name: '高校毕业生就业去向落实率', base: '76.2%', compare: '78.5%', change: 2.3, rate: 3.02 },
  { name: '就业困难人员帮扶就业率', base: '78.5%', compare: '82.6%', change: 4.1, rate: 5.22 },
  { name: '职业技能培训人数', base: '3,526人', compare: '4,183人', change: 657, rate: 18.63 },
  { name: '社保参保人数', base: '286,452人', compare: '301,847人', change: 15395, rate: 5.37 }
])

const systemSuggestions = ref([
  '建议重点关注城镇调查失业率下降趋势，持续监测就业市场变化，保持就业扶持政策的连续性和稳定性。',
  '建议加大对高校毕业生就业服务力度，特别是对未就业毕业生开展"一对一"就业帮扶，确保就业去向落实率稳步提升。',
  '建议加强职业技能培训与产业需求的对接，提高培训的针对性和实效性，促进培训后就业转化率提升。',
  '建议关注灵活就业人员社保参保快速增长的趋势，适时出台灵活就业人员权益保障配套政策。',
  '建议对就业困难人员实施精准帮扶，重点关注失业12个月以上长期失业人员，制定个性化帮扶方案。'
])

function handleFileChange(file: any) {
  if (file.name) uploadFileName.value = file.name
}

function removeUploadFile() {
  uploadFileName.value = ''
}

function generateUploadReport() {
  generatingUpload.value = true
  setTimeout(() => {
    generatingUpload.value = false
    uploadReportGenerated.value = true
  }, 2000)
}

function exportUploadReport(type: string) {
  alert(`报告已导出为${type.toUpperCase()}格式。`)
}

function setYoY() {
  quickBtn.value = 'yoy'
  const now = dayjs()
  basePeriod.value = [now.subtract(1, 'year').startOf('year').format('YYYY-MM-DD'), now.subtract(1, 'year').endOf('year').format('YYYY-MM-DD')]
  comparePeriod.value = [now.startOf('year').format('YYYY-MM-DD'), now.format('YYYY-MM-DD')]
}

function setQoQ() {
  quickBtn.value = 'qoq'
  const now = dayjs()
  const lastMonth = now.subtract(1, 'month')
  basePeriod.value = [lastMonth.startOf('month').format('YYYY-MM-DD'), lastMonth.endOf('month').format('YYYY-MM-DD')]
  comparePeriod.value = [now.startOf('month').format('YYYY-MM-DD'), now.format('YYYY-MM-DD')]
}

function generateSystemReport() {
  generatingSystem.value = true
  setTimeout(() => {
    generatingSystem.value = false
    systemReportGenerated.value = true
  }, 2000)
}

function exportSystemReport(type: string) {
  alert(`对比分析报告已导出为${type.toUpperCase()}格式。`)
}
</script>

<style scoped>
.data-report-page {
  height: 100%;
  overflow-y: auto;
  padding: 0;
}

.page-tabs {
  height: 100%;
}

.page-tabs :deep(.el-tabs__header) {
  padding: 0 20px;
  margin: 0;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.page-tabs :deep(.el-tabs__content) {
  padding: 20px;
  height: calc(100% - 48px);
  overflow-y: auto;
}

.tab-content {
  max-width: 900px;
  margin: 0 auto;
}

.upload-config, .system-config {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.upload-box {
  width: 100%;
}

.upload-icon {
  font-size: 32px;
  color: #2563eb;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
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

.uploaded-file-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #f3f4f6;
  border-radius: 8px;
  margin-top: 12px;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #374151;
}

.config-row {
  display: flex;
  gap: 32px;
  margin-top: 20px;
}

.config-item {
  flex: 1;
}

.item-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.action-bar {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* System config */
.config-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}

.full-width {
  width: 100%;
}

.period-row {
  display: flex;
  gap: 16px;
}

.period-item {
  flex: 1;
}

.period-label {
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
}

.quick-btns {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* Report result */
.report-result {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-left h3 {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 4px;
  font-weight: 600;
}

.file-source {
  font-size: 12px;
  color: #9ca3af;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.report-body {
  line-height: 1.8;
}

.body-section {
  margin-bottom: 24px;
}

.body-section h4 {
  font-size: 15px;
  color: #1f2937;
  margin-bottom: 12px;
  font-weight: 600;
}

.body-section p {
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
}

.body-section ul {
  padding-left: 20px;
}

.body-section li {
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
}

/* Metrics */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
}

/* Suggestions */
.suggestion-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f0fe, #f0f4ff);
  border-radius: 8px;
  border-left: 3px solid #2563eb;
}

.suggestion-item p {
  margin: 0;
  flex: 1;
}

.suggestion-tag {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  white-space: nowrap;
  padding: 2px 8px;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 4px;
  height: fit-content;
}

/* Compare table */
.compare-table-wrapper {
  overflow-x: auto;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.compare-table th {
  background: #f3f4f6;
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.compare-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.compare-table .up {
  color: #10b981;
  font-weight: 500;
}

.compare-table .down {
  color: #ef4444;
  font-weight: 500;
}

.compare-table tr:hover td {
  background: #f9fafb;
}
</style>