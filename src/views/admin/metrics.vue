<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">指标口径管理</div>
          <div class="page-subtitle">管理业务指标定义、口径和数据来源</div>
        </div>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 新增指标
        </el-button>
      </div>

      <el-table :data="metrics" stripe style="width: 100%">
        <el-table-column prop="name" label="指标名称" min-width="160" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="period" label="统计周期" width="120" />
        <el-table-column label="同比变化" width="120">
          <template #default="{ row }">
            <span :class="row.trend >= 0 ? 'trend-up' : 'trend-down'">
              {{ row.trend >= 0 ? '+' : '' }}{{ row.trend }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="数据来源" width="140" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <el-button size="small" text type="primary">编辑</el-button>
            <el-button size="small" text type="primary">同义词</el-button>
            <el-button size="small" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" title="新增指标" width="500px">
      <el-form label-width="80px">
        <el-form-item label="指标名称"><el-input v-model="newMetric.name" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="newMetric.unit" /></el-form-item>
        <el-form-item label="数据来源"><el-input v-model="newMetric.source" /></el-form-item>
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
import { fetchMetrics } from '@/api/mock'
import type { MetricData } from '@/types'

const metrics = ref<MetricData[]>([])
const showAddDialog = ref(false)
const newMetric = ref({ name: '', unit: '人', source: '' })

onMounted(async () => {
  metrics.value = await fetchMetrics()
})

const handleAdd = () => {
  metrics.value.push({ id: Date.now().toString(), ...newMetric.value, value: 0, period: '2024-08', trend: 0 })
  showAddDialog.value = false
  ElMessage.success('指标已添加')
}
</script>

<style scoped>
.admin-page { height: calc(100vh - 96px); }
.trend-up { color: #10b981; font-weight: 500; }
.trend-down { color: #ef4444; font-weight: 500; }
</style>
