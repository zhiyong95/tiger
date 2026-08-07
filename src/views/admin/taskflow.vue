<template>
  <div class="task-flow">
    <div class="page-header">
      <h2>任务流配置</h2>
      <span class="subtitle">任务状态、处理节点、转办规则配置</span>
      <el-button type="primary" size="small" style="margin-left:auto" @click="handleNewFlow">+ 新建流程</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">流程定义</span></template>
          <el-table :data="flows" stripe style="width:100%" @row-click="onFlowSelect">
            <el-table-column prop="name" label="流程名称" />
            <el-table-column prop="nodes" label="节点数" width="70" align="center" />
            <el-table-column prop="updated" label="更新时间" width="150" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已发布' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click.stop="handleEditFlow(row as any)">编辑</el-button>
                <el-button size="small" text type="primary" @click.stop="handleConfigNodes(row as any)">配置</el-button>
                <el-button size="small" text type="danger" @click.stop="handleDeleteFlow(row as any)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span style="font-weight:600">节点配置 - {{ currentFlow.name || '请选择流程' }}</span>
          </template>
          <div class="flow-nodes" v-if="currentFlow.nodes">
            <div class="flow-node" v-for="(node, i) in currentNodes" :key="i">
              <div class="node-dot" :style="{ background: node.color }"></div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-desc">{{ node.desc }}</div>
              </div>
              <div v-if="i < currentNodes.length - 1" class="node-arrow">↓</div>
            </div>
          </div>
          <el-empty v-else description="请点击左侧流程查看节点配置" :image-size="80" />
        </el-card>
        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">转办规则</span></template>
          <div class="rule-item" v-for="(r, idx) in rules" :key="r.name">
            <span class="rule-name">{{ r.name }}</span>
            <el-switch v-model="rules[idx].enabled" size="small" @change="onRuleToggle(r)" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建/编辑流程对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" :close-on-click-modal="false">
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
            placeholder="每行一个节点：节点名称|节点描述|颜色，如：&#10;任务创建|AI生成任务|#2563eb"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFlow">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface FlowItem {
  id?: number
  name: string
  nodes: number
  updated: string
  status: string
  nodeList?: Array<{ name: string; desc: string; color: string }>
}

interface RuleItem {
  name: string
  enabled: boolean
}

const activeFlowId = ref<number | null>(1)
const dialogVisible = ref(false)
const dialogTitle = ref('新建流程')
const editingFlowId = ref<number | null>(null)
let nextId = 100

const defaultNodes = [
  { name: '任务创建', desc: 'AI生成任务/系统触发', color: '#2563eb' },
  { name: '待处理', desc: '等待经办人员处理', color: '#d97706' },
  { name: '处理中', desc: '经办人员已开始处理', color: '#0891b2' },
  { name: '已确认', desc: '确认结果或风险属实', color: '#059669' },
  { name: '已归档', desc: '任务完成归档', color: '#6b7280' },
]

const flows = ref<FlowItem[]>([
  { id: 1, name: '审核预审流程', nodes: 5, updated: '2026-08-06 14:20', status: '已发布', nodeList: [...defaultNodes] },
  { id: 2, name: '风险预警处置流程', nodes: 4, updated: '2026-08-05 09:15', status: '已发布', nodeList: defaultNodes.slice(0, 4) },
  { id: 3, name: '问答反馈处理流程', nodes: 3, updated: '2026-08-04 16:30', status: '草稿', nodeList: defaultNodes.slice(0, 3) },
  { id: 4, name: '知识入库审核流程', nodes: 4, updated: '2026-08-03 11:00', status: '已发布', nodeList: [
    { name: '提交入库', desc: '用户/业务人员提交知识', color: '#2563eb' },
    { name: '初审校验', desc: '系统校验格式合规', color: '#d97706' },
    { name: '人工审核', desc: '管理员人工复核确认', color: '#0891b2' },
    { name: '正式入库', desc: '知识向量化存储', color: '#059669' },
  ] },
])

