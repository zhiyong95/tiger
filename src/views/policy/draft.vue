<template>
  <div class="policy-draft">
    <!-- 左侧表单区 -->
    <div class="draft-left">
      <div class="left-header">
        <h3>政策编制配置</h3>
      </div>

      <div class="form-section">
        <div class="form-item">
          <label class="form-label">政策类型</label>
          <el-select v-model="policyType" class="full-width" placeholder="请选择政策类型">
            <el-option label="就业促进政策" value="就业促进政策" />
            <el-option label="社会保障政策" value="社会保障政策" />
            <el-option label="人才引进政策" value="人才引进政策" />
            <el-option label="创业扶持政策" value="创业扶持政策" />
            <el-option label="技能培训政策" value="技能培训政策" />
          </el-select>
        </div>

        <div class="form-item">
          <label class="form-label">政策标题</label>
          <el-input v-model="draftTitle" placeholder="请输入政策文件标题" />
        </div>

        <div class="form-item">
          <label class="form-label">参考依据</label>
          <el-input v-model="referenceBasis" type="textarea" :rows="2" placeholder="输入参考政策文件、法律法规等依据" />
        </div>

        <div class="form-item">
          <label class="form-label">起草单位</label>
          <el-input v-model="draftDept" placeholder="如：xx市人力资源保障局" />
        </div>

        <div class="form-item">
          <label class="form-label">编制要求</label>
          <el-checkbox-group v-model="draftRequirements" class="req-group">
            <el-checkbox label="结构规范" />
            <el-checkbox label="数据支撑" />
            <el-checkbox label="风险评估" />
            <el-checkbox label="公众意见" />
          </el-checkbox-group>
        </div>
      </div>

      <div class="action-section">
        <el-button type="primary" size="large" class="full-width gen-btn" :disabled="!draftTitle || isGenerating" @click="startDraft">
          <el-icon style="margin-right:6px"><MagicStick /></el-icon>AI辅助起草
        </el-button>
      </div>

      <div class="history-section">
        <div class="history-header">
          <span class="history-title">起草历史</span>
          <el-button text size="small" @click="draftHistory = []">清空</el-button>
        </div>
        <div class="history-list" v-if="draftHistory.length > 0">
          <div v-for="(item, idx) in draftHistory" :key="idx" class="history-item" @click="loadHistory(item)">
            <div class="history-name">{{ item.title || '未命名' }}</div>
            <div class="history-meta">{{ item.type }} · {{ item.time }}</div>
          </div>
        </div>
        <div v-else class="history-empty">暂无起草历史</div>
      </div>
    </div>

    <!-- 右侧对话区 -->
    <div class="draft-right" ref="chatRef">
      <div class="empty-state" v-if="messages.length === 0 && !isGenerating">
        <TutuEmpty :welcome="welcomeText" :questions="recommendQuestions" :on-ask="onAskRecommend" />
      </div>

      <div class="message-list" v-else ref="messageListRef">
        <div v-for="(msg, idx) in messages" :key="idx" class="msg-wrap">
          <!-- 用户消息 -->
          <div v-if="msg.role === 'user'" class="user-msg">
            <div class="user-bubble">{{ msg.content }}</div>
          </div>
          <!-- AI消息 -->
          <div v-else class="ai-msg">
            <div class="ai-bubble">
              <div class="ai-header">
                <span class="ai-label">途途 · 政策编制</span>
                <span class="msg-time">{{ msg.time }}</span>
              </div>
              <div class="ai-content" v-html="msg.content"></div>
              <div class="ai-source">📄 参考依据：上位政策法规库 / 公文范本库 · 生成时间：{{ getNow() }}</div>
              <div class="disclaimer">AI生成内容仅供参考，请结合实际情况审核使用</div>
              <div class="ai-actions" v-if="msg.draftResult">
                <el-button size="small" @click="exportDraft(msg.draftResult, 'word')">导出 Word</el-button>
                <el-button size="small" @click="exportDraft(msg.draftResult, 'pdf')">导出 PDF</el-button>
                <el-button size="small" text @click="regenerateDraft(msg)">重新生成</el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 加载状态 -->
        <div class="ai-msg" v-if="isGenerating">
          <div class="ai-bubble">
            <div class="ai-loading">
              <span class="dot-pulse"></span>
              <span class="loading-text">正在起草政策文件…</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="bottom-input" v-if="messages.length > 0">
        <div class="input-wrapper">
          <el-input
            v-model="followUpInput"
            type="textarea"
            :rows="2"
            placeholder="输入对政策文件的调整要求，如'第三条扶持措施补充公益性岗位安置细则'"
            :disabled="isGenerating"
            @keyup.enter="sendFollowUp"
          />
          <el-button type="primary" :disabled="!followUpInput || isGenerating" @click="sendFollowUp" class="send-btn">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
        <div class="quick-questions" v-if="messages.length > 0">
          <el-button v-for="q in quickQuestions" :key="q" text size="small" @click="sendQuickQuestion(q)" class="quick-btn">{{ q }}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, EditPen, Document, DataAnalysis, Promotion } from '@element-plus/icons-vue'
