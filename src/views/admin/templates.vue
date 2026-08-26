<template>
  <div class="templates-page">
    <el-page-header @back="router.back()" content="返回" class="page-back-header">
      <template #content>
        <div class="page-title-wrap">
          <div class="page-title">公文模板管理</div>
          <div class="page-subtitle">管理公文模板、写作规范和字段配置，统一公文输出格式</div>
        </div>
      </template>
    </el-page-header>

    <!-- 统计卡片 -->
    <div class="stat-cards-row">
      <div class="stat-card stat-1">
        <div class="stat-value">{{ templates.length }}</div>
        <div class="stat-label">模板总数</div>
      </div>
      <div class="stat-card stat-2">
        <div class="stat-value">{{ categories.length }}</div>
        <div class="stat-label">类型数量</div>
      </div>
      <div class="stat-card stat-3">
        <div class="stat-value">{{ usedCount }}</div>
        <div class="stat-label">本月使用次数</div>
      </div>
      <div class="stat-card stat-4">
        <div class="stat-value">{{ categories.filter(c => c.count > 0).length }}/{{ categories.length }}</div>
        <div class="stat-label">覆盖类型</div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-row">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索模板名称..."
          clearable
          style="width: 260px"
          :prefix-icon="Search"
        />
        <el-radio-group v-model="activeCategory" size="small" class="category-tabs">
          <el-radio-button value="">全部模板</el-radio-button>
          <el-radio-button v-for="cat in categories" :key="cat.name" :value="cat.name">
            {{ cat.name }}
            <el-tag size="small" type="info" style="margin-left: 4px">{{ cat.count }}</el-tag>
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="addTemplate">
          <el-icon><Plus /></el-icon> 新增模板
        </el-button>
      </div>
    </div>

    <!-- 模板卡片列表 -->
    <div class="template-grid" v-if="filteredTemplates.length > 0">
      <div
        v-for="tpl in filteredTemplates"
        :key="tpl.id"
        class="template-card"
        :class="{ 'is-empty': false }"
      >
        <div class="card-header">
          <div class="card-type-badge" :class="'badge-' + tpl.category">
            {{ tpl.category }}
          </div>
          <div class="card-actions">
            <el-tooltip content="预览" placement="top">
              <el-button text size="small" @click="handlePreview(tpl)">
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button text size="small" @click="handleEdit(tpl)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button text size="small" type="danger" @click="handleDelete(tpl)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div class="card-body">
          <div class="card-name">{{ tpl.name }}</div>
          <div class="card-desc">包含 {{ tpl.fields.length }} 个字段</div>
          <div class="card-fields">
            <el-tag
              v-for="f in tpl.fields"
              :key="f"
              size="small"
              effect="plain"
              class="field-tag"
            >
              {{ f }}
            </el-tag>
          </div>
        </div>
        <div class="card-footer">
          <el-button
            size="small"
            type="primary"
            plain
            @click="handleUseTemplate(tpl)"
          >
            <el-icon><Document /></el-icon> 使用此模板
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无匹配的模板" :image-size="120">
      <el-button type="primary" @click="addTemplate">新增模板</el-button>
    </el-empty>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEditing ? '编辑模板' : '新增模板'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入模板名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="公文类型" prop="category">
          <el-select v-model="formData.category" style="width: 100%">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="字段配置" prop="fields">
          <div class="fields-editor">
            <div class="fields-list">
              <div v-for="(field, idx) in formData.fields" :key="idx" class="field-item">
                <el-icon class="field-drag"><Rank /></el-icon>
                <el-input v-model="formData.fields[idx]" placeholder="字段名称" size="small" style="flex:1" />
                <el-button text type="danger" size="small" @click="removeField(idx)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            <el-button size="small" class="add-field-btn" @click="addField">
              <el-icon><Plus /></el-icon> 添加字段
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="模板说明">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="简要描述模板的用途和适用场景（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="previewData?.name || '模板预览'"
      width="700px"
      top="5vh"
    >
      <div v-if="previewData" class="preview-content">
        <div class="preview-meta">
          <el-tag>{{ previewData.category }}</el-tag>
          <span class="preview-field-count">{{ previewData.fields.length }} 个字段</span>
        </div>
        <div class="preview-structure">
          <div class="preview-structure-title">公文结构示意</div>
          <div class="preview-doc">
            <div class="preview-doc-title">【{{ previewData.name }}】</div>
            <div class="preview-doc-line" v-for="(f, i) in previewData.fields" :key="i">
              <span class="preview-doc-label">{{ f }}</span>
              <span class="preview-doc-placeholder">（请输入{{ f }}）</span>
            </div>
            <div class="preview-doc-line">
              <span class="preview-doc-label">发文单位</span>
              <span class="preview-doc-placeholder">（XX市人力资源和社会保障局）</span>
            </div>
            <div class="preview-doc-line">
              <span class="preview-doc-label">发文日期</span>
              <span class="preview-doc-placeholder">（XXXX年XX月XX日）</span>
            </div>
          </div>
        </div>
        <div class="preview-fields-detail">
          <div class="preview-subtitle">字段说明</div>
          <el-table :data="previewFieldsData" size="small" stripe>
            <el-table-column prop="index" label="序号" width="60" />
            <el-table-column prop="name" label="字段名称" />
            <el-table-column prop="type" label="字段类型" width="100" />
            <el-table-column prop="required" label="必填" width="60">
              <template #default>是</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleUseFromPreview">使用此模板</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="showDeleteDialog" title="确认删除" width="400px">
      <div class="delete-confirm">
        <el-icon class="delete-warn-icon" color="#ef4444" :size="48"><WarningFilled /></el-icon>
        <p>确定要删除模板「<strong>{{ deleteTarget?.name }}</strong>」吗？</p>
        <p class="delete-hint">此操作不可撤销，删除后使用该模板生成的公文不受影响。</p>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, View, Edit, Delete, Document, Rank, Close, WarningFilled } from '@element-plus/icons-vue'
