<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">日志审计</div>
          <div class="page-subtitle">查看系统操作日志、AI调用记录和数据访问日志</div>
        </div>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon> 导出日志
        </el-button>
      </div>

      <!-- 筛选栏 -->
      <el-form inline class="search-bar">
        <el-form-item>
          <el-input v-model="searchUser" placeholder="搜索用户" clearable style="width: 140px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterModule" placeholder="模块筛选" clearable style="width: 140px">
            <el-option label="知识问答" value="知识问答" />
            <el-option label="公文助手" value="公文助手" />
            <el-option label="智能问数" value="智能问数" />
            <el-option label="业务审核" value="业务审核" />
            <el-option label="系统管理" value="系统管理" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
      </el-form>

      <!-- 日志表格 -->
      <el-table :data="filteredLogs" stripe style="width: 100%">
        <el-table-column prop="time" label="时间" width="170" />
        <el-table-column prop="user" label="用户" width="100" />
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="80" />
        <el-table-column prop="detail" label="详情" min-width="250" />
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :total="filteredLogs.length"
          :page-size="10"
          layout="total, prev, pager, next"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchLogs } from '@/api/mock'
import type { LogRecord } from '@/types'

const logs = ref<LogRecord[]>([])
const searchUser = ref('')
const filterModule = ref('')
const dateRange = ref<[Date, Date] | null>(null)

onMounted(async () => {
  logs.value = await fetchLogs()
})

const filteredLogs = computed(() => {
  return logs.value.filter((l) => {
    if (searchUser.value && !l.user.includes(searchUser.value)) return false
    if (filterModule.value && l.module !== filterModule.value) return false
    return true
  })
})

const handleExport = () => {
  ElMessage.success('日志导出成功')
}
</script>

<style scoped>
.admin-page {
  height: calc(100vh - 96px);
}

.search-bar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
