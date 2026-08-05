<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">数据源管理</div>
          <div class="page-subtitle">管理数据库、接口、文件导入等数据源</div>
        </div>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新增数据源
        </el-button>
      </div>

      <el-table :data="datasources" stripe style="width: 100%">
        <el-table-column prop="name" label="数据源名称" width="160" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="连接状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'connected' ? 'success' : 'danger'" size="small">
              {{ row.status === 'connected' ? '已连接' : '断开' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastSync" label="最后同步" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary">编辑</el-button>
            <el-button size="small" text type="success" @click="testConnection(row)">测试连接</el-button>
            <el-button size="small" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" title="新增数据源" width="500px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="newDs.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newDs.type" style="width: 100%">
            <el-option label="数据库" value="数据库" />
            <el-option label="API接口" value="API接口" />
            <el-option label="文件导入" value="文件导入" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接地址"><el-input v-model="newDs.url" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const showAddDialog = ref(false)
const newDs = ref({ name: '', type: '数据库' as string, url: '' })

const datasources = ref([
  { id: '1', name: '就业统计系统', type: '数据库', status: 'connected', lastSync: '2024-08-05 06:00' },
  { id: '2', name: '社保业务系统', type: '数据库', status: 'connected', lastSync: '2024-08-05 06:00' },
  { id: '3', name: '失业监测系统', type: 'API接口', status: 'connected', lastSync: '2024-08-05 08:00' },
  { id: '4', name: '培训管理系统', type: '数据库', status: 'disconnected', lastSync: '2024-08-03 06:00' },
])

const testConnection = (row: any) => {
  row.status = 'connected'
  ElMessage.success('连接测试成功')
}

const handleAdd = () => {
  datasources.value.push({ id: Date.now().toString(), ...newDs.value, status: 'connected', lastSync: '-' })
  showAddDialog.value = false
  ElMessage.success('数据源已添加')
}
</script>

<style scoped>
.admin-page { height: calc(100vh - 96px); }
</style>
