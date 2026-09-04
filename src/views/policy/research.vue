<template>
  <div class="policy-research">
    <!-- 左侧面板 -->
    <div class="left-panel">
      <div class="panel-section">
        <div class="section-title">政策链接</div>
        <div class="url-input-row">
          <el-input v-model="urlText" placeholder="输入政策链接地址" size="small" clearable @keyup.enter="addUrl" />
          <el-button type="primary" size="small" @click="addUrl" style="flex-shrink:0;">添加</el-button>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-title">文件上传</div>
        <div class="upload-zone" :class="{ 'drag-over': isDragOver }" @dragenter.prevent="isDragOver = true" @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false" @drop.prevent="onDrop" @click="triggerFileInput">
          <input ref="fileInputRef" type="file" accept=".pdf,.doc,.docx,.txt" style="display:none" @change="onFileSelected" />
          <div class="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="upload-text">点击上传或拖拽文件</div>
          <div class="upload-hint">支持 PDF、Word、TXT 格式</div>
        </div>
        <div v-if="currentFile" class="file-item">
          <div class="file-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span class="file-name">{{ currentFile.name }}</span>
            <el-tag :type="currentFile.status === 'ready' ? 'success' : 'warning'" size="small">{{ currentFile.status === 'ready' ? '已就绪' : '上传中' }}</el-tag>
          </div>
          <el-button text size="small" @click="removeFile" style="color:#ef4444;">删除</el-button>
        </div>
      </div>

      <div class="panel-section">
        <el-button type="primary" size="large" :disabled="!currentFile || analyzing" :loading="analyzing" class="analyze-btn" @click="startAnalysis">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          开始 AI 解读
        </el-button>
      </div>

      <div class="panel-section">
        <div class="section-title">解读历史</div>
        <div v-if="historyList.length === 0" class="empty-hint">暂无解读记录</div>
        <div v-for="(item, idx) in historyList" :key="idx" class="history-item" :class="{ active: idx === activeHistoryIdx }" @click="loadHistory(idx)">
          <div class="history-name">{{ item.name }}</div>
          <div class="history-meta">{{ item.title }} · {{ item.time }}</div>
        </div>
        <el-button v-if="historyList.length > 0" text size="small" @click="clearHistory" style="color:#999;margin-top:8px;width:100%;">清空历史</el-button>
      </div>
    </div>

    <!-- 右侧对话区 -->
    <div class="right-chat">
      <!-- 空状态 -->
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.5"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
        </div>
        <div class="empty-title">AI 政策研判助手</div>
        <div class="empty-desc">在左侧上传政策文件或输入链接，点击"开始 AI 解读"生成政策研判报告</div>
        <div class="empty-cards">
          <div class="empty-card"><div class="ec-icon" style="background:#e8f0fe;">📄</div><div class="ec-title">政策深度解读</div><div class="ec-desc">自动提取政策核心条款、适用对象、补贴标准等关键信息</div></div>
          <div class="empty-card"><div class="ec-icon" style="background:#fef3c7;">💬</div><div class="ec-title">多轮对话追问</div><div class="ec-desc">支持对研判结果进行多轮对话式追问，深入分析政策细节</div></div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="chat-messages" ref="msgListRef">
        <div v-for="(msg, idx) in messages" :key="idx" class="msg-item" :class="msg.role">
          <div class="msg-avatar">
            <svg v-if="msg.role === 'ai'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4z"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="msg-content">
            <div class="msg-bubble">
              <template v-if="msg.role === 'user'">
                <div class="msg-text">{{ msg.content }}</div>
              </template>
              <template v-else>
                <div class="ai-header">
                  <span class="ai-badge">AI 研判</span>
                  <span class="msg-time">{{ msg.time }}</span>
                  <el-button v-if="msg.result" text size="small" @click="exportReport(msg.result)" style="margin-left:auto;color:#2563eb;font-size:12px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    导出报告
                  </el-button>
                </div>
                <div class="msg-text" v-if="msg.content" style="white-space:pre-wrap;line-height:1.8;margin-bottom:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #2563eb;">{{ msg.content }}</div>
                <div class="result-content" v-if="msg.result">
                  <div class="result-title">{{ msg.result.title }}</div>
                  <div class="result-tags">
                    <el-tag size="small" type="primary">{{ msg.result.level }}</el-tag>
                    <el-tag v-for="t in msg.result.tags" :key="t" size="small" style="margin-left:4px;">{{ t }}</el-tag>
                  </div>
                  <div class="result-section">
                    <div class="section-label">政策概述</div>
                    <div class="section-text">{{ msg.result.background }}</div>
                  </div>
                  <div class="result-cards">
                    <div class="info-card">
                      <div class="label">适用对象</div>
                      <ul class="result-list"><li v-for="o in msg.result.targetObjects" :key="o">{{ o }}</li></ul>
                    </div>
                    <div class="info-card">
                      <div class="label">核心条件</div>
                      <ul class="result-list"><li v-for="c in msg.result.coreConditions" :key="c">{{ c }}</li></ul>
                    </div>
                    <div class="info-card">
                      <div class="label">补贴标准</div>
                      <div v-for="a in msg.result.subsidyAmounts" :key="a" class="amount-item" v-html="highlightAmount(a)"></div>
                    </div>
                    <div class="info-card">
                      <div class="label">办理流程</div>
                      <ul class="result-list"><li v-for="s in processSteps" :key="s.name"><strong>{{ s.name }}</strong>：{{ s.desc }}</li></ul>
                    </div>
                  </div>
                  <div class="result-section">
                    <div class="section-label">政策背景与目的</div>
                    <div class="section-text">{{ msg.result.background }}</div>
                  </div>
                </div>
                <div v-if="msg.isLoading" class="loading-indicator">
                  <span class="dot-pulse"></span>
                  <span class="loading-text">正在生成研判报告…</span>
                </div>
                <div class="disclaimer">AI生成内容仅供参考，请结合实际情况审核使用</div>
              </template>
            </div>
          </div>
        </div>
        <div ref="msgBottomRef"></div>
      </div>

      <!-- 底部追问入口 -->
      <div class="chat-footer">
        <div class="question-hint" v-if="messages.length > 0">
          <el-button v-for="q in getQuickQuestions()" :key="q" text size="small" @click="sendQuestion(q)" class="quick-btn">{{ q }}</el-button>
        </div>
        <div class="input-row">
          <el-input v-model="qaInput" :placeholder="messages.length > 0 ? '输入对研判内容的问题…' : '在左侧上传政策后开始解读'" size="large" clearable @keyup.enter="sendQA" class="qa-input">
            <template #prefix>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </template>
          </el-input>
          <el-button type="primary" :disabled="!qaInput.trim()" size="large" @click="sendQA" class="send-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

