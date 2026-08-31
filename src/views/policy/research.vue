<template>
  <div class="policy-page">
    <!-- 左侧：上传 + 配置 + 历史 -->
    <div class="policy-sidebar">
      <!-- 上传区域 -->
      <div class="upload-section">
        <div class="section-title"><span class="title-bar"></span>政策上传</div>

        <!-- URL 上传 -->
        <label class="input-label">政策链接</label>
        <el-input v-model="urlText" placeholder="输入政策 URL 链接" clearable class="url-input" @keyup.enter="addUrl" />

        <!-- 分割线 -->
        <div class="divider-text"><span>或</span></div>

        <!-- 文件上传 -->
        <div class="drop-zone" @click="triggerFileInput" @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false" @drop.prevent="onDrop" :class="{ 'drop-zone-active': isDragOver }">
          <div class="drop-icon">📄</div>
          <div class="drop-text">点击选择文件，或拖拽文件到此区域</div>
          <div class="drop-hint">支持 PDF、Word、TXT 格式</div>
          <input ref="fileInputRef" type="file" accept=".pdf,.doc,.docx,.txt" style="display:none" @change="onFileSelected" />
        </div>

        <!-- 当前文件 -->
        <div v-if="currentFile" class="current-file">
          <div class="current-file-info">
            <span class="item-icon">📄</span>
            <span class="item-name">{{ currentFile.name }}</span>
            <el-tag :type="currentFile.status === 'ready' ? 'success' : 'warning'" size="small" class="item-format-tag">{{ currentFile.status === 'ready' ? '就绪' : '上传中' }}</el-tag>
            <el-button text size="small" type="danger" @click="removeFile" class="item-delete">删除</el-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button type="primary" class="analyze-btn" :disabled="!currentFile || analyzing" @click="startAnalysis" :loading="analyzing">
          {{ analyzing ? 'AI 解读中...' : '开始 AI 解读' }}
        </el-button>
        <div v-if="!currentFile" class="btn-hint">请先上传政策文件或输入链接</div>
      </div>

      <!-- 历史记录 -->
      <div class="history-section">
        <div class="history-header">
          <span class="history-title">📋 解读历史</span>
          <el-button text size="small" @click="historyList.length = 0">清空</el-button>
        </div>
        <div class="history-list" v-if="historyList.length > 0">
          <div v-for="(item, idx) in historyList" :key="idx" class="history-card" :class="{ 'history-active': activeHistoryIdx === idx }" @click="loadHistory(idx)">
            <div class="history-card-top">
              <span class="history-time">{{ item.time }}</span>
            </div>
            <div class="history-title-text">{{ item.title || item.name }}</div>
            <div class="history-count-text">{{ item.count }} 份政策</div>
          </div>
        </div>
        <div v-else class="history-empty">暂无解读记录</div>
      </div>
    </div>

    <!-- 右侧主区域 -->
    <div class="policy-main">
      <!-- 空状态 -->
      <div v-if="pageState === 'empty'" class="state-empty">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">政策智能研判</div>
        <div class="empty-desc">上传政策文件或输入链接，开始 AI 深度解读</div>
      </div>

      <!-- 分析中 -->
      <div v-if="pageState === 'analyzing'" class="state-analyzing">
        <div class="loading-ring"><div class="loading-spinner"></div><div class="loading-brain">🧠</div></div>
        <div class="analyzing-text">AI 正在深度解读政策文件</div>
        <div class="analyzing-hint">正在提取政策要点、分析核心内容...</div>
      </div>

      <!-- 解读结果 -->
      <div v-if="pageState === 'result'" class="result-container">
        <!-- 标题卡片 -->
        <div class="result-title-card">
          <div class="title-left">
            <div class="result-title-text">{{ singleResult.title }}</div>
            <div class="result-tags">
              <el-tag :type="singleResult.level === '国家级' ? 'danger' : singleResult.level === '省级' ? 'warning' : 'info'" size="small" class="result-tag">{{ singleResult.level }}</el-tag>
              <el-tag v-for="t in singleResult.tags" :key="t" size="small" class="result-tag">{{ t }}</el-tag>
            </div>
          </div>
          <el-button class="export-btn" @click="handleExport">📥 导出报告</el-button>
        </div>

        <!-- 信息网格 -->
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-header" style="background: linear-gradient(135deg,#eef2ff,#e0e7ff);"><span class="info-card-icon">👥</span><span class="info-card-title">适用对象</span></div>
            <div class="info-card-body"><div v-for="o in singleResult.targetObjects" :key="o" class="info-tag-wrapper"><el-tag size="small" class="info-tag">{{ o }}</el-tag></div></div>
          </div>
          <div class="info-card">
            <div class="info-card-header" style="background: linear-gradient(135deg,#fef3c7,#fde68a);"><span class="info-card-icon">📋</span><span class="info-card-title">核心条件</span></div>
            <div class="info-card-body"><ul class="info-list"><li v-for="c in singleResult.coreConditions" :key="c">{{ c }}</li></ul></div>
          </div>
          <div class="info-card">
            <div class="info-card-header" style="background: linear-gradient(135deg,#d1fae5,#a7f3d0);"><span class="info-card-icon">💰</span><span class="info-card-title">补贴标准</span></div>
            <div class="info-card-body"><div v-for="a in singleResult.subsidyAmounts" :key="a" class="amount-item" v-html="highlightAmount(a)"></div></div>
          </div>
          <div class="info-card">
            <div class="info-card-header" style="background: linear-gradient(135deg,#fce7f3,#fbcfe8);"><span class="info-card-icon">🔄</span><span class="info-card-title">办理流程</span></div>
            <div class="info-card-body"><ul class="info-list"><li v-for="s in processSteps" :key="s.name"><strong>{{ s.name }}</strong>：{{ s.desc }}</li></ul></div>
          </div>
        </div>

        <!-- 政策背景 -->
        <div class="process-card">
          <div class="info-card-header" style="padding: 0 0 12px 0;"><span class="info-card-icon">📖</span><span class="info-card-title">政策背景与目的</span></div>
          <p class="info-paragraph">{{ singleResult.background }}</p>
        </div>

        <!-- 政策问答 -->
        <div class="qa-section">
          <div class="qa-header"><span class="info-card-icon">💬</span><span class="info-card-title">政策问答</span><el-button text size="small" @click="clearQA" style="margin-left:auto;">清空对话</el-button></div>
          <div class="qa-body" ref="qaBodyRef">
            <div v-for="(qa, qi) in qaMessages" :key="qi" class="qa-msg" :class="qa.role === 'user' ? 'qa-user' : 'qa-ai'">
              <div class="qa-avatar">{{ qa.role === 'user' ? '🧑' : '🤖' }}</div>
              <div class="qa-content"><div class="qa-bubble">{{ qa.content }}</div><div v-if="qa.extra" class="qa-extra"><div v-for="(e, ei) in qa.extra" :key="ei" class="qa-extra-item">{{ e }}</div></div></div>
            </div>
            <div ref="qaBottomRef"></div>
          </div>
          <div class="qa-input-row">
            <el-input v-model="qaInput" placeholder="输入政策相关问题..." @keyup.enter="sendQA" size="small" class="qa-input" />
            <el-button type="primary" size="small" @click="sendQA" style="flex-shrink:0;">发送</el-button>
          </div>
          <div class="qa-quick" v-if="qaMessages.length === 0">
            <span class="quick-label">常见问题：</span>
            <el-button v-for="qq in getQuickQuestions()" :key="qq" text size="small" @click="sendQuestion(qq)" class="quick-btn">{{ qq }}</el-button>
          </div>
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
interface QAMessage { role: 'user' | 'ai'; content: string; extra?: string[] }
interface HistoryItem { name: string; title: string; time: string; count: number; resultKey: number }

const analyzeResult = ref<PolicyResult | null>(null)
const urlText = ref('')
const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const analyzing = ref(false)
const pageState = ref<'empty' | 'analyzing' | 'result'>('empty')
const currentFile = ref<{ name: string; status: 'uploading' | 'ready' } | null>(null)
const activeHistoryIdx = ref(0)
const historyList = ref<HistoryItem[]>([])

const processSteps = [
  { name: '申请', desc: '申请人向当地人社部门或经办机构提交申请材料' },
  { name: '审核', desc: '人社部门对申请材料进行审核，核实资格条件' },
  { name: '公示', desc: '审核通过后进行公示，接受社会监督（5个工作日）' },
  { name: '拨付', desc: '公示无异议后，按规定拨付补贴资金' },
]

const allResults: PolicyResult[] = [
  {
    title: '高校毕业生就业补贴政策解读', level: '国家级', tags: ['就业补贴', '高校毕业生'],
    background: '为贯彻落实党中央、国务院关于稳就业工作的决策部署，充分发挥就业补贴政策在促进高校毕业生就业创业中的引导作用，根据《国务院办公厅关于进一步做好高校毕业生等青年就业创业工作的通知》等文件精神，制定本政策解读。',
    targetObjects: ['毕业年度高校毕业生', '离校2年内未就业高校毕业生', '16-24岁登记失业青年'],
    coreConditions: ['签订1年以上劳动合同并缴纳社会保险', '从事灵活就业并办理就业登记', '参加就业见习并签订见习协议'],
    subsidyAmounts: ['一次性吸纳就业补贴：<span class="amount-highlight">3,000元/人</span>', '社会保险补贴：最长不超过<span class="amount-highlight">2年</span>', '就业见习补贴：<span class="amount-highlight">1,500元/月</span>'],
  },
  {
    title: '稳岗返还补贴政策解读', level: '国家级', tags: ['稳岗返还', '企业补贴'],
    background: '为支持企业稳定就业岗位，充分发挥失业保险稳岗返还政策在支持企业稳岗扩岗中的积极作用，根据《人力资源社会保障部 财政部 国家税务总局关于做好失业保险稳岗位提技能防失业工作的通知》等文件精神，制定本政策解读。',
    targetObjects: ['依法参加失业保险并足额缴纳失业保险费的企业', '上年度未裁员或裁员率低于控制目标的企业'],
    coreConditions: ['依法参加失业保险并足额缴纳失业保险费12个月以上', '上年度未裁员或裁员率不高于5.5%', '生产经营活动符合国家及所在区域产业结构调整和环保政策'],
    subsidyAmounts: ['大型企业返还比例：不超过企业及其职工上年度实际缴纳失业保险费的<span class="amount-highlight">30%</span>', '中小微企业返还比例：不超过企业及其职工上年度实际缴纳失业保险费的<span class="amount-highlight">60%</span>'],
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
    background: '为加大创业担保贷款贴息支持力度，支持重点群体创业就业，根据《国务院办公厅关于进一步支持大学生创新创业的指导意见》和《财政部 人力资源社会保障部 中国人民银行关于进一步加大创业担保贷款贴息力度全力支持重点群体创业就业的通知》等文件精神，制定本政策解读。',
    targetObjects: ['城镇登记失业人员', '就业困难人员（含残疾人）', '复员转业退役军人', '高校毕业生', '返乡创业农民工', '网络商户'],
    coreConditions: ['具有完全民事行为能力', '信用记录良好', '有具体创业项目和经营场所', '按规定办理工商登记注册'],
    subsidyAmounts: ['个人创业担保贷款额度：最高<span class="amount-highlight">30万元</span>', '小微企业创业担保贷款额度：最高<span class="amount-highlight">400万元</span>', '贴息比例：LPR-150BP以下部分由借款人承担，剩余部分财政贴息'],
  },
  {
    title: '职业技能培训补贴政策解读', level: '国家级', tags: ['技能培训', '职业提升'],
    background: '为提升劳动者职业技能水平和就业创业能力，建设知识型、技能型、创新型劳动者大军，根据《国务院办公厅关于印发职业技能提升行动方案（2019—2021年）的通知》等文件精神，结合国家职业资格制度改革要求，制定本政策解读。',
    targetObjects: ['企业职工（含劳务派遣人员）', '高校毕业生', '农村转移就业劳动者', '城乡未继续升学的初高中毕业生', '失业人员', '退役军人'],
    coreConditions: ['参加培训并取得相应证书（职业资格证书、职业技能等级证书等）', '企业职工需累计缴纳失业保险12个月以上', '同一职业（工种）同一等级不得重复享受'],
    subsidyAmounts: ['初级工：<span class="amount-highlight">1,000元/人</span>', '中级工：<span class="amount-highlight">1,500元/人</span>', '高级工：<span class="amount-highlight">2,000元/人</span>', '技师：<span class="amount-highlight">3,500元/人</span>', '高级技师：<span class="amount-highlight">5,000元/人</span>'],
  },
]

const singleResult = ref<PolicyResult>(allResults[0])
const selectedRecommendTags = ref<string[]>([])

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
  if (!url) return
  const name = url.length > 30 ? url.slice(0, 30) + '...' : url
  currentFile.value = { name, status: 'ready' }
  ElMessage.success('已添加政策链接')
}