import { fetchDocumentTemplates } from '@/api/mock'
import type { DocumentTemplate } from '@/types'

const router = useRouter()

const templates = ref<DocumentTemplate[]>([])
const searchQuery = ref('')
const activeCategory = ref('')
const showAddDialog = ref(false)
const showPreviewDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const previewData = ref<DocumentTemplate | null>(null)
const deleteTarget = ref<DocumentTemplate | null>(null)
const formRef = ref()

const categoryOptions = ['通知', '报告', '请示', '函件', '批复'] as const

const categories = computed(() => {
  const map = new Map<string, number>()
  for (const t of templates.value) {
    map.set(t.category, (map.get(t.category) || 0) + 1)
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
})

const usedCount = computed(() => Math.floor(templates.value.length * 12.5 + 36))

const formData = ref({
  name: '',
  category: '通知' as string,
  fields: ['标题', '正文', '落款'],
  description: ''
})

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择公文类型', trigger: 'change' }],
  fields: [{ required: true, message: '请至少添加一个字段', trigger: 'change' }]
}

const filteredTemplates = computed(() => {
  let list = templates.value
  if (activeCategory.value) {
    list = list.filter(t => t.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
  }
  return list
})

const previewFieldsData = computed(() => {
  if (!previewData.value) return []
  return previewData.value.fields.map((f, i) => ({
    index: i + 1,
    name: f,
    type: '文本',
    required: '是'
  }))
})

onMounted(async () => {
  templates.value = await fetchDocumentTemplates()
})

const addField = () => {
  formData.value.fields.push('')
}

const removeField = (idx: number) => {
  formData.value.fields.splice(idx, 1)
  if (formData.value.fields.length === 0) {
    formData.value.fields.push('标题', '正文', '落款')
  }
}

const resetForm = () => {
  formData.value = { name: '', category: '通知', fields: ['标题', '正文', '落款'], description: '' }
  isEditing.value = false
  editingId.value = ''
}

const openAddDialog = () => {
  resetForm()
  showAddDialog.value = true
}

const handleEdit = (tpl: DocumentTemplate) => {
  isEditing.value = true
  editingId.value = tpl.id
  formData.value = {
    name: tpl.name,
    category: tpl.category,
    fields: [...tpl.fields],
    description: (tpl as any).description || ''
  }
  showAddDialog.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const cleanFields = formData.value.fields.filter(f => f.trim() !== '')
  if (cleanFields.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }

  if (isEditing.value) {
    const idx = templates.value.findIndex(t => t.id === editingId.value)
    if (idx !== -1) {
      templates.value[idx] = {
        ...templates.value[idx],
        name: formData.value.name,
        category: formData.value.category as any,
        fields: cleanFields,
        ...(formData.value.description ? { description: formData.value.description } as any : {})
      }
    }
    ElMessage.success('模板已更新')
  } else {
    const newTpl: DocumentTemplate = {
      id: Date.now().toString(),
      name: formData.value.name,
      category: formData.value.category as any,
      fields: cleanFields
    }
    templates.value.unshift(newTpl)
    ElMessage.success('模板已新增')
  }

  showAddDialog.value = false
  resetForm()
}

const handlePreview = (tpl: DocumentTemplate) => {
  previewData.value = tpl
  showPreviewDialog.value = true
}

const handleDelete = (tpl: DocumentTemplate) => {
  deleteTarget.value = tpl
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  if (!deleteTarget.value) return
  templates.value = templates.value.filter(t => t.id !== deleteTarget.value!.id)
  ElMessage.success('模板已删除')
  showDeleteDialog.value = false
  deleteTarget.value = null
}

const handleUseTemplate = (tpl: DocumentTemplate) => {
  ElMessage.success(`已选择模板「${tpl.name}」，跳转至公文生成...`)
  router.push('/document')
}

const handleUseFromPreview = () => {
  showPreviewDialog.value = false
  if (previewData.value) {
    handleUseTemplate(previewData.value)
  }
}

// 重置新增按钮 - 修改为使用 resetForm
const addTemplate = () => {
  resetForm()
  showAddDialog.value = true
}
</script>

<style scoped>
.templates-page {
  height: calc(100vh - 96px);
  overflow-y: auto;
  padding-bottom: 20px;
}
.page-back-header {
  margin-bottom: 16px;
}
.page-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}
.page-subtitle {
  font-size: 13px;
  color: #6b7280;
}

