<template>
  <div class="dept-perms">
    <div class="section-title">科室一览</div>
    <div class="dept-grid">
      <div v-for="dept in departments" :key="dept.id" class="dept-card">
        <div class="dept-header">{{ dept.name }}</div>
        <div class="dept-duty">{{ dept.duty }}</div>
        <div class="dept-manager">
          <el-icon><User /></el-icon> 管理员：{{ dept.manager }}
        </div>
        <div class="dept-users">
          <span v-for="u in getDeptUsers(dept.id)" :key="u.id" class="user-chip">
            {{ u.name }}
            <el-tag size="small" :type="roleTagType(u.role)" effect="dark" style="margin-left:4px">
              {{ u.roleName }}
            </el-tag>
          </span>
        </div>
      </div>
    </div>

    <div class="section-title" style="margin-top:24px">权限矩阵</div>
    <div class="matrix-wrapper">
      <el-table :data="matrixData" border stripe>
        <el-table-column prop="action" label="操作" width="140" />
        <el-table-column label="系统管理员" width="140">
          <template #default><el-icon color="#10b981"><Check /></el-icon></template>
        </el-table-column>
        <el-table-column label="科室管理员（本部门）" width="180">
          <template #default><el-icon color="#10b981"><Check /></el-icon></template>
        </el-table-column>
        <el-table-column label="科室成员（本部门）" width="170">
          <template #default="{ row }">
            <el-icon v-if="row['memberDept']" color="#10b981"><Check /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="其他科室成员" width="140">
          <template #default="{ row }">
            <el-icon v-if="row['other']" color="#10b981"><Check /></el-icon>
            <span v-else style="color:#d1d5db">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Check } from '@element-plus/icons-vue'

const props = defineProps<{
  departments: any[]
  users: any[]
}>()

function getDeptUsers(deptId: string) {
  return props.users.filter(u => u.dept === deptId)
}

function roleTagType(role: string): 'info' | 'primary' | 'success' | 'warning' | 'danger' {
  const map: Record<string, 'info' | 'primary' | 'success' | 'warning' | 'danger'> = { admin: 'danger', manager: 'warning', member: 'info' }
  return map[role] || 'info'
}

const matrixData = [
  { action: '查看 / 预览', memberDept: true, other: true },
  { action: '复制使用', memberDept: true, other: true },
  { action: '新建模板', memberDept: true, other: true },
  { action: '编辑模板', memberDept: true, other: false },
  { action: '修改可见范围', memberDept: true, other: false },
  { action: '删除模板', memberDept: true, other: false },
]
</script>

<style scoped>
.dept-perms { padding: 4px 0; }
.section-title { font-size: 16px; font-weight: 600; color: #0a1e5c; margin-bottom: 16px; }
.dept-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.dept-card {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.dept-header { font-size: 15px; font-weight: 700; color: #0a1e5c; margin-bottom: 6px; }
.dept-duty { font-size: 12px; color: #6b7280; margin-bottom: 10px; line-height: 1.5; }
.dept-manager { font-size: 13px; color: #1f2937; margin-bottom: 10px; display: flex; align-items: center; gap: 4px; }
.dept-users { display: flex; flex-wrap: wrap; gap: 6px; }
.user-chip {
  display: inline-flex; align-items: center;
  font-size: 12px; background: #f3f4f6; padding: 2px 8px;
  border-radius: 4px; color: #374151;
}
.matrix-wrapper { max-width: 780px; }
</style>