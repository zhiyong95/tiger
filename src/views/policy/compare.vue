<template>
  <div class="policy-page">
    <!-- 左侧边栏 340px -->
    <div class="policy-sidebar">
      <div class="upload-section">
        <div class="section-title"><span class="title-bar"></span>政策上传</div>
        <div class="url-input-area">
          <label class="input-label">政策文件链接（每行一条）</label>
          <el-input v-model="urlText" type="textarea" :rows="3" placeholder="https://example.com/policy1&#10;https://example.com/policy2" class="url-input" />
        </div>
        <div class="divider-text"><span>或</span></div>
        <div class="drop-zone" :class="{ 'drop-zone-active': isDragOver }" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
          <div class="drop-icon">📁</div>
          <div class="drop-text">点击或拖拽上传文件（可多选）</div>
          <div class="drop-hint">支持 PDF、Word、TXT 格式</div>
        </div>
        <input ref="fileInputRef" type="file" multiple accept=".pdf,.doc,.docx,.txt" style="display:none" @change="onFileSelected" />
        <div v-if="uploadedItems.length > 0" class="uploaded-list-section">
          <div class="list-header">
            <span class="list-title">已上传政策（{{ uploadedItems.length }}）</span>
            <el-button text size="small" type="danger" @click="clearAllItems">清空全部</el-button>
          </div>
          <div class="uploaded-list">
            <div v-for="(item, idx) in uploadedItems" :key="item.id" class="uploaded-item" :class="{'uploaded-item-error':item.status==='error'}" draggable="true">
              <span class="drag-handle">⠿</span>
              <span class="item-icon"><template v-if="item.type==='url'">🔗</template><template v-else-if="item.format==='pdf'">📕</template><template v-else>📄</template></span>
              <span class="item-name">{{ item.name }}</span>
              <el-tag :type="item.type==='url'?'warning':'primary'" size="small" class="item-format-tag">{{ item.type==='url'?'URL':item.format?.toUpperCase() }}</el-tag>
              <span class="item-size">{{ item.size }}</span>
              <el-button text size="small" type="danger" @click="removeItem(idx)" style="flex-shrink:0;padding:0 4px">✕</el-button>
            </div>
          </div>
          <div class="compare-config">
            <div class="section-title" style="margin-top:12px"><span class="title-bar"></span>比对配置</div>
            <div class="config-row">
              <label class="config-label">比对维度</label>
              <el-checkbox-group v-model="compareDims">
                <el-checkbox value="条款差异" label="条款差异">条款差异</el-checkbox>
                <el-checkbox value="扶持标准" label="扶持标准">扶持标准</el-checkbox>
                <el-checkbox value="适用范围" label="适用范围">适用范围</el-checkbox>
                <el-checkbox value="责任主体" label="责任主体">责任主体</el-checkbox>
                <el-checkbox value="实施期限" label="实施期限">实施期限</el-checkbox>
                <el-checkbox value="补助金额" label="补助金额">补助金额</el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="config-row">
              <label class="config-label">输出偏好</label>
              <el-checkbox-group v-model="outputPrefers">
                <el-checkbox value="highlight" label="highlight">差异高亮清单</el-checkbox>
                <el-checkbox value="table" label="table">结构化对比表格</el-checkbox>
                <el-checkbox value="summary" label="summary">变化总结报告</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          <div style="margin-top:12px;padding:0 4px">
            <el-button type="primary" class="action-btn" :disabled="uploadedItems.length<2" @click="startCompare" style="width:100%">
              <el-icon style="margin-right:4px"><Promotion /></el-icon>开始比对分析
            </el-button>
          </div>
        </div>
      </div>
      <div class="history-section">
        <div class="section-title"><span class="title-bar"></span>比对历史</div>
        <div v-if="compareHistory.length===0" class="empty-hint">暂无比对记录</div>
        <div v-for="h in compareHistory" :key="h.id" class="history-item" :class="{'history-item-active': h.id === activeHistoryId}" @click="loadCompareResult(h)">
          <div class="history-name">{{ h.name }}</div>
          <div class="history-time">{{ h.time }}</div>
        </div>
      </div>
    </div>
    <!-- 右侧对话区 -->
    <div class="policy-main chat-main">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">多政策横向比对</div>
        <div class="empty-desc">上传至少 2 份政策文件，配置比对维度后开始分析</div>
      </div>
      <div v-else ref="chatContainerRef" class="chat-messages">
        <div v-for="(msg, idx) in messages" :key="idx" class="chat-message" :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'">
          <div v-if="msg.role === 'user'" class="user-bubble">
            <div class="bubble-content">{{ msg.content }}</div>
            <div class="bubble-time">{{ msg.time }}</div>
          </div>
          <div v-else class="ai-bubble">
            <div class="ai-avatar">AI</div>
            <div class="ai-body">
              <div class="ai-name">政策比对助手</div>
              <!-- 加载中状态 -->
              <div v-if="msg.status === 'loading'" class="ai-loading">
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-text">正在生成比对分析…</span>
              </div>
              <template v-else>
                <!-- 比对概览 -->
                <div v-if="msg.overview" class="compare-overview">
                  <div class="overview-title">📊 比对概览</div>
                  <div class="overview-desc">{{ msg.overview.desc }}</div>
                  <div class="overview-stats">
                    <div class="ov-stat"><span class="ov-num">{{ msg.overview.stats.total }}</span>对比文件</div>
                    <div class="ov-stat"><span class="ov-num diff-highlight">{{ msg.overview.stats.diffCount }}</span>差异点</div>
                    <div class="ov-stat"><span class="ov-num same-highlight">{{ msg.overview.stats.sameCount }}</span>相同点</div>
                    <div class="ov-stat"><span class="ov-num change-highlight">{{ msg.overview.stats.changeCount }}</span>变更项</div>
                  </div>
                </div>
                <!-- 差异对比表 -->
                <div v-if="msg.diffTable && msg.diffTable.length > 0" class="compare-section">
                  <div class="section-label">📋 差异对比表</div>
                  <el-table :data="msg.diffTable" stripe border size="small" style="width:100%">
                    <el-table-column prop="dimension" label="维度" width="110" />
                    <el-table-column label="政策A" min-width="160">
                      <template #default="{row}"><span :class="row.aStatus==='新增'?'diff-new':row.aStatus==='删除'?'diff-del':''">{{ row.aContent }}</span></template>
                    </el-table-column>
                    <el-table-column label="政策B" min-width="160">
                      <template #default="{row}"><span :class="row.bStatus==='新增'?'diff-new':row.bStatus==='删除'?'diff-del':''">{{ row.bContent }}</span></template>
                    </el-table-column>
                    <el-table-column prop="conclusion" label="差异结论" min-width="150" />
                  </el-table>
                </div>
                <!-- AI分析结论 -->
                <div v-if="msg.aiConclusion" class="compare-section">
                  <div class="section-label">🤖 AI 分析结论</div>
                  <div class="ai-conclusion-box" v-html="msg.aiConclusion"></div>
                </div>
                <!-- 变化总结报告 -->
                <div v-if="msg.changeSummary" class="compare-section">
                  <div class="section-label">📝 变化总结报告</div>
                  <div class="summary-content" v-html="msg.changeSummary"></div>
                </div>
                <!-- 底部标注 -->
                <div class="ai-footer-note">AI生成内容仅供参考，请结合实际情况审核使用</div>
                <!-- 导出按钮 -->
                <div class="ai-actions">
                  <el-button size="small" @click="exportMsgResult(msg)"><el-icon style="margin-right:4px"><Download /></el-icon>导出比对结果</el-button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <!-- 底部输入区 -->
      <div class="chat-input-area">
        <el-input
          v-model="followUpText"
          type="textarea"
          :rows="2"
          placeholder="输入追问内容（如：补充某维度对比、细化新旧政策衔接建议）"
          :disabled="isGenerating"
        />
        <div class="input-actions">
          <span class="input-hint">按 Enter 发送，Shift+Enter 换行</span>
          <el-button type="primary" :disabled="!followUpText.trim() || isGenerating" @click="sendFollowUp">
            <el-icon style="margin-right:4px"><Position /></el-icon>发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion, Download, Position } from '@element-plus/icons-vue'

