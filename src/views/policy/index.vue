<template>
  <div class="policy-page">
    <!-- 左侧边栏 320px -->
    <div class="policy-sidebar">
      <!-- 政策上传区 -->
      <div class="upload-section">
        <div class="section-title">
          <span class="title-bar"></span>政策上传
        </div>
        <div class="url-input-area">
          <label class="input-label">政策文件链接</label>
          <el-input
            v-model="policyUrl"
            placeholder="粘贴政策文件URL..."
            clearable
            class="url-input"
            @input="onUrlInput"
          />
        </div>
        <div class="divider-text"><span>或</span></div>
        <div
          class="drop-zone"
          :class="{ 'drop-zone-active': isDragOver, 'drop-zone-hidden': !!selectedFile }"
          @click="triggerFileInput"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <div class="drop-icon">📁</div>
          <div class="drop-text">点击或拖拽上传文件</div>
          <div class="drop-hint">支持 PDF、Word、TXT 格式</div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          style="display: none"
          @change="onFileSelected"
        />
        <div v-if="selectedFile" class="file-item">
          <span class="file-icon">📄</span>
          <span class="file-name">{{ selectedFile.name }}</span>
          <el-icon class="file-remove" @click="clearFile"><Close /></el-icon>
        </div>
        <el-button
          class="analyze-btn"
          :loading="analyzing"
          :disabled="(!policyUrl && !selectedFile) || analyzing"
          @click="startAnalysis"
        >
          <span v-if="!analyzing">🔍 开始 AI 分析</span>
          <span v-else>⏳ 分析中...</span>
        </el-button>
      </div>

      <!-- 研究历史区 -->
      <div class="history-section">
        <div class="history-header">
          <span class="history-title">🕐 研究历史</span>
          <el-tag size="small" type="info" class="history-count">共 {{ historyList.length }} 条</el-tag>
        </div>
        <div class="history-list">
          <div
            v-for="(item, idx) in historyList"
            :key="idx"
            class="history-card"
            :class="{ 'history-active': activeHistoryIdx === idx }"
            @click="loadHistory(idx)"
          >
            <div class="history-card-top">
              <el-tag size="small" :type="item.source === '链接解析' ? 'primary' : 'success'">
                {{ item.source }}
              </el-tag>
              <span class="history-time">{{ item.time }}</span>
            </div>
            <div class="history-title-text">{{ item.title }}</div>
            <div class="history-tags">
              <el-tag v-for="tag in item.tags" :key="tag" size="small" class="history-tag">
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div v-if="historyList.length === 0" class="history-empty">
            暂无研究历史
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容区 -->
    <div class="policy-main">
      <!-- 状态1：空状态 -->
      <div v-if="pageState === 'empty'" class="state-empty">
        <div class="empty-icon">📄</div>
        <div class="empty-title">上传政策文件，开启 AI 智能分析</div>
        <div class="empty-desc">支持政策链接解析与本地文件上传</div>
      </div>

      <!-- 状态2：分析中 -->
      <div v-else-if="pageState === 'analyzing'" class="state-analyzing">
        <div class="loading-ring">
          <div class="loading-spinner"></div>
          <div class="loading-brain">🧠</div>
        </div>
        <div class="analyzing-text">AI 正在深度分析政策内容...</div>
        <div class="analyzing-hint">预计需要 10-20 秒</div>
      </div>

      <!-- 状态3：分析结果 -->
      <div v-else-if="pageState === 'result'" class="state-result">
        <div class="result-container">
          <!-- 3.1 标题卡片 -->
          <div class="result-title-card">
            <div class="title-left">
              <div class="result-title-text">{{ resultData.title }}</div>
              <div class="result-tags">
                <el-tag v-for="tag in resultData.policyTags" :key="tag" class="result-tag" size="small">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <el-button class="export-btn" @click="handleExport">
              ⬇️ 导出报告
            </el-button>
          </div>

          <!-- 3.2 四宫格信息卡片 -->
          <div class="info-grid">
            <div class="info-card" v-for="card in infoCards" :key="card.title">
              <div class="info-card-header" :style="{ background: card.bgColor }">
                <span class="info-card-icon">{{ card.icon }}</span>
                <span class="info-card-title">{{ card.title }}</span>
              </div>
              <div class="info-card-body">
                <template v-if="card.type === 'tags'">
                  <el-tag v-for="item in card.items" :key="item" class="info-tag" type="success">
                    {{ item }}
                  </el-tag>
                </template>
                <template v-else-if="card.type === 'list'">
                  <ol class="info-list">
                    <li v-for="item in card.items" :key="item">{{ item }}</li>
                  </ol>
                </template>
                <template v-else-if="card.type === 'amount'">
                  <div v-for="item in card.items" :key="item" class="amount-item">
                    <span v-html="highlightAmount(item)"></span>
                  </div>
                </template>
                <template v-else>
                  <p class="info-paragraph">{{ card.content }}</p>
                </template>
              </div>
            </div>
          </div>

          <!-- 3.3 办理流程 -->
          <div class="process-card">
            <div class="process-title">🔄 办理流程</div>
            <div class="process-steps">
              <div class="process-step" v-for="(step, sIdx) in processSteps" :key="sIdx">
                <div class="step-circle">{{ sIdx + 1 }}</div>
                <div class="step-info">
                  <div class="step-name">{{ step.name }}</div>
                  <div class="step-desc">{{ step.desc }}</div>
                </div>
                <div v-if="sIdx < processSteps.length - 1" class="step-line"></div>
              </div>
            </div>
          </div>

          <!-- 3.4 AI 推荐政策标签 -->
          <div class="recommend-card">
            <div class="recommend-header">
              <span class="recommend-title">🤖 AI 推荐政策标签</span>
              <el-tag class="recommend-badge" type="primary" size="small">智能推荐</el-tag>
            </div>
            <div class="recommend-tags">
              <span
                v-for="tag in recommendTags"
                :key="tag"
                class="recommend-tag-item"
                :class="{ 'recommend-tag-active': selectedRecommendTags.includes(tag) }"
                @click="toggleRecommendTag(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 3.5 政策智能问答 -->
          <div class="qa-card">
            <div class="qa-header">
              <div class="qa-header-left">
                <span class="qa-title">📝 政策智能问答</span>
                <el-tag size="small" type="warning" class="qa-badge">基于当前研判结果</el-tag>
              </div>
              <el-button v-if="qaMessages.length > 0" text size="small" type="danger" @click="clearQA">
                清空对话
              </el-button>
            </div>
            <div class="qa-body" ref="qaBodyRef">
              <div v-if="qaMessages.length === 0" class="qa-empty">
                <div class="qa-empty-icon">💬</div>
                <div class="qa-empty-title">对当前政策内容进行提问</div>
                <div class="qa-empty-desc">可询问政策适用条件、办理流程、补贴标准等</div>
                <div class="qa-suggestions">
                  <span
                    v-for="(q, qIdx) in getQuickQuestions()"
                    :key="qIdx"
                    class="qa-suggestion-item"
                    @click="sendQuestion(q)"
                  >
                    {{ q }}
                  </span>
                </div>
              </div>
              <div v-else class="qa-messages">
                <div
                  v-for="(msg, mIdx) in qaMessages"
                  :key="mIdx"
                  class="qa-message"
                  :class="msg.role === 'user' ? 'qa-message-user' : 'qa-message-ai'"
                >
                  <div class="qa-avatar">
                    {{ msg.role === 'user' ? '👤' : '🤖' }}
                  </div>
                  <div class="qa-bubble">
                    <div class="qa-bubble-text">{{ msg.content }}</div>
                    <div v-if="msg.extra" class="qa-bubble-extra">
                      <div v-for="(item, eIdx) in msg.extra" :key="eIdx" class="qa-extra-item">
                        <span class="qa-extra-dot"></span>
                        {{ item }}
                      </div>
                    </div>
                  </div>
                </div>
                <div ref="qaBottomRef"></div>
              </div>
            </div>
            <div class="qa-input-area">
              <el-input
                v-model="qaInput"
                placeholder="输入政策相关问题..."
                class="qa-input"
                clearable
                @keyup.enter="sendQA"
              />
              <el-button
                class="qa-send-btn"
                :disabled="!qaInput.trim()"
                @click="sendQA"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

