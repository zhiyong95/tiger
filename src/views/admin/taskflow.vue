<template>
  <div class="task-flow">
    <div class="page-header">
      <h2>任务流配置</h2>
      <span class="subtitle">任务状态、处理节点、转办规则配置</span>
      <el-button type="primary" size="small" style="margin-left:auto">+ 新建流程</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">流程定义</span></template>
          <el-table :data="flows" stripe style="width:100%">
            <el-table-column prop="name" label="流程名称" />
            <el-table-column prop="nodes" label="节点数" width="70" />
            <el-table-column prop="updated" label="更新时间" width="150" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '已发布' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default>
                <el-button size="small" text type="primary">编辑</el-button>
                <el-button size="small" text type="primary">配置</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">节点配置</span></template>
          <div class="flow-nodes">
            <div class="flow-node" v-for="(node, i) in nodes" :key="node.name">
              <div class="node-dot" :style="{ background: node.color }"></div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-desc">{{ node.desc }}</div>
              </div>
              <div v-if="i < nodes.length - 1" class="node-arrow">↓</div>
            </div>
          </div>
        </el-card>
        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">转办规则</span></template>
          <div class="rule-item" v-for="r in rules" :key="r.name">
            <span class="rule-name">{{ r.name }}</span>
            <el-switch v-model="r.enabled" size="small" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const flows = [
  { name: '审核预审流程', nodes: 5, updated: '2026-08-06 14:20', status: '已发布' },
  { name: '风险预警处置流程', nodes: 4, updated: '2026-08-05 09:15', status: '已发布' },
  { name: '问答反馈处理流程', nodes: 3, updated: '2026-08-04 16:30', status: '草稿' },
  { name: '知识入库审核流程', nodes: 4, updated: '2026-08-03 11:00', status: '已发布' },
]
const nodes = [
  { name: '任务创建', desc: 'AI生成任务 / 系统触发', color: '#2563eb' },
  { name: '待处理', desc: '等待经办人员处理', color: '#d97706' },
  { name: '处理中', desc: '经办人员已开始处理', color: '#0891b2' },
  { name: '已确认', desc: '确认结果或风险属实', color: '#059669' },
  { name: '已归档', desc: '任务完成归档', color: '#6b7280' },
]
const rules = ref([
  { name: '超时自动转办', enabled: true },
  { name: '退回补正次数限制', enabled: true },
  { name: '高风险任务通知负责人', enabled: true },
  { name: '归档前需确认', enabled: false },
])
</script>
<style scoped>
.task-flow { padding: 0; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; }
.subtitle { font-size: 13px; color: #9ca3af; }
.flow-nodes { padding: 8px 0; }
.flow-node { display: flex; align-items: flex-start; gap: 12px; position: relative; padding: 4px 0; }
.node-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.node-info { flex: 1; }
.node-name { font-size: 14px; font-weight: 500; color: #1f2937; }
.node-desc { font-size: 12px; color: #9ca3af; }
.node-arrow { position: absolute; left: 5px; top: 20px; font-size: 12px; color: #d1d5db; }
.rule-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.rule-item:last-child { border-bottom: none; }
.rule-name { font-size: 13px; color: #374151; }
</style>