const rules = ref<RuleItem[]>([
  { name: '超时自动转办', enabled: true },
  { name: '退回补正次数限制', enabled: true },
  { name: '高风险任务通知负责人', enabled: true },
  { name: '归档前需确认', enabled: false },
])

const flowForm = ref<Partial<FlowItem>>({
  name: '',
  status: '草稿',
})
const nodeDescText = ref('')

const currentFlow = computed<FlowItem>(() => flows.value.find(f => f.id === activeFlowId.value) || { id: 0, name: '', nodes: 0, updated: '', status: '', nodeList: [] })
const currentNodes = computed(() => currentFlow.value?.nodeList || [])

const onFlowSelect = (row: FlowItem) => {
  activeFlowId.value = row.id || null
  ElMessage.info(`当前已选中「${row.name}」`)
}

const onRuleToggle = (r: RuleItem) => {
  ElMessage.success(`转办规则「${r.name}」已${r.enabled ? '启用' : '关闭'}`)
}

const handleNewFlow = () => {
  dialogTitle.value = '新建流程'
  editingFlowId.value = null
  flowForm.value = { name: '', status: '草稿' }
  nodeDescText.value = `任务创建|AI生成任务|#2563eb\n待处理|等待经办人员处理|#d97706\n已归档|任务完成归档|#6b7280`
  dialogVisible.value = true
}

const handleEditFlow = (row: FlowItem) => {
  dialogTitle.value = '编辑流程'
  editingFlowId.value = row.id || null
  flowForm.value = { ...row }
  if (row.nodeList) {
    nodeDescText.value = row.nodeList.map(n => `${n.name}|${n.desc}|${n.color}`).join('\n')
  }
  dialogVisible.value = true
}

const handleConfigNodes = (row: FlowItem) => {
  activeFlowId.value = row.id || null
  ElMessage.success(`已进入「${row.name}」节点配置模式`)
}

const handleDeleteFlow = (row: FlowItem) => {
  ElMessageBox.confirm(
    `确定要删除流程「${row.name}」吗？删除后该流程将不再可用。`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idx = flows.value.findIndex(f => f.id === row.id)
    if (idx !== -1) {
      flows.value.splice(idx, 1)
    }
    // 如果当前选中的流程被删了，重置选中状态
    if (activeFlowId.value === row.id) {
      activeFlowId.value = flows.value.length > 0 ? flows.value[0].id! : null
    }
    ElMessage.success(`流程「${row.name}」已删除`)
  }).catch(() => {})
}

const handleSaveFlow = () => {
  if (!flowForm.value.name?.trim()) {
    ElMessage.warning('请输入流程名称')
    return
  }
  // 解析节点描述文本
  const lines = nodeDescText.value.trim().split('\n').filter(l => l.trim())
  const parsedNodes = lines.map(line => {
    const parts = line.split('|')
    return {
      name: parts[0]?.trim() || '未命名节点',
      desc: parts[1]?.trim() || '',
      color: parts[2]?.trim() || '#2563eb',
    }
  })

  if (editingFlowId.value === null) {
    // 新增流程
    nextId++
    const newFlow: FlowItem = {
      id: nextId,
      name: flowForm.value.name,
      nodes: parsedNodes.length,
      updated: new Date().toISOString().slice(0, 10),
      status: flowForm.value.status || '草稿',
      nodeList: parsedNodes,
    }
    flows.value.push(newFlow)
    activeFlowId.value = newFlow.id!
    ElMessage.success(`流程「${newFlow.name}」已创建`)
  } else {
    // 编辑已有流程
    const idx = flows.value.findIndex(f => f.id === editingFlowId.value)
    if (idx !== -1) {
      flows.value[idx] = {
        ...flows.value[idx],
        ...flowForm.value,
        nodes: parsedNodes.length,
        nodeList: parsedNodes,
        updated: new Date().toISOString().slice(0, 10),
      }
    }
    ElMessage.success(`流程「${flowForm.value.name}」已更新`)
  }
  dialogVisible.value = false
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
