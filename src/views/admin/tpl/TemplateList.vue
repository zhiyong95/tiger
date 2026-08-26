<template>
  <div class="tpl-list">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background:#e8f0fe">
          <el-icon :size="22" color="#2563eb"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-num">{{ visibleCount }}</span>
          <span class="stat-label">当前可见模板</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fef3e8">
          <el-icon :size="22" color="#f59e0b"><Share /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-num">{{ publicCount }}</span>
          <span class="stat-label">公开模板</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#e8faf0">
          <el-icon :size="22" color="#10b981"><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-num">{{ deptCount }}</span>
          <span class="stat-label">本部门模板</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f0e8ff">
          <el-icon :size="22" color="#8b5cf6"><User /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-num">{{ myCount }}</span>
          <span class="stat-label">我创建的模板</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板名称、发文机关..."
          :prefix-icon="Search"
          clearable
          style="width:280px"
          size="small"
        />
        <el-select v-model="filterType" placeholder="公文类型" clearable size="small" style="width:130px">
          <el-option v-for="t in docTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="filterScope" placeholder="可见范围" clearable size="small" style="width:120px">
          <el-option label="公开" value="public" />
          <el-option label="本部门" value="department" />
          <el-option label="仅自己" value="private" />
        </el-select>
        <el-select v-model="filterDept" placeholder="创建科室" clearable size="small" style="width:140px">
          <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
        <el-checkbox v-model="onlyMine" size="small">仅看我的</el-checkbox>
        <el-button size="small" @click="handleReset">
          <el-icon><Refresh /></el-icon> 重置
        </el-button>
      </div>
      <div class="filter-right">
        <el-button type="primary" size="small" @click="$emit('create')">
          <el-icon><Plus /></el-icon> 新建模板
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="templates" stripe style="width:100%" @row-dblclick="(row: any) => $emit('preview', row)">
      <el-table-column prop="name" label="模板名称" min-width="200">
        <template #default="{ row }">
          <div class="tpl-name-cell">
            <span class="tpl-name">{{ row.name }}</span>
            <el-tag v-if="row.system" size="small" type="danger" effect="dark" class="tpl-badge">系统</el-tag>
            <el-tag v-if="row.status === 'draft'" size="small" type="warning" class="tpl-badge">草稿</el-tag>
          </div>
          <div class="tpl-org">{{ row.org }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="公文类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagType(row.type)" size="small" effect="plain">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建人" width="140">
        <template #default="{ row }">
          <div class="creator-cell">
            <span class="creator-name">{{ getUserName(row.createdBy) }}</span>
            <span class="creator-dept">{{ getDeptName(row.createdDept) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150" />
      <el-table-column label="可见范围" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.scope === 'public'" type="success" size="small">公开</el-tag>
          <el-tag v-else-if="row.scope === 'department'" type="warning" size="small">本部门</el-tag>
          <el-tag v-else type="info" size="small">仅自己</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="usage" label="使用次数" width="90" align="center" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <div class="action-btns">
            <el-button text size="small" type="primary" @click="$emit('preview', row)">预览</el-button>
            <el-button
              v-if="canEditRow(row)" text size="small" type="primary"
              @click="$emit('edit', row)"
            >编辑</el-button>
            <el-button v-else text size="small" disabled>只读</el-button>
            <el-button text size="small" type="primary" @click="$emit('copy', row)">复制</el-button>
            <el-button
              v-if="canDeleteRow(row)" text size="small" type="danger"
              @click="$emit('delete', row)"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty v-if="templates.length === 0" description="暂无匹配的模板" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, Plus, Refresh, Document, Share, OfficeBuilding, User } from '@element-plus/icons-vue'

const props = defineProps<{
  currentUser: any
  templates: any[]
}>()

defineEmits<{
  preview: [row: any]
  edit: [row: any]
  copy: [row: any]
  delete: [row: any]
  create: []
}>()

const searchKeyword = defineModel<string>('searchKeyword', { default: '' })
const filterType = defineModel<string>('filterType', { default: '' })
const filterScope = defineModel<string>('filterScope', { default: '' })
const filterDept = defineModel<string>('filterDept', { default: '' })
const onlyMine = defineModel<boolean>('onlyMine', { default: false })

const docTypes = ['通知', '请示', '报告', '纪要', '函', '告知书', '审批表', '清单']

const departments = [
  { id: 'd1', name: '办公室' }, { id: 'd2', name: '人事科' },
  { id: 'd3', name: '就业促进科' }, { id: 'd4', name: '社会保险科' },
  { id: 'd5', name: '劳动监察科' }, { id: 'd6', name: '工资福利科' },
  { id: 'sys', name: '系统管理' },
]

const handleReset = () => {
  searchKeyword.value = ''
  filterType.value = ''
  filterScope.value = ''
  filterDept.value = ''
  onlyMine.value = false
}

const demoUsers = [
  { id: 'u1', name: '赵磊', dept: 'sys' }, { id: 'u2', name: '张伟', dept: 'd1' },
  { id: 'u3', name: '王芳', dept: 'd1' }, { id: 'u4', name: '李明', dept: 'd2' },
  { id: 'u5', name: '孙悦', dept: 'd5' }, { id: 'u6', name: '陈静', dept: 'd4' },
]

const visibleCount = computed(() => props.templates.length)
const publicCount = computed(() => props.templates.filter((t: any) => t.scope === 'public').length)
const deptCount = computed(() => props.templates.filter((t: any) => t.scope === 'department' || (t.createdDept === props.currentUser?.dept)).length)
const myCount = computed(() => props.templates.filter((t: any) => t.createdBy === props.currentUser?.id).length)

function getUserName(id: string) { return demoUsers.find(u => u.id === id)?.name || id }
function getDeptName(id: string) { return departments.find(d => d.id === id)?.name || id }
function typeTagType(type: string): 'info' | 'primary' | 'success' | 'warning' | 'danger' | undefined {
  const map: Record<string, 'info' | 'primary' | 'success' | 'warning' | 'danger'> = { '请示': 'warning', '报告': 'primary', '告知书': 'success', '纪要': 'info', '清单': 'info', '审批表': 'warning' }
  return map[type]
}
function canEditRow(row: any) {
  const u = props.currentUser
  if (!u) return false
  if (u.role === 'admin') return true
  if (u.role === 'manager' && row.createdDept === u.dept) return true
  return row.createdBy === u.id
}
function canDeleteRow(row: any) {
  const u = props.currentUser
  if (!u) return false
  if (u.role === 'admin') return true
  return row.createdBy === u.id
}
</script>

<style scoped>
.tpl-list { height: 100%; display: flex; flex-direction: column; gap: 16px; }
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card {
  display: flex; align-items: center; gap: 14px;
  background: #fff; border-radius: 12px; padding: 18px 20px;
  border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-icon {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-info { display: flex; flex-direction: column; }
.stat-num { font-size: 24px; font-weight: 700; color: #1f2937; }
.stat-label { font-size: 13px; color: #6b7280; margin-top: 2px; }
.filter-bar {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 12px;
}
.filter-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-right { flex-shrink: 0; }
.tpl-name-cell { display: flex; align-items: center; gap: 6px; }
.tpl-name { font-weight: 600; color: #1f2937; font-size: 14px; }
.tpl-org { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.tpl-badge { transform: scale(0.85); }
.creator-cell { display: flex; flex-direction: column; line-height: 1.4; }
.creator-name { font-size: 13px; color: #1f2937; }
.creator-dept { font-size: 12px; color: #9ca3af; }
.action-btns { display: flex; gap: 2px; flex-wrap: wrap; }
</style>