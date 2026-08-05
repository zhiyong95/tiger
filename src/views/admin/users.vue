<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">用户权限管理</div>
          <div class="page-subtitle">管理系统用户、角色和部门权限</div>
        </div>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新增用户
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <el-form inline class="search-bar">
        <el-form-item>
          <el-input v-model="searchKey" placeholder="搜索姓名/部门" clearable style="width: 200px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterRole" placeholder="角色筛选" clearable style="width: 140px">
            <el-option label="业务科室人员" value="业务科室人员" />
            <el-option label="窗口经办人员" value="窗口经办人员" />
            <el-option label="系统管理员" value="系统管理员" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 用户表格 -->
      <el-table :data="filteredUsers" stripe style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="department" label="部门" width="140" />
        <el-table-column prop="role" label="角色" width="140" />
        <el-table-column prop="phone" label="联系方式" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button
              size="small"
              text
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="handleToggle(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingUser ? '编辑用户' : '新增用户'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
            <el-option label="就业促进科" value="就业促进科" />
            <el-option label="社会保险科" value="社会保险科" />
            <el-option label="人才开发科" value="人才开发科" />
            <el-option label="劳动关系科" value="劳动关系科" />
            <el-option label="系统管理" value="系统管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="局领导/分管领导" value="局领导/分管领导" />
            <el-option label="业务科室人员" value="业务科室人员" />
            <el-option label="窗口经办人员" value="窗口经办人员" />
            <el-option label="乡镇/街道经办员" value="乡镇/街道经办员" />
            <el-option label="系统管理员" value="系统管理员" />
            <el-option label="审计人员" value="审计人员" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUsers } from '@/api/mock'
import type { User } from '@/types'

const users = ref<User[]>([])
const searchKey = ref('')
const filterRole = ref('')
const showAddDialog = ref(false)
const editingUser = ref<User | null>(null)

const form = ref({ name: '', department: '', role: '', phone: '' })

onMounted(async () => {
  users.value = await fetchUsers()
})

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    if (searchKey.value && !u.name.includes(searchKey.value) && !u.department.includes(searchKey.value)) return false
    if (filterRole.value && u.role !== filterRole.value) return false
    return true
  })
})

const handleEdit = (user: User) => {
  editingUser.value = user
  form.value = { name: user.name, department: user.department, role: user.role, phone: user.phone }
  showAddDialog.value = true
}

const handleToggle = (user: User) => {
  user.status = user.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`已${user.status === 'active' ? '启用' : '停用'}用户 ${user.name}`)
}

const handleSave = () => {
  if (editingUser.value) {
    Object.assign(editingUser.value, form.value)
    ElMessage.success('用户信息已更新')
  } else {
    users.value.push({ id: Date.now().toString(), ...form.value, status: 'active' })
    ElMessage.success('用户已添加')
  }
  showAddDialog.value = false
  editingUser.value = null
  form.value = { name: '', department: '', role: '', phone: '' }
}
</script>

<style scoped>
.admin-page {
  height: calc(100vh - 96px);
}

.search-bar {
  margin-bottom: 16px;
}
</style>