interface PolicyResult {
  title: string; level: string; tags: string[]; background: string
  targetObjects: string[]; coreConditions: string[]; subsidyAmounts: string[]
}
interface ChatMessage { role: 'user' | 'ai'; content: string; time: string; result?: PolicyResult; isLoading?: boolean }
interface HistoryItem { name: string; title: string; time: string; count: number; resultKey: number }

const urlText = ref('')
const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const analyzing = ref(false)
const currentFile = ref<{ name: string; status: 'uploading' | 'ready' } | null>(null)
const activeHistoryIdx = ref(0)
const historyList = ref<HistoryItem[]>([])
const qaInput = ref('')
const messages = ref<ChatMessage[]>([])
const msgListRef = ref<HTMLDivElement>()
const msgBottomRef = ref<HTMLDivElement>()
const lastResultKey = ref(-1)

const processSteps = [
  { name: '申请', desc: '申请人向当地人社部门或经办机构提交申请材料' },
  { name: '审核', desc: '人社部门对申请材料进行审核，核实资格条件' },
  { name: '公示', desc: '审核通过后进行公示，接受社会监督（5个工作日）' },
  { name: '拨付', desc: '公示无异议后，按规定拨付补贴资金' },
]

const allResults: PolicyResult[] = [
  {
    title: '稳岗返还补贴政策解读', level: '国家级', tags: ['稳岗返还', '企业补贴'],
    background: '参保企业足额缴纳失业保险费12个月以上，上年度未裁员或裁员率不高于上年度全国城镇调查失业率控制目标（5.5%），30人（含）以下的参保企业裁员率不高于参保职工总数20%的，可以按规定享受失业保险稳岗返还。大型企业按企业及其职工上年度实际缴纳失业保险费的30%返还，中小微企业按上年度实际缴纳失业保险费的60%返还。稳岗返还资金可用于职工生活补助、缴纳社会保险费、转岗培训、技能提升培训等稳定就业岗位以及降低生产经营成本支出。',
    targetObjects: ['依法参加失业保险并足额缴纳失业保险费的企业', '上年度未裁员或裁员率低于控制目标的企业'],
    coreConditions: ['依法参加失业保险并足额缴纳失业保险费12个月以上', '上年度未裁员或裁员率不高于5.5%', '30人以下企业裁员率不高于职工总数20%'],
    subsidyAmounts: ['大型企业返还比例：不超过上年度实际缴纳失业保险费的<span class="amount-highlight">30%</span>', '中小微企业返还比例：不超过上年度实际缴纳失业保险费的<span class="amount-highlight">60%</span>'],
  },
  {
    title: '一次性扩岗补助政策解读', level: '国家级', tags: ['扩岗补助', '高校毕业生'],
    background: '对招用毕业年度及离校两年内未就业高校毕业生、16—24岁登记失业青年，签订劳动合同并为其足额缴纳3个月以上失业、工伤、职工养老保险费的企业和社会组织，每招用1名符合条件人员发放一次性扩岗补助1500元。劳务派遣单位享受一次性扩岗补助的经办模式及资金分配方式，参照稳岗返还政策实施。',
    targetObjects: ['招用符合条件人员的企业', '社会组织', '劳务派遣单位'],
    coreConditions: ['签订劳动合同并足额缴纳3个月以上失业、工伤、职工养老保险费', '招用毕业年度及离校两年内未就业高校毕业生', '招用16—24岁登记失业青年'],
    subsidyAmounts: ['一次性扩岗补助：<span class="amount-highlight">1,500元/人</span>'],
  },
  {
    title: '技能提升补贴政策解读', level: '国家级', tags: ['技能提升', '职业培训'],
    background: '参加失业保险12个月以上的企业在职职工或领取失业保险金人员，取得列入各地急需紧缺职业（工种）目录、职业中类与所在企业行业类别一致、数字和绿色职业等级证书之一的，可按初级、中级、高级分别申领1000元、1500元、2000元的技能提升补贴。对取得多项急需紧缺职业（工种）证书的，在每人每年1次补贴基础上增加2次补贴次数，共计不超过3次。',
    targetObjects: ['企业在职职工', '领取失业保险金人员'],
    coreConditions: ['参加失业保险12个月以上', '取得急需紧缺职业（工种）目录内证书', '证书与所在企业行业类别一致'],
    subsidyAmounts: ['初级工：<span class="amount-highlight">1,000元/人</span>', '中级工：<span class="amount-highlight">1,500元/人</span>', '高级工：<span class="amount-highlight">2,000元/人</span>'],
  },
  {
    title: '就业困难人员援助政策解读', level: '省级', tags: ['就业援助', '困难群体'],
    background: '为贯彻落实就业优先战略，进一步做好就业困难人员就业援助工作，加强困难群体就业兜底帮扶，根据《就业促进法》和《社会救助暂行办法》等法律法规，结合本省实际，制定本政策解读。',
    targetObjects: ['零就业家庭成员', '享受最低生活保障且登记失业人员', '残疾人', '退役军人', '距法定退休年龄不足5年的人员'],
    coreConditions: ['已进行失业登记并被认定为就业困难人员', '有就业意愿和劳动能力', '接受公共就业服务机构提供的就业援助服务'],
    subsidyAmounts: ['公益性岗位补贴：不低于当地最低工资标准的<span class="amount-highlight">50%</span>', '社会保险补贴：按实际缴费的<span class="amount-highlight">2/3</span>给予补贴', '灵活就业社保补贴：<span class="amount-highlight">600元/月</span>'],
  },
  {
    title: '创业担保贷款贴息政策解读', level: '国家级', tags: ['创业扶持', '贷款贴息'],
    background: '为加大创业担保贷款贴息支持力度，支持重点群体创业就业，根据相关规定，制定本政策解读。',
    targetObjects: ['城镇登记失业人员', '就业困难人员（含残疾人）', '复员转业退役军人', '高校毕业生', '返乡创业农民工'],
    coreConditions: ['具有完全民事行为能力', '信用记录良好', '有具体创业项目和经营场所', '按规定办理工商登记注册'],
    subsidyAmounts: ['个人创业担保贷款额度：最高<span class="amount-highlight">30万元</span>', '小微企业创业担保贷款额度：最高<span class="amount-highlight">400万元</span>'],
  },
]