import TutuEmpty from '@/components/TutuEmpty.vue'

const welcomeText = '我可以依据上位政策与公文规范，帮你起草政策文稿初稿。'
const recommendQuestions = ['起草灵活就业人员参加职工养老保险实施办法', '撰写稳岗补贴经办服务通知初稿', '生成年度政策落实工作方案框架']

function onAskRecommend(q: string) {
  if (messages.value.length > 0 || isGenerating.value) return
  const map: Record<string, { type: string; title: string; dept: string; basis: string; requirements: string[] }> = {
    '起草灵活就业人员参加职工养老保险实施办法': {
      type: '社会保障政策', title: '灵活就业人员参加职工养老保险实施办法', dept: 'xx市人力资源和社会保障局',
      basis: '《社会保险法》《关于灵活就业人员参加企业职工基本养老保险有关问题的通知》', requirements: ['结构规范', '数据支撑', '风险评估']
    },
    '撰写稳岗补贴经办服务通知初稿': {
      type: '就业促进政策', title: '关于开展稳岗补贴经办服务的通知（初稿）', dept: 'xx市人力资源和社会保障局',
      basis: '《失业保险条例》及稳岗返还相关文件精神', requirements: ['结构规范', '公众意见']
    },
    '生成年度政策落实工作方案框架': {
      type: '就业促进政策', title: '20XX年度人社惠民政策落实工作方案（框架）', dept: 'xx市人力资源和社会保障局',
      basis: '年度人社重点工作部署', requirements: ['结构规范', '风险评估', '公众意见']
    }
  }
  const c = map[q]
  if (c) {
    policyType.value = c.type
    draftTitle.value = c.title
    draftDept.value = c.dept
    referenceBasis.value = c.basis
    draftRequirements.value = c.requirements
    startDraft()
  }
}

const getNow = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

interface DraftResult {
  title: string
  type: string
  content: string
  sections: Array<{ heading: string; body: string }>
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  time: string
  draftResult?: DraftResult
  config?: { type: string; title: string; basis: string; dept: string; requirements: string[] }
}

interface HistoryItem {
  title: string
  type: string
  time: string
  message: ChatMessage
}

const chatRef = ref<HTMLElement>()
const messageListRef = ref<HTMLElement>()

const policyType = ref('就业促进政策')
const draftTitle = ref('')
const referenceBasis = ref('')
const draftDept = ref('')
const draftRequirements = ref<string[]>([])

const isGenerating = ref(false)
const messages = ref<ChatMessage[]>([])
const followUpInput = ref('')
const draftHistory = ref<HistoryItem[]>([])

const quickQuestions = ['补充扶持措施', '细化申请条件', '完善监督条款', '更新参考依据']

const getTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const generateDraftContent = (config: { type: string; title: string; basis: string; dept: string; requirements: string[] }): DraftResult => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  const hasRisk = config.requirements.includes('风险评估')
  const hasData = config.requirements.includes('数据支撑')
  const hasPublic = config.requirements.includes('公众意见')
  const hasStructure = config.requirements.includes('结构规范')

  const sections: Array<{ heading: string; body: string }> = []

  sections.push({
    heading: `${config.title}`,
    body: `${config.dept || 'xx市人力资源和社会保障局'}\n${dateStr}`
  })

  sections.push({
    heading: '第一条 目的与依据',
    body: `为深入贯彻落实国家和自治区关于${config.type}的决策部署，进一步做好${config.title}工作，切实保障和改善民生，促进社会和谐稳定，根据《中华人民共和国就业促进法》《社会保险法》及相关政策文件${config.basis ? `，结合《${config.basis}》` : ''}有关规定，结合我市实际，制定本办法。`
  })

  sections.push({
    heading: '第二条 适用范围',
    body: `本办法适用于本市行政区域内符合下列条件之一的单位和个人：\n\n（一）本市户籍的城镇登记失业人员、就业困难人员、离校未就业高校毕业生等${config.type}重点群体；\n\n（二）按规定参加本市社会保险并履行缴费义务的用人单位；\n\n（三）在本市行政区域内开展${config.type}相关工作的各类服务机构。\n\n法律法规另有规定的，从其规定。`
  })

  sections.push({
    heading: '第三条 扶持措施',
    body: `（一）资金支持。对符合条件的对象，按规定给予社会保险补贴、岗位补贴、创业担保贷款贴息等${hasData ? '，具体标准为：社会保险补贴按实际缴费额的50%给予补贴，创业担保贷款最高额度为30万元，期限不超过3年' : ''}。\n\n（二）服务保障。各级公共就业服务机构应当为服务对象提供政策咨询、职业介绍、技能培训、创业指导等一站式服务。\n\n（三）岗位开发。鼓励用人单位开发公益性岗位，优先安置就业困难人员，按规定落实岗位补贴和社保补贴。`
  })

  sections.push({
    heading: '第四条 申请程序',
    body: `（一）申请。符合条件的单位或个人向所在地街道（乡镇）公共就业服务平台提交申请材料。\n\n（二）审核。街道（乡镇）公共就业服务平台在收到申请后5个工作日内完成初审，报区（县）人社部门审核。\n\n（三）公示。审核通过后在所在社区公示7个工作日，接受社会监督。\n\n（四）拨付。公示无异议的，按规定程序拨付资金。`
  })

  sections.push({
    heading: '第五条 监督与管理',
    body: `（一）各级人社部门应建立健全监督管理制度，定期对${config.type}政策落实情况进行检查评估。\n\n（二）对虚报、冒领、骗取补贴资金的单位和个人，依法追回已拨付资金，并纳入失信记录；情节严重的，依法追究法律责任。\n\n（三）各级财政部门应加强资金监管，确保专款专用。`
  })

  if (hasRisk) {
    sections.push({
      heading: '风险评估',
      body: `经评估，本政策实施可能面临以下风险：\n\n（一）资金风险。政策实施需要财政资金保障，建议建立专项资金预算管理机制，确保资金及时足额到位。\n\n（二）执行风险。基层经办能力可能存在不足，建议加强业务培训，优化经办流程，提高服务效率。\n\n（三）社会风险。政策覆盖面广、涉及群体多，建议建立舆情监测和应急处置机制，及时回应社会关切。`
    })
  }

  if (hasPublic) {
    sections.push({
      heading: '公众意见',
      body: `在政策制定过程中，通过政府网站、政务新媒体等渠道公开征求意见，共收到公众反馈意见${Math.floor(Math.random() * 50) + 20}条，采纳合理性建议${Math.floor(Math.random() * 10) + 5}条。主要涉及：\n\n（一）关于简化申请材料的建议，已采纳并在第四条中明确"容缺受理"机制。\n\n（二）关于提高补贴标准的建议，将根据财政承受能力适时调整。\n\n（三）关于扩大覆盖范围的建议，已在第二条中适当放宽适用范围。`
    })
  }

  sections.push({
    heading: '第六条 附则',
    body: `（一）本办法由${config.dept || 'xx市人力资源和社会保障局'}负责解释。\n\n（二）本办法自发布之日起施行，有效期5年。\n\n（三）此前有关规定与本办法不一致的，以本办法为准。`
  })

  const content = sections.map(s => {
    if (s.heading === `${config.title}`) {
      return s.body
    }
    return `\n\n**${s.heading}**\n\n${s.body}`
  }).join('')

  return {
    title: config.title,
    type: config.type,
    content,
    sections
  }
}

