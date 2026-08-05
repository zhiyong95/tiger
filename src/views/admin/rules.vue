<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">审核规则管理</div>
          <div class="page-subtitle">管理业务审核事项和规则配置</div>
        </div>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新增规则
        </el-button>
      </div>

      <el-table :data="rules" stripe style="width: 100%">
        <el-table-column prop="matterName" label="审核事项" width="160" />
        <el-table-column prop="ruleName" label="规则名称" width="140" />
        <el-table-column prop="condition" label="规则条件" min-width="250" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <el-button size="small" text type="primary">编辑</el-button>
            <el-button size="small" text type="primary">测试</el-button>
            <el-button size="small" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" title="新增规则" width="500px">
      <el-form label-width="80px">
        <el-form-item label="审核事项">
          <el-select v-model="newRule.matterName" style="width: 100%">
            <el-option label="就业补贴资格预审" value="就业补贴资格预审" />
            <el-option label="灵活就业社保补贴" value="灵活就业社保补贴" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则名称"><el-input v-model="newRule.ruleName" /></el-form-item>
        <el-form-item label="规则条件"><el-input v-model="newRule.condition" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAuditRules } from '@/api/mock'
import type { AuditRule } from '@/types'

const rules = ref<AuditRule[]>([])
const showAddDialog = ref(false)
const newRule = ref({ matterName: '就业补贴资格预审', ruleName: '', condition: '' })

onMounted(async () => {
  rules.value = await fetchAuditRules()
})

const handleAdd = () => {
  rules.value.push({ id: Date.now().toString(), ...newRule.value, status: 'active', version: 'v1.0' })
  showAddDialog.value = false
  ElMessage.success('规则已添加')
}
</script>

<style scoped>
.admin-page { height: calc(100vh - 96px); }
</style>