/* 统计卡片 */
.stat-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border-left: 4px solid;
}
.stat-card .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}
.stat-card .stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}
.stat-1 { border-left-color: #2563eb; }
.stat-2 { border-left-color: #10b981; }
.stat-3 { border-left-color: #f59e0b; }
.stat-4 { border-left-color: #8b5cf6; }

/* 工具栏 */
.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.toolbar-right {
  flex-shrink: 0;
}
.category-tabs :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}

/* 模板卡片网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.template-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}
.template-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
  border-color: #2563eb;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 0;
}
.card-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
  color: #fff;
}
.badge-通知 { background: #2563eb; }
.badge-报告 { background: #10b981; }
.badge-请示 { background: #f59e0b; }
.badge-函件 { background: #8b5cf6; }
.badge-批复 { background: #ef4444; }
.card-actions {
  display: flex;
  gap: 2px;
}
.card-body {
  padding: 12px 16px;
  flex: 1;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}
.card-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
}
.card-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.field-tag {
  font-size: 11px;
}
.card-footer {
  padding: 10px 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
}

/* 字段编辑器 */
.fields-editor {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}
.fields-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.field-drag {
  color: #9ca3af;
  cursor: grab;
}
.add-field-btn {
  width: 100%;
  border-style: dashed;
}

/* 预览 */
.preview-content {
  padding: 0 4px;
}
.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.preview-field-count {
  font-size: 13px;
  color: #6b7280;
}
.preview-structure {
  margin-bottom: 20px;
}
.preview-structure-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}
.preview-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}
.preview-doc {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px 24px;
  font-family: SimSun, serif;
}
.preview-doc-title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #1f2937;
}
.preview-doc-line {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.8;
}
.preview-doc-label {
  color: #1f2937;
  font-weight: 500;
}
.preview-doc-placeholder {
  color: #9ca3af;
}
.preview-fields-detail {
  margin-top: 16px;
}

/* 删除确认 */
.delete-confirm {
  text-align: center;
  padding: 16px 0;
}
.delete-warn-icon {
  margin-bottom: 12px;
}
.delete-confirm p {
  font-size: 14px;
  color: #374151;
  margin: 8px 0;
}
.delete-hint {
  font-size: 12px !important;
  color: #9ca3af !important;
}
</style>