interface DiffRow {
  dimension: string
  aContent: string
  aStatus: string
  bContent: string
  bStatus: string
  conclusion: string
}

interface CompareOverview {
  desc: string
  stats: { total: number; diffCount: number; sameCount: number; changeCount: number }
}

interface AiMessage {
  role: 'user' | 'ai'
  content: string
  time: string
  status?: 'loading' | 'done'
  overview?: CompareOverview
  diffTable?: DiffRow[]
  aiConclusion?: string
  changeSummary?: string
}

interface CompareHistoryItem {
  id: number
  name: string
  time: string
  messages: AiMessage[]
}

const urlText = ref('')
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const uploadedItems = ref<any[]>([])
const compareDims = ref<string[]>(['条款差异', '扶持标准', '适用范围'])
const outputPrefers = ref<string[]>(['table', 'summary'])
const compareHistory = ref<CompareHistoryItem[]>([])
const activeHistoryId = ref<number | null>(null)

const messages = ref<AiMessage[]>([])
const followUpText = ref('')
const isGenerating = ref(false)
const chatContainerRef = ref<HTMLDivElement>()

// 初始历史
const mockCompareHistory: CompareHistoryItem[] = [
  { id: 1, name: '就业补贴政策新旧对比', time: '2026-08-25 10:30', messages: [] },
  { id: 2, name: '省市创业扶持政策比对', time: '2026-08-24 15:20', messages: [] }
]
compareHistory.value = mockCompareHistory

