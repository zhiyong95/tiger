<template>
  <div class="policy-page">
    <el-row :gutter="20">
      <!-- 左侧：政策输入 -->
      <el-col :span="8">
        <div class="page-card" style="margin-bottom: 20px">
          <div class="page-header">
            <div class="page-title" style="font-size: 16px">政策研究</div>
          </div>
          <el-form label-width="80px">
            <el-form-item label="政策文件">
              <el-upload
                class="upload-area"
                drag
                :auto-upload="false"
                :on-change="handleFileChange"
              >
                <el-icon :size="32"><UploadFilled /></el-icon>
                <div class="upload-text">拖拽文件到此处或点击上传</div>
                <div class="upload-hint">支持 PDF、Word、TXT 格式</div>
              </el-upload>
            </el-form-item>
            <el-form-item label="或输入URL">
              <el-input v-model="policyUrl" placeholder="输入政策文件URL" />
            </el-form-item>
            <el-form-item label="研究类型">
              <el-select v-model="researchType" style="width: 100%">
                <el-option label="政策摘要" value="summary" />
                <el-option label="新旧对比" value="compare" />
                <el-option label="地区对比" value="region" />
                <el-option label="解读报告" value="interpret" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleResearch"
                :loading="researching"
                style="width: 100%"
              >
                <el-icon><Reading /></el-icon> 开始研究
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：研究结果 -->
      <el-col :span="16">
        <div class="page-card result-panel" style="height: calc(100vh - 136px)">
          <div v-if="!researchResult" class="result-empty">
            <el-icon :size="48" color="#c0c4cc"><Reading /></el-icon>
            <p class="empty-title">上传政策文件开始研究</p>
            <p class="empty-desc">支持政策摘要、新旧对比、地区对比和解读报告</p>
          </div>

          <div v-else class="result-body">
            <div class="result-header">
              <h3>{{ researchResult.title }}</h3>
              <el-tag type="success">{{ researchTypeLabels[researchType] }}</el-tag>
            </div>

            <div class="result-content" v-html="researchResult.content"></div>

            <!-- 标签建议 -->
            <div v-if="researchResult.tags" class="tags-section">
              <div class="section-title">建议标签</div>
              <div class="tag-list">
                <el-tag
                  v-for="tag in researchResult.tags"
                  :key="tag"
                  class="policy-tag"
                  closable
                  @close="removeTag(tag)"
                >
                  {{ tag }}
                </el-tag>
                <el-button size="small" text type="primary" @click="showAddTag = true">
                  + 添加标签
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const policyUrl = ref('')
const researchType = ref('summary')
const researching = ref(false)
const showAddTag = ref(false)

const researchResult = ref<{
  title: string
  content: string
  tags?: string[]
} | null>(null)

const researchTypeLabels: Record<string, string> = {
  summary: '政策摘要',
  compare: '新旧对比',
  region: '地区对比',
  interpret: '解读报告',
}

const handleFileChange = () => {
  ElMessage.success('文件已选择')
}

const handleResearch = async () => {
  researching.value = true
  await new Promise((resolve) => setTimeout(resolve, 2000))

  researchResult.value = {
    title: '《关于延续实施部分减负稳岗扩就业政策措施的通知》政策摘要',
    content: `
      <h4>一、政策背景</h4>
      <p>为巩固拓展脱贫攻坚成果，促进高校毕业生等青年就业创业，继续实施部分减负稳岗扩就业政策措施。</p>

      <h4>二、主要对象</h4>
      <p>不裁员少裁员的参保企业、就业困难人员、高校毕业生、退役军人等重点群体。</p>

      <h4>三、核心条件</h4>
      <ul>
        <li>失业保险稳岗返还：参保企业上年度未裁员或裁员率不高于5.5%</li>
        <li>一次性扩岗补助：招用毕业年度高校毕业生并签订劳动合同</li>
        <li>就业补贴：经认定的就业困难人员实现灵活就业</li>
      </ul>

      <h4>四、补贴标准</h4>
      <ul>
        <li>稳岗返还：大型企业返还30%，中小微企业返还60%</li>
        <li>扩岗补助：每招用1人补助1000元</li>
        <li>灵活就业社保补贴：不超过实际缴费的2/3</li>
      </ul>

      <h4>五、办理流程</h4>
      <p>企业通过当地人社网上服务平台申报，经办机构审核后直接返还至企业社保账户。</p>
    `,
    tags: ['稳岗返还', '就业补贴', '扩岗补助', '中小微企业', '高校毕业生'],
  }

  researching.value = false
  ElMessage.success('研究完成')
}

const removeTag = (tag: string) => {
  if (researchResult.value?.tags) {
    researchResult.value.tags = researchResult.value.tags.filter((t) => t !== tag)
  }
}
</script>

<style scoped>
.policy-page {
  height: calc(100vh - 96px);
}

.upload-area {
  width: 100%;
}

.upload-text {
  font-size: 14px;
  color: #374151;
  margin-top: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.result-panel {
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
  padding: 10px 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.result-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.result-content {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
}

.result-content :deep(h4) {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 16px 0 8px;
}

.result-content :deep(ul) {
  padding-left: 20px;
  margin: 8px 0;
}

.result-content :deep(li) {
  margin-bottom: 4px;
}

.tags-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.policy-tag {
  cursor: default;
}
</style>
