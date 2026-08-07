<template>
  <div class="admin-page">
    <div class="page-card">
      <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新增模板
        </el-button>
      </div>

      <el-table :data="templates" stripe style="width: 100%">
        <el-table-column prop="name" label="模板名称" width="160" />
        <el-table-column prop="category" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="字段配置" min-width="300">
          <template #default="{ row }">
            <el-tag v-for="f in row.fields" :key="f" size="small" style="margin: 2px">{{ f }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <el-button size="small" text type="primary">编辑</el-button>
            <el-button size="small" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" title="新增模板" width="500px">
      <el-form label-width="80px">
        <el-form-item label="模板名称"><el-input v-model="newTpl.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newTpl.category" style="width: 100%">
            <el-option label="通知" value="通知" />
            <el-option label="报告" value="报告" />
            <el-option label="请示" value="请示" />
            <el-option label="函件" value="函件" />
            <el-option label="批复" value="批复" />
          </el-select>
        </el-form-item>
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
import { fetchDocumentTemplates } from '@/api/mock'
import type { DocumentTemplate } from '@/types'

const templates = ref<DocumentTemplate[]>([])
const showAddDialog = ref(false)
const newTpl = ref({ name: '', category: '通知' as const })

onMounted(async () => {
  templates.value = await fetchDocumentTemplates()
})

const handleAdd = () => {
  templates.value.push({ id: Date.now().toString(), ...newTpl.value, fields: ['标题', '正文', '落款'] })
  showAddDialog.value = false
  ElMessage.success('模板已添加')
}
</script>

<style scoped>
.admin-page { height: calc(100vh - 96px); }
</style>