const removeFile = () => {
  currentFile.value = null
  urlText.value = ''
}

const startAnalysis = () => {
  if (!currentFile.value) { ElMessage.warning('请先上传政策文件或输入链接'); return }
  analyzing.value = true
  pageState.value = 'analyzing'
  setTimeout(() => {
    analyzing.value = false
    const randomIdx = Math.floor(Math.random() * allResults.length)
    singleResult.value = allResults[randomIdx]
    selectedRecommendTags.value = []
    pageState.value = 'result'
    historyList.value.unshift({
      name: currentFile.value?.name || '未命名',
      title: singleResult.value.title,
      time: new Date().toISOString().slice(0, 10),
      count: 1,
      resultKey: randomIdx,
    })
    if (historyList.value.length > 10) historyList.value.pop()
    activeHistoryIdx.value = 0
    ElMessage.success('AI 解读完成')
  }, 2500)
}

const loadHistory = (idx: number) => {
  activeHistoryIdx.value = idx
  const item = historyList.value[idx]
  singleResult.value = allResults[item.resultKey % allResults.length]
  selectedRecommendTags.value = []
  pageState.value = 'result'
}

const handleExport = () => { ElMessage.success('报告导出中，请稍候...') }

const highlightAmount = (text: string) => {
  return text.replace(/([\d,]+(?:\.\d+)?)(?=\s*元)/g, '<span class="amount-highlight">$1</span>')
    .replace(/(\d+(?:\.\d+)?)%/g, '<span class="amount-highlight">$1%</span>')
}

