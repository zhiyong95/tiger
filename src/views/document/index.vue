<template>
  <div class="doc-page">
    <!-- 顶部标语与统计卡片 -->
    <div class="stats-banner">
      <div class="slogan">
        <el-icon><Document /></el-icon>
        <span>AI智能公文助手 · 高效撰写 · 智能审校 · 一键归档</span>
      </div>
      <div class="stats-row">
        <div class="stat-card stat-blue">
          <span class="stat-label">本月已生成</span>
          <div class="stat-value-row">
            <span class="stat-value">{{ stats.monthlyGenerated }}</span>
            <span class="stat-trend up">↑{{ stats.monthlyGrowth }}%</span>
          </div>
        </div>
        <div class="stat-card stat-green">
          <span class="stat-label">审核通过率</span>
          <div class="stat-value-row">
            <span class="stat-value">{{ stats.approvalRate }}%</span>
          </div>
        </div>
        <div class="stat-card stat-amber">
          <span class="stat-label">AI节省时长</span>
          <div class="stat-value-row">
            <span class="stat-value">{{ stats.aiSavedHours }}<span class="stat-unit">h</span></span>
          </div>
        </div>
        <div class="stat-card stat-red">
          <span class="stat-label">流转中公文</span>
          <div class="stat-value-row">
            <span class="stat-value">{{ stats.inProgress }}</span>
          </div>
        </div>
        <div class="stat-card stat-purple">
          <span class="stat-label">归档总量</span>
          <div class="stat-value-row">
            <span class="stat-value">{{ stats.totalArchived.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能导航标签 -->
    <div class="nav-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['nav-tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <el-icon :size="18"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
        <span :class="['tab-badge', tab.key === 'template' ? 'badge-blue' : 'badge-gray']">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 筛选与操作区（模板库） -->
    <template v-if="activeTab === 'template'">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="filter-group">
            <span class="filter-label">公文类型</span>
            <div class="filter-tags">
              <span
                v-for="dt in docTypeOptions"
                :key="dt.key"
                :class="['filter-tag', { active: selectedDocType === dt.key }]"
                @click="selectedDocType = dt.key"
              >{{ dt.label }}<span class="tag-count">({{ dt.count }})</span></span>
            </div>
          </div>
          <div class="filter-group">
            <span class="filter-label">业务领域</span>
            <el-select v-model="selectedField" placeholder="全部领域" size="small" class="field-select">
              <el-option label="全部领域" value="" />
              <el-option label="综合管理" value="综合管理" />
              <el-option label="就业促进" value="就业促进" />
              <el-option label="社会保险" value="社会保险" />
              <el-option label="人才开发" value="人才开发" />
              <el-option label="劳动关系" value="劳动关系" />
              <el-option label="规划财务" value="规划财务" />
              <el-option label="政策法规" value="政策法规" />
            </el-select>
          </div>
          <el-input
            v-model="searchQuery"
            placeholder="搜索模板..."
            prefix-icon="Search"
            size="small"
            class="search-input"
            clearable
          />
        </div>
        <div class="filter-right">
          <el-button size="small" class="recent-btn">
            <el-icon style="margin-right: 4px;"><Clock /></el-icon>最近使用
          </el-button>
          <el-button type="primary" size="small" class="create-btn">
            <el-icon style="margin-right: 4px;"><Plus /></el-icon>新建模板
          </el-button>
        </div>
      </div>

      <!-- 我收藏的模板 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon :size="18"><StarFilled /></el-icon>
            我收藏的模板
          </h3>
          <span class="section-count">共 {{ favoriteTemplates.length }} 个模板</span>
        </div>
        <div class="template-grid">
          <div
            v-for="tmpl in favoriteTemplates"
            :key="tmpl.id"
            class="template-card"
            @click="handleUseTemplate(tmpl)"
          >
            <div class="card-top">
              <div class="card-icon" :style="{ background: tmpl.iconColor + '20', color: tmpl.iconColor }">
                <el-icon :size="22"><component :is="docTypeIconMap[tmpl.docType]" /></el-icon>
              </div>
              <div v-if="tmpl.badge" :class="['card-badge', tmpl.badge.type === 'hot' ? 'badge-hot' : 'badge-new']">
                {{ tmpl.badge.text }}
              </div>
            </div>
            <div class="card-title">{{ tmpl.name }}</div>
            <div class="card-subtitle">{{ tmpl.subtitle }}</div>
            <div class="card-bottom">
              <div class="card-tags">
                <span v-for="tag in tmpl.tags" :key="tag.text" class="card-tag" :style="{ background: tag.color + '15', color: tag.color }">
                  {{ tag.text }}
                </span>
              </div>
              <span class="card-usage">使用{{ tmpl.usageCount }}次</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 部门热门模板 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon :size="18"><TrendCharts /></el-icon>
            部门热门模板
          </h3>
          <span class="section-count">共 {{ hotTemplates.length }} 个模板</span>
        </div>
        <div class="template-grid">
          <div
            v-for="tmpl in hotTemplates"
            :key="tmpl.id"
            class="template-card hot-card"
            @click="handleUseTemplate(tmpl)"
          >
            <div class="card-top">
              <div class="card-icon" :style="{ background: tmpl.iconColor + '20', color: tmpl.iconColor }">
                <el-icon :size="22"><component :is="docTypeIconMap[tmpl.docType]" /></el-icon>
              </div>
              <div v-if="tmpl.badge" :class="['card-badge', tmpl.badge.type === 'hot' ? 'badge-hot' : 'badge-new']">
                {{ tmpl.badge.text }}
              </div>
            </div>
            <div class="card-title">{{ tmpl.name }}</div>
            <div class="card-subtitle">{{ tmpl.subtitle }}</div>
            <div class="card-desc">{{ tmpl.description }}</div>
            <div class="card-bottom">
              <div class="card-tags">
                <span v-for="tag in tmpl.tags" :key="tag.text" class="card-tag" :style="{ background: tag.color + '15', color: tag.color }">
                  {{ tag.text }}
                </span>
              </div>
              <div class="card-meta">
                <span class="card-rating">★ {{ tmpl.rating }} · {{ tmpl.ratingCount }}次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 合规审校 -->
    <template v-if="activeTab === 'review'">
      <div class="empty-state">
        <el-icon :size="48"><CircleCheck /></el-icon>
        <h3>合规审校</h3>
        <p>从模板库选择公文后进行合规审校，检查错别字、敏感词、格式问题</p>
      </div>
    </template>

    <!-- 检索归档 -->
    <template v-if="activeTab === 'archive'">
      <div class="empty-state">
        <el-icon :size="48"><FolderOpened /></el-icon>
        <h3>检索归档</h3>
        <p>检索历史公文记录，支持按时间、类型、关键词筛选</p>
      </div>
    </template>

    <!-- 流转督办 -->
    <template v-if="activeTab === 'supervise'">
      <div class="empty-state">
        <el-icon :size="48"><Bell /></el-icon>
        <h3>流转督办</h3>
        <p>跟踪公文流转状态，督办待办事项</p>
      </div>
    </template>

    <!-- 使用模板对话框 -->
    <el-dialog v-model="showDialog" title="使用模板" width="700px" :close-on-click-modal="false">
      <template v-if="selectedTemplate">
        <el-form :model="formData" label-width="100px">
          <el-form-item label="公文标题">
            <el-input v-model="formData.title" placeholder="请输入公文标题" />
          </el-form-item>
          <el-form-item label="发文对象">
            <el-input v-model="formData.target" placeholder="请输入发文对象" />
          </el-form-item>
          <el-form-item label="正文内容">
            <el-input v-model="formData.content" type="textarea" :rows="8" placeholder="请输入正文内容" />
          </el-form-item>
          <el-form-item label="落款单位">
            <el-input v-model="formData.signature" placeholder="请输入落款单位" />
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker v-model="formData.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate">生成初稿</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document, StarFilled, TrendCharts, CircleCheck, FolderOpened, Bell,
  Clock, Plus, Search, DocumentCopy, Notification, ChatDotSquare,
  DataAnalysis, WarningFilled,
} from '@element-plus/icons-vue'
import type { DocStats, TemplateCard, DocTab } from '@/types'
import { fetchDocStats, fetchTemplateCards, fetchHotTemplateCards, generateDocument } from '@/api/mock'

const router = useRouter()

const stats = ref<DocStats>({
  monthlyGenerated: 0, monthlyGrowth: 0, approvalRate: 0,
  aiSavedHours: 0, inProgress: 0, totalArchived: 0,
})
const templateCards = ref<TemplateCard[]>([])
const hotTemplates = ref<TemplateCard[]>([])
const loading = ref(false)
const activeTab = ref<DocTab>('template')
const searchQuery = ref('')
const selectedDocType = ref('all')
const selectedField = ref('')
const showDialog = ref(false)
const selectedTemplate = ref<TemplateCard | null>(null)
const formData = ref({
  title: '',
  target: '',
  content: '',
  signature: '',
  date: '',
})

const docTypeIconMap: Record<string, any> = {
  '请示': DocumentCopy,
  '通知': Notification,
  '报告': DataAnalysis,
  '函件': ChatDotSquare,
  '批复': DocumentCopy,
  '约谈通知': WarningFilled,
}

const tabs = [
  { key: 'template' as DocTab, label: '模板库', icon: Document, count: '128' },
  { key: 'review' as DocTab, label: '合规审校', icon: CircleCheck, count: '3' },
  { key: 'archive' as DocTab, label: '检索归档', icon: FolderOpened, count: '12.4K' },
  { key: 'supervise' as DocTab, label: '流转督办', icon: Bell, count: '24' },
]

const docTypeOptions = [
  { key: 'all', label: '全部', count: 128 },
  { key: '请示', label: '请示', count: 28 },
  { key: '通知', label: '通知', count: 35 },
  { key: '报告', label: '报告', count: 22 },
  { key: '函件', label: '函件', count: 18 },
  { key: '批复', label: '批复', count: 15 },
  { key: '约谈通知', label: '约谈通知', count: 10 },
]

const favoriteTemplates = computed(() => {
  let list = templateCards.value
  if (selectedDocType.value !== 'all') {
    list = list.filter((t) => t.docType === selectedDocType.value)
  }
  if (selectedField.value) {
    list = list.filter((t) => t.businessField === selectedField.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((t) => t.name.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q))
  }
  return list
})

async function loadData() {
  loading.value = true
  try {
    const [s, tc, ht] = await Promise.all([
      fetchDocStats(),
      fetchTemplateCards(),
      fetchHotTemplateCards(),
    ])
    stats.value = s
    templateCards.value = tc
    hotTemplates.value = ht
  } catch (e: any) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleUseTemplate(tmpl: TemplateCard) {
  selectedTemplate.value = tmpl
  formData.value = { title: '', target: '', content: '', signature: '', date: '' }
  showDialog.value = true
}

async function handleGenerate() {
  if (!selectedTemplate.value) return
  try {
    const result = await generateDocument(selectedTemplate.value.id, formData.value)
    ElMessage.success('公文初稿已生成')
    showDialog.value = false
    router.push('/document')
  } catch (e: any) {
    ElMessage.error('生成失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.doc-page {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 20px;
}

/* ===== 统计横幅 ===== */
.stats-banner {
  margin-bottom: 20px;
}

.slogan {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 16px;
  padding: 0 2px;
}

.slogan .el-icon {
  color: #1a56db;
  font-size: 18px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-blue { border-left: 3px solid #3b82f6; }
.stat-green { border-left: 3px solid #10b981; }
.stat-amber { border-left: 3px solid #d97706; }
.stat-red { border-left: 3px solid #ef4444; }
.stat-purple { border-left: 3px solid #8b5cf6; }

.stat-label {
  font-size: 13px;
  color: #9ca3af;
  display: block;
  margin-bottom: 6px;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-unit {
  font-size: 16px;
  font-weight: 400;
  color: #9ca3af;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
}

.stat-trend.up { color: #10b981; }

/* ===== 导航标签 ===== */
.nav-tabs {
  display: flex;
  background: #fff;
  border-radius: 10px;
  padding: 0 4px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.nav-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 20px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  position: relative;
  transition: all 0.2s;
  user-select: none;
}

.nav-tab-item:hover {
  color: #374151;
}

.nav-tab-item.active {
  color: #1a56db;
}

.nav-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 2px;
  background: #1a56db;
  border-radius: 2px 2px 0 0;
}

.tab-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 500;
  line-height: 1.6;
}

.badge-blue {
  background: #e8f0fe;
  color: #1a56db;
}

.badge-gray {
  background: #f3f4f6;
  color: #6b7280;
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  user-select: none;
}

.filter-tag:hover {
  color: #1a56db;
  background: #f0f4ff;
}

.filter-tag.active {
  background: #1a56db;
  color: #fff;
  border-color: #1a56db;
}

.tag-count {
  font-size: 12px;
  opacity: 0.8;
  margin-left: 2px;
}

.field-select {
  width: 130px;
}

.search-input {
  width: 200px;
}

.filter-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.recent-btn {
  color: #374151;
  border-color: #d1d5db;
}

.create-btn {
  background: #1a56db;
  border-color: #1a56db;
}

/* ===== 分区标题 ===== */
.section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.section-title .el-icon {
  color: #1a56db;
}

.section-count {
  font-size: 13px;
  color: #9ca3af;
}

/* ===== 模板卡片网格 ===== */
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.template-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
  transform: translateY(-1px);
}

.hot-card {
  padding-bottom: 16px;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.badge-hot {
  background: #fef3c7;
  color: #d97706;
}

.badge-new {
  background: #fef3c7;
  color: #92400e;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.card-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.card-usage {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
}

.card-meta {
  flex-shrink: 0;
}

.card-rating {
  font-size: 12px;
  color: #d97706;
  white-space: nowrap;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  color: #9ca3af;
}

.empty-state .el-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: #374151;
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 1200px) {
  .template-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .template-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-left {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>