/* ========== 左侧边栏 ========== */
const policyUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const analyzing = ref(false)
const activeHistoryIdx = ref(-1)

/* ========== 历史记录数据 ========== */
interface HistoryItem {
  title: string
  source: string
  time: string
  tags: string[]
  resultKey: number
}

const historyList = reactive<HistoryItem[]>([
  { title: '关于促进高校毕业生就业创业若干措施的通知', source: '链接解析', time: '2026-08-13', tags: ['就业', '高校毕业生'], resultKey: 0 },
  { title: '职业技能提升行动补贴政策', source: '文件上传', time: '2026-08-12', tags: ['培训', '补贴'], resultKey: 1 },
  { title: '困难人员就业援助实施办法', source: '链接解析', time: '2026-08-10', tags: ['援助', '困难群体'], resultKey: 2 },
  { title: '创业担保贷款贴息政策', source: '文件上传', time: '2026-08-08', tags: ['创业', '贷款'], resultKey: 3 },
  { title: '稳岗返还补贴政策细则', source: '链接解析', time: '2026-08-05', tags: ['稳岗', '企业'], resultKey: 4 },
])

/* ========== 预置分析结果数据 ========== */
interface PolicyResult {
  title: string
  policyTags: string[]
  background: string
  targetObjects: string[]
  coreConditions: string[]
  subsidyAmounts: string[]
}

