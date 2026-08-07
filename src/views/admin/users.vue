<template>
  <div class="user-permission-page">
    <el-page-header @back="router.back()" content="返回" class="page-back-header">
      <template #content>
        <div class="page-title-wrap">
          <div class="page-title">用户 / 角色 / 部门权限管理</div>
          <div class="page-subtitle">建立统一身份管理和权限控制体系，满足最小权限原则和分级授权</div>
        </div>
      </template>
    </el-page-header>

    <!-- 顶部统计卡片 -->
    <div class="stat-cards-row">
      <div class="stat-card stat-1">
        <div class="stat-value">128</div>
        <div class="stat-label">用户总数</div>
      </div>
      <div class="stat-card stat-2">
        <div class="stat-value">12</div>
        <div class="stat-label">角色总数</div>
      </div>
      <div class="stat-card stat-3">
        <div class="stat-value">36</div>
        <div class="stat-label">部门总数</div>
      </div>
      <div class="stat-card stat-4">
        <div class="stat-value">98.7%</div>
        <div class="stat-label">权限合规率</div>
      </div>
    </div>

    <!-- 主内容区分栏布局 -->
    <div class="main-layout-row">
      <!-- 左侧：部门组织架构树 -->
      <div class="sidebar-col">
        <div class="tree-card">
          <div class="tree-header">
            <span class="tree-title">组织架构树</span>
            <el-button text type="primary" size="small">
              <el-icon><Plus /></el-icon> 新增部门
            </el-button>
          </div>
          <el-tree
            :data="deptTreeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            :default-expanded-keys="['dept-1', 'dept-2', 'dept-3', 'dept-4', 'dept-5', 'dept-6']"
            highlight-current
            @node-click="handleSelectDept"
          >
            <template #default="{ data }">
              <span class="custom-tree-node">
                <el-icon class="tree-dept-icon"><OfficeBuilding /></el-icon>
                <span>{{ data.name }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：Tab 主工作区 -->
      <div class="content-col">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 用户管理 Tab -->
          <el-tab-pane label="用户账号" name="users">
            <div class="toolbar-bar">
              <div class="search-area">
                <el-input
                  v-model="searchKey"
                  placeholder="搜索用户名、姓名、工号..."
                  :prefix-icon="Search"
                  clearable
                  style="width: 280px"
                />
              </div>
              <div class="action-buttons">
                <el-button @click="handleBatchImport">
                  <el-icon><Upload /></el-icon> 批量导入
                </el-button>
                <el-button type="primary" @click="handleAddUser">
                  <el-icon><Plus /></el-icon> 新增用户
                </el-button>
              </div>
            </div>
            <el-table :data="filteredUsers" stripe style="width: 100%" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column prop="username" label="用户名" width="140" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="deptName" label="所属部门" width="160" />
              <el-table-column prop="roleName" label="角色" width="140">
                <template #default="{ row }">
                  <el-tag type="primary" size="small">{{ row.roleName }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="employeeNo" label="工号" width="120" />
              <el-table-column prop="status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'active' ? '启用' : '停用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastLoginAt" label="最后登录" width="170" />
              <el-table-column label="操作" fixed="right" width="240">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="handleEditUser(row)">编辑</el-button>
                  <el-button link type="warning" size="small" @click="handleResetPassword(row)">重置密码</el-button>
                  <el-button link type="danger" size="small" @click="handleToggleStatus(row)">
                    {{ row.status === 'active' ? '停用' : '启用' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-bar">
              <el-pagination layout="total, sizes, prev, pager, next, jumper" :total="128" />
            </div>
          </el-tab-pane>

          <!-- 角色配置 Tab -->
          <el-tab-pane label="角色定义" name="roles">
            <div class="toolbar-bar">
              <div style="color: #6b7280; font-size: 13px;">角色总数：<strong style="color: #1f2937;">12</strong>，预置角色 6，自定义角色 6</div>
              <el-button type="primary" @click="handleAddRole">
                <el-icon><Plus /></el-icon> 新增角色
              </el-button>
            </div>
            <div class="roles-grid">
              <div class="role-card" v-for="role in roleList" :key="role.id">
                <div class="role-card-header">
                  <div class="role-name">{{ role.name }}</div>
                  <el-tag size="small" :type="role.isPreset ? 'info' : 'primary'">{{ role.isPreset ? '预置' : '自定义' }}</el-tag>
                </div>
                <div class="role-desc">{{ role.description }}</div>
                <div class="role-meta">
                  <span><el-icon><User /></el-icon> {{ role.userCount }} 个用户</span>
                  <span>{{ role.permissionCount }} 项权限</span>
                </div>
                <div class="role-actions">
                  <el-button link type="primary" size="small" @click="handleConfigPermission(role)">配置权限</el-button>
                  <el-button link type="warning" size="small">编辑</el-button>
                  <el-button link type="danger" size="small" :disabled="role.isPreset">删除</el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 功能权限矩阵 Tab -->
          <el-tab-pane label="功能权限" name="permissions">
            <div class="toolbar-bar">
              <div style="color: #6b7280; font-size: 13px;">选择角色查看和配置功能权限</div>
              <el-select v-model="selectedPermissionRoleId" style="width: 200px;" placeholder="选择角色">
                <el-option label="局领导" value="role-1" />
                <el-option label="业务管理员" value="role-2" />
                <el-option label="普通用户" value="role-3" />
                <el-option label="访客" value="role-4" />
              </el-select>
            </div>
            <div class="permission-matrix-wrap">
              <el-table :data="permissionMatrixData" border style="width: 100%">
                <el-table-column prop="moduleName" label="模块名称" width="200" />
                <el-table-column prop="desc" label="说明" width="240" />
                <el-table-column label="查看" width="100" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.canView" />
                  </template>
                </el-table-column>
                <el-table-column label="新增" width="100" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.canAdd" />
                  </template>
                </el-table-column>
                <el-table-column label="编辑" width="100" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.canEdit" />
                  </template>
                </el-table-column>
                <el-table-column label="删除" width="100" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.canDelete" />
                  </template>
                </el-table-column>
                <el-table-column label="导出" width="100" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.canExport" />
                  </template>
                </el-table-column>
              </el-table>
              <div class="matrix-footer">
                <el-button type="primary" @click="handleSavePermissions">
                  <el-icon><Check /></el-icon> 保存权限配置
                </el-button>
                <el-button>重置</el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- 数据权限配置 Tab -->
          <el-tab-pane label="数据权限" name="data-permissions">
            <div class="toolbar-bar">
              <div style="color: #6b7280; font-size: 13px;">配置角色的数据可见范围和密级限制</div>
            </div>
            <el-form label-width="140px" style="max-width: 700px;">
              <el-form-item label="数据范围">
                <el-radio-group>
                  <el-radio label="all">全部数据</el-radio>
                  <el-radio label="dept">本部门及下级</el-radio>
                  <el-radio label="self">仅本人数据</el-radio>
                  <el-radio label="custom">自定义范围</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="区域范围">
                <el-select style="width: 100%;" multiple placeholder="选择可访问的区域">
                  <el-option label="全市" value="all" />
                  <el-option label="天河区" value="tianhe" />
                  <el-option label="越秀区" value="yuexiu" />
                  <el-option label="海珠区" value="haizhu" />
                  <el-option label="白云区" value="baiyun" />
                </el-select>
              </el-form-item>
              <el-form-item label="密级限制">
                <el-checkbox-group>
                  <el-checkbox label="public" /> 公开数据
                  <el-checkbox label="internal" /> 内部数据
                  <el-checkbox label="confidential" /> 机密数据
                  <el-checkbox label="secret" /> 绝密数据
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary">保存数据权限配置</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="userDialogVisible" title="新增用户" width="580px">
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="工号" prop="employeeNo">
          <el-input v-model="userForm.employeeNo" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-tree-select
            v-model="userForm.deptId"
            :data="deptTreeData"
            :props="{ label: 'name', value: 'id' } as any"
            placeholder="选择所属部门"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="关联角色">
          <el-select v-model="userForm.roleId" placeholder="选择角色" style="width: 100%;">
            <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input v-model="userForm.password" type="password" placeholder="设置初始密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddUser">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, Check, OfficeBuilding, User as UserIcon } from '@element-plus/icons-vue'
import { fetchUsers } from '@/api/mock'
import type { User } from '@/types'

const router = useRouter()

const activeTab = ref('users')
const searchKey = ref('')
const selectedDeptId = ref('all')
const selectedPermissionRoleId = ref('role-1')
const selectedRows = ref<User[]>([])
const userDialogVisible = ref(false)

const userForm = ref({
  username: '',
  name: '',
  employeeNo: '',
  deptId: '',
  roleId: '',
  password: ''
})

// 部门组织架构树数据
const deptTreeData = ref([
  {
    id: 'dept-1',
    name: '广州市人力资源和社会保障局',
    children: [
      { id: 'dept-1-1', name: '办公室' },
      { id: 'dept-1-2', name: '就业促进科' },
      { id: 'dept-1-3', name: '社会保险科' },
      { id: 'dept-1-4', name: '人才开发科' },
      { id: 'dept-1-5', name: '劳动关系科' },
    ]
  },
  {
    id: 'dept-2',
    name: '天河区人力资源和社会保障局',
    children: [
      { id: 'dept-2-1', name: '综合科' },
      { id: 'dept-2-2', name: '就业服务中心' },
    ]
  },
  {
    id: 'dept-3',
    name: '越秀区人力资源和社会保障局'
  },
  {
    id: 'dept-4',
    name: '海珠区人力资源和社会保障局'
  },
  {
    id: 'dept-5',
    name: '白云区人力资源和社会保障局'
  },
  { id: 'dept-6',
    name: '各街道人社所'
  }
])

const users = ref<User[]>([])
const filteredUsers = computed(() => {
  let result = users.value
  if (searchKey.value) {
    const key = searchKey.value.toLowerCase()
    result = result.filter(u =>
      u.username.toLowerCase().includes(key) ||
      u.name.toLowerCase().includes(key)
    )
  }
  return result
})

const roleList = ref([
  { id: 'role-1', name: '局领导', description: '拥有全部模块查看和管理权限', userCount: 8, permissionCount: 32, isPreset: true },
  { id: 'role-2', name: '业务管理员', description: '负责业务经办和日常管理', userCount: 28, permissionCount: 26, isPreset: true },
  { id: 'role-3', name: '窗口经办人员', description: '前台窗口业务办理权限', userCount: 42, permissionCount: 18, isPreset: true },
  { id: 'role-4', name: '普通用户', description: '基础信息查询权限', userCount: 36, permissionCount: 12, isPreset: true },
  { id: 'role-5', name: '审计人员', description: '日志审计和数据核查权限', userCount: 6, permissionCount: 14, isPreset: true },
  { id: 'role-6', name: '访客', description: '只读模式，不可修改数据', userCount: 8, permissionCount: 6, isPreset: true },
  { id: 'role-7', name: '就业业务专员', description: '就业领域专项权限', userCount: 8, permissionCount: 20, isPreset: false },
  { id: 'role-8', name: '社保业务专员', description: '社保领域专项权限', userCount: 6, permissionCount: 19, isPreset: false },
])

const permissionMatrixData = ref([
  { moduleName: '首页工作台', desc: '首页、统计、快捷入口', canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  { moduleName: '人社知识智能问答', desc: '问答、反馈、历史', canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: true },
  { moduleName: 'AI公文助手', desc: '模板、生成、导出', canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
  { moduleName: '智能问数', desc: '查询、图表、报告生成', canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: true },
  { moduleName: '业务智能审核', desc: '预审、复核、归档', canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: false },
  { moduleName: '后台管理 - 用户管理', desc: '用户CRUD', canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  { moduleName: '后台管理 - 知识库', desc: '文档上传、审核', canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: true },
  { moduleName: '后台管理 - 日志审计', desc: '日志查看导出', canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
])

async function loadData() {
  users.value = await fetchUsers()
}

function handleSelectDept(data: any) {
  selectedDeptId.value = data.id
  ElMessage.success(`已选中部门：${data.name}`)
}

function handleSelectionChange(selection: User[]) {
  selectedRows.value = selection
}

function handleAddUser() {
  userDialogVisible.value = true
}

function confirmAddUser() {
  ElMessage.success('用户创建成功')
  userDialogVisible.value = false
  loadData()
}

function handleEditUser(row: any) {
  const user = row as User
  ElMessage.info(`编辑用户：${user.name}`)
}

function handleResetPassword(row: any) {
  const user = row as User
  ElMessageBox.confirm(`确定要重置用户 ${user.name} 的密码吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('密码重置成功，新密码已发送至用户手机')
  }).catch(() => {})
}

function handleToggleStatus(row: any) {
  const user = row as User
  ElMessage.success(`用户 ${user.name} 状态已切换`)
  loadData()
}

function handleBatchImport() {
  ElMessage.info('打开批量导入窗口')
}

function handleAddRole() {
  ElMessage.info('打开新增角色窗口')
}

function handleConfigPermission(role: any) {
  activeTab.value = 'permissions'
  selectedPermissionRoleId.value = role.id
  ElMessage.info(`配置角色【${role.name}】的权限`)
}

function handleSavePermissions() {
  ElMessage.success('权限配置已保存')
}

function handleDeleteDept() {
  ElMessage.warning('请先移除该部门下的所有子部门和用户后再删除')
}

function handleDeleteRole() {
  ElMessage.warning('该角色下有关联用户，无法直接删除')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.user-permission-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 56px);
}
.page-back-header {
  background: white;
  margin: -20px -20px 20px -20px;
  padding: 16px 24px;
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
.stat-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.stat-1 .stat-value { color: #2563eb; }
.stat-2 .stat-value { color: #22c55e; }
.stat-3 .stat-value { color: #f59e0b; }
.stat-4 .stat-value { color: #8b5cf6; }
.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}
.main-layout-row {
  display: flex;
  gap: 16px;
}
.sidebar-col {
  width: 260px;
  flex-shrink: 0;
}
.tree-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}
.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}
.tree-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}
.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.tree-dept-icon {
  color: #2563eb;
}
.content-col {
  flex: 1;
  background: white;
  border-radius: 12px;
}
.toolbar-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.action-buttons {
  display: flex;
  gap: 10px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
}
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}
.role-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  transition: all 0.2s;
}
.role-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
}
.role-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.role-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
.role-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}
.role-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 12px;
}
.role-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}
.permission-matrix-wrap {
  padding: 20px;
}
.matrix-footer {
  display: flex;
  gap: 10px;
  padding-top: 16px;
}
</style>