const triggerFileInput = () => fileInputRef.value?.click()
const onDragOver = (e: DragEvent) => { isDragOver.value = true }
const onDragLeave = () => { isDragOver.value = false }
const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files) handleFiles(Array.from(files))
}
const onFileSelected = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) handleFiles(Array.from(files))
}
const handleFiles = (files: File[]) => {
  files.forEach(f => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      ElMessage.warning(`不支持格式: ${f.name}`)
      return
    }
    uploadedItems.value.push({ id: Date.now() + Math.random(), name: f.name, format: ext, size: formatSize(f.size), type: 'file', status: 'done' })
  })
}
const formatSize = (bytes: number) => bytes < 1024 ? bytes + 'B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + 'KB' : (bytes / 1048576).toFixed(1) + 'MB'
const removeItem = (idx: number) => { uploadedItems.value.splice(idx, 1) }
const clearAllItems = () => { uploadedItems.value = []; messages.value = []; compareResultData.value = null }

// 解析URL文本为上传项
const parseUrls = () => {
  const lines = urlText.value.split('\n').map(s => s.trim()).filter(Boolean)
  lines.forEach(url => {
    if (!uploadedItems.value.find(i => i.type === 'url' && i.name === url)) {
      uploadedItems.value.push({ id: Date.now() + Math.random(), name: url, format: 'url', size: '链接', type: 'url', status: 'done' })
    }
  })
  urlText.value = ''
}

// 构建比对指令
const buildComparePrompt = () => {
  compareDims.value.sort()
  const items = uploadedItems.value
  const names = items.map(i => i.name)
  const dims = compareDims.value.join('、')
  const prefers = outputPrefers.value.map(p => {
    const map: Record<string, string> = { highlight: '差异高亮清单', table: '结构化对比表格', summary: '变化总结报告' }
    return map[p] || p
  }).join('、')
  return `请对以下政策进行比对分析。比对类型:新旧政策比对;政策1:${names[0] || '未命名'};政策2:${names[1] || '未命名'};比对维度:${dims};输出偏好:${prefers}。`
}

const scrollToBottom = async () => {
  await nextTick()
  const el = chatContainerRef.value
  if (el) el.scrollTop = el.scrollHeight
}