const triggerFileInput = () => { fileInputRef.value?.click() }

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) { ElMessage.warning('不支持的文件格式'); return }
  currentFile.value = { name: file.name, status: 'uploading' }
  setTimeout(() => {
    if (currentFile.value) currentFile.value.status = 'ready'
    ElMessage.success(`已上传 ${file.name}`)
    urlText.value = ''
  }, 500)
  input.value = ''
}

const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (!files?.length) return
  const file = files[0]
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) { ElMessage.warning('不支持的文件格式'); return }
  currentFile.value = { name: file.name, status: 'uploading' }
  setTimeout(() => {
    if (currentFile.value) currentFile.value.status = 'ready'
    ElMessage.success(`已上传 ${file.name}`)
    urlText.value = ''
  }, 500)
}

const addUrl = () => {
  const url = urlText.value.trim()
  if (!url) { ElMessage.warning('请输入政策链接'); return }
  const name = url.length > 30 ? url.slice(0, 30) + '...' : url
  currentFile.value = { name, status: 'ready' }
  ElMessage.success('已添加政策链接')
}

const removeFile = () => {
  currentFile.value = null
  urlText.value = ''
}

const scrollToBottom = async () => {
  await nextTick()
  msgBottomRef.value?.scrollIntoView({ behavior: 'smooth' })
}