const allResults: PolicyResult[] = [
  {
    title: '关于促进高校毕业生就业创业若干措施的通知',
    policyTags: ['就业促进', '高校毕业生'],
    background: '为深入贯彻落实党中央、国务院关于高校毕业生就业工作的决策部署，进一步做好高校毕业生就业创业工作，结合本市实际，制定以下政策措施。本通知自发布之日起施行，有效期至2028年12月31日。',
    targetObjects: ['应届高校毕业生', '毕业两年内未就业毕业生', '基层服务人员', '自主创业人员'],
    coreConditions: ['具有本市户籍或在本市高校就读的应届毕业生', '毕业两年内未实现就业且已进行失业登记', '到基层单位就业并签订一年以上劳动合同', '自主创业并正常经营满6个月以上', '参加职业技能培训并取得相应证书'],
    subsidyAmounts: ['基层就业补贴一次性 <b>3,000</b> 元/人', '创业补贴 <b>10,000</b> 元', '培训补贴 <b>800-3,000</b> 元/人', '社保补贴最长2年'],
  },
  {
    title: '职业技能提升行动补贴政策',
    policyTags: ['技能培训', '职业提升'],
    background: '为全面提升劳动者职业技能水平和就业创业能力，缓解结构性就业矛盾，推动经济高质量发展，实施职业技能提升行动。',
    targetObjects: ['企业在职职工', '失业人员', '农村转移劳动力', '退役军人'],
    coreConditions: ['参加职业技能培训并取得职业资格证书', '培训课时不少于80学时', '企业组织职工开展岗位技能提升培训', '个人参加就业技能培训'],
    subsidyAmounts: ['初级工补贴 <b>1,000</b> 元/人', '中级工补贴 <b>1,500</b> 元/人', '高级工补贴 <b>2,000</b> 元/人', '技师补贴 <b>3,500</b> 元/人'],
  },
  {
    title: '困难人员就业援助实施办法',
    policyTags: ['就业援助', '困难群体'],
    background: '为建立健全就业困难人员就业援助制度，促进就业困难人员实现就业和稳定就业，保障基本生活，维护社会和谐稳定。',
    targetObjects: ['零就业家庭成员', '大龄就业困难人员', '残疾人', '低保家庭人员'],
    coreConditions: ['经认定的就业困难人员', '有劳动能力和就业意愿', '接受公共就业服务机构安排', '实现灵活就业或单位吸纳就业'],
    subsidyAmounts: ['社保补贴 <b>600</b> 元/月', '岗位补贴 <b>500</b> 元/月', '一次性求职创业补贴 <b>1,000</b> 元', '公益性岗位补贴 <b>800</b> 元/月'],
  },
  {
    title: '创业担保贷款贴息政策',
    policyTags: ['创业扶持', '贷款贴息'],
    background: '为鼓励创业带动就业，解决创业者融资难问题，对符合条件的创业人员和小微企业提供创业担保贷款及贴息支持。',
    targetObjects: ['城镇登记失业人员', '高校毕业生', '返乡创业农民工', '小微企业'],
    coreConditions: ['经工商登记注册并正常经营', '贷款用途符合创业项目要求', '个人信用记录良好', '提供有效担保或抵押'],
    subsidyAmounts: ['个人贷款最高 <b>30</b> 万元', '小微企业贷款最高 <b>300</b> 万元', '贴息比例 <b>50%</b>', '贷款期限最长 <b>3</b> 年'],
  },
  {
    title: '稳岗返还补贴政策细则',
    policyTags: ['稳岗返还', '企业减负'],
    background: '为支持企业稳定岗位，不裁员或少裁员，继续实施失业保险稳岗返还政策，帮助企业缓解经营压力。',
    targetObjects: ['参保企业', '不裁员少裁员企业', '中小微企业', '大型企业'],
    coreConditions: ['依法参加失业保险并足额缴纳失业保险费', '上年度未裁员或裁员率不高于5.5%', '30人以下企业裁员率不高于20%', '非严重失信企业'],
    subsidyAmounts: ['大型企业返还 <b>30%</b>', '中小微企业返还 <b>60%</b>', '单个企业上限 <b>500</b> 万元', '劳务派遣企业 <b>30%</b>'],
  },
]

