<template>
  <div class="policy-page">
    <div class="policy-sidebar">
      <div class="upload-section">
        <div class="section-title"><span class="title-bar"></span>政策问答</div>
        <div class="qa-intro">
          <p style="font-size:13px;color:#6b7280;line-height:1.6">基于已上传的政策文件或政策知识库，AI 智能解答您的政策相关问题。</p>
        </div>
        <div class="policy-source-select">
          <label class="input-label">问答来源</label>
          <el-radio-group v-model="qaSource" style="width:100%">
            <el-radio value="all" style="margin-bottom:6px">全部政策知识库</el-radio>
            <el-radio value="upload" style="margin-bottom:6px">仅已上传政策</el-radio>
            <el-radio value="selected">指定政策文件</el-radio>
          </el-radio-group>
        </div>
        <div v-if="qaSource==='selected'" class="file-select-list">
          <div v-for="f in policyFiles" :key="f.id" class="file-select-item" @click="toggleFileSelect(f.id)">
            <el-checkbox :checked="selectedFiles.includes(f.id)" />
            <span class="file-name">{{ f.name }}</span>
          </div>
        </div>
        <div style="margin-top:12px">
          <el-button type="primary" @click="clearQAChat" style="width:100%">
            <el-icon style="margin-right:4px"><Plus /></el-icon>新建问答
          </el-button>
        </div>
      </div>
      <div class="history-section">
        <div class="section-title"><span class="title-bar"></span>问答历史</div>
        <div v-if="qaHistory.length===0" class="empty-hint">暂无疑问记录</div>
        <div v-for="h in qaHistory" :key="h.id" class="history-item" @click="loadQaHistory(h)">
          <div class="history-name">{{ h.question }}</div>
          <div class="history-time">{{ h.time }}</div>
        </div>
      </div>
    </div>
    <div class="policy-main">
      <div v-if="qaMessages.length===0" class="qa-welcome">
        <TutuEmpty :welcome="welcomeText" :questions="recommendQuestions" :on-ask="askQuestion" />
      </div>
      <div v-else class="qa-chat-area">
        <div class="qa-messages" ref="qaMessagesRef">
          <div v-for="(m,idx) in qaMessages" :key="idx" class="qa-msg" :class="m.role==='user'?'qa-user':'qa-ai'">
            <div v-if="m.role==='ai'" class="qa-ai-head">
              <div class="qa-tutu-avatar">途</div>
              <span class="qa-ai-name">途途</span>
              <span class="qa-ai-label">政策问答</span>
            </div>
            <div class="qa-bubble">
              <div v-if="m.role==='ai' && m.references" class="qa-refs">
                <el-tag v-for="r in m.references" :key="r" size="small" style="margin-right:4px;margin-bottom:4px">{{ r }}</el-tag>
              </div>
              <div v-html="m.content"></div>
              <div v-if="m.role==='ai'" class="qa-source">📄 政策依据：{{ (m.references && m.references.length ? m.references.join('、') : '政策知识库') }} · 生成时间：{{ nowText() }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="qa-input-bar">
        <el-input v-model="qaInput" placeholder="输入您的政策问题..." :disabled="isAnswering" @keyup.enter="askQuestion(qaInput)" />
        <el-button type="primary" :loading="isAnswering" :disabled="!qaInput.trim()" @click="askQuestion(qaInput)">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import TutuEmpty from '@/components/TutuEmpty.vue'

const qaSource = ref('all')
const qaInput = ref('')
const isAnswering = ref(false)
const qaMessages = ref<{role:string;content:string;references?:string[]}[]>([])
const qaHistory = ref<{id:number;question:string;time:string}[]>([])
const selectedFiles = ref<number[]>([])
const qaMessagesRef = ref<HTMLDivElement>()
const policyFiles = ref([
  { id: 1, name: '就业促进法.pdf' },
  { id: 2, name: '失业保险条例.docx' },
  { id: 3, name: '社保补贴管理办法.pdf' }
])
const welcomeText = '我可以依据政策法规库，解答你关于人社政策的各类疑问。'
const recommendQuestions = [
  '灵活就业人员如何参加职工医保？',
  '失业保险金的领取条件是什么？',
  '申请工伤认定需要准备哪些材料？'
]

const mockQaHistory = [
  { id: 1, question: '灵活就业人员社保补贴如何申请？', time: '2026-08-25 10:30' },
  { id: 2, question: '失业保险金领取条件', time: '2026-08-24 15:20' }
]
qaHistory.value = mockQaHistory

const mockAnswers: Record<string, {content:string;refs:string[]}> = {
  '灵活就业人员社保补贴如何申请？': {
    content: '<p><strong>灵活就业人员社保补贴申请指南：</strong></p><ol><li><strong>申请条件</strong>：经认定的就业困难人员、离校2年内未就业高校毕业生，以灵活就业身份缴纳社会保险费。</li><li><strong>补贴标准</strong>：按个人实际缴纳社会保险费的<strong>2/3</strong>给予补贴，补贴期限最长不超过<strong>3年</strong>（距法定退休年龄不足5年可延长至退休）。</li><li><strong>申请材料</strong>：身份证明、就业失业登记证、社会保险缴费凭证、灵活就业证明。</li><li><strong>申请流程</strong>：向户籍所在地或常住地街道（乡镇）人社服务中心提交申请 → 街道初审（5个工作日）→ 区县人社部门审核（10个工作日）→ 公示无异议后拨付。</li><li><strong>申请渠道</strong>：线下窗口办理或登录"XX省人社网上服务平台"在线申请。</li></ol>',
    refs: ['就业促进法', '社保补贴管理办法']
  },
  '失业保险金领取条件是什么？': {
    content: '<p><strong>失业保险金领取条件：</strong></p><ol><li><strong>缴费条件</strong>：失业前用人单位和本人已缴纳失业保险费满<strong>1年</strong></li><li><strong>非自愿失业</strong>：非因本人意愿中断就业（如合同期满、被辞退、企业破产等）</li><li><strong>已办理失业登记</strong>：并已进行求职登记，有求职要求</li><li><strong>领取期限</strong>：缴费满1年不足5年，最长12个月；满5年不足10年，最长18个月；10年以上，最长24个月</li><li><strong>领取标准</strong>：不低于当地城市居民最低生活保障标准，不高于当地最低工资标准</li></ol>',
    refs: ['失业保险条例']
  },
  '灵活就业人员如何参加职工医保？': {
    content: '<p><strong>灵活就业人员参加职工医保指南：</strong></p><ol><li><strong>参保对象</strong>：无雇工的个体工商户、未在用人单位参加职工医保的非全日制从业人员及其他灵活就业人员。</li><li><strong>登记方式</strong>：本人持身份证/社保卡到户籍地或居住地医保经办机构办理参保登记，或在"XX省医保公共服务平台"线上申报。</li><li><strong>缴费方式</strong>：按当地设区市上年度全口径城镇单位就业人员平均工资的一定比例（通常<strong>8%~10%</strong>）按月或按年缴纳。</li><li><strong>待遇享受</strong>：缴费后按职工医保规定享受个人账户与住院、门诊统筹等待遇，连续缴费与待遇享受期按当地规定执行。</li><li><strong>咨询渠道</strong>：可拨打 <strong>12393</strong> 医保服务热线或当地经办窗口咨询。</li></ol>',
    refs: ['国家医保局政策文件', 'XX省医保局文件']
  },
  '申请工伤认定需要准备哪些材料？': {
    content: '<p><strong>申请工伤认定所需材料：</strong></p><ol><li><strong>工伤认定申请表</strong>：内容包括事故时间、地点、原因以及职工伤害程度等基本情况。</li><li><strong>劳动关系证明材料</strong>：劳动合同、工资支付凭证、考勤记录、工作证等能够证明劳动关系的材料。</li><li><strong>医疗诊断证明</strong>：医疗机构出具的受伤后诊断证明书或职业病诊断证明书。</li><li><strong>事故相关材料</strong>：事故现场照片、监控录像、目击证人证言、公安机关或安全生产监管部门出具的事故认定书（视情况）。</li><li><strong>申请时限</strong>：用人单位应在事故伤害发生之日起<strong>30日内</strong>提出申请；用人单位未申请的，职工或近亲属可在<strong>1年内</strong>自行申请。</li></ol>',
    refs: ['工伤保险条例']
  }
}

const toggleFileSelect = (id: number) => {
  const idx = selectedFiles.value.indexOf(id)
  if (idx > -1) selectedFiles.value.splice(idx, 1)
  else selectedFiles.value.push(id)
}

const askQuestion = (q: string) => {
  if (!q.trim() || isAnswering.value) return
  const question = q === qaInput.value ? qaInput.value : q
  if (qaInput.value && q === qaInput.value) qaInput.value = ''

  qaMessages.value.push({ role: 'user', content: question })
  isAnswering.value = true

  // Check if there's a known answer
  const knownAnswer = mockAnswers[question]
  if (knownAnswer) {
    setTimeout(() => {
      qaMessages.value.push({ role: 'ai', content: knownAnswer.content, references: knownAnswer.refs })
      isAnswering.value = false
      qaHistory.value.unshift({ id: Date.now(), question: question.substring(0, 20) + (question.length > 20 ? '...' : ''), time: new Date().toLocaleString() })
      scrollToBottom()
    }, 1200)
  } else {
    setTimeout(() => {
      qaMessages.value.push({
        role: 'ai',
        content: `<p>根据政策知识库分析，关于"${question}"的相关信息如下：</p><p>经查询相关政策文件，该问题涉及就业扶持政策范畴。建议您提供更具体的信息（如适用人群、政策类型等），以便获取更精准的解答。</p><p>您也可以拨打 <strong>12333</strong> 人社服务热线进行咨询。</p>`,
        references: ['政策知识库']
      })
      isAnswering.value = false
      scrollToBottom()
    }, 1000)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (qaMessagesRef.value) {
    qaMessagesRef.value.scrollTop = qaMessagesRef.value.scrollHeight
  }
}

const nowText = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const clearQAChat = () => { qaMessages.value = []; qaInput.value = '' }
const loadQaHistory = (h: any) => { /* 加载历史 */ }
</script>

<style scoped>
.policy-page { display:flex; height:100%; background:#f5f6fa; }
.policy-sidebar { width:340px; min-width:340px; background:#fff; border-right:1px solid #e5e7eb; display:flex; flex-direction:column; overflow-y:auto; padding:16px; }
.policy-main { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; }
.section-title { font-size:14px; font-weight:600; color:#1f2937; display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.title-bar { display:inline-block; width:3px; height:14px; background:#2563eb; border-radius:2px; }
.input-label { font-size:12px; color:#6b7280; margin-bottom:4px; display:block; font-weight:500; }
.policy-source-select { margin:12px 0; }
.file-select-list { max-height:140px; overflow-y:auto; margin-bottom:8px; }
.file-select-item { display:flex; align-items:center; gap:8px; padding:6px 8px; cursor:pointer; border-radius:4px; }
.file-select-item:hover { background:#f3f4f6; }
.file-name { font-size:12px; color:#374151; }
.history-section { margin-top:16px; flex:1; overflow-y:auto; }
.history-item { padding:8px 10px; border-radius:6px; cursor:pointer; margin-bottom:4px; }
.history-item:hover { background:#f3f4f6; }
.history-name { font-size:13px; color:#374151; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.history-time { font-size:11px; color:#9ca3af; margin-top:2px; }
.qa-welcome { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; min-height:400px; padding:24px; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-title { font-size:18px; font-weight:600; color:#374151; margin-bottom:8px; }
.empty-desc { font-size:13px; color:#9ca3af; margin-bottom:20px; }
.qa-suggestions { width:100%; max-width:600px; }
.suggest-title { font-size:14px; color:#6b7280; margin-bottom:12px; }
.suggest-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.suggest-item { padding:10px 14px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; font-size:12px; color:#374151; cursor:pointer; transition:all .2s; }
.suggest-item:hover { border-color:#2563eb; color:#2563eb; background:#f0f7ff; }
.qa-chat-area { flex:1; overflow-y:auto; margin-bottom:12px; }
.qa-messages { max-height:calc(100vh - 280px); overflow-y:auto; padding:16px; }
.qa-msg { display:flex; gap:10px; margin-bottom:16px; }
.qa-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
.qa-user { flex-direction:row-reverse; }
.qa-ai .qa-avatar { background:#dbeafe; }
.qa-user .qa-avatar { background:#2563eb; color:#fff; }
.qa-ai-head { display:flex; align-items:center; gap:8px; margin-top:4px; }
.qa-tutu-avatar { width:36px; height:36px; border-radius:50%; background:#2563eb; color:#fff; font-size:16px; font-weight:600; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.qa-ai-name { font-size:14px; font-weight:600; color:#111827; }
.qa-ai-label { font-size:12px; background:#eff6ff; color:#2563eb; border-radius:4px; padding:2px 8px; }
.qa-source { margin-top:10px; font-size:12px; color:#6b7280; border-top:1px dashed #e5e7eb; padding-top:8px; }
.qa-bubble { max-width:75%; padding:12px 16px; border-radius:10px; font-size:13px; line-height:1.7; }
.qa-ai .qa-bubble { background:#fff; border:1px solid #e5e7eb; }
.qa-user .qa-bubble { background:#2563eb; color:#fff; }
.qa-bubble ol { padding-left:20px; } .qa-bubble li { margin-bottom:4px; }
.qa-refs { margin-bottom:8px; display:flex; flex-wrap:wrap; }
.qa-input-bar { display:flex; gap:8px; padding:12px 16px; background:#fff; border-radius:10px; border:1px solid #e5e7eb; }
</style>