<template>
  <div class="audit-page">
    <!-- 模式切换 Tab -->
    <div class="mode-tabs">
      <div class="mode-tab" :class="{ active: auditMode === 'batch' }" @click="auditMode = 'batch'">
        <el-icon><UploadFilled /></el-icon>
        <span>批量审核模式</span>
      </div>
      <div class="mode-tab" :class="{ active: auditMode === 'single' }" @click="auditMode = 'single'">
        <el-icon><User /></el-icon>
        <span>单人审核模式</span>
      </div>
    </div>

    <!-- ========== 批量审核模式 ========== -->
    <div v-if="auditMode === 'batch'" class="batch-mode">
      <!-- 导入操作区 -->
      <div class="import-area">
        <div class="import-left">
          <div class="import-title">
            <div class="title-bar"></div>
            <span>批量导入审核</span>
          </div>
          <div class="import-actions">
            <el-upload
              :auto-upload="false"
              :on-change="handleBatchFileChange"
              :file-list="batchFileList"
              accept=".xlsx,.xls,.csv"
              :show-file-list="false"
            >
              <el-button type="primary" size="large">
                <el-icon><Upload /></el-icon> 上传文件
              </el-button>
            </el-upload>
            <el-button size="large" @click="downloadTemplate">
              <el-icon><Download /></el-icon> 模板下载
            </el-button>
          </div>
          <div class="import-tip">支持 Excel (.xlsx/.xls)、CSV 格式，单个文件不超过 50MB</div>
          <!-- 文件解析进度 -->
          <div v-if="batchParsing" class="parse-progress">
            <el-progress :percentage="parseProgress" :stroke-width="12" striped striped-flow />
            <span class="parse-text">AI 正在解析并预检数据...</span>
          </div>
          <!-- 已选文件 -->
          <div v-if="selectedBatchFile" class="selected-file">
            <el-icon color="#10b981"><Document /></el-icon>
            <span class="file-name">{{ selectedBatchFile }}</span>
            <el-icon class="file-remove" @click="clearBatchFile"><Close /></el-icon>
          </div>
        </div>
        <div class="import-right">
          <div class="import-title">
            <div class="title-bar"></div>
            <span>数据预检</span>
          </div>
          <div v-if="preCheckResult" class="precheck-result">
            <div class="precheck-row">
              <span class="precheck-label">总记录数</span>
              <span class="precheck-value">{{ preCheckResult.total }}</span>
            </div>
            <div class="precheck-row">
              <span class="precheck-label">有效记录</span>
              <span class="precheck-value success">{{ preCheckResult.valid }}</span>
            </div>
            <div class="precheck-row">
              <span class="precheck-label">格式错误</span>
              <span class="precheck-value danger">{{ preCheckResult.errors }}</span>
            </div>
            <div class="precheck-row">
              <span class="precheck-label">重复数据</span>
              <span class="precheck-value warning">{{ preCheckResult.duplicates }}</span>
            </div>
          </div>
          <div v-else class="precheck-empty">
            <el-icon :size="32" color="#c0c4cc"><Document /></el-icon>
            <p>上传文件后自动进行数据预检</p>
          </div>
        </div>
      </div>

      <!-- 批量审核结果 -->
      <div v-if="batchResults.length > 0" class="batch-results">
        <!-- 汇总统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card stat-total">
            <div class="stat-icon"><el-icon><UserFilled /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">总导入人数</div>
              <div class="stat-value">{{ batchResults.length }}</div>
            </div>
          </div>
          <div class="stat-card stat-pass">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">审核通过</div>
              <div class="stat-value">{{ batchPassCount }} <span class="stat-pct">{{ batchPassPct }}%</span></div>
            </div>
          </div>
          <div class="stat-card stat-fail">
            <div class="stat-icon"><el-icon><CircleClose /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">审核不通过</div>
              <div class="stat-value">{{ batchFailCount }} <span class="stat-pct">{{ batchFailPct }}%</span></div>
            </div>
          </div>
          <div class="stat-card stat-review">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">待人工复核</div>
              <div class="stat-value">{{ batchReviewCount }} <span class="stat-pct">{{ batchReviewPct }}%</span></div>
            </div>
          </div>
          <div class="stat-card stat-time">
            <div class="stat-icon"><el-icon><Timer /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">平均审核耗时</div>
              <div class="stat-value">1.2<span class="stat-unit">s</span></div>
            </div>
          </div>
        </div>

        <!-- 批量操作栏 -->
        <div class="batch-toolbar">
          <div class="toolbar-left">
            <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
            <el-select v-model="filterConclusion" placeholder="按结论筛选" size="small" style="width: 140px; margin-left: 12px">
              <el-option label="全部" value="" />
              <el-option label="通过" value="pass" />
              <el-option label="不通过" value="fail" />
              <el-option label="待复核" value="review" />
            </el-select>
          </div>
          <div class="toolbar-right">
            <el-button size="small" @click="batchExport">
              <el-icon><Download /></el-icon> 批量导出
            </el-button>
            <el-button size="small" type="success" @click="batchMarkDone">
              <el-icon><Check /></el-icon> 批量标记已处理
            </el-button>
            <el-button size="small" type="warning" @click="batchTransferReview">
              <el-icon><Switch /></el-icon> 批量转人工复核
            </el-button>
          </div>
        </div>

        <!-- 审核结果表格 -->
        <el-table :data="filteredBatchResults" stripe border style="width: 100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="index" label="序号" width="60" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="idCard" label="身份证号" width="160">
            <template #default="{ row }">{{ maskIdCard(row.idCard) }}</template>
          </el-table-column>
          <el-table-column prop="businessType" label="申报业务类型" width="140" />
          <el-table-column prop="conclusion" label="审核结论" width="110">
            <template #default="{ row }">
              <el-tag :type="conclusionType(row.conclusion)" size="small">{{ conclusionText(row.conclusion) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag :type="riskType(row.riskLevel)" size="small" effect="dark">{{ row.riskLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="不符合原因" min-width="200">
            <template #default="{ row }">
              <el-popover v-if="row.reason" placement="top" trigger="click" :width="400">
                <template #reference>
                  <span class="reason-link">{{ row.reasonShort }}</span>
                </template>
                <div class="reason-detail">
                  <div v-for="(r, i) in row.reasons" :key="i" class="reason-item">
                    <el-tag :type="reasonTagType(r.type)" size="small">{{ r.type }}</el-tag>
                    <p class="reason-text">{{ r.desc }}</p>
                    <p class="reason-policy">政策依据：{{ r.policy }}</p>
                    <p class="reason-suggest">整改建议：{{ r.suggest }}</p>
                  </div>
                </div>
              </el-popover>
              <span v-else style="color: #10b981">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewBatchDetail(row)">详情</el-button>
              <el-button link type="warning" size="small" @click="manualReview(row)">复核</el-button>
              <el-button link type="info" size="small" @click="exportSingle(row)">导出</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 批量空状态 -->
      <div v-if="batchResults.length === 0 && !batchParsing" class="batch-empty">
        <el-icon :size="56" color="#c0c4cc"><UploadFilled /></el-icon>
        <p class="batch-empty-title">上传人员名单，开启批量智能审核</p>
        <p class="batch-empty-desc">支持 Excel / CSV 格式，AI 自动完成材料校验与规则匹配</p>
      </div>
    </div>

    <!-- ========== 单人审核模式 ========== -->
    <div v-if="auditMode === 'single'" class="single-mode">
      <!-- 人员检索 -->
      <div class="single-search">
        <el-input v-model="searchKeyword" placeholder="按姓名、身份证号、申报编号搜索" style="width: 360px" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="searchPerson">
          <el-icon><Search /></el-icon> 搜索
        </el-button>
        <el-button @click="showAddForm = true">
          <el-icon><Plus /></el-icon> 新增单人审核
        </el-button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <el-table :data="searchResults" stripe border>
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="idCard" label="身份证号" width="160">
            <template #default="{ row }">{{ maskIdCard(row.idCard) }}</template>
          </el-table-column>
          <el-table-column prop="businessType" label="申报业务" width="140" />
          <el-table-column prop="status" label="审核状态" width="110">
            <template #default="{ row }">
              <el-tag :type="conclusionType(row.status)" size="small">{{ conclusionText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" @click="enterSingleAudit(row)">进入审核</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 三栏审核详情 -->
      <div v-if="currentAuditPerson" class="audit-detail">
        <!-- 左栏：人员基本信息 -->
        <div class="detail-col detail-left">
          <div class="col-title">人员基本信息</div>
          <div class="info-list">
            <div class="info-row"><span class="info-label">姓名</span><span class="info-value">{{ currentAuditPerson.name }}</span></div>
            <div class="info-row"><span class="info-label">身份证号</span><span class="info-value">{{ currentAuditPerson.idCard }}</span></div>
            <div class="info-row"><span class="info-label">联系电话</span><span class="info-value">{{ currentAuditPerson.phone }}</span></div>
            <div class="info-row"><span class="info-label">所在单位</span><span class="info-value">{{ currentAuditPerson.company }}</span></div>
            <div class="info-row"><span class="info-label">申报业务</span><span class="info-value">{{ currentAuditPerson.businessType }}</span></div>
            <div class="info-row"><span class="info-label">申报时间</span><span class="info-value">{{ currentAuditPerson.applyTime }}</span></div>
            <div class="info-row"><span class="info-label">当前节点</span><span class="info-value">{{ currentAuditPerson.currentNode }}</span></div>
          </div>
        </div>

        <!-- 中栏：申报材料与数据 -->
        <div class="detail-col detail-center">
          <div class="col-title">申报材料与数据</div>
          <div class="material-section">
            <div class="material-title">申请表单</div>
            <div class="form-preview">
              <div class="form-row"><span>姓名</span><span class="form-val">{{ currentAuditPerson.name }}</span></div>
              <div class="form-row"><span>身份证号</span><span class="form-val">{{ currentAuditPerson.idCard }}</span></div>
              <div class="form-row"><span>业务类型</span><span class="form-val highlight">{{ currentAuditPerson.businessType }}</span></div>
              <div class="form-row"><span>申报事项</span><span class="form-val">{{ currentAuditPerson.applyItem }}</span></div>
            </div>
          </div>
          <div class="material-section">
            <div class="material-title">上传材料</div>
            <div class="material-grid">
              <div v-for="mat in currentAuditPerson.materials" :key="mat.name" class="material-item" @click="previewMaterial(mat)">
                <el-icon :size="28" color="#2563eb"><Document /></el-icon>
                <span class="material-name">{{ mat.name }}</span>
              </div>
            </div>
          </div>
          <div class="material-section">
            <div class="material-title">跨部门数据比对</div>
            <div class="compare-list">
              <div v-for="c in currentAuditPerson.crossCheck" :key="c.dept" class="compare-item">
                <span class="compare-dept">{{ c.dept }}</span>
                <el-tag :type="c.passed ? 'success' : 'danger'" size="small">{{ c.passed ? '一致' : '异常' }}</el-tag>
                <span class="compare-desc">{{ c.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右栏：AI 审核结论面板 -->
        <div class="detail-col detail-right">
          <div class="col-title">AI 审核结论</div>
          <!-- 风险等级 -->
          <div class="risk-gauge">
            <div class="gauge-circle" :class="currentAuditPerson.riskLevel">
              <span class="gauge-text">{{ currentAuditPerson.riskLevel === 'low' ? '低' : currentAuditPerson.riskLevel === 'medium' ? '中' : '高' }}</span>
            </div>
            <span class="gauge-label">风险等级</span>
          </div>
          <!-- 审核结论 -->
          <div class="audit-conclusion" :class="currentAuditPerson.conclusion">
            <el-icon :size="20"><component :is="currentAuditPerson.conclusion === 'pass' ? 'CircleCheck' : currentAuditPerson.conclusion === 'fail' ? 'CircleClose' : 'WarningFilled'" /></el-icon>
            <span>{{ currentAuditPerson.conclusion === 'pass' ? '审核通过' : currentAuditPerson.conclusion === 'fail' ? '审核不通过' : '待人工复核' }}</span>
          </div>
          <!-- 疑点清单 -->
          <div v-if="currentAuditPerson.doubts.length > 0" class="doubt-list">
            <div class="doubt-title">疑点清单</div>
            <div v-for="(d, i) in currentAuditPerson.doubts" :key="i" class="doubt-item">
              <el-icon color="#f59e0b"><WarningFilled /></el-icon>
              <span>{{ d }}</span>
            </div>
          </div>
          <!-- 政策依据 -->
          <div class="policy-ref">
            <div class="doubt-title">政策依据</div>
            <p v-for="(p, i) in currentAuditPerson.policies" :key="i" class="policy-item">{{ p }}</p>
          </div>
          <!-- 人工操作区 -->
          <div class="manual-actions">
            <div class="doubt-title">人工操作</div>
            <div class="action-btns">
              <el-button type="success" size="small" @click="singleAction('pass')">通过</el-button>
              <el-button type="danger" size="small" @click="singleAction('reject')">退回</el-button>
              <el-button type="warning" size="small" @click="singleAction('correct')">要求补正</el-button>
              <el-button size="small" @click="singleAction('escalate')">转上级审核</el-button>
            </div>
            <el-input v-model="singleComment" type="textarea" :rows="3" placeholder="请输入审核意见..." style="margin-top: 12px" />
          </div>
        </div>
      </div>

      <!-- 审核时间轴 -->
      <div v-if="currentAuditPerson" class="audit-timeline-section">
        <div class="col-title" style="margin-bottom: 16px">审核留痕</div>
        <el-timeline>
          <el-timeline-item v-for="(t, i) in currentAuditPerson.timeline" :key="i" :timestamp="t.time" :type="t.type" placement="top">
            <div class="timeline-content">
              <span class="timeline-step">{{ t.step }}</span>
              <span class="timeline-op">操作人：{{ t.operator }}</span>
              <span class="timeline-comment">{{ t.comment }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 单人空状态 -->
      <div v-if="!currentAuditPerson && searchResults.length === 0" class="single-empty">
        <el-icon :size="56" color="#c0c4cc"><User /></el-icon>
        <p class="single-empty-title">搜索或录入人员，开始单人精细审核</p>
        <p class="single-empty-desc">支持按姓名、身份证号、申报编号检索已有申报记录</p>
      </div>
    </div>

    <!-- 新增单人审核对话框 -->
    <el-dialog v-model="showAddForm" title="新增单人审核录入" width="520px">
      <el-form label-width="90px">
        <el-form-item label="姓名"><el-input v-model="addForm.name" placeholder="请输入姓名" /></el-form-item>
        <el-form-item label="身份证号"><el-input v-model="addForm.idCard" placeholder="请输入身份证号" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="addForm.phone" placeholder="请输入联系电话" /></el-form-item>
        <el-form-item label="所在单位"><el-input v-model="addForm.company" placeholder="请输入所在单位" /></el-form-item>
        <el-form-item label="申报业务">
          <el-select v-model="addForm.businessType" placeholder="请选择" style="width: 100%">
            <el-option label="退休审批" value="退休审批" />
            <el-option label="社保待遇" value="社保待遇" />
            <el-option label="就业补贴" value="就业补贴" />
            <el-option label="技能培训" value="技能培训" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报事项"><el-input v-model="addForm.applyItem" placeholder="请输入申报事项" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddForm = false">取消</el-button>
        <el-button type="primary" @click="submitAddForm">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 材料预览对话框 -->
    <el-dialog v-model="showMaterialPreview" title="材料预览" width="600px">
      <div class="material-preview-body">
        <el-icon :size="64" color="#2563eb"><Document /></el-icon>
        <p style="margin-top: 16px; font-size: 16px; font-weight: 600">{{ previewMaterialName }}</p>
        <p style="color: #6b7280; margin-top: 8px">材料预览功能，实际项目中将展示文件内容</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ========== 模式切换 ==========
const auditMode = ref<'batch' | 'single'>('batch')

// ========== 批量审核 ==========
const batchFileList = ref<any[]>([])
const selectedBatchFile = ref('')
const batchParsing = ref(false)
const parseProgress = ref(0)

const preCheckResult = ref<{ total: number; valid: number; errors: number; duplicates: number } | null>(null)

const batchResults = ref<any[]>([])
const selectAll = ref(false)
const filterConclusion = ref('')
const selectedRows = ref<any[]>([])

const handleBatchFileChange = (file: any) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
    ElMessage.error('仅支持 Excel (.xlsx/.xls) 和 CSV 格式文件')
    return
  }
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 50MB')
    return
  }
  selectedBatchFile.value = file.name
  batchParsing.value = true
  parseProgress.value = 0
  const timer = setInterval(() => {
    parseProgress.value += Math.random() * 20
    if (parseProgress.value >= 100) {
      parseProgress.value = 100
      clearInterval(timer)
      batchParsing.value = false
      preCheckResult.value = { total: 156, valid: 148, errors: 5, duplicates: 3 }
      generateBatchResults()
      ElMessage.success('文件解析完成，共 156 条记录')
    }
  }, 300)
}

const clearBatchFile = () => {
  selectedBatchFile.value = ''
  preCheckResult.value = null
  batchResults.value = []
  ElMessage.info('已清除文件')
}

const downloadTemplate = () => {
  ElMessage.success('模板下载中...（模拟）')
}

const generateBatchResults = () => {
  const names = ['张明', '李华', '王芳', '赵强', '刘伟', '陈静', '杨帆', '周婷', '吴磊', '孙丽', '马军', '朱敏', '胡波', '郭萍', '林峰']
  const types = ['退休审批', '社保待遇', '就业补贴', '灵活就业社保补贴', '技能培训补贴']
  const conclusions = ['pass', 'pass', 'pass', 'fail', 'review']
  const risks = ['low', 'low', 'medium', 'high', 'medium']
  const reasonTypes = ['材料缺失类', '信息不一致类', '资格不达标类', '重复申报类', '数据异常类', '政策限制类', '跨部门核验未通过类']
  const policies = ['《社会保险法》第16条', '《就业促进法》第52条', '人社部令第45号', '《工伤保险条例》第14条', '《失业保险条例》第15条']

  batchResults.value = names.map((name, i) => {
    const conclusion = conclusions[i % conclusions.length]
    const risk = risks[i % risks.length]
    const hasReason = conclusion !== 'pass'
    const reasons = hasReason
      ? Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, j) => ({
          type: reasonTypes[(i + j) % reasonTypes.length],
          desc: `第${i + 1}条记录${reasonTypes[(i + j) % reasonTypes.length]}问题，具体字段定位：${['身份证号', '联系电话', '缴费年限', '申报单位', '银行卡信息'][j % 5]}`,
          policy: policies[(i + j) % policies.length],
          suggest: `请补充或修正${['身份证正反面', '联系电话', '社保证明', '申报单位信息', '银行卡信息'][j % 5]}`,
        }))
      : []
    return {
      index: i + 1,
      name,
      idCard: `37010219900101${String(1000 + i).padStart(4, '0')}`,
      businessType: types[i % types.length],
      conclusion,
      riskLevel: risk,
      reasonShort: hasReason ? reasons[0].desc.slice(0, 30) + '...' : '',
      reasons,
      processed: false,
    }
  })
}

const batchPassCount = computed(() => batchResults.value.filter(r => r.conclusion === 'pass').length)
const batchFailCount = computed(() => batchResults.value.filter(r => r.conclusion === 'fail').length)
const batchReviewCount = computed(() => batchResults.value.filter(r => r.conclusion === 'review').length)
const batchPassPct = computed(() => batchResults.value.length ? Math.round(batchPassCount.value / batchResults.value.length * 100) : 0)
const batchFailPct = computed(() => batchResults.value.length ? Math.round(batchFailCount.value / batchResults.value.length * 100) : 0)
const batchReviewPct = computed(() => batchResults.value.length ? Math.round(batchReviewCount.value / batchResults.value.length * 100) : 0)

const filteredBatchResults = computed(() => {
  if (!filterConclusion.value) return batchResults.value
  return batchResults.value.filter(r => r.conclusion === filterConclusion.value)
})

const handleSelectAll = (val: any) => {
  selectedRows.value = val ? [...filteredBatchResults.value] : []
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const batchExport = () => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先选择要导出的记录'); return }
  ElMessage.success(`已导出 ${selectedRows.value.length} 条审核结果（含不符合原因明细）`)
}

const batchMarkDone = () => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先选择记录'); return }
  selectedRows.value.forEach(r => { r.processed = true })
  ElMessage.success(`已批量标记 ${selectedRows.value.length} 条为"已处理"`)
}

const batchTransferReview = () => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先选择记录'); return }
  selectedRows.value.forEach(r => { r.conclusion = 'review' })
  ElMessage.success(`已将 ${selectedRows.value.length} 条转人工复核`)
}

const viewBatchDetail = (row: any) => { ElMessage.info(`查看 ${row.name} 的审核详情`) }
const manualReview = (row: any) => { ElMessage.info(`对 ${row.name} 进行人工复核`) }
const exportSingle = (row: any) => { ElMessage.success(`已导出 ${row.name} 的审核结果`) }

const conclusionType = (c: string) => {
  const map: Record<string, any> = { pass: 'success', fail: 'danger', review: 'warning' }
  return map[c] || 'info'
}
const conclusionText = (c: string) => {
  const map: Record<string, string> = { pass: '通过', fail: '不通过', review: '待复核' }
  return map[c] || c
}
const riskType = (r: string) => {
  const map: Record<string, any> = { low: 'success', medium: 'warning', high: 'danger' }
  return map[r] || 'info'
}
const reasonTagType = (t: string) => {
  const map: Record<string, any> = { '材料缺失类': 'warning', '信息不一致类': 'danger', '资格不达标类': 'danger', '重复申报类': 'info', '数据异常类': 'warning', '政策限制类': 'danger', '跨部门核验未通过类': 'danger' }
  return map[t] || 'info'
}

const maskIdCard = (id: string) => id.length > 10 ? id.slice(0, 6) + '****' + id.slice(-4) : id

// ========== 单人审核 ==========
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const currentAuditPerson = ref<any>(null)
const showAddForm = ref(false)
const singleComment = ref('')
const showMaterialPreview = ref(false)
const previewMaterialName = ref('')

const addForm = ref({ name: '', idCard: '', phone: '', company: '', businessType: '', applyItem: '' })

const searchPerson = () => {
  if (!searchKeyword.value.trim()) { ElMessage.warning('请输入搜索关键词'); return }
  searchResults.value = [
    { name: '张明', idCard: '370102199001011234', businessType: '退休审批', status: 'review', phone: '13800138001', company: '济南市人社局', applyTime: '2026-08-15 09:30', currentNode: 'AI初审', applyItem: '正常退休审批', materials: [{ name: '身份证正反面.pdf' }, { name: '退休申请表.docx' }, { name: '社保证明.pdf' }], crossCheck: [{ dept: '公安系统', passed: true, desc: '身份信息一致' }, { dept: '民政系统', passed: true, desc: '婚姻登记记录匹配' }, { dept: '税务系统', passed: false, desc: '收入数据存在差异' }], riskLevel: 'medium', conclusion: 'review', doubts: ['税务系统收入数据与申报信息存在差异', '缴费年限临界值需人工确认'], policies: ['《社会保险法》第16条：参加基本养老保险的个人，达到法定退休年龄时累计缴费满十五年的，按月领取基本养老金', '人社部发〔2024〕12号：关于规范退休审批流程的通知'], timeline: [{ step: 'AI初审', time: '2026-08-15 09:31', type: 'primary', operator: '系统AI', comment: '自动完成材料校验，发现2处疑点' }, { step: '人工复核', time: '2026-08-15 10:00', type: 'warning', operator: '待处理', comment: '等待审核人员确认' }] },
    { name: '李华', idCard: '370102198505052345', businessType: '就业补贴', status: 'pass', phone: '13900139002', company: '历下区就业中心', applyTime: '2026-08-14 14:20', currentNode: '已完成', applyItem: '高校毕业生就业补贴', materials: [{ name: '毕业证.pdf' }, { name: '劳动合同.pdf' }], crossCheck: [{ dept: '学信网', passed: true, desc: '学历信息一致' }, { dept: '社保系统', passed: true, desc: '参保状态正常' }], riskLevel: 'low', conclusion: 'pass', doubts: [], policies: ['《就业促进法》第52条'], timeline: [{ step: 'AI初审', time: '2026-08-14 14:21', type: 'success', operator: '系统AI', comment: '全部校验通过' }, { step: '人工确认', time: '2026-08-14 15:00', type: 'success', operator: '王审核员', comment: '确认通过' }] },
  ]
  ElMessage.success(`找到 ${searchResults.value.length} 条匹配记录`)
}

const enterSingleAudit = (row: any) => {
  currentAuditPerson.value = row
  ElMessage.success(`已进入 ${row.name} 的审核详情`)
}

const previewMaterial = (mat: any) => {
  previewMaterialName.value = mat.name
  showMaterialPreview.value = true
}

const singleAction = (action: string) => {
  const map: Record<string, string> = { pass: '通过', reject: '退回', correct: '要求补正', escalate: '转上级审核' }
  if (!singleComment.value && action !== 'pass') { ElMessage.warning('请填写审核意见'); return }
  ElMessage.success(`已${map[action]}${currentAuditPerson.value?.name}的审核申请`)
  singleComment.value = ''
}

const submitAddForm = () => {
  if (!addForm.value.name || !addForm.value.idCard) { ElMessage.warning('请填写姓名和身份证号'); return }
  ElMessage.success(`已提交 ${addForm.value.name} 的单人审核申请`)
  showAddForm.value = false
  addForm.value = { name: '', idCard: '', phone: '', company: '', businessType: '', applyItem: '' }
}
</script>

<style scoped>
.audit-page {
  padding: 0;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.3s;
}
.mode-tab:hover {
  background: #f0f7ff;
  color: #2563eb;
}
.mode-tab.active {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 2px 8px rgba(37,99,235,0.3);
}

/* 批量模式 */
.import-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.import-left, .import-right {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.import-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}
.title-bar {
  width: 3px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
}
.import-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.import-tip {
  font-size: 12px;
  color: #9ca3af;
}
.parse-progress {
  margin-top: 16px;
}
.parse-text {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
  display: block;
}
.selected-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}
.file-name {
  flex: 1;
  font-size: 13px;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-remove {
  cursor: pointer;
  color: #9ca3af;
  font-size: 16px;
}
.file-remove:hover {
  color: #ef4444;
}

.precheck-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.precheck-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 8px;
}
.precheck-label {
  font-size: 13px;
  color: #6b7280;
}
.precheck-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}
.precheck-value.success { color: #10b981; }
.precheck-value.danger { color: #ef4444; }
.precheck-value.warning { color: #f59e0b; }
.precheck-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  gap: 12px;
}
.precheck-empty p {
  font-size: 13px;
}

/* 汇总统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border-top: 3px solid transparent;
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.stat-total { border-top-color: #2563eb; }
.stat-pass { border-top-color: #10b981; }
.stat-fail { border-top-color: #ef4444; }
.stat-review { border-top-color: #f59e0b; }
.stat-time { border-top-color: #8b5cf6; }
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.stat-total .stat-icon { background: #eff6ff; color: #2563eb; }
.stat-pass .stat-icon { background: #ecfdf5; color: #10b981; }
.stat-fail .stat-icon { background: #fef2f2; color: #ef4444; }
.stat-review .stat-icon { background: #fffbeb; color: #f59e0b; }
.stat-time .stat-icon { background: #f5f3ff; color: #8b5cf6; }
.stat-info { flex: 1; }
.stat-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; color: #1f2937; }
.stat-pct { font-size: 13px; font-weight: 400; color: #6b7280; margin-left: 4px; }
.stat-unit { font-size: 12px; font-weight: 400; color: #6b7280; }

/* 批量工具栏 */
.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 批量空状态 */
.batch-empty, .single-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.batch-empty-title, .single-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
}
.batch-empty-desc, .single-empty-desc {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 8px;
}

.reason-link {
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}
.reason-link:hover {
  text-decoration: underline;
}
.reason-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reason-item {
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
}
.reason-text {
  font-size: 13px;
  color: #1f2937;
  margin: 6px 0 4px;
}
.reason-policy {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}
.reason-suggest {
  font-size: 12px;
  color: #2563eb;
  margin: 4px 0 0;
}

/* 单人模式 */
.single-search {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}
.search-results {
  margin-bottom: 20px;
}

/* 三栏详情 */
.audit-detail {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  gap: 20px;
  margin-bottom: 20px;
}
.detail-col {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.col-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}
.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 12px;
  color: #9ca3af;
}
.info-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.material-section {
  margin-bottom: 20px;
}
.material-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}
.form-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}
.form-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.form-row span:first-child {
  color: #6b7280;
}
.form-val {
  color: #1f2937;
  font-weight: 500;
}
.form-val.highlight {
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.material-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: #f0f7ff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.material-item:hover {
  border-color: #2563eb;
  background: #eff6ff;
  transform: translateY(-2px);
}
.material-name {
  font-size: 11px;
  color: #374151;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.compare-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.compare-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}
.compare-dept {
  font-weight: 600;
  color: #1f2937;
  min-width: 70px;
}
.compare-desc {
  color: #6b7280;
  font-size: 12px;
}

/* 右栏 */
.risk-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}
.gauge-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.gauge-circle.low { background: linear-gradient(135deg, #10b981, #059669); }
.gauge-circle.medium { background: linear-gradient(135deg, #f59e0b, #d97706); }
.gauge-circle.high { background: linear-gradient(135deg, #ef4444, #dc2626); }
.gauge-label {
  font-size: 12px;
  color: #6b7280;
}

.audit-conclusion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}
.audit-conclusion.pass { background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0; }
.audit-conclusion.fail { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
.audit-conclusion.review { background: #fffbeb; color: #f59e0b; border: 1px solid #fde68a; }

.doubt-list, .policy-ref {
  margin-bottom: 16px;
}
.doubt-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}
.doubt-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  padding: 6px 0;
}
.policy-item {
  font-size: 12px;
  color: #6b7280;
  padding: 6px 0;
  line-height: 1.6;
  border-bottom: 1px dashed #f0f0f0;
}

.manual-actions {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 时间轴 */
.audit-timeline-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  margin-top: 20px;
}
.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-step {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}
.timeline-op {
  font-size: 13px;
  color: #6b7280;
}
.timeline-comment {
  font-size: 13px;
  color: #374151;
}

.material-preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>
