<template>
  <div class="policy-page">
    <!-- 左侧边栏 340px -->
    <div class="policy-sidebar">
      <!-- 政策上传区 -->
      <div class="upload-section">
        <div class="section-title">
          <span class="title-bar"></span>政策上传
        </div>

        <!-- URL 多行输入 -->
        <div class="url-input-area">
          <label class="input-label">政策文件链接（每行一条）</label>
          <el-input
            v-model="urlText"
            type="textarea"
            :rows="3"
            placeholder="https://example.com/policy1&#10;https://example.com/policy2"
            class="url-input"
            @input="onUrlChange"
          />
        </div>

        <div class="divider-text"><span>或</span></div>

        <!-- 多文件拖拽上传 -->
        <div
          class="drop-zone"
          :class="{ 'drop-zone-active': isDragOver }"
          @click="triggerFileInput"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <div class="drop-icon">📁</div>
          <div class="drop-text">点击或拖拽上传文件（可多选）</div>
          <div class="drop-hint">支持 PDF、Word、TXT 格式，可一次上传多个</div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          style="display: none"
          @change="onFileSelected"
        />

        <!-- 已上传政策列表 -->
        <div v-if="uploadedItems.length > 0" class="uploaded-list-section">
          <div class="list-header">
            <span class="list-title">已上传政策（{{ uploadedItems.length }}）</span>
            <el-button text size="small" type="danger" @click="clearAllItems">清空全部</el-button>
          </div>
          <div class="uploaded-list" ref="uploadedListRef">
            <div
              v-for="(item, idx) in uploadedItems"
              :key="item.id"
              class="uploaded-item"
              :class="{ 'uploaded-item-error': item.status === 'error' }"
              draggable="true"
              @dragstart="onDragStart($event, idx)"
              @dragover.prevent="onDragOverItem($event, idx)"
              @dragend="onDragEnd"
            >
              <span class="drag-handle">⠿</span>
              <span class="item-icon">
                <template v-if="item.type === 'url'">🔗</template>
                <template v-else-if="item.format === 'pdf'">📕</template>
                <template v-else-if="item.format === 'doc' || item.format === 'docx'">📘</template>
                <template v-else>📄</template>
              </span>
              <span class="item-name">{{ item.name }}</span>
              <el-tag
                :type="item.type === 'url' ? 'warning' : 'primary'"
                size="small"
                class="item-format-tag"
              >
                {{ item.type === 'url' ? 'URL' : item.format?.toUpperCase() }}
              </el-tag>
              <span class="item-size">{{ item.size }}</span>
              <el-tag
                v-if="item.status === 'uploading'"
                size="small"
                type="info"
                effect="dark"
                class="item-status"
              >上传中...</el-tag>
              <el-tag
                v-else-if="item.status === 'error'"
                size="small"
                type="danger"
                effect="dark"
                class="item-status"
              >解析失败</el-tag>
              <el-tooltip content="置顶" placement="top">
                <el-icon class="item-action" @click="pinItem(idx)"><Top /></el-icon>
              </el-tooltip>
              <el-tooltip content="预览" placement="top">
                <el-icon class="item-action" @click="previewItem(item)"><View /></el-icon>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-icon class="item-action item-delete" @click="removeItem(idx)"><Delete /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- 比对配置区 -->
      <div v-if="uploadedItems.length > 0" class="config-section">
        <div class="section-title">
          <span class="title-bar"></span>分析模式
        </div>
        <el-radio-group v-model="analysisMode" class="mode-radio-group">
          <el-radio value="single" class="mode-radio">
            <div class="mode-radio-content">
              <span class="mode-label">单文档解读模式</span>
              <span class="mode-desc">分别解析每份政策，生成解读报告</span>
            </div>
          </el-radio>
          <el-radio value="compare" class="mode-radio" :disabled="uploadedItems.length < 2">
            <div class="mode-radio-content">
              <span class="mode-label">多政策横向比对模式</span>
              <span class="mode-desc">对全部上传政策做对比分析</span>
              <span v-if="uploadedItems.length < 2" class="mode-hint">需至少上传2份政策</span>
            </div>
          </el-radio>
        </el-radio-group>

        <transition name="slide-fade">
          <div v-if="analysisMode === 'compare'" class="compare-options">
            <div class="opt-title">比对维度：</div>
            <div class="opt-checkboxes">
              <el-checkbox v-for="dim in compareDimensions" :key="dim.value" v-model="dim.checked" :label="dim.value" :value="dim.value">
                {{ dim.label }}
              </el-checkbox>
            </div>
            <div class="opt-title" style="margin-top: 12px;">输出偏好：</div>
            <el-radio-group v-model="outputPreference" class="output-preference">
              <el-radio value="highlight">差异高亮清单</el-radio>
              <el-radio value="table">结构化对比表格</el-radio>
              <el-radio value="summary">变化总结报告</el-radio>
            </el-radio-group>
          </div>
        </transition>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button
          class="analyze-btn"
          :loading="analyzing"
          :disabled="uploadedItems.length === 0 || analyzing"
          @click="startAnalysis"
        >
          <span v-if="!analyzing">
            {{ analysisMode === 'compare' ? '🔍 开始比对分析' : '🔍 开始 AI 解读' }}
          </span>
          <span v-else>⏳ 分析中...</span>
        </el-button>
        <div v-if="uploadedItems.length === 0 && !analyzing" class="btn-hint">
          请至少上传 1 份政策文件或链接
        </div>
        <div v-else-if="analysisMode === 'compare' && uploadedItems.length < 2 && !analyzing" class="btn-hint">
          比对模式需至少上传 2 份政策
        </div>
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
              <el-tag size="small" :type="item.mode === 'compare' ? 'danger' : 'primary'">
                {{ item.mode === 'compare' ? '比对' : '解读' }}
              </el-tag>
              <span class="history-time">{{ item.time }}</span>
            </div>
            <div class="history-title-text">{{ item.title }}</div>
            <div class="history-count-text">{{ item.count }} 份政策</div>
          </div>
          <div v-if="historyList.length === 0" class="history-empty">暂无研究历史</div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容区 -->
    <div class="policy-main">
      <div v-if="pageState === 'empty'" class="state-empty">
        <div class="empty-icon">📄</div>
        <div class="empty-title">上传政策文件，开启 AI 智能分析</div>
        <div class="empty-desc">支持多文件上传与多政策横向比对</div>
      </div>

      <div v-else-if="pageState === 'analyzing'" class="state-analyzing">
        <div class="loading-ring">
          <div class="loading-spinner"></div>
          <div class="loading-brain">🧠</div>
        </div>
        <div class="analyzing-text">
          {{ analysisMode === 'compare' ? 'AI 正在横向比对政策差异...' : 'AI 正在深度分析政策内容...' }}
        </div>
        <div class="analyzing-hint">预计需要 15-30 秒</div>
      </div>

      <!-- 比对结果 -->
      <div v-else-if="pageState === 'compare_result'" class="state-result">
        <div class="result-container">
          <div class="compare-result-header">
            <div class="cr-title">
              <span class="cr-icon">📊</span>
              <span>多政策横向比对分析报告</span>
            </div>
            <div class="cr-subtitle">共比对 {{ compareResult.policyCount }} 份政策文件</div>
            <div class="cr-policy-list">
              <el-tag v-for="(p, pIdx) in compareResult.policyNames" :key="pIdx" size="small" class="cr-policy-tag">
                {{ pIdx + 1 }}. {{ p }}
              </el-tag>
            </div>
          </div>

          <div class="compare-dimension-results">
            <div v-for="(dim, dimIdx) in compareResult.dimensions" :key="dimIdx" class="dimension-card">
              <div class="dimension-card-header">
                <span class="dimension-icon">{{ dim.icon }}</span>
                <span class="dimension-name">{{ dim.name }}</span>
              </div>
              <div class="dimension-table-wrap">
                <table class="compare-table">
                  <thead>
                    <tr>
                      <th>对比项</th>
                      <th v-for="(p, pIdx) in compareResult.policyNames" :key="pIdx">{{ p }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rIdx) in dim.rows" :key="rIdx">
                      <td class="td-label">{{ row.label }}</td>
                      <td v-for="(cell, cIdx) in row.cells" :key="cIdx">
                        <span :class="{ 'diff-highlight': dim.highlights?.[rIdx]?.[cIdx] }">{{ cell }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="dimension-summary">
                <span class="ds-label">AI 分析：</span>
                <span class="ds-text">{{ dim.summary }}</span>
              </div>
            </div>
          </div>

          <div class="compare-summary">
            <div class="cs-header">📋 综合对比结论</div>
            <div class="cs-content">{{ compareResult.conclusion }}</div>
          </div>

          <div class="compare-export">
            <el-button class="export-btn" @click="handleExport">⬇️ 导出比对报告</el-button>
          </div>
        </div>
      </div>

      <!-- 单文档解读结果 -->
      <div v-else-if="pageState === 'single_result'" class="state-result">
        <div class="result-container">
          <div class="result-title-card">
            <div class="title-left">
              <div class="result-title-text">{{ singleResult.title }}</div>
              <div class="result-tags">
                <el-tag v-for="tag in singleResult.policyTags" :key="tag" class="result-tag" size="small">{{ tag }}</el-tag>
              </div>
            </div>
            <el-button class="export-btn" @click="handleExport">⬇️ 导出报告</el-button>
          </div>

          <div class="info-grid">
            <div class="info-card" v-for="card in infoCards" :key="card.title">
              <div class="info-card-header" :style="{ background: card.bgColor }">
                <span class="info-card-icon">{{ card.icon }}</span>
                <span class="info-card-title">{{ card.title }}</span>
              </div>
              <div class="info-card-body">
                <template v-if="card.type === 'tags'">
                  <el-tag v-for="item in card.items" :key="item" class="info-tag" type="success">{{ item }}</el-tag>
                </template>
                <template v-else-if="card.type === 'list'">
                  <ol class="info-list"><li v-for="item in card.items" :key="item">{{ item }}</li></ol>
                </template>
                <template v-else-if="card.type === 'amount'">
                  <div v-for="item in card.items" :key="item" class="amount-item"><span v-html="highlightAmount(item)"></span></div>
                </template>
                <template v-else>
                  <p class="info-paragraph">{{ card.content }}</p>
                </template>
              </div>
            </div>
          </div>

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

          <div class="recommend-card">
            <div class="recommend-header">
              <span class="recommend-title">🤖 AI 推荐政策标签</span>
              <el-tag class="recommend-badge" type="primary" size="small">智能推荐</el-tag>
            </div>
            <div class="recommend-tags">
              <span v-for="tag in recommendTags" :key="tag" class="recommend-tag-item"
                :class="{ 'recommend-tag-active': selectedRecommendTags.includes(tag) }"
                @click="toggleRecommendTag(tag)">{{ tag }}</span>
            </div>
          </div>

          <div class="qa-card">
            <div class="qa-header">
              <div class="qa-header-left">
                <span class="qa-title">📝 政策智能问答</span>
                <el-tag size="small" type="warning" class="qa-badge">基于当前研判结果</el-tag>
              </div>
              <el-button v-if="qaMessages.length > 0" text size="small" type="danger" @click="clearQA">清空对话</el-button>
            </div>
            <div class="qa-body" ref="qaBodyRef">
              <div v-if="qaMessages.length === 0" class="qa-empty">
                <div class="qa-empty-icon">💬</div>
                <div class="qa-empty-title">对当前政策内容进行提问</div>
                <div class="qa-empty-desc">可询问政策适用条件、办理流程、补贴标准等</div>
                <div class="qa-suggestions">
                  <span v-for="(q, qIdx) in getQuickQuestions()" :key="qIdx" class="qa-suggestion-item" @click="sendQuestion(q)">{{ q }}</span>
                </div>
              </div>
              <div v-else class="qa-messages">
                <div v-for="(msg, mIdx) in qaMessages" :key="mIdx" class="qa-message" :class="msg.role === 'user' ? 'qa-message-user' : 'qa-message-ai'">
                  <div class="qa-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
                  <div class="qa-bubble">
                    <div class="qa-bubble-text">{{ msg.content }}</div>
                    <div v-if="msg.extra" class="qa-bubble-extra">
                      <div v-for="(item, eIdx) in msg.extra" :key="eIdx" class="qa-extra-item">
                        <span class="qa-extra-dot"></span> {{ item }}
                      </div>
                    </div>
                  </div>
                </div>
                <div ref="qaBottomRef"></div>
              </div>
            </div>
            <div class="qa-input-area">
              <el-input v-model="qaInput" placeholder="输入政策相关问题..." class="qa-input" clearable @keyup.enter="sendQA" />
              <el-button class="qa-send-btn" :disabled="!qaInput.trim()" @click="sendQA">发送</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="previewVisible" :title="previewTitle" width="640px" class="preview-dialog">
      <div class="preview-content">{{ previewContent }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, View, Top } from '@element-plus/icons-vue'

interface UploadedItem {
  id: number; name: string; type: 'file' | 'url'; format?: string; size: string; status: 'ready' | 'uploading' | 'error'; content?: string
}

interface CompareDimension {
  icon: string; name: string; rows: { label: string; cells: string[] }[]; highlights?: boolean[][]; summary: string
}

interface CompareResult {
  policyCount: number; policyNames: string[]; dimensions: CompareDimension[]; conclusion: string
}

interface HistoryItem {
  title: string; time: string; mode: 'single' | 'compare'; count: number; resultKey: number
}

interface QAMessage {
  role: 'user' | 'ai'; content: string; extra?: string[]
}

const urlText = ref('')
const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const uploadedItems = reactive<UploadedItem[]>([])
const uploadedListRef = ref<HTMLDivElement>()

const analysisMode = ref<'single' | 'compare'>('single')
const compareDimensions = reactive([
  { value: 'terms', label: '政策条款差异', checked: true },
  { value: 'change', label: '新旧版本变化对比', checked: false },
  { value: 'standard', label: '扶持标准', checked: true },
  { value: 'scope', label: '适用范围', checked: true },
  { value: 'subject', label: '责任主体', checked: false },
  { value: 'period', label: '实施期限', checked: true },
])
const outputPreference = ref('highlight')

const pageState = ref<'empty' | 'analyzing' | 'single_result' | 'compare_result'>('empty')
const analyzing = ref(false)
const activeHistoryIdx = ref(-1)

const previewVisible = ref(false)
const previewTitle = ref('')
const previewContent = ref('')

interface PolicyResult {
  title: string; policyTags: string[]; background: string; targetObjects: string[]; coreConditions: string[]; subsidyAmounts: string[]
}

const allResults: PolicyResult[] = [
  { title: '关于促进高校毕业生就业创业若干措施的通知', policyTags: ['就业促进', '高校毕业生'],
    background: '为深入贯彻落实党中央、国务院关于高校毕业生就业工作的决策部署，进一步做好高校毕业生就业创业工作，结合本市实际，制定以下政策措施。本通知自发布之日起施行，有效期至2028年12月31日。',
    targetObjects: ['应届高校毕业生', '毕业两年内未就业毕业生', '基层服务人员', '自主创业人员'],
    coreConditions: ['具有本市户籍或在本市高校就读的应届毕业生', '毕业两年内未实现就业且已进行失业登记', '到基层单位就业并签订一年以上劳动合同', '自主创业并正常经营满6个月以上', '参加职业技能培训并取得相应证书'],
    subsidyAmounts: ['基层就业补贴一次性 <b>3,000</b> 元/人', '创业补贴 <b>10,000</b> 元', '培训补贴 <b>800-3,000</b> 元/人', '社保补贴最长2年'] },
  { title: '职业技能提升行动补贴政策', policyTags: ['技能培训', '职业提升'],
    background: '为全面提升劳动者职业技能水平和就业创业能力，缓解结构性就业矛盾，推动经济高质量发展，实施职业技能提升行动。',
    targetObjects: ['企业在职职工', '失业人员', '农村转移劳动力', '退役军人'],
    coreConditions: ['参加职业技能培训并取得职业资格证书', '培训课时不少于80学时', '企业组织职工开展岗位技能提升培训', '个人参加就业技能培训'],
    subsidyAmounts: ['初级工补贴 <b>1,000</b> 元/人', '中级工补贴 <b>1,500</b> 元/人', '高级工补贴 <b>2,000</b> 元/人', '技师补贴 <b>3,500</b> 元/人'] },
  { title: '困难人员就业援助实施办法', policyTags: ['就业援助', '困难群体'],
    background: '为建立健全就业困难人员就业援助制度，促进就业困难人员实现就业和稳定就业，保障基本生活，维护社会和谐稳定。',
    targetObjects: ['零就业家庭成员', '大龄就业困难人员', '残疾人', '低保家庭人员'],
    coreConditions: ['经认定的就业困难人员', '有劳动能力和就业意愿', '接受公共就业服务机构安排', '实现灵活就业或单位吸纳就业'],
    subsidyAmounts: ['社保补贴 <b>600</b> 元/月', '岗位补贴 <b>500</b> 元/月', '一次性求职创业补贴 <b>1,000</b> 元', '公益性岗位补贴 <b>800</b> 元/月'] },
  { title: '创业担保贷款贴息政策', policyTags: ['创业扶持', '贷款贴息'],
    background: '为鼓励创业带动就业，解决创业者融资难问题，对符合条件的创业人员和小微企业提供创业担保贷款及贴息支持。',
    targetObjects: ['城镇登记失业人员', '高校毕业生', '返乡创业农民工', '小微企业'],
    coreConditions: ['经工商登记注册并正常经营', '贷款用途符合创业项目要求', '个人信用记录良好', '提供有效担保或抵押'],
    subsidyAmounts: ['个人贷款最高 <b>30</b> 万元', '小微企业贷款最高 <b>300</b> 万元', '贴息比例 <b>50%</b>', '贷款期限最长 <b>3</b> 年'] },
  { title: '稳岗返还补贴政策细则', policyTags: ['稳岗返还', '企业减负'],
    background: '为支持企业稳定岗位，不裁员或少裁员，继续实施失业保险稳岗返还政策，帮助企业缓解经营压力。',
    targetObjects: ['参保企业', '不裁员少裁员企业', '中小微企业', '大型企业'],
    coreConditions: ['依法参加失业保险并足额缴纳失业保险费', '上年度未裁员或裁员率不高于5.5%', '30人以下企业裁员率不高于20%', '非严重失信企业'],
    subsidyAmounts: ['大型企业返还 <b>30%</b>', '中小微企业返还 <b>60%</b>', '单个企业上限 <b>500</b> 万元', '劳务派遣企业 <b>30%</b>'] },
]

const singleResult = ref<PolicyResult>(allResults[0])
const selectedRecommendTags = ref<string[]>([])

const infoCards = computed(() => [
  { icon: '📖', title: '政策背景', bgColor: 'linear-gradient(135deg, #e6f4ff, #d6eaff)', type: 'text' as const, content: singleResult.value.background },
  { icon: '👥', title: '面向对象', bgColor: 'linear-gradient(135deg, #f0f9eb, #e1f3d8)', type: 'tags' as const, items: singleResult.value.targetObjects },
  { icon: '📋', title: '核心条件', bgColor: 'linear-gradient(135deg, #fff7e6, #ffefd0)', type: 'list' as const, items: singleResult.value.coreConditions },
  { icon: '💰', title: '补贴标准', bgColor: 'linear-gradient(135deg, #fff2f0, #ffe8e4)', type: 'amount' as const, items: singleResult.value.subsidyAmounts },
])

const processSteps = [
  { name: '在线申请', desc: '登录就业服务平台提交申请' },
  { name: '材料审核', desc: '人社部门5个工作日内审核' },
  { name: '公示公告', desc: '审核通过公示5个工作日' },
  { name: '补贴发放', desc: '公示无异议后拨付至个人账户' },
]

const recommendTags = ['#稳就业', '#人才引进', '#基层服务', '#创业孵化', '#职业培训', '#社保补贴', '#重点群体', '#政策红利']

const compareResult = ref<CompareResult>({
  policyCount: 0, policyNames: [], dimensions: [], conclusion: '',
})

const historyList = reactive<HistoryItem[]>([
  { title: '高校毕业生就业创业政策比对', time: '2026-08-26', mode: 'compare', count: 3, resultKey: 0 },
  { title: '关于促进高校毕业生就业创业若干措施的通知', time: '2026-08-25', mode: 'single', count: 1, resultKey: 1 },
  { title: '稳岗返还补贴政策细则', time: '2026-08-22', mode: 'single', count: 1, resultKey: 4 },
])

let itemIdCounter = Date.now()

const onUrlChange = () => {
  if (urlText.value.trim()) {
    const urls = urlText.value.split('\n').map(s => s.trim()).filter(s => s.length > 0)
    urls.forEach(url => {
      if (!uploadedItems.some(i => i.name === url)) {
        const name = url.length > 40 ? url.substring(0, 40) + '...' : url
        uploadedItems.push({ id: itemIdCounter++, name, type: 'url', size: '--', status: 'ready' })
      }
    })
  }
}

const onDragOver = () => { isDragOver.value = true }
const onDragLeave = () => { isDragOver.value = false }
const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files))
}
const triggerFileInput = () => fileInputRef.value?.click()
const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

