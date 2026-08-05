<template>
  <div class="document-page">
    <el-row :gutter="20">
      <!-- 左侧：模板选择和参数输入 -->
      <el-col :span="8">
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">选择公文类型</div>
          </div>
          <div class="template-list">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="template-item"
              :class="{ active: selectedTemplate === tpl.id }"
              @click="selectTemplate(tpl.id)"
            >
              <el-icon :size="20" color="#1a56db"><Document /></el-icon>
              <div class="template-info">
                <div class="template-name">{{ tpl.name }}</div>
                <div class="template-category">{{ tpl.category }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="page-card">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">填写要点</div>
          </div>
          <el-form label-width="80px" size="default">
            <el-form-item label="标题">
              <el-input v-model="docParams.title" placeholder="请输入公文标题" />
            </el-form-item>
            <el-form-item label="发文对象">
              <el-input v-model="docParams.target" placeholder="请输入发文对象" />
            </el-form-item>
            <el-form-item label="正文要点">
              <el-input
                v-model="docParams.content"
                type="textarea"
                :rows="5"
                placeholder="请输入正文要点，AI将据此生成初稿"
              />
            </el-form-item>
            <el-form-item label="落款">
              <el-input v-model="docParams.signature" placeholder="请输入落款单位" />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleGenerate"
                :loading="generating"
                style="width: 100%"
              >
                <el-icon><MagicStick /></el-icon> AI生成初稿
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：生成结果和编辑 -->
      <el-col :span="16">
        <div class="page-card doc-editor" style="height: calc(100vh - 136px)">
          <div class="editor-header">
            <div class="page-title" style="font-size: 16px">
              {{ currentDoc?.title || '公文编辑区' }}
            </div>
            <div class="editor-actions">
              <el-button v-if="currentDoc" @click="handleProofread" :loading="proofreading">
                <el-icon><Checked /></el-icon> 合规审校
              </el-button>
              <el-button v-if="currentDoc" type="primary" @click="handleExport">
                <el-icon><Download /></el-icon> 导出Word
              </el-button>
            </div>
          </div>

          <div v-if="!currentDoc" class="editor-empty">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p class="empty-title">选择模板并填写要点后生成公文</p>
            <p class="empty-desc">AI将基于模板和您的输入生成公文初稿</p>
          </div>

          <div v-else class="editor-content">
            <el-input
              v-model="currentDoc.content"
              type="textarea"
              :rows="20"
              class="doc-textarea"
              placeholder="在此编辑公文内容..."
            />

            <!-- 审校问题 -->
            <div v-if="currentDoc.issues.length > 0" class="proofread-panel">
              <div class="panel-title">
                <el-icon color="#f59e0b"><Warning /></el-icon>
                审校发现 {{ currentDoc.issues.length }} 个问题
              </div>
              <div v-for="(issue, idx) in currentDoc.issues" :key="idx" class="issue-item">
                <el-tag
                  :type="issue.type === 'sensitive' || issue.type === 'political' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ issueTypeLabel(issue.type) }}
                </el-tag>
                <span class="issue-message">{{ issue.message }}</span>
                <span class="issue-position">{{ issue.position }}</span>
              </div>
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
import { fetchDocumentTemplates, generateDocument } from '@/api/mock'
import type { DocumentTemplate, DocumentRecord } from '@/types'

const templates = ref<DocumentTemplate[]>([])
const selectedTemplate = ref('')
const generating = ref(false)
const proofreading = ref(false)
const currentDoc = ref<DocumentRecord | null>(null)

const docParams = ref({
  title: '',
  target: '',
  content: '',
  signature: 'XX市人力资源和社会保障局',
  date: '',
})

onMounted(async () => {
  templates.value = await fetchDocumentTemplates()
})

const selectTemplate = (id: string) => {
  selectedTemplate.value = id
}

const issueTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    typo: '错别字',
    format: '格式',
    sensitive: '敏感词',
    political: '涉政表述',
  }
  return map[type] || type
}

const handleGenerate = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请先选择公文类型')
    return
  }
  generating.value = true
  try {
    currentDoc.value = await generateDocument(selectedTemplate.value, docParams.value)
    ElMessage.success('公文初稿生成成功')
  } catch {
    ElMessage.error('生成失败，请重试')
  } finally {
    generating.value = false
  }
}

const handleProofread = async () => {
  proofreading.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  proofreading.value = false
  ElMessage.success('审校完成，已标注问题')
}

const handleExport = () => {
  ElMessage.success('Word文档导出成功')
}
</script>

<style scoped>
.document-page {
  height: calc(100vh - 96px);
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item:hover {
  border-color: #1a56db;
  background: #f8fafc;
}

.template-item.active {
  border-color: #1a56db;
  background: #e8f0fe;
}

.template-info {
  flex: 1;
}

.template-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.template-category {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.doc-editor {
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
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

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.doc-textarea {
  flex: 1;
}

.doc-textarea :deep(.el-textarea__inner) {
  height: 100%;
  font-size: 14px;
  line-height: 2;
  font-family: 'SimSun', serif;
}

.proofread-panel {
  padding: 16px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fde68a;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #fde68a;
  font-size: 13px;
}

.issue-item:last-child {
  border-bottom: none;
}

.issue-message {
  flex: 1;
  color: #374151;
}

.issue-position {
  color: #9ca3af;
  font-size: 12px;
}
</style>
