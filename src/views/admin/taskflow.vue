<template>
  <div class="task-flow">
    <div class="page-header">
      <h2>任务流配置</h2>
      <span class="subtitle">任务状态、处理节点、转办规则配置</span>
      <el-button type="primary" size="small" style="margin-left:auto" @click="onNewFlow">+ 新建流程</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">流程定义</span></template>
          <el-table :data="flows" stripe style="width:100%" highlight-current-row @row-click="onSelectFlow">
            <el-table-column prop="name" label="流程名称" />
            <el-table-column prop="nodes" label="节点数" width="70" align="center" />
            <el-table-column prop="updated" label="更新时间" width="150" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已发布' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click.stop="onEditFlow(row as any)">编辑</el-button>
                <el-button size="small" text type="primary" @click.stop="onConfigFlow(row as any)">配置</el-button>
                <el-button size="small" text type="danger" @click.stop="onDeleteFlow(row as any)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="flows.length === 0" description="暂无流程定义" :image-size="80" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">节点配置 - {{ selectedFlow?.name || '请选择流程' }}</span></template>
          <div v-if="selectedFlow?.nodesList && selectedFlow.nodesList.length" class="flow-nodes">
            <div v-for="(node, i) in selectedFlow.nodesList" :key="i" class="flow-node">
              <div class="node-dot" :style="{ background: node.color }"></div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-desc">{{ node.desc }}</div>
              </div>
              <div v-if="i < selectedFlow.nodesList.length - 1" class="node-arrow">↓</div>
            </div>
          </div>
          <el-empty v-else description="点击左侧流程查看节点" :image-size="80" />
        </el-card>
        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">转办规则</span></template>
          <div v-for="(r, idx) in rules" :key="r.name" class="rule-item">
            <span class="rule-name">{{ r.name }}</span>
            <el-switch v-model="rules[idx].enabled" size="small" @change="onToggleRule(r)" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showDialog" :title="dialogTitle" width="520px" :close-on-click-modal="false">
      <el-form :model="flowForm" label-width="110px">
        <el-form-item label="流程名称">
          <el-input v-model="flowForm.name" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="流程状态">
          <el-radio-group v-model="flowForm.status">
            <el-radio label="草稿" value="草稿" />
            <el-radio label="已发布" value="已发布" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="节点描述">
          <el-input
            v-model="nodeDescText"
            type="textarea"
            :rows="4"
            placeholder="每行一个节点，格式：节点名称|节点描述|颜色&#10;如：任务创建|AI生成任务|#2563eb"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="onSaveFlow">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface FlowNode {
  name: string
  desc: string
  color: string
}

interface FlowItem {
  id: number
  name: string
  nodes: number
  updated: string
  status: string
  nodesList: FlowNode[]
}

interface RuleItem {
  name: string
  enabled: boolean
}

const selectedId = ref<number | null>(1)
const showDialog = ref(false)
const dialogTitle = ref('新建流程')
const editingId = ref<number | null>(null)
let nextId = 100

const defaultNodes: FlowNode[] = [
  { name: '任务创建', desc: 'AI生成任务/系统触发', color: '#2563eb' },
  { name: '待处理', desc: '等待经办人员处理', color: '#d97706' },
  { name: '处理中', desc: '经办人员已开始处理', color: '#0891b2' },
  { name: '已确认', desc: '确认结果或风险属实', color: '#059669' },
  { name: '已归档', desc: '任务完成归档', color: '#6b7280' },
]

const flows = ref<FlowItem[]>([
  { id: 1, name: '审核预审流程', nodes: 5, updated: '2026-08-06 14:20', status: '已发布', nodesList: [...defaultNodes] },
  { id: 2, name: '风险预警处置流程', nodes: 4, updated: '2026-08-05 09:15', status: '已发布', nodesList: defaultNodes.slice(0, 4) },
  { id: 3, name: '问答反馈处理流程', nodes: 3, updated: '2026-08-04 16:30', status: '草稿', nodesList: defaultNodes.slice(0, 3) },
  {
    id: 4, name: '知识入库审核流程', nodes: 4, updated: '2026-08-03 11:00', status: '已发布',
    nodesList: [
      { name: '提交入库', desc: '用户/业务人员提交知识', color: '#2563eb' },
      { name: '初审校验', desc: '系统校验格式合规', color: '#d97706' },
      { name: '人工审核', desc: '管理员人工复核确认', color: '#0891b2' },
      { name: '正式入库', desc: '知识向量化存储', color: '#059669' },
    ],
  },
])