const addFiles = (files: File[]) => {
  files.forEach((file, idx) => {
    if (!file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      ElMessage.warning(`"${file.name}" 格式不支持`)
      return
    }
    if (uploadedItems.some(i => i.name === file.name && i.type === 'file')) {
      ElMessage.warning(`"${file.name}" 已存在`)
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const sizeStr = file.size > 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB'
    const item: UploadedItem = { id: itemIdCounter++, name: file.name, type: 'file', format: ext, size: sizeStr, status: 'uploading' }
    uploadedItems.push(item)
    setTimeout(() => {
      item.status = 'ready'
      if (idx === files.length - 1) ElMessage.success(`已上传 ${files.length} 份文件`)
    }, 500 + idx * 300)
  })
}

const removeItem = (idx: number) => { uploadedItems.splice(idx, 1) }
const clearAllItems = () => { uploadedItems.length = 0; urlText.value = ''; ElMessage.success('已清空全部政策') }
const pinItem = (idx: number) => {
  if (idx === 0) return
  const item = uploadedItems.splice(idx, 1)[0]
  uploadedItems.unshift(item)
}

let dragStartIdx = -1
const onDragStart = (e: DragEvent, idx: number) => { dragStartIdx = idx; if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move' }
const onDragOverItem = (e: DragEvent, idx: number) => {
  if (dragStartIdx === -1 || dragStartIdx === idx) return
  const item = uploadedItems.splice(dragStartIdx, 1)[0]
  uploadedItems.splice(idx, 0, item)
  dragStartIdx = idx
}
const onDragEnd = () => { dragStartIdx = -1 }

const previewItem = (item: UploadedItem) => {
  previewTitle.value = item.name
  previewContent.value = `该政策文件 "${item.name}" 的详细内容正在从系统中加载，请等待完整解析...`
  previewVisible.value = true
}

const generateCompareResult = (): CompareResult => {
  const names = uploadedItems.map(i => i.name)
  const selectedDims = compareDimensions.filter(d => d.checked).map(d => d.value)
  const dimConfig: Record<string, { icon: string; name: string }> = {
    terms: { icon: '📋', name: '政策条款差异' }, change: { icon: '🔄', name: '新旧版本变化对比' },
    standard: { icon: '💰', name: '扶持标准' }, scope: { icon: '🎯', name: '适用范围' },
    subject: { icon: '🏛️', name: '责任主体' }, period: { icon: '⏱️', name: '实施期限' },
  }
  const dimensions: CompareDimension[] = selectedDims.map(dimKey => {
    const config = dimConfig[dimKey]
    const rows: { label: string; cells: string[] }[] = []
    const highlights: boolean[][] = []
    if (dimKey === 'standard') {
      rows.push({ label: '补贴金额', cells: names.map((_, i) => i === 0 ? '3,000元/人' : i === 1 ? '1,000元/人' : '600元/月') })
      rows.push({ label: '补贴上限', cells: names.map((_, i) => i === 0 ? '10,000元' : i === 1 ? '3,500元' : '800元/月') })
      rows.push({ label: '发放周期', cells: names.map((_, i) => i === 0 ? '一次性' : i === 1 ? '一次性' : '按月') })
      highlights.push([false, true, true], [false, true, true], [false, false, true])
    } else if (dimKey === 'scope') {
      rows.push({ label: '适用对象', cells: names.map((_, i) => ['高校毕业生、基层服务人员', '企业在职职工、失业人员', '零就业家庭、残疾人、低保户'][i] || '—') })
      rows.push({ label: '年龄要求', cells: names.map(() => '无明确限制') })
      rows.push({ label: '户籍要求', cells: names.map((_, i) => i === 0 ? '本市户籍或本市高校就读' : '无限制') })
    } else if (dimKey === 'terms') {
      rows.push({ label: '申请条件', cells: names.map((_, i) => ['签订1年以上劳动合同', '取得职业资格证书', '经认定就业困难'][i] || '—') })
      rows.push({ label: '审核时限', cells: names.map(() => '5-15个工作日') })
      rows.push({ label: '公示要求', cells: names.map(() => '公示5个工作日') })
    } else if (dimKey === 'period') {
      rows.push({ label: '政策有效期', cells: names.map((_, i) => ['至2028年12月31日', '长期有效', '至2027年12月31日'][i] || '—') })
      rows.push({ label: '补贴享受期限', cells: names.map((_, i) => ['一次性', '每年可申请', '最长2年'][i] || '—') })
    } else {
      rows.push({ label: '主要差异', cells: names.map((_, i) => i === 0 ? '新增基层就业补贴' : i === 1 ? '提高培训补贴标准' : '扩大援助范围') })
    }
    const summaries: Record<string, string> = {
      terms: '各政策在申请条件和审核流程上基本一致，均要求5-15个工作日审核和5个工作日公示。',
      standard: '补贴标准和发放方式差异较大，高校毕业生政策为一次性补贴，就业援助为按月发放，职业技能培训按等级阶梯式补贴。',
      scope: '适用范围差异明显，高校毕业生政策限定学历和毕业年限，就业援助面向困难群体，职业技能培训覆盖面最广。',
      period: '政策有效期和补贴享受期限各有不同，需关注各自到期时间。',
    }
    return { ...config, rows, highlights, summary: summaries[dimKey] || '各政策存在一定差异，建议根据实际情况选择适用政策。' }
  })
  return {
    policyCount: names.length, policyNames: names, dimensions,
    conclusion: `经对 ${names.length} 份政策文件进行全面比对分析，发现各政策在适用范围、扶持标准、实施期限等方面存在显著差异。建议根据具体业务场景选择适用政策，重点关注意向对象的认定条件和补贴标准差异。如需进一步了解某份政策的详细信息，可切换至单文档解读模式查看完整解读报告。`,
  }
}

const startAnalysis = () => {
  if (uploadedItems.length === 0) { ElMessage.warning('请至少上传 1 份政策文件或链接'); return }
  if (analysisMode.value === 'compare' && uploadedItems.length < 2) { ElMessage.warning('比对模式至少需要 2 份政策'); return }
  analyzing.value = true; pageState.value = 'analyzing'
  setTimeout(() => {
    analyzing.value = false
    if (analysisMode.value === 'compare') {
      compareResult.value = generateCompareResult(); pageState.value = 'compare_result'
    } else {
      const randomIdx = Math.floor(Math.random() * allResults.length)
      singleResult.value = allResults[randomIdx]; selectedRecommendTags.value = []; pageState.value = 'single_result'
    }
    const names = uploadedItems.map(i => i.name)
    historyList.unshift({
      title: analysisMode.value === 'compare' ? '多政策横向比对分析' : names[0],
      time: new Date().toISOString().slice(0, 10),
      mode: analysisMode.value as 'single' | 'compare',
      count: uploadedItems.length, resultKey: Math.floor(Math.random() * 100),
    })
    if (historyList.length > 10) historyList.pop()
    activeHistoryIdx.value = 0
    ElMessage.success(analysisMode.value === 'compare' ? '比对分析完成' : 'AI 解读完成')
  }, 2500)
}

const loadHistory = (idx: number) => {
  activeHistoryIdx.value = idx; const item = historyList[idx]
  if (item.mode === 'compare') { pageState.value = 'compare_result' }
  else { singleResult.value = allResults[item.resultKey % allResults.length]; selectedRecommendTags.value = []; pageState.value = 'single_result' }
}

const handleExport = () => { ElMessage.success('报告导出中，请稍候...') }
const toggleRecommendTag = (tag: string) => {
  const idx = selectedRecommendTags.value.indexOf(tag)
  if (idx >= 0) selectedRecommendTags.value.splice(idx, 1)
  else selectedRecommendTags.value.push(tag)
}

const highlightAmount = (text: string) => {
  return text.replace(/([\d,]+(?:\.\d+)?)(?=\s*元)/g, '<span class="amount-highlight">$1</span>')
    .replace(/(\d+(?:\.\d+)?)%/g, '<span class="amount-highlight">$1%</span>')
}

const qaInput = ref('')
const qaMessages = reactive<QAMessage[]>([])
const qaBodyRef = ref<HTMLDivElement>()
const qaBottomRef = ref<HTMLDivElement>()

const scrollQAToBottom = async () => {
  await nextTick(); if (qaBottomRef.value) qaBottomRef.value.scrollIntoView({ behavior: 'smooth' })
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
  qaMessages.push({ role: 'user', content: text }); qaInput.value = ''; scrollQAToBottom()
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
.url-input :deep(.el-textarea__inner) { border-radius: 6px; font-size: 12px; resize: none; }
.divider-text { display: flex; align-items: center; margin: 8px 0; color: #909399; font-size: 12px; }
.divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background: #e4e7ed; }
.divider-text span { padding: 0 12px; }
.drop-zone { border: 2px dashed #d9d9d9; border-radius: 8px; background: #fafafa; padding: 14px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; }
.drop-zone:hover, .drop-zone-active { border-color: #2563eb; background: #eef2ff; }
.drop-icon { font-size: 24px; margin-bottom: 4px; }
.drop-text { font-size: 12px; color: #374151; margin-bottom: 2px; }
.drop-hint { font-size: 11px; color: #9ca3af; }
.uploaded-list-section { margin-top: 8px; }
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.list-title { font-size: 12px; font-weight: 600; color: #1f2937; }
.uploaded-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.uploaded-item { display: flex; align-items: center; gap: 6px; background: #f8f9fa; border: 1px solid #e8e8e8; border-radius: 6px; padding: 6px 8px; transition: all 0.15s; }
.uploaded-item:hover { border-color: #2563eb; background: #f0f4ff; }
.uploaded-item-error { border-color: #fca5a5; background: #fef2f2; }
.drag-handle { cursor: grab; color: #d1d5db; font-size: 14px; user-select: none; }
.drag-handle:hover { color: #2563eb; }
.item-icon { font-size: 14px; flex-shrink: 0; }
.item-name { flex: 1; font-size: 11px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.item-format-tag { font-size: 10px; height: 18px; line-height: 16px; padding: 0 4px; flex-shrink: 0; }
.item-size { font-size: 10px; color: #9ca3af; flex-shrink: 0; }
.item-status { font-size: 10px; height: 18px; line-height: 16px; padding: 0 4px; flex-shrink: 0; }
.item-action { font-size: 13px; color: #9ca3af; cursor: pointer; flex-shrink: 0; }
.item-action:hover { color: #2563eb; }
.item-delete:hover { color: #ef4444; }
.config-section { padding: 12px 20px; border-bottom: 1px solid #e4e7ed; }
.mode-radio-group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.mode-radio { width: 100%; margin-right: 0; }
.mode-radio-content { display: flex; flex-direction: column; gap: 2px; }
.mode-label { font-size: 13px; font-weight: 500; color: #1f2937; }
.mode-desc { font-size: 11px; color: #9ca3af; }
.mode-hint { font-size: 11px; color: #f59e0b; margin-left: 4px; }
.compare-options { margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e8e8e8; }
.opt-title { font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px; }
.opt-checkboxes { display: flex; flex-wrap: wrap; gap: 4px; }
.opt-checkboxes :deep(.el-checkbox) { margin-right: 0; height: 28px; }
.opt-checkboxes :deep(.el-checkbox__label) { font-size: 12px; }
.output-preference { display: flex; flex-direction: column; gap: 4px; }
.output-preference :deep(.el-radio) { margin-right: 0; height: 26px; }
.output-preference :deep(.el-radio__label) { font-size: 12px; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-8px); }
.action-section { padding: 12px 20px; border-bottom: 1px solid #e4e7ed; }
.analyze-btn { width: 100%; height: 40px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 6px; font-size: 14px; transition: all 0.2s; }
.analyze-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
.analyze-btn.is-disabled { opacity: 0.7; }
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
.compare-result-header { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.cr-title { font-size: 18px; font-weight: 700; color: #1f2937; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.cr-icon { font-size: 22px; }
.cr-subtitle { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
.cr-policy-list { display: flex; flex-wrap: wrap; gap: 6px; }
.cr-policy-tag { font-size: 11px; }
.compare-dimension-results { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.dimension-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.dimension-card-header { padding: 14px 20px; background: linear-gradient(135deg, #eef2ff, #e0e7ff); display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: #1f2937; }
.dimension-icon { font-size: 16px; }
.dimension-table-wrap { padding: 16px 20px; overflow-x: auto; }
.compare-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.compare-table th { background: #f8f9fa; color: #374151; font-weight: 600; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; white-space: nowrap; }
.compare-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #4b5563; }
.compare-table .td-label { font-weight: 500; color: #1f2937; white-space: nowrap; background: #fafafa; }
.diff-highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: 500; color: #92400e; }
.dimension-summary { padding: 12px 20px; background: #fafafa; border-top: 1px solid #f0f0f0; font-size: 12px; color: #4b5563; line-height: 1.6; }
.ds-label { font-weight: 600; color: #2563eb; }
.compare-summary { background: linear-gradient(135deg, #eef2ff, #e0e7ff); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.cs-header { font-size: 15px; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
.cs-content { font-size: 13px; color: #4b5563; line-height: 1.8; }
.compare-export { text-align: center; margin-bottom: 24px; }
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
.info-list { margin: 0; padding-left: 18px; font-size: 12px; color: #4b5563; line-height: 1.8; }
.amount-item { font-size: 12px; color: #4b5563; padding: 4px 0; line-height: 1.6; }
:deep(.amount-highlight) { color: #f59e0b; font-weight: 700; font-size: 14px; }
.info-paragraph { font-size: 12px; color: #4b5563; line-height: 1.8; margin: 0; }
.process-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.process-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
.process-steps { display: flex; flex-direction: column; gap: 0; }
.process-step { display: flex; align-items: flex-start; gap: 12px; position: relative; padding-bottom: 16px; }
.step-circle { width: 28px; height: 28px; min-width: 28px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; z-index: 1; }
.step-info { flex: 1; padding-top: 4px; }
.step-name { font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 2px; }
.step-desc { font-size: 12px; color: #6b7280; }
.step-line { position: absolute; left: 13px; top: 28px; bottom: 0; width: 2px; background: #e5e7eb; }
.recommend-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.recommend-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.recommend-title { font-size: 14px; font-weight: 600; color: #1f2937; }
.recommend-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.recommend-tag-item { padding: 6px 14px; background: #f0f4ff; color: #2563eb; border-radius: 16px; font-size: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid #dbeafe; }
.recommend-tag-item:hover { background: #dbeafe; }
.recommend-tag-active { background: #2563eb; color: #fff; border-color: #2563eb; }
.qa-card { background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.qa-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #f0f0f0; }
.qa-header-left { display: flex; align-items: center; gap: 8px; }
.qa-title { font-size: 14px; font-weight: 600; color: #1f2937; }
.qa-body { max-height: 360px; overflow-y: auto; padding: 16px 20px; }
.qa-empty { text-align: center; padding: 20px 0; }
.qa-empty-icon { font-size: 36px; margin-bottom: 8px; }
.qa-empty-title { font-size: 14px; color: #1f2937; font-weight: 500; margin-bottom: 4px; }
.qa-empty-desc { font-size: 12px; color: #9ca3af; margin-bottom: 16px; }
.qa-suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.qa-suggestion-item { padding: 6px 14px; background: #f0f4ff; color: #2563eb; border-radius: 16px; font-size: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid #dbeafe; }
.qa-suggestion-item:hover { background: #dbeafe; }
.qa-messages { display: flex; flex-direction: column; gap: 12px; }
.qa-message { display: flex; gap: 8px; }
.qa-message-user { flex-direction: row-reverse; }
.qa-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.qa-bubble { max-width: 75%; }
.qa-message-user .qa-bubble { background: #2563eb; color: #fff; border-radius: 12px 4px 12px 12px; padding: 10px 14px; }
.qa-message-ai .qa-bubble { background: #f8f9fa; color: #1f2937; border-radius: 4px 12px 12px 12px; padding: 10px 14px; }
.qa-bubble-text { font-size: 13px; line-height: 1.6; }
.qa-bubble-extra { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.qa-extra-item { font-size: 12px; color: inherit; display: flex; align-items: flex-start; gap: 4px; }
.qa-message-user .qa-extra-item { color: #e0e7ff; }
.qa-input-area { display: flex; gap: 8px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.qa-input { flex: 1; }
.qa-send-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; }
.preview-dialog :deep(.el-dialog__body) { padding: 20px; }
.preview-content { font-size: 13px; color: #4b5563; line-height: 1.8; white-space: pre-wrap; }
</style>