const startAnalysis = () => {
  if (!currentFile.value) { ElMessage.warning('请先上传政策文件或输入链接'); return }
  if (analyzing.value) return
  analyzing.value = true

  const fileName = currentFile.value.name
  const isUrl = fileName.startsWith('http') || urlText.value.trim().startsWith('http')
  let userMsg: string
  if (isUrl) {
    userMsg = `请对「${urlText.value.trim()}」中的政策进行研判。政策来源:政策链接 ${urlText.value.trim()}。`
  } else {
    userMsg = `请对「《${fileName}》」进行政策研判。政策来源:上传文件《${fileName}》。`
  }

  messages.value.push({ role: 'user', content: userMsg, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
  const aiMsgIdx = messages.value.length
  messages.value.push({ role: 'ai', content: '', time: '', isLoading: true })
  scrollToBottom()

  setTimeout(() => {
    analyzing.value = false
    const randomIdx = Math.floor(Math.random() * allResults.length)
    const result = allResults[randomIdx]
    lastResultKey.value = randomIdx

    messages.value[aiMsgIdx] = {
      role: 'ai',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      result,
      isLoading: false,
    }

    historyList.value.unshift({
      name: currentFile.value?.name || '未命名',
      title: result.title,
      time: new Date().toISOString().slice(0, 10),
      count: 1,
      resultKey: randomIdx,
    })
    if (historyList.value.length > 10) historyList.value.pop()
    activeHistoryIdx.value = 0
    scrollToBottom()
    ElMessage.success('AI 解读完成')
  }, 2500)
}

const loadHistory = (idx: number) => {
  activeHistoryIdx.value = idx
  const item = historyList.value[idx]
  const result = allResults[item.resultKey % allResults.length]
  messages.value.push({ role: 'user', content: `查看历史研判记录：${item.name}`, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
  messages.value.push({ role: 'ai', content: '', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), result })
  scrollToBottom()
}

const clearHistory = () => {
  historyList.value = []
  activeHistoryIdx.value = 0
  messages.value = []
  ElMessage.success('已清空历史记录')
}

const sendQA = () => {
  const q = qaInput.value.trim()
  if (!q) return
  qaInput.value = ''
  messages.value.push({ role: 'user', content: q, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
  const aiMsgIdx = messages.value.length
  messages.value.push({ role: 'ai', content: '', time: '', isLoading: true })
  scrollToBottom()

  setTimeout(() => {
    const lastResult = messages.value.filter(m => m.result).pop()?.result
    if (lastResult) {
      messages.value[aiMsgIdx] = {
        role: 'ai',
        content: `根据您的问题「${q}」，对《${lastResult.title}》进行补充分析：\n\n${getFollowUpAnswer(q, lastResult)}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        result: lastResult,
        isLoading: false,
      }
    } else {
      messages.value[aiMsgIdx] = {
        role: 'ai',
        content: `根据您的问题「${q}」，结合政策内容分析如下：\n\n请先在左侧上传政策文件并点击"开始AI解读"生成研判报告，再针对具体内容进行提问。`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isLoading: false,
      }
    }
    scrollToBottom()
  }, 1500)
}

const sendQuestion = (q: string) => {
  qaInput.value = q
  sendQA()
}

const getFollowUpAnswer = (q: string, result: PolicyResult): string => {
  const qLower = q.toLowerCase()
  if (qLower.includes('对比') || qLower.includes('比较')) {
    return `与同类政策相比，该政策在以下方面具有特点：\n1. 覆盖范围：面向${result.targetObjects.join('、')}等群体\n2. 补贴力度：${result.subsidyAmounts.join('；')}\n3. 申请条件：${result.coreConditions.join('；')}`
  }
  if (qLower.includes('流程') || qLower.includes('办理') || qLower.includes('申请')) {
    return `办理流程如下：\n1. 申请：申请人向当地人社部门或经办机构提交申请材料\n2. 审核：人社部门对申请材料进行审核，核实资格条件\n3. 公示：审核通过后进行公示，接受社会监督（5个工作日）\n4. 拨付：公示无异议后，按规定拨付补贴资金`
  }
  if (qLower.includes('建议') || qLower.includes('帮扶') || qLower.includes('社区') || qLower.includes('岗位')) {
    return `针对该政策的实施建议：\n1. 加强政策宣传，确保符合条件的${result.targetObjects[0] || '对象'}及时了解政策内容\n2. 简化申请流程，推行"一网通办"服务模式\n3. 加强部门协同，实现数据共享，提高审核效率\n4. 建立政策落实跟踪机制，定期评估实施效果`
  }
  return `关于「${q}」的补充说明：\n\n根据《${result.title}》相关规定，该政策主要面向${result.targetObjects.join('、')}，核心条件包括${result.coreConditions.join('、')}。建议您向当地人社部门咨询具体经办流程，以获取最新、最准确的信息。`
}

const getQuickQuestions = () => {
  return ['补充对比分析', '细化办理流程', '政策适用建议', '风险提示']
}

const exportReport = (result: PolicyResult) => {
  const text = `【${result.title}】\n\n政策级别：${result.level}\n标签：${result.tags.join('、')}\n\n政策概述：${result.background}\n\n适用对象：\n${result.targetObjects.map(o => `- ${o}`).join('\n')}\n\n核心条件：\n${result.coreConditions.map(c => `- ${c}`).join('\n')}\n\n补贴标准：\n${result.subsidyAmounts.map(a => `- ${a.replace(/<[^>]*>/g, '')}`).join('\n')}\n\n办理流程：\n${processSteps.map(s => `- ${s.name}：${s.desc}`).join('\n')}\n\nAI生成内容仅供参考，请结合实际情况审核使用`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${result.title}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('报告已导出')
}

const highlightAmount = (text: string) => {
  return text.replace(/([\d,]+(?:\.\d+)?)(?=\s*元)/g, '<span class="amount-highlight">$1</span>')
    .replace(/(\d+(?:\.\d+)?)%/g, '<span class="amount-highlight">$1%</span>')
}
</script>

<style scoped>
.policy-research {
  display: flex;
  height: 100%;
  gap: 0;
  background: #f2f5fa;
}

/* 左侧面板 */
.left-panel {
  width: 340px;
  min-width: 340px;
  background: #fff;
  border-right: 1px solid #e4eaf3;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-section { display: flex; flex-direction: column; gap: 8px; }
.section-title { font-size: 14px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 6px; }
.url-input-row { display: flex; gap: 8px; }
.upload-zone {
  border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer;
  transition: all 0.2s; background: #fafbfc;
}
.upload-zone:hover, .upload-zone.drag-over { border-color: #2563eb; background: #e8f0fe; }
.upload-icon { color: #9ca3af; margin-bottom: 8px; }
.upload-text { font-size: 13px; color: #374151; margin-bottom: 4px; }
.upload-hint { font-size: 11px; color: #9ca3af; }
.file-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }
.file-info { display: flex; align-items: center; gap: 6px; overflow: hidden; }
.file-name { font-size: 12px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.analyze-btn { width: 100%; height: 44px; font-size: 15px; border-radius: 8px; background: #2563eb; }
.empty-hint { font-size: 12px; color: #9ca3af; text-align: center; padding: 16px 0; }
.history-item { padding: 10px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.history-item:hover { background: #f3f4f6; }
.history-item.active { background: #e8f0fe; border-color: #2563eb; }
.history-name { font-size: 13px; font-weight: 500; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* 右侧对话区 */
.right-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f2f5fa;
  overflow: hidden;
}
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.empty-icon { margin-bottom: 8px; }
.empty-title { font-size: 20px; font-weight: 600; color: #1f2937; }
.empty-desc { font-size: 13px; color: #6b7280; text-align: center; max-width: 400px; line-height: 1.6; }
.empty-cards { display: flex; gap: 16px; margin-top: 16px; }
.empty-card {
  width: 200px; padding: 16px; background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ec-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 8px; }
.ec-title { font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.ec-desc { font-size: 11px; color: #6b7280; line-height: 1.5; }

.chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.msg-item { display: flex; gap: 10px; max-width: 85%; }
.msg-item.user { align-self: flex-end; flex-direction: row-reverse; }
.msg-item.ai { align-self: flex-start; }
.msg-avatar {
  width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.msg-item.user .msg-avatar { background: #2563eb; }
.msg-item.ai .msg-avatar { background: #0a2480; }
.msg-content { min-width: 0; }
.msg-bubble {
  padding: 12px 16px; border-radius: 10px; font-size: 13px; line-height: 1.7;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.msg-item.user .msg-bubble { background: #2563eb; color: #fff; border-radius: 18px 18px 4px 18px; }
.msg-item.ai .msg-bubble { background: #fff; border: 1px solid #e4eaf3; border-radius: 4px 18px 18px 18px; }
.msg-text { white-space: pre-wrap; word-break: break-word; }

.ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ai-badge { font-size: 11px; background: #e8f0fe; color: #2563eb; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.msg-time { font-size: 11px; color: #9ca3af; }
.result-content { display: flex; flex-direction: column; gap: 12px; }
.result-title { font-size: 16px; font-weight: 600; color: #1f2937; }
.result-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.result-section { margin-top: 4px; }
.section-label { font-size: 13px; font-weight: 600; color: #2563eb; margin-bottom: 6px; padding-left: 8px; border-left: 3px solid #2563eb; }
.section-text { font-size: 13px; color: #374151; line-height: 1.8; }
.result-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.info-card { padding: 10px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }
.info-card .label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.result-list { font-size: 12px; color: #6b7280; line-height: 1.8; padding-left: 16px; margin: 0; }
.result-list li { list-style: disc; }
.amount-item { font-size: 12px; color: #374151; padding: 3px 0; }
.amount-highlight { color: #2563eb; font-weight: 600; }
.loading-indicator { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.loading-text { font-size: 13px; color: #6b7280; }
.dot-pulse {
  width: 8px; height: 8px; border-radius: 50%; background: #2563eb;
  animation: pulse 1.2s ease-in-out infinite;
}
.dot-pulse::before, .dot-pulse::after {
  content: ''; position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #2563eb;
  animation: pulse 1.2s ease-in-out infinite;
}
.dot-pulse::before { transform: translateX(-12px); animation-delay: -0.4s; }
.dot-pulse::after { transform: translateX(12px); animation-delay: 0.4s; }
@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
.disclaimer { font-size: 11px; color: #9ca3af; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; }

.chat-footer {
  padding: 12px 20px 16px; background: #fff; border-top: 1px solid #e4eaf3;
}
.question-hint { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.quick-btn { font-size: 12px; color: #2563eb; border: 1px solid #dbeafe; border-radius: 16px; padding: 4px 12px; }
.quick-btn:hover { background: #e8f0fe; border-color: #2563eb; }
.input-row { display: flex; gap: 10px; }
.qa-input { flex: 1; }
.qa-input :deep(.el-input__inner) { border-radius: 10px; }
.send-btn { border-radius: 10px; width: 44px; height: 44px; flex-shrink: 0; }
.send-btn :deep(.el-button__inner) { display: flex; align-items: center; justify-content: center; }
</style>