const rules = ref<RuleItem[]>([
  { name: '超时自动转办', enabled: true },
  { name: '退回补正次数限制', enabled: true },
  { name: '高风险任务通知负责人', enabled: true },
  { name: '归档前需确认', enabled: false },
])

const flowForm = ref<Partial<FlowItem>>({ name: '', status: '草稿' })
const nodeDescText = ref('')

const selectedFlow = computed(() => flows.value.find(f => f.id === selectedId.value) || null)

function onSelectFlow(row: FlowItem) {
  selectedId.value = row.id
  ElMessage.info(`已选中「${row.name}」`)
}

function onToggleRule(r: RuleItem) {
  ElMessage.success(`转办规则「${r.name}」已${r.enabled ? '启用' : '关闭'}`)
}

function onNewFlow() {
  dialogTitle.value = '新建流程'
  editingId.value = null
  flowForm.value = { name: '', status: '草稿' }
  nodeDescText.value = '任务创建|AI生成任务|#2563eb\n待处理|等待经办人员处理|#d97706\n已归档|任务完成归档|#6b7280'
  showDialog.value = true
}

function onEditFlow(row: FlowItem) {
  dialogTitle.value = '编辑流程'
  editingId.value = row.id
  flowForm.value = { name: row.name, status: row.status }
  nodeDescText.value = row.nodesList.map(n => `${n.name}|${n.desc}|${n.color}`).join('\n')
  showDialog.value = true
}

function onConfigFlow(row: FlowItem) {
  selectedId.value = row.id
  ElMessage.success(`已进入「${row.name}」节点配置模式`)
}

function onDeleteFlow(row: FlowItem) {
  ElMessageBox.confirm(
    `确定要删除流程「${row.name}」吗？删除后该流程将不再可用。`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idx = flows.value.findIndex(f => f.id === row.id)
    if (idx !== -1) {
      flows.value.splice(idx, 1)
      if (selectedId.value === row.id) {
        selectedId.value = flows.value.length > 0 ? flows.value[0].id : null
      }
    }
    ElMessage.success(`流程「${row.name}」已删除`)
  }).catch(() => {})
}

function onSaveFlow() {
  const name = flowForm.value.name?.trim()
  if (!name) {
    ElMessage.warning('请输入流程名称')
    return
  }

  const lines = nodeDescText.value.trim().split('\n').filter(l => l.trim())
  const parsedNodes: FlowNode[] = lines.map(line => {
    const parts = line.split('|')
    return { name: parts[0]?.trim() || '未命名节点', desc: parts[1]?.trim() || '', color: parts[2]?.trim() || '#2563eb' }
  })

  if (editingId.value === null) {
    nextId++
    const newFlow: FlowItem = {
      id: nextId,
      name: name,
      nodes: parsedNodes.length,
      updated: new Date().toISOString().slice(0, 10),
      status: flowForm.value.status || '草稿',
      nodesList: parsedNodes,
    }
    flows.value.push(newFlow)
    selectedId.value = newFlow.id
    ElMessage.success(`流程「${name}」已创建`)
  } else {
    const idx = flows.value.findIndex(f => f.id === editingId.value)
    if (idx !== -1) {
      flows.value[idx] = {
        ...flows.value[idx],
        name: name,
        status: flowForm.value.status || '草稿',
        nodes: parsedNodes.length,
        nodesList: parsedNodes,
        updated: new Date().toISOString().slice(0, 10),
      }
    }
    ElMessage.success(`流程「${name}」已更新`)
  }
  showDialog.value = false
}
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