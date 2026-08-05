<template>
  <div class="report-page">
    <el-row :gutter="20">
      <!-- 左侧：报告配置 -->
      <el-col :span="8">
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">报告配置</div>
          </div>
          <el-form label-width="80px">
            <el-form-item label="报告类型">
              <el-select v-model="selectedTemplate" placeholder="请选择报告模板" style="width: 100%">
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
                v-model="selectedPeriod"
                type="month"
                placeholder="选择月份"
                style="width: 100%"
                value-format="YYYY-MM"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleGenerate"
                :loading="generating"
                style="width: 100%"
              >
                <el-icon><MagicStick /></el-icon> 生成报告
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="page-card">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">报告模板</div>
          </div>
          <div class="template-cards">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="template-card"
              :class="{ active: selectedTemplate === tpl.id }"
              @click="selectedTemplate = tpl.id"
            >
              <el-icon :size="24" color="#1a56db"><TrendCharts /></el-icon>
              <div class="tpl-name">{{ tpl.name }}</div>
              <div class="tpl-category">{{ tpl.category }}</div>
              <div class="tpl-indicators">
                <el-tag v-for="ind in tpl.indicators" :key="ind" size="small">{{ ind }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：报告内容 -->
      <el-col :span="16">
        <div class="page-card report-content" style="height: calc(100vh - 136px)">
          <div v-if="!reportData" class="report-empty">
            <el-icon :size="48" color="#c0c4cc"><TrendCharts /></el-icon>
            <p class="empty-title">选择模板和周期后生成报告</p>
            <p class="empty-desc">系统将自动获取数据并生成分析报告</p>
          </div>

          <div v-else class="report-body">
            <div class="report-header-bar">
              <h2 class="report-title">{{ reportData.title }}</h2>
              <div class="report-actions">
                <el-button @click="handleExport">
                  <el-icon><Download /></el-icon> 导出Word
                </el-button>
              </div>
            </div>

            <div class="report-text" v-html="formatReport(reportData.content)"></div>

            <!-- AI建议 -->
            <div class="ai-suggestions">
              <div class="suggestions-title">
                <el-icon color="#1a56db"><Lightbulb /></el-icon>
                AI工作建议
                <el-tag size="small" type="info">AI建议</el-tag>
              </div>
              <ol class="suggestions-list">
                <li v-for="(s, i) in reportData.suggestions" :key="i">{{ s }}</li>
              </ol>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchReportTemplates, generateReport } from '@/api/mock'
import type { ReportTemplate } from '@/types'

const templates = ref<ReportTemplate[]>([])
const selectedTemplate = ref('')
const selectedPeriod = ref('2024-07')
const generating = ref(false)
const reportData = ref<{ title: string; content: string; suggestions: string[] } | null>(null)

onMounted(async () => {
  templates.value = await fetchReportTemplates()
  if (templates.value.length > 0) {
    selectedTemplate.value = templates.value[0].id
  }
})

const handleGenerate = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择报告模板')
    return
  }
  generating.value = true
  try {
    reportData.value = await generateReport(selectedTemplate.value, selectedPeriod.value)
    ElMessage.success('报告生成成功')
  } catch {
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

const handleExport = () => {
  ElMessage.success('Word文档导出成功')
}

const formatReport = (content: string) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/^(一|二|三|四|五)\u3001/g, '<h3>$1、</h3>')
    .replace(/^(\d+)\.\s/g, '<strong>$1. </strong>')
}
</script>

<style scoped>
.report-page {
  height: calc(100vh - 96px);
}

.template-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-card {
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #1a56db;
}

.template-card.active {
  border-color: #1a56db;
  background: #e8f0fe;
}

.tpl-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-top: 8px;
}

.tpl-category {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.tpl-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.report-content {
  overflow-y: auto;
}

.report-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-title {
  font-size: 16px;
  color: #6b7280;
  margin-top: 16px;
}

.empty-desc {
  font-size: 13px;
  margin-top: 8px;
}

.report-body {
  padding: 10px 0;
}

.report-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 2px solid #1a56db;
  margin-bottom: 20px;
}

.report-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.report-text {
  font-size: 14px;
  line-height: 2;
  color: #374151;
  font-family: 'SimSun', serif;
}

.report-text :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #1f2937;
}

.ai-suggestions {
  margin-top: 24px;
  padding: 16px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.suggestions-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1a56db;
  margin-bottom: 12px;
}

.suggestions-list {
  padding-left: 20px;
  font-size: 14px;
  line-height: 2;
  color: #374151;
}

.suggestions-list li {
  margin-bottom: 4px;
}
</style>
