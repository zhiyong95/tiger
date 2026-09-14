<template>
  <div class="template-page">
    <!-- 身份切换栏 -->
    <div class="identity-bar">
      <div class="identity-left">
        <span class="page-title">公文模板库</span>
        <span class="page-desc">统一沉淀、分类、共享人社公文模板</span>
      </div>
      <div class="identity-right">
        <span class="label">当前身份：</span>
        <el-select v-model="currentIdentity" size="small" style="width:200px" @change="switchIdentity">
          <el-option
            v-for="u in demoUsers"
            :key="u.id"
            :label="`${u.name}（${u.deptName}·${u.roleName}）`"
            :value="u.id"
          />
        </el-select>
        <el-tag :type="identityTagType" size="small" effect="dark" class="role-tag">
          {{ currentRoleName }}
        </el-tag>
      </div>
    </div>

    <!-- 权限提示横幅 -->
    <el-alert
      v-if="permissionNotice"
      :title="permissionNotice"
      type="info"
      show-icon
      :closable="false"
      class="perm-alert"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" class="tpl-tabs">
        <el-tab-pane label="📋 模板列表" name="list">
          <template-list
            :current-user="currentUser"
            :templates="filteredTemplates"
            @preview="handlePreview"
            @edit="handleEdit"
            @copy="handleCopy"
            @delete="handleDelete"
            @create="handleCreate"
          />
        </el-tab-pane>
        <el-tab-pane label="🏢 科室与权限" name="depts">
          <dept-permissions :departments="departments" :users="demoUsers" />
        </el-tab-pane>
        <el-tab-pane label="📂 公文类型" name="types">
          <doc-types :templates="allTemplates" />
        </el-tab-pane>
        <el-tab-pane label="📊 使用统计" name="stats">
          <usage-stats :templates="allTemplates" :departments="departments" :users="demoUsers" />
        </el-tab-pane>
        <el-tab-pane label="❓ 权限说明" name="help">
          <perm-help />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新建/编辑模板弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑模板' : '新建模板'"
      width="800px"
      class="tpl-dialog"
      destroy-on-close
    >
      <template-form
        :template="editingTemplate"
        :current-user="currentUser"
        @save="handleSave"
        @cancel="dialogVisible = false"
      />
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="模板预览"
      width="720px"
      class="preview-dialog"
    >
      <template-preview :tpl="previewingTemplate" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TemplateList from './tpl/TemplateList.vue'
import TemplateForm from './tpl/TemplateForm.vue'
import TemplatePreview from './tpl/TemplatePreview.vue'
import DeptPermissions from './tpl/DeptPermissions.vue'
import DocTypes from './tpl/DocTypes.vue'
import UsageStats from './tpl/UsageStats.vue'
import PermHelp from './tpl/PermHelp.vue'
import { useTemplateStore } from '@/api/templateStore'
import type { GovTemplate } from '@/api/templateStore'

interface DemoUser {
  id: string
  name: string
  dept: string
  deptName: string
  role: 'admin' | 'manager' | 'member'
  roleName: string
  title: string
}

interface Department {
  id: string
  name: string
  duty: string
  manager: string
}

type Template = GovTemplate

const tplStore = useTemplateStore()

const activeTab = ref('list')
const currentIdentity = ref('u1')
const dialogVisible = ref(false)
const previewVisible = ref(false)
const isEditing = ref(false)
const editingTemplate = ref<Template | null>(null)
const previewingTemplate = ref<Template | null>(null)
const searchKeyword = ref('')
const filterType = ref('')
const filterScope = ref('')
const filterDept = ref('')
const onlyMine = ref(false)

const departments: Department[] = [
  { id: 'd1', name: '办公室', duty: '综合协调、文电会务、机要保密', manager: '王芳' },
  { id: 'd2', name: '人事科', duty: '干部人事、机构编制、考核任免', manager: '李明' },
  { id: 'd3', name: '就业促进科', duty: '就业创业政策、劳务协作', manager: '赵磊' },
  { id: 'd4', name: '社会保险科', duty: '养老、失业、工伤等社保业务', manager: '陈静' },
  { id: 'd5', name: '劳动监察科', duty: '劳动保障监察、争议仲裁', manager: '赵磊' },
  { id: 'd6', name: '工资福利科', duty: '工资福利、离退休审批', manager: '赵磊' },
  { id: 'sys', name: '系统管理', duty: '平台维护（非业务科室）', manager: '赵磊' },
]

const demoUsers: DemoUser[] = [
  { id: 'u1', name: '赵磊', dept: 'sys', deptName: '系统管理', role: 'admin', roleName: '系统管理员', title: '系统管理员' },
  { id: 'u2', name: '张伟', dept: 'd1', deptName: '办公室', role: 'member', roleName: '科室成员', title: '科员' },
  { id: 'u3', name: '王芳', dept: 'd1', deptName: '办公室', role: 'manager', roleName: '科室管理员', title: '办公室主任' },
  { id: 'u4', name: '李明', dept: 'd2', deptName: '人事科', role: 'manager', roleName: '科室管理员', title: '人事科科长' },
  { id: 'u5', name: '孙悦', dept: 'd5', deptName: '劳动监察科', role: 'member', roleName: '科室成员', title: '科员' },
  { id: 'u6', name: '陈静', dept: 'd4', deptName: '社会保险科', role: 'manager', roleName: '科室管理员', title: '社保科科长' },
]