const qaInput = ref('')
const qaMessages = reactive<QAMessage[]>([])
const qaBodyRef = ref<HTMLDivElement>()
const qaBottomRef = ref<HTMLDivElement>()

const scrollQAToBottom = async () => {
  await nextTick()
  if (qaBottomRef.value) qaBottomRef.value.scrollIntoView({ behavior: 'smooth' })
}

const getQuickQuestions = () => {
  const title = singleResult.value.title
  if (title.includes('高校毕业生')) return ['哪些高校毕业生可以申请补贴？', '具体补贴标准是多少？', '如何办理申请手续？', '申请需要准备哪些材料？']
  if (title.includes('补贴') || title.includes('返还')) return ['哪些企业可以申请稳岗返还？', '返还比例如何计算？', '资金用途有哪些限制？', '申请流程需要多长时间？']
  if (title.includes('困难')) return ['哪些人员属于就业困难群体？', '可以享受哪些援助政策？', '如何申请认定就业困难人员？', '援助政策的有效期是多久？']
  if (title.includes('创业')) return ['贷款额度最高多少？', '贴息比例是多少？', '需要提供什么担保？', '还款期限有何规定？']
  if (title.includes('培训') || title.includes('技能')) return ['哪些培训可以申请补贴？', '补贴标准是多少？', '如何报名参加培训？', '证书有何要求？']
  return ['该政策的适用对象有哪些？', '具体申请条件是什么？', '补贴标准和周期是多少？', '办理流程和时限是？']
}

