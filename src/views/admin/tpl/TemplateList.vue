<template>
  <div class="tpl-list-page">
    <!-- 顶部筛选条 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input v-model="localSearch" placeholder="搜索模板名称/文号/标题" clearable style="width:280px" @keyup.enter="$emit('create')" />
        <el-select v-model="filterType" placeholder="公文类型" clearable style="width:150px">
          <el-option label="全部" value="" />
          <el-option label="请示" value="请示" />
          <el-option label="通知" value="通知" />
          <el-option label="报告" value="报告" />
          <el-option label="批复" value="批复" />
          <el-option label="函" value="函" />
          <el-option label="审批表" value="审批表" />
          <el-option label="告知书" value="告知书" />
        </el-select>
        <el-select v-model="filterScope" placeholder="共享范围" clearable style="width:150px">
          <el-option label="全部" value="" />
          <el-option label="公开共享" value="public" />
          <el-option label="部门内部" value="department" />
          <el-option label="个人私有" value="private" />
        </el-select>
        <el-select v-model="filterDept" placeholder="所属部门" clearable style="width:150px">
          <el-option label="全部" value="" />
          <el-option label="系统管理" value="sys" />
          <el-option label="办公室" value="d1" />
          <el-option label="人事科" value="d2" />
          <el-option label="就业促进科" value="d3" />
          <el-option label="社会保险科" value="d4" />
          <el-option label="劳动监察科" value="d5" />
        </el-select>
        <el-checkbox v-model="onlyMine">仅看我创建的</el-checkbox>
        <el-button @click="resetFilter">重置筛选</el-button>
      </div>
      <el-button type="primary" @click="$emit('create')">+ 新建模板</el-button>
    </div>

    <!-- 卡片列表 -->
    <div class="card-grid">
      <div v-for="t in resultList" :key="t.id" class="tpl-card" :class="{ system: t.system, draft: t.status === 'draft' }">
        <div class="card-header">
          <div class="tpl-name">
            <el-icon><Document /></el-icon>
            <span>{{ t.name }}</span>
          </div>
          <div class="tpl-badges">
            <el-tag v-if="t.system" type="primary" size="small" effect="dark">系统</el-tag>
            <el-tag :type="scopeTagType(t.scope)" size="small">
              {{ scopeLabel(t.scope) }}
            </el-tag>
            <el-tag v-if="t.status === 'draft'" type="info" size="small">草稿</el-tag>
          </div>
        </div>
        <div class="card-body">
          <div class="meta-row">
            <span class="label">类型：</span>{{ t.type }}
          </div>
          <div class="meta-row" v-if="t.org">
            <span class="label">发文单位：</span>{{ t.org }}
          </div>
          <div class="meta-row">
            <span class="label">使用次数：</span>
            <span class="usage-num">{{ t.usage }}</span>
          </div>
          <div class="meta-row module-row" v-if="t.modules && t.modules.length">
            <span class="label">归属模块：</span>
            <el-tag
              v-for="m in t.modules"
              :key="m"
              size="small"
              :type="m === 'report/data' ? 'warning' : 'success'"
              effect="plain"
              class="module-tag"
            >{{ moduleLabel(m) }}</el-tag>
          </div>
          <div class="desc-text">{{ t.desc }}</div>
        </div>
        <div class="card-footer">
          <div class="time-text">{{ t.updatedAt }}</div>
          <div class="action-btns">
            <el-button text size="small" @click="$emit('preview', t)">预览</el-button>
            <el-button text size="small" @click="$emit('edit', t)">编辑</el-button>
            <el-button text size="small" @click="$emit('copy', t)">复制</el-button>
            <el-button text size="small" type="danger" @click="$emit('delete', t)">删除</el-button>
          </div>
        </div>
      </div>
      <div v-if="resultList.length === 0" class="empty-state">
        <el-empty description="暂无匹配的公文模板" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string; name: string; type: string; system?: boolean; scope: string; usage: number; desc: string; org: string; status: string; updatedAt: string; modules?: string[] }">
import { ref, computed, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'

interface Props {
  currentUser: { id: string }
  templates: T[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  preview: [tpl: T]
  edit: [tpl: T]
  copy: [tpl: T]
  delete: [tpl: T]
  create: []
}>()

const localSearch = ref('')
const filterType = ref('')
const filterScope = ref('')
const filterDept = ref('')
const onlyMine = ref(false)

const resultList = computed(() => {
  return props.templates.filter(t => {
    if (localSearch.value) {
      const kw = localSearch.value.toLowerCase()
      if (!t.name.toLowerCase().includes(kw) && !t.desc.toLowerCase().includes(kw) && !t.org.toLowerCase().includes(kw)) return false
    }
    if (filterType.value && t.type !== filterType.value) return false
    if (filterScope.value && t.scope !== filterScope.value) return false
    if (filterDept.value && t.id.startsWith('tpl-')) { /* handled in parent */ }
    if (onlyMine.value) { /* handled in parent */ }
    return true
  })
})

function scopeTagType(s: string) {
  if (s === 'public') return 'success'
  if (s === 'department') return 'warning'
  return 'info'
}

function scopeLabel(s: string) {
  if (s === 'public') return '公开共享'
  if (s === 'department') return '部门内部'
  return '个人私有'
}

const MODULE_LABELS: Record<string, string> = {
  'report/research': '调研分析报告',
  'report/data': '数据分析报告',
  document: '公文助手',
  audit: '业务智审'
}
function moduleLabel(m: string) {
  return MODULE_LABELS[m] || m
}

function resetFilter() {
  localSearch.value = ''
  filterType.value = ''
  filterScope.value = ''
  filterDept.value = ''
  onlyMine.value = false
}

watch(() => props.templates, () => {}, { immediate: true, deep: true })
</script>

<style scoped>
.tpl-list-page {
  padding: 0;
  height: 100%;
}
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 0 20px;
  flex-wrap: wrap;
}
.filter-left {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.tpl-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}
.tpl-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
}
.tpl-card.system {
  border-left: 3px solid #2563eb;
}
.tpl-card.draft {
  opacity: 0.8;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.tpl-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
}
.tpl-badges {
  display: flex;
  gap: 6px;
}
.card-body {
  flex: 1;
}
.meta-row {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 6px;
}
.meta-row .label {
  color: #9ca3af;
}
.usage-num {
  font-weight: 600;
  color: #2563eb;
}
.desc-text {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.module-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.module-tag {
  margin: 0;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}
.time-text {
  font-size: 12px;
  color: #9ca3af;
}
.action-btns {
  display: flex;
  gap: 2px;
}
.empty-state {
  grid-column: 1 / -1;
  padding: 40px 0;
}
</style>
