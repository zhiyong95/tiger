<template>
  <div class="audit-page">
    <el-row :gutter="20">
      <!-- 左侧：审核输入 -->
      <el-col :span="8">
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">智能审核</div>
          </div>
          <el-form label-width="80px">
            <el-form-item label="审核事项">
              <el-select v-model="selectedMatter" placeholder="请选择审核事项" style="width: 100%">
                <el-option label="就业补贴资格预审" value="employment" />
                <el-option label="灵活就业社保补贴" value="flexible" />
              </el-select>
            </el-form-item>
            <el-form-item label="申请人姓名">
              <el-input v-model="applicant.name" placeholder="请输入申请人姓名" />
            </el-form-item>
            <el-form-item label="身份证号">
              <el-input v-model="applicant.idCard" placeholder="请输入身份证号" />
            </el-form-item>
            <el-form-item label="材料上传">
              <el-upload
                :auto-upload="false"
                :on-change="handleFileChange"
                :file-list="fileList"
                multiple
              >
                <el-button size="small" type="primary">
                  <el-icon><Upload /></el-icon> 上传材料
                </el-button>
                <template #tip>
                  <div class="upload-tip">支持身份证、申请表、证明材料等</div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleAudit"
                :loading="auditing"
                style="width: 100%"
              >
                <el-icon><Checked /></el-icon> 开始预审
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：审核结果 -->
      <el-col :span="16">
        <div class="page-card audit-result-panel" style="height: calc(100vh - 136px)">
          <div v-if="!auditResult" class="result-empty">
            <el-icon :size="48" color="#c0c4cc"><Checked /></el-icon>
            <p class="empty-title">填写信息后开始智能预审</p>
            <p class="empty-desc">AI将基于审核规则给出预审建议</p>
          </div>

          <div v-else class="result-body">
            <!-- 预审结论 -->
            <div class="conclusion-card" :class="auditResult.suggestion">
              <div class="conclusion-header">
                <el-icon :size="24">
                  <component :is="conclusionIcon" />
                </el-icon>
                <div>
                  <div class="conclusion-title">{{ conclusionTitle }}</div>
                  <div class="conclusion-desc">{{ auditResult.reason }}</div>
                </div>
              </div>
              <el-tag :type="conclusionTagType" size="large">{{ conclusionLabel }}</el-tag>
            </div>

            <!-- 命中规则 -->
            <div class="result-section">
              <div class="section-title">
                <el-icon color="#10b981"><CircleCheck /></el-icon>
                命中规则
              </div>
              <div class="rule-list">
                <div v-for="rule in auditResult.hitRules" :key="rule" class="rule-item">
                  <el-icon color="#10b981"><Check /></el-icon>
                  <span>{{ rule }}</span>
                </div>
              </div>
            </div>

            <!-- 缺件清单 -->
            <div v-if="auditResult.missingMaterials.length > 0" class="result-section">
              <div class="section-title">
                <el-icon color="#f59e0b"><Warning /></el-icon>
                缺件清单
              </div>
              <div class="missing-list">
                <div v-for="mat in auditResult.missingMaterials" :key="mat" class="missing-item">
                  <el-icon color="#f59e0b"><WarningFilled /></el-icon>
                  <span>{{ mat }}</span>
                </div>
              </div>
            </div>

            <!-- 人工复核 -->
            <div class="review-section">
              <div class="section-title">人工复核</div>
              <el-alert
                title="AI预审结论仅供参考，请以人工复核结果为准"
                type="info"
                :closable="false"
                style="margin-bottom: 12px"
              />
              <el-input
                v-model="reviewComment"
                type="textarea"
                :rows="3"
                placeholder="请输入复核意见..."
              />
              <div class="review-actions">
                <el-button type="success" @click="handleReview('confirm')">
                  <el-icon><CircleCheck /></el-icon> 确认通过
                </el-button>
                <el-button type="danger" @click="handleReview('reject')">
                  <el-icon><CircleClose /></el-icon> 退回
                </el-button>
                <el-button type="warning" @click="handleReview('return')">
                  <el-icon><RefreshLeft /></el-icon> 退回补正
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { submitAuditReview } from '@/api/mock'

const selectedMatter = ref('')
const auditing = ref(false)
const reviewComment = ref('')
const fileList = ref<any[]>([])

const applicant = ref({
  name: '',
  idCard: '',
})

const auditResult = ref<{
  suggestion: 'suggest_pass' | 'suggest_reject' | 'need_review'
  reason: string
  hitRules: string[]
  missingMaterials: string[]
} | null>(null)

const conclusionIcon = computed(() => {
  if (!auditResult.value) return 'InfoFilled'
  const map = { suggest_pass: 'CircleCheck', suggest_reject: 'CircleClose', need_review: 'WarningFilled' }
  return map[auditResult.value.suggestion]
})

const conclusionTitle = computed(() => {
  if (!auditResult.value) return ''
  const map = {
    suggest_pass: '建议通过',
    suggest_reject: '建议不通过',
    need_review: '需人工核实',
  }
  return map[auditResult.value.suggestion]
})

const conclusionLabel = computed(() => conclusionTitle.value)

const conclusionTagType = computed(() => {
  if (!auditResult.value) return 'info'
  const map = { suggest_pass: 'success', suggest_reject: 'danger', need_review: 'warning' }
  return map[auditResult.value.suggestion] as any
})

const handleFileChange = () => {
  // file change handler
}

const handleAudit = async () => {
  if (!selectedMatter.value) {
    ElMessage.warning('请选择审核事项')
    return
  }
  auditing.value = true
  await new Promise((resolve) => setTimeout(resolve, 2000))

  auditResult.value = {
    suggestion: 'suggest_pass',
    reason: '申请人符合就业补贴申请条件，年龄、参保状态、就业状态均满足要求。',
    hitRules: ['年龄18-60周岁', '参保满6个月', '非全日制就业', '未享受其他就业补贴'],
    missingMaterials: [],
  }

  auditing.value = false
  ElMessage.success('预审完成')
}

const handleReview = async (decision: 'confirm' | 'reject' | 'return') => {
  await submitAuditReview('1', decision, reviewComment.value)
  ElMessage.success(`已${decision === 'confirm' ? '确认通过' : decision === 'reject' ? '退回' : '退回补正'}`)
}
</script>

<style scoped>
.audit-page {
  height: calc(100vh - 96px);
}

.upload-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.audit-result-panel {
  overflow-y: auto;
}

.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-title {
  font-size: 16px;
  color: #6b7280;
  margin-top: 16px;
}

.empty-desc {
  font-size: 13px;
  margin-top: 8px;
}

.result-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}

.conclusion-card {
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.conclusion-card.suggest_pass {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.conclusion-card.suggest_reject {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.conclusion-card.need_review {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.conclusion-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.conclusion-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.conclusion-desc {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.result-section {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.rule-list, .missing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item, .missing-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  padding: 6px 0;
}

.review-section {
  padding: 16px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.review-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
</style>