const getAIAnswer = (question: string): QAMessage => {
  const q = question.toLowerCase()
  const data = singleResult.value
  if (q.includes('对象') || q.includes('人群') || q.includes('谁') || q.includes('哪些人'))
    return { role: 'ai', content: `根据研读 "${data.title}" 政策内容，该政策的适用对象包括：`, extra: data.targetObjects.map(o => `✅ ${o}`) }
  if (q.includes('条件') || q.includes('申请') || q.includes('资格') || q.includes('要求'))
    return { role: 'ai', content: '根据政策规定，申请需满足以下核心条件：', extra: data.coreConditions.map(c => `📌 ${c}`) }
  if (q.includes('补贴') || q.includes('标准') || q.includes('金额') || q.includes('多少') || q.includes('钱'))
    return { role: 'ai', content: '该政策涉及的补贴/资金标准如下：', extra: data.subsidyAmounts.map(a => `💰 ${a.replace(/<[^>]*>/g, '')}`) }
  if (q.includes('流程') || q.includes('手续') || q.includes('办理') || q.includes('步骤'))
    return { role: 'ai', content: `${data.title} 的办理流程如下：`, extra: processSteps.map((s, i) => `第${i + 1}步：${s.name} — ${s.desc}`) }
  if (q.includes('材料') || q.includes('证件') || q.includes('文件') || q.includes('资料'))
    return { role: 'ai', content: '办理该政策通常需要准备以下材料：', extra: ['📄 身份证原件及复印件', '📄 相关资格证明文件', '📄 申请表', '📄 单位/个人银行账户信息', '📄 其他佐证材料'] }
  if (q.includes('时间') || q.includes('期限') || q.includes('多久') || q.includes('有效期'))
    return { role: 'ai', content: '根据政策规定，办理时限和有效期说明如下：', extra: ['⏱ 审核时限：5-15个工作日', '⏱ 公示期：5个工作日', '⏱ 资金拨付：公示无异议后10个工作日内', '⏱ 政策有效期：一般至2028年12月31日'] }
  if (q.includes('背景') || q.includes('目的') || q.includes('依据') || q.includes('原因'))
    return { role: 'ai', content: data.background }
  return { role: 'ai', content: `根据对 "${data.title}" 的政策研判，以下是为您梳理的相关信息：`, extra: [`📌 适用对象：${data.targetObjects.join('、')}`, `📌 核心条件：${data.coreConditions.slice(0, 3).join('；')}`, `📌 补贴标准：${data.subsidyAmounts.slice(0, 3).map(a => a.replace(/<[^>]*>/g, '')).join('；')}`] }
}