// 模拟AI生成比对结果
const generateCompareResult = () => {
  return {
    overview: {
      desc: '比对类型：新旧政策比对 | 比对文件：2份 | 经AI智能分析，两份政策文件在6个维度上存在显著差异',
      stats: { total: 2, diffCount: 6, sameCount: 8, changeCount: 4 }
    },
    diffTable: [
      { dimension: '扶持标准', aContent: '每人每月补贴 800 元', aStatus: '新增', bContent: '每人每月补贴 600 元', bStatus: '删除', conclusion: '标准提高 200 元/月（+25%）' },
      { dimension: '适用范围', aContent: '本市户籍失业人员', aStatus: '新增', bContent: '本市户籍就业困难人员', bStatus: '修改', conclusion: '适用范围扩大，覆盖人群更广' },
      { dimension: '实施期限', aContent: '2026年1月-2026年12月', aStatus: '新增', bContent: '2025年1月-2025年12月', bStatus: '删除', conclusion: '期限延至2026年底' },
      { dimension: '补助金额', aContent: '最高 5000 元/人', aStatus: '新增', bContent: '最高 3000 元/人', bStatus: '修改', conclusion: '补助金额上限提高 2000 元（+66.7%）' },
      { dimension: '责任主体', aContent: '区县人社部门', aStatus: '新增', bContent: '市级人社部门', bStatus: '修改', conclusion: '管理权限下放至区县' },
      { dimension: '条款差异', aContent: '新增第 12 条监督机制', aStatus: '新增', bContent: '无此条款', bStatus: '删除', conclusion: '新增监督机制，强化过程监管' }
    ],
    aiConclusion: '<p>经 AI 综合分析，两份政策文件在<strong>扶持标准、补助金额、适用范围</strong>三个维度存在显著差异：</p><ul><li><strong>扶持标准</strong>：新政策较旧政策提高 200 元/月，增幅 25%，直接提升受益群体获得感</li><li><strong>适用范围</strong>：从"就业困难人员"扩大至"失业人员"，覆盖人群更广，体现政策普惠性导向</li><li><strong>补助金额</strong>：上限从 3000 元提升至 5000 元，增幅 66.7%，显著加大财政扶持力度</li><li><strong>责任主体</strong>：从市级下放至区县，管理权限下沉，有利于就近服务、快速响应</li></ul><p><strong>风险提示</strong>：政策调整后预算增加幅度较大，建议关注区县财政承受能力；同时加强区县执行能力培训，确保政策落地效果。</p>',
    changeSummary: '<h4>一、修订要点说明</h4><p>本次政策修订主要涉及扶持标准提升、适用范围扩大、责任主体下放三个方面，体现了"提标扩面、权责下沉"的总体改革方向。</p><h4>二、主要变化</h4><ol><li><strong>金额提高</strong>：扶持标准提高 200 元/月（+25%），补助金额上限提高 2000 元（+66.7%）</li><li><strong>范围扩大</strong>：从"就业困难人员"扩大至"失业人员"</li><li><strong>权限下放</strong>：责任主体从市级下放至区县人社部门</li><li><strong>条款新增</strong>：新增监督机制条款，强化过程监管</li></ol><h4>三、过渡期与新旧衔接建议</h4><p>建议设置 3 个月过渡期，期间按新标准受理、按旧流程审批；同步开展区县经办人员培训。</p><h4>四、对执行的影响</h4><p>预计年度预算增加约 30%，需提前做好资金测算与预算调整申报。</p>'
  }
}

const appendAiMessage = (content: string, prompt: string) => {
  const result = generateCompareResult()
  const aiMsg: AiMessage = {
    role: 'ai',
    content: content,
    time: new Date().toLocaleString(),
    status: 'done',
    overview: result.overview,
    diffTable: result.diffTable,
    aiConclusion: result.aiConclusion,
    changeSummary: result.changeSummary
  }
  messages.value.push(aiMsg)
  isGenerating.value = false
  scrollToBottom()
}