/* ========== 页面状态 ========== */
const pageState = ref<'empty' | 'analyzing' | 'result'>('empty')
const resultData = ref<PolicyResult>(allResults[0])
const selectedRecommendTags = ref<string[]>([])

const infoCards = computed(() => [
  { icon: '📖', title: '政策背景', bgColor: 'linear-gradient(135deg, #e6f4ff, #d6eaff)', type: 'text', content: resultData.value.background },
  { icon: '👥', title: '面向对象', bgColor: 'linear-gradient(135deg, #f0f9eb, #e1f3d8)', type: 'tags', items: resultData.value.targetObjects },
  { icon: '📋', title: '核心条件', bgColor: 'linear-gradient(135deg, #fff7e6, #ffefd0)', type: 'list', items: resultData.value.coreConditions },
  { icon: '💰', title: '补贴标准', bgColor: 'linear-gradient(135deg, #fff2f0, #ffe8e4)', type: 'amount', items: resultData.value.subsidyAmounts },
])

const processSteps = [
  { name: '在线申请', desc: '登录就业服务平台提交申请' },
  { name: '材料审核', desc: '人社部门5个工作日内审核' },
  { name: '公示公告', desc: '审核通过公示5个工作日' },
  { name: '补贴发放', desc: '公示无异议后拨付至个人账户' },
]

const recommendTags = ['#稳就业', '#人才引进', '#基层服务', '#创业孵化', '#职业培训', '#社保补贴', '#重点群体', '#政策红利']

/* ========== 交互方法 ========== */
const onUrlInput = () => {
  if (policyUrl.value) {
    selectedFile.value = null
  }
}

const onDragOver = (e: DragEvent) => {
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    validateAndSetFile(input.files[0])
  }
}

const validateAndSetFile = (file: File) => {
  const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
    ElMessage.warning('仅支持 PDF、Word、TXT 格式文件')
    return
  }
  selectedFile.value = file
  policyUrl.value = ''
  ElMessage.success(`已选择文件：${file.name}`)
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const startAnalysis = () => {
  if (!policyUrl.value && !selectedFile.value) {
    ElMessage.warning('请输入政策链接或上传文件')
    return
  }
  analyzing.value = true
  pageState.value = 'analyzing'

  setTimeout(() => {
    analyzing.value = false
    pageState.value = 'result'
    const randomIdx = Math.floor(Math.random() * allResults.length)
    resultData.value = allResults[randomIdx]
    selectedRecommendTags.value = []

    // 追加到历史记录顶部
    const source = selectedFile.value ? '文件上传' : '链接解析'
    historyList.unshift({
      title: resultData.value.title,
      source,
      time: new Date().toISOString().slice(0, 10),
      tags: resultData.value.policyTags,
      resultKey: randomIdx,
    })
    if (historyList.length > 10) {
      historyList.pop()
    }
    activeHistoryIdx.value = 0
    ElMessage.success('AI 分析完成')
  }, 2500)
}