const sendQuestion = (question: string) => { qaInput.value = question; sendQA() }
const sendQA = () => {
  const text = qaInput.value.trim()
  if (!text) return
  qaMessages.push({ role: 'user', content: text })
  qaInput.value = ''
  scrollQAToBottom()
  setTimeout(() => { qaMessages.push(getAIAnswer(text)); scrollQAToBottom() }, 600)
}
const clearQA = () => { qaMessages.length = 0; ElMessage.success('已清空对话') }
</script>

<style scoped>
.policy-page { display: flex; height: calc(100vh - 96px); }
.policy-sidebar { width: 340px; min-width: 340px; background: #fff; border-right: 1px solid #e4e7ed; display: flex; flex-direction: column; overflow: hidden; }
.upload-section { padding: 16px 20px 12px; border-bottom: 1px solid #e4e7ed; }
.section-title { font-size: 14px; font-weight: 600; color: #1f2937; display: flex; align-items: center; margin-bottom: 12px; }
.title-bar { display: inline-block; width: 3px; height: 16px; background: #2563eb; border-radius: 2px; margin-right: 8px; }
.input-label { font-size: 12px; color: #909399; display: block; margin-bottom: 4px; }
.url-input { margin-bottom: 0; }
.divider-text { display: flex; align-items: center; margin: 8px 0; color: #909399; font-size: 12px; }
.divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background: #e4e7ed; }
.divider-text span { padding: 0 12px; }
.drop-zone { border: 2px dashed #d9d9d9; border-radius: 8px; background: #fafafa; padding: 14px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; }
.drop-zone:hover, .drop-zone-active { border-color: #2563eb; background: #eef2ff; }
.drop-icon { font-size: 24px; margin-bottom: 4px; }
.drop-text { font-size: 12px; color: #374151; margin-bottom: 2px; }
.drop-hint { font-size: 11px; color: #9ca3af; }
.current-file { margin-top: 8px; }
.current-file-info { display: flex; align-items: center; gap: 6px; background: #f0f4ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 10px; }
.item-icon { font-size: 14px; flex-shrink: 0; }
.item-name { flex: 1; font-size: 12px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.item-format-tag { flex-shrink: 0; }
.item-delete { flex-shrink: 0; }
.action-section { padding: 12px 20px; border-bottom: 1px solid #e4e7ed; }
.analyze-btn { width: 100%; height: 40px; }
.btn-hint { text-align: center; font-size: 11px; color: #f59e0b; margin-top: 6px; }
.history-section { flex: 1; background: #f8f9fa; padding: 12px 20px; display: flex; flex-direction: column; overflow: hidden; }
.history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.history-title { font-size: 14px; font-weight: 600; color: #1f2937; }
.history-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.history-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.2s; }
.history-card:hover { border-color: #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.history-active { border-color: #2563eb; background: #eef2ff; }
.history-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.history-time { font-size: 11px; color: #909399; }
.history-title-text { font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 2px; }
.history-count-text { font-size: 11px; color: #9ca3af; }
.history-empty { text-align: center; color: #909399; font-size: 13px; padding: 40px 0; }
.policy-main { flex: 1; background: #f0f2f5; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; }
.state-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #909399; }
.empty-icon { font-size: 64px; opacity: 0.4; margin-bottom: 16px; }
.empty-title { font-size: 16px; color: #6b7280; font-weight: 500; margin-bottom: 8px; }
.empty-desc { font-size: 13px; color: #9ca3af; }
.state-analyzing { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
.loading-ring { position: relative; width: 80px; height: 80px; margin-bottom: 24px; }
.loading-spinner { width: 80px; height: 80px; border: 4px solid #e8e8e8; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
.loading-brain { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 32px; }
@keyframes spin { to { transform: rotate(360deg); } }
.analyzing-text { font-size: 16px; color: #1f2937; font-weight: 500; margin-bottom: 8px; }
.analyzing-hint { font-size: 13px; color: #9ca3af; }
.result-container { width: 100%; max-width: 900px; margin: 0 auto; padding: 24px; }
.result-title-card { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.title-left { flex: 1; }
.result-title-text { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 8px; line-height: 1.4; }
.result-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.result-tag { font-size: 11px; }
.export-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; flex-shrink: 0; margin-left: 16px; }
.export-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.info-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s; }
.info-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.info-card-header { padding: 12px 16px; display: flex; align-items: center; gap: 6px; }
.info-card-icon { font-size: 16px; }
.info-card-title { font-size: 13px; font-weight: 600; color: #1f2937; }
.info-card-body { padding: 12px 16px; }
.info-tag { margin: 2px 4px 2px 0; font-size: 11px; }
.info-tag-wrapper { display: inline-block; }
.info-list { margin: 0; padding-left: 18px; font-size: 12px; color: #4b5563; line-height: 1.8; }
.amount-item { font-size: 12px; color: #4b5563; padding: 4px 0; line-height: 1.6; }
:deep(.amount-highlight) { color: #f59e0b; font-weight: 700; font-size: 14px; }
.info-paragraph { font-size: 12px; color: #4b5563; line-height: 1.8; margin: 0; }
.process-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.qa-section { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 24px; }
.qa-header { display: flex; align-items: center; gap: 6px; padding: 14px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 600; font-size: 13px; color: #1f2937; }
.qa-body { max-height: 280px; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.qa-msg { display: flex; gap: 8px; max-width: 85%; }
.qa-user { align-self: flex-end; flex-direction: row-reverse; }
.qa-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f0f0f0; font-size: 14px; flex-shrink: 0; }
.qa-bubble { padding: 8px 12px; border-radius: 8px; font-size: 12px; line-height: 1.5; }
.qa-user .qa-bubble { background: #2563eb; color: #fff; }
.qa-ai .qa-bubble { background: #f0f4ff; color: #1f2937; }
.qa-extra { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }
.qa-extra-item { font-size: 12px; color: #4b5563; padding: 4px 8px; background: #fafafa; border-radius: 4px; }
.qa-input-row { display: flex; gap: 8px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.qa-input { flex: 1; }
.qa-quick { padding: 8px 20px 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; border-top: 1px solid #f0f0f0; }
.quick-label { font-size: 11px; color: #909399; }
.quick-btn { font-size: 11px !important; }
</style>