const startCompare = () => {
  if (uploadedItems.value.length < 2) { ElMessage.warning('请至少上传 2 份政策文件'); return }
  if (compareDims.value.length === 0) { ElMessage.warning('请至少选择一个比对维度'); return }
  if (outputPrefers.value.length === 0) { ElMessage.warning('请至少选择一个输出偏好'); return }
  // 解析URL
  parseUrls()
  if (uploadedItems.value.length < 2) { ElMessage.warning('请至少上传 2 份政策文件'); return }

  const prompt = buildComparePrompt()
  const userMsg: AiMessage = {
    role: 'user',
    content: prompt,
    time: new Date().toLocaleString()
  }
  messages.value.push(userMsg)
  activeHistoryId.value = null

  // 添加AI加载消息
  const loadingMsg: AiMessage = {
    role: 'ai',
    content: '',
    time: new Date().toLocaleString(),
    status: 'loading'
  }
  messages.value.push(loadingMsg)
  isGenerating.value = true
  scrollToBottom()

  // 模拟AI生成延迟
  setTimeout(() => {
    // 移除loading消息
    const idx = messages.value.indexOf(loadingMsg)
    if (idx !== -1) messages.value.splice(idx, 1)
    appendAiMessage(prompt, prompt)
    // 保存到历史
    const historyItem: CompareHistoryItem = {
      id: Date.now(),
      name: `政策比对分析 ${new Date().toLocaleDateString()}`,
      time: new Date().toLocaleString(),
      messages: JSON.parse(JSON.stringify(messages.value))
    }
    compareHistory.value.unshift(historyItem)
    activeHistoryId.value = historyItem.id
  }, 1500)
}

const sendFollowUp = () => {
  const text = followUpText.value.trim()
  if (!text || isGenerating.value) return

  const userMsg: AiMessage = {
    role: 'user',
    content: text,
    time: new Date().toLocaleString()
  }
  messages.value.push(userMsg)
  followUpText.value = ''

  // 添加AI加载消息
  const loadingMsg: AiMessage = {
    role: 'ai',
    content: '',
    time: new Date().toLocaleString(),
    status: 'loading'
  }
  messages.value.push(loadingMsg)
  isGenerating.value = true
  scrollToBottom()

  setTimeout(() => {
    const idx = messages.value.indexOf(loadingMsg)
    if (idx !== -1) messages.value.splice(idx, 1)
    // 生成追问回复 - 基于上一轮结果补充
    const followUpContent = `根据您的追问"${text}"，补充分析如下：`
    const result = generateCompareResult()
    const aiMsg: AiMessage = {
      role: 'ai',
      content: followUpContent,
      time: new Date().toLocaleString(),
      status: 'done',
      overview: {
        desc: `针对追问「${text}」的补充分析`,
        stats: { total: 2, diffCount: 6, sameCount: 8, changeCount: 4 }
      },
      diffTable: result.diffTable,
      aiConclusion: `<p>针对"${text}"的补充分析：</p>` + result.aiConclusion,
      changeSummary: `<h4>补充分析：${text}</h4>` + result.changeSummary
    }
    messages.value.push(aiMsg)
    isGenerating.value = false
    scrollToBottom()
    // 更新历史记录
    updateHistoryMessages()
  }, 1200)
}

const updateHistoryMessages = () => {
  if (activeHistoryId.value) {
    const h = compareHistory.value.find(i => i.id === activeHistoryId.value)
    if (h) {
      h.messages = JSON.parse(JSON.stringify(messages.value))
    }
  }
}

const loadCompareResult = (h: CompareHistoryItem) => {
  activeHistoryId.value = h.id
  if (h.messages && h.messages.length > 0) {
    messages.value = JSON.parse(JSON.stringify(h.messages))
  } else {
    // 老数据兼容 - 生成一个示例对话
    const prompt = `请对历史记录中的政策进行比对分析。比对类型:新旧政策比对;政策1:${h.name};比对维度:条款差异、扶持标准、适用范围、责任主体、实施期限、补助金额;输出偏好:结构化对比表格、变化总结报告。`
    messages.value = [
      { role: 'user', content: prompt, time: h.time },
      {
        role: 'ai',
        content: '',
        time: h.time,
        status: 'done',
        overview: { desc: '比对类型：新旧政策比对 | 比对文件：2份', stats: { total: 2, diffCount: 6, sameCount: 8, changeCount: 4 } },
        diffTable: [
          { dimension: '扶持标准', aContent: '每人每月补贴 800 元', aStatus: '新增', bContent: '每人每月补贴 600 元', bStatus: '删除', conclusion: '标准提高 200 元/月' },
          { dimension: '适用范围', aContent: '本市户籍失业人员', aStatus: '新增', bContent: '本市户籍就业困难人员', bStatus: '修改', conclusion: '适用范围扩大' },
          { dimension: '实施期限', aContent: '2026年1月-2026年12月', aStatus: '新增', bContent: '2025年1月-2025年12月', bStatus: '删除', conclusion: '期限延至2026年底' },
          { dimension: '补助金额', aContent: '最高 5000 元/人', aStatus: '新增', bContent: '最高 3000 元/人', bStatus: '修改', conclusion: '补助金额上限提高 2000 元' },
          { dimension: '责任主体', aContent: '区县人社部门', aStatus: '新增', bContent: '市级人社部门', bStatus: '修改', conclusion: '权限下放至区县' },
          { dimension: '条款差异', aContent: '新增第 12 条监督机制', aStatus: '新增', bContent: '无此条款', bStatus: '删除', conclusion: '新增监督机制' }
        ],
        aiConclusion: '<p>经 AI 综合分析，两份政策文件在扶持标准、补助金额、适用范围三个维度存在显著差异。</p>',
        changeSummary: '<h4>主要变化</h4><ol><li>扶持标准提高 200 元/月（+25%）</li><li>适用范围从就业困难人员扩大到失业人员</li><li>补助金额上限从 3000 元提升至 5000 元</li><li>责任主体从市级下放至区县人社部门</li></ol>'
      }
    ]
  }
  scrollToBottom()
}