const loadHistory = (idx: number) => {
  activeHistoryIdx.value = idx
  const item = historyList[idx]
  resultData.value = allResults[item.resultKey % allResults.length]
  selectedRecommendTags.value = []
  pageState.value = 'result'
}

const handleExport = () => {
  ElMessage.success('报告导出中，请稍候...')
}

const toggleRecommendTag = (tag: string) => {
  const idx = selectedRecommendTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedRecommendTags.value.splice(idx, 1)
  } else {
    selectedRecommendTags.value.push(tag)
  }
}

const highlightAmount = (text: string) => {
  return text.replace(/([\d,]+(?:\.\d+)?)(?=\s*元)/g, '<span class="amount-highlight">$1</span>')
    .replace(/(\d+(?:\.\d+)?)%/g, '<span class="amount-highlight">$1%</span>')
}

/* ========== 政策智能问答 ========== */
interface QAMessage {
  role: 'user' | 'ai'
  content: string
  extra?: string[]
}

const qaInput = ref('')
const qaMessages = reactive<QAMessage[]>([])
const qaBodyRef = ref<HTMLDivElement>()
const qaBottomRef = ref<HTMLDivElement>()

const scrollQAToBottom = async () => {
  await nextTick()
  if (qaBottomRef.value) {
    qaBottomRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}

const getQuickQuestions = () => {
  const title = resultData.value.title
  if (title.includes('高校毕业生')) {
    return ['哪些高校毕业生可以申请补贴？', '具体补贴标准是多少？', '如何办理申请手续？', '申请需要准备哪些材料？']
  } else if (title.includes('补贴') || title.includes('返还')) {
    return ['哪些企业可以申请稳岗返还？', '返还比例如何计算？', '资金用途有哪些限制？', '申请流程需要多长时间？']
  } else if (title.includes('困难')) {
    return ['哪些人员属于就业困难群体？', '可以享受哪些援助政策？', '如何申请认定就业困难人员？', '援助政策的有效期是多久？']
  } else if (title.includes('创业')) {
    return ['贷款额度最高多少？', '贴息比例是多少？', '需要提供什么担保？', '还款期限有何规定？']
  } else if (title.includes('培训') || title.includes('技能')) {
    return ['哪些培训可以申请补贴？', '补贴标准是多少？', '如何报名参加培训？', '证书有何要求？']
  }
  return ['该政策的适用对象有哪些？', '具体申请条件是什么？', '补贴标准和周期是多少？', '办理流程和时限是？']
}

const getAIAnswer = (question: string): QAMessage => {
  const q = question.toLowerCase()
  const data = resultData.value

  if (q.includes('对象') || q.includes('人群') || q.includes('谁') || q.includes('哪些人')) {
    return {
      role: 'ai',
      content: `根据研读 "${data.title}" 政策内容，该政策的适用对象包括：`,
      extra: data.targetObjects.map(o => `✅ ${o}`)
    }
  }
  if (q.includes('条件') || q.includes('申请') || q.includes('资格') || q.includes('要求')) {
    return {
      role: 'ai',
      content: `根据政策规定，申请需满足以下核心条件：`,
      extra: data.coreConditions.map(c => `📌 ${c}`)
    }
  }
  if (q.includes('补贴') || q.includes('标准') || q.includes('金额') || q.includes('多少') || q.includes('钱')) {
    return {
      role: 'ai',
      content: `该政策涉及的补贴/资金标准如下：`,
      extra: data.subsidyAmounts.map(a => `💰 ${a.replace(/<[^>]*>/g, '')}`)
    }
  }
  if (q.includes('流程') || q.includes('手续') || q.includes('办理') || q.includes('步骤')) {
    return {
      role: 'ai',
      content: `${data.title} 的办理流程如下：`,
      extra: processSteps.map((s, i) => `第${i + 1}步：${s.name} — ${s.desc}`)
    }
  }
  if (q.includes('材料') || q.includes('证件') || q.includes('文件') || q.includes('资料')) {
    return {
      role: 'ai',
      content: '办理该政策通常需要准备以下材料（具体以当地人社部门要求为准）：',
      extra: ['📄 身份证原件及复印件', '📄 相关资格证明文件', '📄 申请表（可在窗口领取或网上下载）', '📄 单位/个人银行账户信息', '📄 其他佐证材料（根据具体政策类型）']
    }
  }
  if (q.includes('时间') || q.includes('期限') || q.includes('多久') || q.includes('有效期')) {
    return {
      role: 'ai',
      content: '根据政策规定，办理时限和有效期说明如下：',
      extra: ['⏱ 审核时限：5-15个工作日', '⏱ 公示期：5个工作日', '⏱ 资金拨付：公示无异议后10个工作日内', '⏱ 政策有效期：一般至2028年12月31日']
    }
  }
  if (q.includes('背景') || q.includes('目的') || q.includes('依据') || q.includes('原因')) {
    return {
      role: 'ai',
      content: data.background,
    }
  }

  // 默认回答
  return {
    role: 'ai',
    content: `根据对 "${data.title}" 的政策研判，以下是为您梳理的相关信息：`,
    extra: [
      `📌 适用对象：${data.targetObjects.join('、')}`,
      `📌 核心条件：${data.coreConditions.slice(0, 3).join('；')}`,
      `📌 补贴标准：${data.subsidyAmounts.slice(0, 3).map(a => a.replace(/<[^>]*>/g, '')).join('；')}`
    ]
  }
}

const sendQuestion = (question: string) => {
  qaInput.value = question
  sendQA()
}

const sendQA = () => {
  const text = qaInput.value.trim()
  if (!text) return

  qaMessages.push({ role: 'user', content: text })
  qaInput.value = ''
  scrollQAToBottom()

  // 模拟AI回复
  setTimeout(() => {
    const answer = getAIAnswer(text)
    qaMessages.push(answer)
    scrollQAToBottom()
  }, 600)
}

const clearQA = () => {
  qaMessages.length = 0
  ElMessage.success('已清空对话')
}
</script>

<style scoped>
.policy-page {
  display: flex;
  height: calc(100vh - 96px);
  gap: 0;
}

/* ===== 左侧边栏 ===== */
.policy-sidebar {
  width: 320px;
  min-width: 320px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.upload-section {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.title-bar {
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
  margin-right: 8px;
}

.input-label {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-bottom: 6px;
}

.url-input {
  margin-bottom: 16px;
}

.url-input :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.url-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.divider-text {
  display: flex;
  align-items: center;
  margin: 12px 0;
  color: #909399;
  font-size: 12px;
}

.divider-text::before,
.divider-text::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e4e7ed;
}

.divider-text span {
  padding: 0 12px;
}

.drop-zone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.drop-zone:hover,
.drop-zone-active {
  border-color: #2563eb;
  background: #eef2ff;
}

.drop-zone-hidden {
  display: none;
}

.drop-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.drop-text {
  font-size: 13px;
  color: #374151;
  margin-bottom: 4px;
}

.drop-hint {
  font-size: 11px;
  color: #9ca3af;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

.file-icon {
  font-size: 16px;
}

.file-name {
  flex: 1;
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-remove {
  cursor: pointer;
  color: #909399;
  font-size: 14px;
}

.file-remove:hover {
  color: #ef4444;
}

.analyze-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.analyze-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.analyze-btn.is-disabled {
  opacity: 0.7;
}

/* 历史区 */
.history-section {
  flex: 1;
  background: #f8f9fa;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-card:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-active {
  border-color: #2563eb;
  background: #eef2ff;
}

.history-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.history-time {
  font-size: 11px;
  color: #909399;
}

.history-title-text {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}

.history-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.history-tag {
  font-size: 10px;
  height: 20px;
  line-height: 18px;
}

.history-empty {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 40px 0;
}

/* ===== 右侧主内容区 ===== */
.policy-main {
  flex: 1;
  background: #f0f2f5;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* 空状态 */
.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: #9ca3af;
}

/* 分析中 */
.state-analyzing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-ring {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid #e8e8e8;
  border-top-color: #2563eb;
  animation: spin 1s linear infinite;
}

.loading-brain {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.analyzing-text {
  font-size: 16px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 8px;
}

.analyzing-hint {
  font-size: 13px;
  color: #909399;
}

/* 结果 */
.state-result {
  width: 100%;
  padding: 24px;
  display: flex;
  justify-content: center;
}

.result-container {
  max-width: 960px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 标题卡片 */
.result-title-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.title-left {
  flex: 1;
}

.result-title-text {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
  line-height: 1.4;
}

.result-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.result-tag {
  background: #eef2ff;
  color: #2563eb;
  border: none;
  border-radius: 4px;
  font-size: 12px;
}

.export-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  color: #fff;
  border-radius: 6px;
  white-space: nowrap;
}

.export-btn:hover {
  opacity: 0.9;
}

/* 四宫格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.2s;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.info-card-icon {
  font-size: 18px;
}

.info-card-title {
  font-size: 14px;
  font-weight: 600;
}

.info-card-body {
  padding: 12px 16px 16px;
}

.info-paragraph {
  font-size: 13px;
  line-height: 1.8;
  color: #374151;
  margin: 0;
}

.info-tag {
  margin: 0 4px 6px 0;
  border-radius: 6px;
  font-size: 12px;
}

.info-list {
  padding-left: 18px;
  margin: 0;
}

.info-list li {
  font-size: 13px;
  color: #374151;
  line-height: 1.8;
  padding-left: 4px;
}

.amount-item {
  font-size: 13px;
  color: #374151;
  line-height: 1.8;
  padding: 2px 0;
}

:deep(.amount-highlight) {
  color: #f59e0b;
  font-weight: 700;
  font-size: 15px;
}

/* 办理流程 */
.process-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}

.process-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.process-steps {
  display: flex;
  justify-content: space-between;
  gap: 0;
  position: relative;
}

.process-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin-bottom: 8px;
}

.step-line {
  position: absolute;
  top: 16px;
  left: calc(50% + 16px);
  width: calc(100% - 32px);
  height: 2px;
  background: #e5e7eb;
  z-index: 0;
}

.step-info {
  text-align: center;
}

.step-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 11px;
  color: #909399;
  max-width: 120px;
}

/* AI 推荐标签 */
.recommend-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}

.recommend-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.recommend-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.recommend-badge {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
}

.recommend-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.recommend-tag-item {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.recommend-tag-item:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eef2ff;
}

.recommend-tag-active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.recommend-tag-active:hover {
  background: #1d4ed8;
  color: #fff;
}

/* 政策智能问答 */
.qa-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.qa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.qa-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qa-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.qa-badge {
  font-size: 10px;
  height: 18px;
  line-height: 16px;
}

.qa-body {
  min-height: 180px;
  max-height: 320px;
  overflow-y: auto;
  background: #fafbfc;
  padding: 16px 20px;
}

.qa-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  text-align: center;
}

.qa-empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.qa-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.qa-empty-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.qa-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 500px;
}

.qa-suggestion-item {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 12px;
  color: #2563eb;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  cursor: pointer;
  transition: all 0.2s;
}

.qa-suggestion-item:hover {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.qa-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.qa-message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.qa-message-ai {
  align-self: flex-start;
}

.qa-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.qa-bubble {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  position: relative;
}

.qa-message-user .qa-bubble {
  background: #2563eb;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.qa-message-ai .qa-bubble {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.qa-bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.qa-bubble-extra {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qa-extra-item {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.5;
}

.qa-message-ai .qa-extra-item {
  color: #4b5563;
}

.qa-extra-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2563eb;
  margin-top: 7px;
  flex-shrink: 0;
}

.qa-input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.qa-input {
  flex: 1;
}

.qa-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  background: #f5f7fa;
}

.qa-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.qa-send-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 13px;
}

.qa-send-btn:hover {
  opacity: 0.9;
}

.qa-send-btn.is-disabled {
  opacity: 0.5;
}
</style>