const formatContent = (sections: Array<{ heading: string; body: string }>) => {
  return sections.map(s => {
    if (s.heading === sections[0].heading) {
      return `<div class="doc-title">${s.body.replace(/\n/g, '<br>')}</div>`
    }
    const bodyHtml = s.body
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/（/g, '<br>（')
    return `<div class="doc-section"><h4>${s.heading}</h4><p>${bodyHtml}</p></div>`
  }).join('')
}

const startDraft = async () => {
  if (!draftTitle.value) {
    ElMessage.warning('请输入政策标题')
    return
  }

  const config = {
    type: policyType.value,
    title: draftTitle.value,
    basis: referenceBasis.value,
    dept: draftDept.value,
    requirements: draftRequirements.value
  }

  const reqText = config.requirements.length > 0 ? config.requirements.join('、') : ''
  let userMsg = `请起草一份${config.type}政策文件。`
  userMsg += `政策标题:${config.title};`
  if (config.basis) userMsg += `参考依据:${config.basis};`
  if (config.dept) userMsg += `起草单位:${config.dept};`
  if (reqText) userMsg += `编制要求:${reqText}。`

  messages.value.push({ role: 'user', content: userMsg, time: getTime() })
  followUpInput.value = ''
  isGenerating.value = true
  await scrollToBottom()

  setTimeout(async () => {
    const result = generateDraftContent(config)
    const html = formatContent(result.sections)
    const aiMsg: ChatMessage = {
      role: 'ai',
      content: html,
      time: getTime(),
      draftResult: result,
      config
    }
    messages.value.push(aiMsg)
    isGenerating.value = false

    draftHistory.value.unshift({
      title: config.title,
      type: config.type,
      time: getTime(),
      message: { ...aiMsg }
    })

    await scrollToBottom()
  }, 1500)
}

const sendFollowUp = async () => {
  const q = followUpInput.value.trim()
  if (!q) return
  messages.value.push({ role: 'user', content: q, time: getTime() })
  followUpInput.value = ''
  isGenerating.value = true
  await scrollToBottom()

  const lastMsg = [...messages.value].reverse().find(m => m.role === 'ai' && m.draftResult)
  setTimeout(async () => {
    if (lastMsg?.draftResult) {
      const result = { ...lastMsg.draftResult }
      const adjustedSections = result.sections.map(s => {
        if (q.includes('补充') || q.includes('增加') || q.includes('添加')) {
          return { ...s, body: s.body + `\n\n（根据调整要求"${q}"补充完善）` }
        }
        if (q.includes('精简') || q.includes('压缩') || q.includes('缩短')) {
          return { ...s, body: s.body.length > 100 ? s.body.substring(0, s.body.length - 50) + '…（内容已精简）' : s.body }
        }
        return s
      })
      result.sections = adjustedSections
      result.content = adjustedSections.map(s => s.body).join('\n\n')

      const html = formatContent(adjustedSections)
      const aiMsg: ChatMessage = {
        role: 'ai',
        content: `<div class="adjust-badge">AI 已根据要求调整</div>${html}`,
        time: getTime(),
        draftResult: result,
        config: lastMsg.config
      }
      messages.value.push(aiMsg)
    } else {
      const result = generateDraftContent({
        type: policyType.value,
        title: draftTitle.value || '政策文件',
        basis: referenceBasis.value,
        dept: draftDept.value,
        requirements: draftRequirements.value
      })
      const html = formatContent(result.sections)
      messages.value.push({ role: 'ai', content: html, time: getTime(), draftResult: result })
    }
    isGenerating.value = false
    await scrollToBottom()
  }, 1000)
}