const exportMsgResult = (msg: AiMessage) => {
  if (!msg.overview) { ElMessage.warning('无比对结果可导出'); return }
  ElMessage.success('比对结果导出成功')
}

// 键盘快捷键 - 发送
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendFollowUp()
  }
}

// 暴露给外部使用
const compareResultData = ref<any>(null)
</script>

<style scoped>
.policy-page { display:flex; height:100%; background:#f5f6fa; }
.policy-sidebar { width:340px; min-width:340px; background:#fff; border-right:1px solid #e5e7eb; display:flex; flex-direction:column; overflow-y:auto; padding:16px; }
.policy-main { flex:1; overflow-y:auto; padding:0; display:flex; flex-direction:column; }
.chat-main { overflow:hidden; }
.section-title { font-size:14px; font-weight:600; color:#1f2937; display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.title-bar { display:inline-block; width:3px; height:14px; background:#2563eb; border-radius:2px; }
.url-input-area { margin-bottom:12px; }
.input-label { font-size:12px; color:#6b7280; margin-bottom:4px; display:block; }
.divider-text { text-align:center; color:#9ca3af; font-size:12px; margin:8px 0; position:relative; }
.divider-text::before, .divider-text::after { content:''; position:absolute; top:50%; width:calc(50% - 20px); height:1px; background:#e5e7eb; }
.divider-text::before { left:0; } .divider-text::after { right:0; }
.drop-zone { border:2px dashed #d1d5db; border-radius:8px; padding:16px; text-align:center; cursor:pointer; transition:all .2s; background:#f9fafb; }
.drop-zone:hover, .drop-zone-active { border-color:#2563eb; background:#eff6ff; }
.drop-icon { font-size:28px; margin-bottom:6px; }
.drop-text { font-size:13px; color:#374151; }
.drop-hint { font-size:11px; color:#9ca3af; margin-top:4px; }
.uploaded-list-section { margin-top:12px; }
.list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.list-title { font-size:13px; font-weight:500; color:#374151; }
.uploaded-list { max-height:220px; overflow-y:auto; }
.uploaded-item { display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:6px; margin-bottom:4px; background:#f9fafb; cursor:default; }
.uploaded-item-error { background:#fef2f2; }
.drag-handle { cursor:grab; color:#9ca3af; font-size:14px; }
.item-icon { font-size:16px; }
.item-name { flex:1; font-size:12px; color:#374151; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.item-format-tag { flex-shrink:0; }
.item-size { font-size:11px; color:#9ca3af; flex-shrink:0; }
.compare-config { background:#f9fafb; border-radius:8px; padding:8px 12px; margin-top:8px; }
.config-row { margin-bottom:8px; }
.config-row:last-child { margin-bottom:0; }
.config-label { font-size:12px; color:#6b7280; display:block; margin-bottom:4px; font-weight:500; }
.action-btn { height:36px; font-size:13px; }
.history-section { margin-top:16px; flex:1; overflow-y:auto; }
.history-item { padding:8px 10px; border-radius:6px; cursor:pointer; margin-bottom:4px; }
.history-item:hover { background:#f3f4f6; }
.history-item-active { background:#eff6ff; border-left:3px solid #2563eb; }
.history-name { font-size:13px; color:#374151; }
.history-time { font-size:11px; color:#9ca3af; margin-top:2px; }

/* 空状态 */
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#9ca3af; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-title { font-size:18px; font-weight:600; color:#374151; margin-bottom:8px; }
.empty-desc { font-size:13px; }

/* 聊天消息区 */
.chat-messages { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }
.chat-message { display:flex; }
.msg-user { justify-content:flex-end; }
.msg-ai { justify-content:flex-start; }
.user-bubble { max-width:70%; background:#2563eb; color:#fff; border-radius:12px 12px 4px 12px; padding:10px 14px; position:relative; }
.bubble-content { font-size:13px; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
.bubble-time { font-size:11px; color:rgba(255,255,255,0.6); margin-top:4px; text-align:right; }
.ai-bubble { max-width:85%; display:flex; gap:10px; }
.ai-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#0a2480,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; flex-shrink:0; }
.ai-body { flex:1; background:#fff; border-radius:12px; padding:16px; border:1px solid #e5e7eb; }
.ai-name { font-size:13px; font-weight:600; color:#1f2937; margin-bottom:8px; }

/* 加载动画 */
.ai-loading { display:flex; align-items:center; gap:6px; padding:8px 0; }
.loading-dot { width:6px; height:6px; border-radius:50%; background:#2563eb; animation:dotPulse 1.4s infinite ease-in-out; }
.loading-dot:nth-child(2) { animation-delay:0.2s; }
.loading-dot:nth-child(3) { animation-delay:0.4s; }
@keyframes dotPulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }
.loading-text { font-size:12px; color:#6b7280; margin-left:4px; }

/* 比对概览 */
.compare-overview { background:linear-gradient(135deg,#eff6ff,#f0f9ff); border-radius:8px; padding:12px; margin-bottom:12px; }
.overview-title { font-size:14px; font-weight:600; color:#1f2937; margin-bottom:6px; }
.overview-desc { font-size:12px; color:#6b7280; margin-bottom:10px; }
.overview-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.ov-stat { text-align:center; background:#fff; border-radius:6px; padding:8px 4px; }
.ov-num { font-size:20px; font-weight:700; color:#2563eb; display:block; }
.diff-highlight { color:#ef4444; }
.same-highlight { color:#10b981; }
.change-highlight { color:#f59e0b; }

/* 对比区块 */
.compare-section { margin-bottom:12px; }
.section-label { font-size:13px; font-weight:600; color:#1f2937; margin-bottom:8px; padding-left:8px; border-left:3px solid #2563eb; }
.diff-new { color:#10b981; font-weight:500; }
.diff-del { color:#ef4444; text-decoration:line-through; }
.ai-conclusion-box { background:linear-gradient(135deg,#eff6ff,#f0f9ff); border-radius:8px; padding:14px; font-size:13px; color:#374151; line-height:1.8; }
.ai-conclusion-box ul { padding-left:20px; }
.ai-conclusion-box li { margin-bottom:4px; }
.summary-content { font-size:13px; color:#374151; line-height:1.8; }
.summary-content h4 { font-size:14px; color:#1f2937; margin:10px 0 6px; }
.summary-content ol { padding-left:20px; }
.summary-content li { margin-bottom:4px; }
.summary-content p { margin-bottom:6px; }

/* 底部标注 */
.ai-footer-note { font-size:11px; color:#9ca3af; text-align:center; margin-top:8px; padding-top:8px; border-top:1px solid #f3f4f6; }

/* 导出按钮 */
.ai-actions { display:flex; gap:8px; margin-top:8px; justify-content:flex-end; }

/* 底部输入区 */
.chat-input-area { border-top:1px solid #e5e7eb; padding:12px 20px; background:#fff; }
.input-actions { display:flex; justify-content:space-between; align-items:center; margin-top:8px; }
.input-hint { font-size:11px; color:#9ca3af; }
</style>