const allTemplates = tplStore.templates

const currentUser = computed(() => demoUsers.find(u => u.id === currentIdentity.value)!)

const currentRoleName = computed(() => currentUser.value?.roleName || '')

const identityTagType = computed(() => {
  if (currentUser.value?.role === 'admin') return 'danger'
  if (currentUser.value?.role === 'manager') return 'warning'
  return 'info'
})

const permissionNotice = computed(() => {
  const u = currentUser.value
  if (!u) return ''
  if (u.role === 'admin') return '您拥有系统管理员权限，可查看、编辑、删除所有模板。'
  if (u.role === 'manager') return `您当前为${u.deptName}的科室管理员，可管理本部门模板。`
  return `您当前为${u.deptName}的${u.roleName}，仅可查看本部门及公开模板。`
})

// 可见性判断
function canView(user: DemoUser, tpl: Template): boolean {
  if (user.role === 'admin') return true
  if (tpl.scope === 'public' || tpl.system) return true
  if (tpl.scope === 'department') return tpl.createdDept === user.dept
  if (tpl.scope === 'private') return tpl.createdBy === user.id
  return false
}

function canEdit(user: DemoUser, tpl: Template): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'manager' && tpl.createdDept === user.dept) return true
  return tpl.createdBy === user.id
}

function canDelete(user: DemoUser, tpl: Template): boolean {
  if (user.role === 'admin') return true
  return tpl.createdBy === user.id
}

function handleCreate() {
  isEditing.value = false
  editingTemplate.value = null
  dialogVisible.value = true
}

const filteredTemplates = computed(() => {
  return allTemplates.filter(tpl => {
    if (!canView(currentUser.value, tpl)) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      if (!tpl.name.toLowerCase().includes(kw) && !tpl.org.toLowerCase().includes(kw) && !tpl.title.toLowerCase().includes(kw)) return false
    }
    if (filterType.value && tpl.type !== filterType.value) return false
    if (filterScope.value && tpl.scope !== filterScope.value) return false
    if (filterDept.value && tpl.createdDept !== filterDept.value) return false
    if (onlyMine.value && tpl.createdBy !== currentUser.value.id) return false
    return true
  })
})

function switchIdentity(id: string) {
  currentIdentity.value = id
}

function handlePreview(tpl: Template) {
  previewingTemplate.value = tpl
  previewVisible.value = true
}

function handleEdit(tpl: Template) {
  if (!canEdit(currentUser.value, tpl)) {
    ElMessage.warning('您没有编辑此模板的权限')
    return
  }
  editingTemplate.value = { ...tpl }
  isEditing.value = true
  dialogVisible.value = true
}

function handleCopy(tpl: Template) {
  const newTpl: Template = {
    ...tpl,
    id: 'tpl-' + Date.now(),
    name: tpl.name + '（副本）',
    createdBy: currentUser.value.id,
    createdDept: currentUser.value.dept,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    usage: 0,
    status: 'draft',
    scope: 'private',
    modules: [...(tpl.modules || [])],
  }
  tplStore.upsertTemplate(newTpl)
  ElMessage.success('已复制模板到我的草稿')
}

function handleDelete(tpl: Template) {
  if (!canDelete(currentUser.value, tpl)) {
    ElMessage.warning('您没有删除此模板的权限')
    return
  }
  ElMessageBox.confirm(`确定删除模板「${tpl.name}」吗？`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    tplStore.removeTemplate(tpl.id)
    ElMessage.success('模板已删除')
  }).catch(() => {})
}

function handleSave(data: Partial<Template>) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  if (isEditing.value && editingTemplate.value) {
    const origin = allTemplates.find(t => t.id === editingTemplate.value!.id)
    if (origin) {
      tplStore.upsertTemplate({
        ...origin,
        ...data,
        updatedAt: now,
      } as Template)
    }
  } else {
    tplStore.upsertTemplate({
      id: 'tpl-' + Date.now(),
      name: data.name || '',
      type: data.type || '通知',
      system: false,
      scope: (data.scope as Template['scope']) || 'private',
      createdBy: currentUser.value.id,
      createdDept: currentUser.value.dept,
      createdAt: now,
      updatedAt: now,
      usage: 0,
      status: data.status || 'draft',
      org: data.org || '',
      docNo: data.docNo || '',
      title: data.title || '',
      desc: data.desc || '',
      body: data.body || '',
      modules: data.modules || [],
      cardIcon: data.cardIcon,
      cardTag: data.cardTag || '',
    } as Template)
  }
  dialogVisible.value = false
  ElMessage.success(isEditing.value ? '模板已更新' : '模板已创建')
}

</script>

<style scoped>
.template-page {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.identity-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.identity-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #0a1e5c;
}

.page-desc {
  font-size: 13px;
  color: #6b7280;
}

.identity-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.identity-right .label {
  font-size: 13px;
  color: #6b7280;
}

.role-tag {
  margin-left: 8px;
}

.perm-alert {
  margin: 12px 20px 0;
}

.main-content {
  flex: 1;
  padding: 0 20px 20px;
  overflow: auto;
}

.tpl-tabs {
  height: 100%;
}

.tpl-tabs :deep(.el-tabs__content) {
  height: calc(100% - 50px);
  overflow: auto;
}

.tpl-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.tpl-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 65vh;
  overflow-y: auto;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}
</style>