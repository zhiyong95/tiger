<template>
  <div class="task-page">
    <div class="page-card">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-form inline>
          <el-form-item label="任务类型">
            <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 140px">
              <el-option label="风险预警" value="risk" />
              <el-option label="审核待办" value="audit" />
              <el-option label="数据异常" value="data" />
            </el-select>
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select v-model="filters.riskLevel" placeholder="全部等级" clearable style="width: 120px">
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">
              <el-icon><Search /></el-icon> 筛选
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计概览 -->
      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="6">
          <div class="stat-mini" style="border-left: 3px solid #ef4444">
            <div class="stat-mini-value" style="color: #ef4444">{{ highCount }}</div>
            <div class="stat-mini-label">高风险</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-mini" style="border-left: 3px solid #f59e0b">
            <div class="stat-mini-value" style="color: #f59e0b">{{ mediumCount }}</div>
            <div class="stat-mini-label">中风险</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-mini" style="border-left: 3px solid #10b981">
            <div class="stat-mini-value" style="color: #10b981">{{ lowCount }}</div>
            <div class="stat-mini-label">低风险</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-mini" style="border-left: 3px solid #1a56db">
            <div class="stat-mini-value" style="color: #1a56db">{{ pendingCount }}</div>
            <div class="stat-mini-label">待处理</div>
          </div>
        </el-col>
      </el-row>

      <!-- 任务列表 -->
      <el-table :data="filteredTasks" stripe style="width: 100%">
        <el-table-column prop="title" label="任务标题" min-width="200" />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.riskLevel)" size="small">
              {{ riskLabel(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止时间" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              text
              type="success"
              @click="handleProcess(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="dialogVisible" title="任务详情" width="600px">
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务标题">{{ currentTask.title }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ currentTask.source }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="riskTagType(currentTask.riskLevel)" size="small">
              {{ riskLabel(currentTask.riskLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentTask.status)" size="small">
              {{ statusLabel(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述">{{ currentTask.description }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTask.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ currentTask.deadline }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentTask.status === 'pending'" class="detail-actions">
          <el-input
            v-model="processComment"
            type="textarea"
            :rows="3"
            placeholder="请输入处理意见..."
            style="margin-bottom: 12px"
          />
          <div class="action-btns">
            <el-button type="success" @click="handleConfirm(currentTask)">确认处理</el-button>
            <el-button type="warning" @click="handleTransfer(currentTask)">转办</el-button>
            <el-button @click="handleArchive(currentTask)">归档</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchRiskTasks, handleRiskTask } from '@/api/mock'
import type { RiskTask } from '@/types'

const tasks = ref<RiskTask[]>([])
const filters = ref({ type: '', riskLevel: '', status: '' })
const dialogVisible = ref(false)
const currentTask = ref<RiskTask | null>(null)
const processComment = ref('')

onMounted(async () => {
  tasks.value = await fetchRiskTasks()
})

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    if (filters.value.riskLevel && t.riskLevel !== filters.value.riskLevel) return false
    if (filters.value.status && t.status !== filters.value.status) return false
    return true
  })
})

const highCount = computed(() => tasks.value.filter((t) => t.riskLevel === 'high').length)
const mediumCount = computed(() => tasks.value.filter((t) => t.riskLevel === 'medium').length)
const lowCount = computed(() => tasks.value.filter((t) => t.riskLevel === 'low').length)
const pendingCount = computed(() => tasks.value.filter((t) => t.status === 'pending').length)

const riskLabel = (level: string) => ({ high: '高', medium: '中', low: '低' }[level] || level)
const riskTagType = (level: string) => ({ high: 'danger', medium: 'warning', low: 'success' }[level] as any)
const statusLabel = (status: string) => ({ pending: '待处理', processing: '处理中', completed: '已完成' }[status] || status)
const statusTagType = (status: string) => ({ pending: 'danger', processing: 'warning', completed: 'success' }[status] as any)

const handleFilter = () => {
  // filtered by computed
}

const handleView = (task: any) => {
  currentTask.value = task as RiskTask
  dialogVisible.value = true
}

const handleProcess = (task: any) => {
  currentTask.value = task as RiskTask
  dialogVisible.value = true
}

const handleConfirm = async (task: any) => {
  const t = task as RiskTask
  await handleRiskTask(t.id, 'confirm', processComment.value)
  t.status = 'completed'
  dialogVisible.value = false
  ElMessage.success('处理完成')
}

const handleTransfer = async (task: any) => {
  const t = task as RiskTask
  await handleRiskTask(t.id, 'transfer', processComment.value)
  t.status = 'processing'
  dialogVisible.value = false
  ElMessage.success('已转办')
}

const handleArchive = async (task: any) => {
  const t = task as RiskTask
  await handleRiskTask(t.id, 'archive', processComment.value)
  t.status = 'completed'
  dialogVisible.value = false
  ElMessage.success('已归档')
}
</script>

<style scoped>
.task-page {
  height: calc(100vh - 96px);
}

.filter-bar {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.stat-mini {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.stat-mini-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-mini-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.task-detail {
  padding: 10px 0;
}

.detail-actions {
  margin-top: 20px;
}

.action-btns {
  display: flex;
  gap: 12px;
}
</style>