const sendQuickQuestion = (q: string) => {
  followUpInput.value = q
  sendFollowUp()
}

const exportDraft = (result: DraftResult, format: 'word' | 'pdf') => {
  const text = result.sections.map(s => {
    if (s.heading === result.sections[0].heading) {
      return s.body
    }
    return `\n\n${s.heading}\n${s.body}`
  }).join('')

  const fullText = `${text}\n\n— AI生成内容仅供参考，请结合实际情况审核使用 —`
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${result.title}.${format === 'word' ? 'doc' : 'pdf'}`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success(`已导出${format === 'word' ? 'Word' : 'PDF'}文件`)
}

const regenerateDraft = (msg: ChatMessage) => {
  if (msg.config) {
    policyType.value = msg.config.type
    draftTitle.value = msg.config.title
    referenceBasis.value = msg.config.basis
    draftDept.value = msg.config.dept
    draftRequirements.value = msg.config.requirements
    startDraft()
  }
}

const loadHistory = (item: HistoryItem) => {
  messages.value.push(item.message)
  scrollToBottom()
}
</script>

<style scoped>
.policy-draft {
  display: flex;
  height: 100%;
  gap: 0;
}

/* 左侧表单 */
.draft-left {
  width: 380px;
  min-width: 380px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.left-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.left-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.form-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.full-width {
  width: 100%;
}
.req-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-section {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}
.gen-btn {
  height: 44px;
  font-size: 15px;
  background: #2563eb;
  border-color: #2563eb;
}

.history-section {
  padding: 16px 20px;
  flex: 1;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.history-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.history-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
}
.history-item:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.history-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}
.history-meta {
  font-size: 12px;
  color: #9ca3af;
}
.history-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 20px 0;
}

/* 右侧对话区 */
.draft-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
}
.empty-desc {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  max-width: 360px;
  margin: 0 0 24px;
}
.feature-cards {
  display: flex;
  gap: 16px;
}
.feature-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #374151;
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.msg-wrap {
  display: flex;
  flex-direction: column;
}

.user-msg {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}
.user-bubble {
  max-width: 75%;
  padding: 10px 16px;
  background: #2563eb;
  color: #fff;
  border-radius: 12px 12px 4px 12px;
  font-size: 14px;
  line-height: 1.6;
}

.ai-msg {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 4px;
}
.ai-bubble {
  max-width: 85%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px 12px 12px 4px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ai-label {
  font-size: 12px;
  font-weight: 500;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}
.msg-time {
  font-size: 11px;
  color: #9ca3af;
}
.ai-source {
  font-size: 12px;
  color: #6b7280;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
  line-height: 1.6;
}
.ai-content {
  font-size: 14px;
  line-height: 1.8;
  color: #1f2937;
}
.ai-content :deep(.doc-title) {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
  line-height: 1.6;
}
.ai-content :deep(.doc-section) {
  margin-bottom: 16px;
}
.ai-content :deep(.doc-section h4) {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
  padding: 0;
}
.ai-content :deep(.doc-section p) {
  margin: 0;
  text-indent: 2em;
}
.ai-content :deep(.adjust-badge) {
  display: inline-block;
  padding: 4px 12px;
  background: #fef3c7;
  color: #d97706;
  font-size: 12px;
  border-radius: 4px;
  margin-bottom: 12px;
}
.disclaimer {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 12px;
  color: #dc2626;
  text-align: center;
}
.ai-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.loading-text {
  font-size: 14px;
  color: #6b7280;
}
.dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 底部输入区 */
.bottom-input {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}
.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.input-wrapper .el-textarea {
  flex: 1;
}
.send-btn {
  height: 36px;
  width: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  border-color: #2563eb;
}
.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.quick-btn {
  font-size: 12px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 14px;
  padding: 4px 12px;
}
</style>