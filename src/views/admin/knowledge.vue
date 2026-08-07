<template>
  <div class="knowledge-page">
    <el-page-header @back="router.back()" class="page-back-header">
      <template #content>
        <div class="page-title-wrap">
          <div class="page-title">知识库管理</div>
          <div class="page-subtitle">构建覆盖人社全业务领域的动态知识库，为智能问答、公文引用、审核依据提供知识支撑</div>
        </div>
      </template>
    </el-page-header>

    <!-- 顶部统计卡片 -->
    <div class="stat-cards-row">
      <div class="stat-card stat-1">
        <div class="stat-value">328</div>
        <div class="stat-label">文档总数</div>
      </div>
      <div class="stat-card stat-2">
        <div class="stat-value">12.4K</div>
        <div class="stat-label">知识切片数</div>
      </div>
      <div class="stat-card stat-3">
        <div class="stat-value">98.7%</div>
        <div class="stat-label">入库覆盖率</div>
      </div>
      <div class="stat-card stat-4">
        <div class="stat-value">156</div>
        <div class="stat-label">待审核</div>
      </div>
    </div>

    <!-- 主内容区分栏布局 -->
    <div class="main-layout-row">
      <!-- 左侧：知识分类树 -->
      <div class="sidebar-col">
        <div class="tree-card">
          <div class="tree-header">
            <span class="tree-title">知识分类体系</span>
          </div>
          <el-tree
            :data="categoryTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            :default-expanded-keys="['cat-all', 'cat-employment', 'cat-social']"
            @node-click="handleSelectCategory"
          >
            <template #default="{ data }">
              <span class="tree-node-label">
                <el-icon v-if="data.icon"><component :is="data.icon" /></el-icon>
                {{ data.name }}
                <el-tag v-if="data.count" size="small" type="info" effect="dark" class="doc-count-tag">{{ data.count }}</el-tag>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：文档管理主体 -->
      <div class="content-col">
        <el-tabs v-model="activeTab" type="card">
          <!-- 1. 全部文档管理 -->
          <el-tab-pane label="全部文档" name="docs">
            <div class="tab-toolbar">
              <div class="toolbar-left">
                <el-input v-model="searchKey" placeholder="搜索文档标题/内容" clearable style="width: 240px">
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
                <el-select v-model="statusFilter" placeholder="发布状态" clearable style="width: 140px">
                  <el-option label="全部状态" value="" />
                  <el-option label="已发布" value="published" />
                  <el-option label="待审核" value="pending" />
                  <el-option label="草稿" value="draft" />
                </el-select>
                <el-select v-model="typeFilter" placeholder="知识类型" clearable style="width: 140px">
                  <el-option label="全部类型" value="" />
                  <el-option label="政策文件" value="政策" />
                  <el-option label="办事指南" value="办事指南" />
                  <el-option label="业务规范" value="业务规范" />
                  <el-option label="常见问题" value="FAQ" />
                  <el-option label="案例解析" value="案例" />
                </el-select>
              </div>
              <div class="toolbar-right">
                <el-button @click="showBatchUploadDialog = true">
                  <el-icon><Upload /></el-icon> 批量导入
                </el-button>
                <el-button type="primary" @click="showUploadDialog = true">
                  <el-icon><Plus /></el-icon> 上传文档
                </el-button>
              </div>
            </div>
            <el-table :data="filteredDocs" stripe style="width: 100%">
              <el-table-column prop="title" label="文档标题" min-width="220" show-overflow-tooltip />
              <el-table-column prop="category" label="分类" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="version" label="版本" width="80" />
              <el-table-column prop="uploader" label="上传人" width="100" />
              <el-table-column prop="uploadTime" label="上传时间" width="160" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" text type="primary" @click="handleView(row)">查看</el-button>
                  <el-button size="small" text type="primary" @click="handleVersionHistory(row)">版本</el-button>
                  <el-button
                    v-if="row.status !== 'published'"
                    size="small"
                    text
                    type="success"
                    @click="handlePublish(row)"
                  >
                    发布
                  </el-button>
                  <el-button
                    v-else
                    size="small"
                    text
                    type="warning"
                    @click="handleUnpublish(row)"
                  >
                    下架
                  </el-button>
                  <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 2. 批量上传区 -->
          <el-tab-pane label="批量导入" name="batch">
            <div class="batch-upload-area">
              <el-upload
                drag
                :auto-upload="false"
                multiple
                :file-list="batchFileList"
                @change="handleBatchFileChange"
                style="width: 100%"
              >
                <el-icon :size="48"><UploadFilled /></el-icon>
                <div class="upload-text">拖拽多个文件到此处或点击上传</div>
                <div class="upload-hint">支持批量上传 PDF / Word / Excel / TXT 格式，最多同时上传 50 个文件</div>
              </el-upload>
              <div v-if="batchFileList.length > 0" class="batch-progress-section">
                <div class="progress-header">
                  <span class="progress-title">AI 解析 & 向量化入库进度</span>
                  <span class="progress-percent">{{ parseProgress }}%</span>
                </div>
                <el-progress :percentage="parseProgress" :status="parseProgress === 100 ? 'success' : undefined" />
                <div class="progress-stats">
                  <span>文件总数: {{ batchFileList.length }}</span>
                  <span>已完成: {{ parsedCount }}</span>
                  <span>失败: {{ failedCount }}</span>
                </div>
              </div>
              <div class="batch-actions" style="margin-top: 20px; text-align: right;">
                <el-button @click="clearBatchFiles">清空文件</el-button>
                <el-button type="primary" @click="startBatchParse" :loading="isParsing">
                  <el-icon><MagicStick /></el-icon> 开始批量解析
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- 3. 抓取配置 -->
          <el-tab-pane label="抓取配置" name="crawler">
            <div class="tab-toolbar">
              <div></div>
              <el-button type="primary" @click="showCrawlerDialog = true">
                <el-icon><Plus /></el-icon> 新增抓取源
              </el-button>
            </div>
            <el-table :data="crawlerSources" stripe style="width: 100%">
              <el-table-column prop="name" label="抓取源名称" width="200" />
              <el-table-column prop="url" label="源 URL" min-width="280" show-overflow-tooltip />
              <el-table-column prop="frequency" label="抓取频率" width="130" />
              <el-table-column prop="lastCrawlTime" label="上次抓取" width="170" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140">
                <template #default="{ row }">
                  <el-button size="small" text type="primary">立即抓取</el-button>
                  <el-button size="small" text type="danger">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 4. 版本归档 -->
          <el-tab-pane label="版本归档" name="versions">
            <el-table :data="versionArchives" stripe style="width: 100%">
              <el-table-column prop="docTitle" label="文档标题" min-width="200" />
              <el-table-column prop="versionNo" label="版本号" width="100" />
              <el-table-column prop="effectTime" label="生效时间" width="170" />
              <el-table-column prop="expireTime" label="废止时间" width="170" />
              <el-table-column prop="operator" label="操作人" width="100" />
              <el-table-column prop="changeDesc" label="变更说明" show-overflow-tooltip />
              <el-table-column label="操作" width="130">
                <template #default="{ row }">
                  <el-button size="small" text type="primary">查看历史</el-button>
                  <el-button size="small" text type="success">恢复版本</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 5. 用户反馈处理 -->
          <el-tab-pane label="用户反馈处理" name="feedback">
            <el-table :data="feedbackList" stripe style="width: 100%">
              <el-table-column prop="user" label="反馈人" width="120" />
              <el-table-column prop="question" label="用户问题" min-width="180" show-overflow-tooltip />
              <el-table-column prop="feedbackType" label="反馈类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.feedbackType === '错误' ? 'danger' : 'warning'">
                    {{ row.feedbackType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="relatedDoc" label="关联文档" min-width="160" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.status === '待处理' ? 'warning' : 'success'">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="submitTime" label="提交时间" width="170" />
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" text type="primary">查看详情</el-button>
                  <el-button size="small" text type="success">修正知识</el-button>
                  <el-button size="small" text type="info">标记已处理</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 上传文档对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传知识文档" width="520px">
      <el-form label-width="90px">
        <el-form-item label="文档分类">
          <el-tree-select
            v-model="uploadForm.categoryId"
            :data="categoryTreeFlat"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择知识分类"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="文档类型">
          <el-select v-model="uploadForm.type" placeholder="请选择文档类型" style="width: 100%">
            <el-option label="政策文件" value="政策" />
            <el-option label="办事指南" value="办事指南" />
            <el-option label="业务规范" value="业务规范" />
            <el-option label="常见问题" value="FAQ" />
            <el-option label="案例解析" value="案例" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="uploadForm.version" placeholder="例如：V1.0" />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload drag :auto-upload="false">
            <el-icon :size="32"><UploadFilled /></el-icon>
            <div class="upload-text">拖拽文件到此处或点击上传</div>
            <div class="upload-hint">支持 PDF / Word / Excel / TXT 格式，单文件最大 200MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload">上传并 AI 解析</el-button>
      </template>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog v-model="showVersionDialog" title="版本历史记录" width="720px">
      <el-timeline>
        <el-timeline-item v-for="v in versionHistoryList" :key="v.id" :timestamp="v.time">
          <div class="ver-item-content">
            <div class="ver-title">
              <strong>{{ v.version }}</strong> · {{ v.title }}
            </div>
            <div class="ver-desc" style="color: #6b7280; font-size: 13px;">
              操作人: {{ v.operator }} · 变更说明: {{ v.changeDesc }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <template #footer>
        <el-button @click="showVersionDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 抓取源配置对话框 -->
    <el-dialog v-model="showCrawlerDialog" title="新增抓取源配置" width="550px">
      <el-form label-width="100px">
        <el-form-item label="抓取源名称">
          <el-input v-model="crawlerForm.name" placeholder="例如：国家人社部官网政策栏目" />
        </el-form-item>
        <el-form-item label="源 URL">
          <el-input v-model="crawlerForm.url" placeholder="https://www.mohrss.gov.cn/xxx" />
        </el-form-item>
        <el-form-item label="抓取频率">
          <el-select v-model="crawlerForm.frequency" placeholder="选择频率" style="width: 100%">
            <el-option label="每小时" value="每小时" />
            <el-option label="每日" value="每日" />
            <el-option label="每周" value="每周" />
            <el-option label="每月" value="每月" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动解析">
          <el-switch v-model="crawlerForm.autoParse" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCrawlerDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCrawlerSource">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload, UploadFilled, MagicStick, Document, Files, ChatDotRound, Reading, Operation } from '@element-plus/icons-vue'
import { fetchKnowledgeDocs } from '@/api/mock'
import type { KnowledgeDoc } from '@/types'

const router = useRouter()

const activeTab = ref('docs')
const searchKey = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const showUploadDialog = ref(false)
const showBatchUploadDialog = ref(false)
const showVersionDialog = ref(false)
const showCrawlerDialog = ref(false)
const selectedCategoryId = ref('cat-all')

const docs = ref<KnowledgeDoc[]>([])
const batchFileList = ref<any[]>([])
const parseProgress = ref(0)
const parsedCount = ref(0)
const failedCount = ref(0)
const isParsing = ref(false)

const uploadForm = ref({ categoryId: '', type: '', version: 'V1.0' })

const crawlerForm = ref({
  name: '',
  url: '',
  frequency: '每日',
  autoParse: true
})

const categoryTree = ref([
  { id: 'cat-all', name: '全部分类', icon: Files, count: 328, children: [
    { id: 'cat-employment', name: '就业领域', icon: Operation, count: 86 },
    { id: 'cat-social', name: '社会保险', icon: Reading, count: 72 },
    { id: 'cat-labor', name: '劳动关系', icon: ChatDotRound, count: 54 },
    { id: 'cat-talent', name: '人才服务', icon: Document, count: 48 },
    { id: 'cat-person', name: '人事管理', icon: Document, count: 36 },
    { id: 'cat-general', name: '综合管理', icon: Document, count: 32 }
  ] }
])

const categoryTreeFlat = computed(() => {
  const flatten: any[] = []
  const walk = (nodes: any[]) => {
    nodes.forEach(n => {
      flatten.push({ id: n.id, name: n.name })
      if (n.children) walk(n.children)
    })
  }
  walk(categoryTree.value)
  return flatten
})

const crawlerSources = ref([
  { id: 'c1', name: '国家人社部官网政策栏目', url: 'https://www.mohrss.gov.cn/policy', frequency: '每日', lastCrawlTime: '2026-08-06 08:30:00', enabled: true },
  { id: 'c2', name: '省人社厅办事指南源', url: 'https://hrss.gd.gov.cn/guide', frequency: '每小时', lastCrawlTime: '2026-08-06 12:00:00', enabled: true },
  { id: 'c3', name: '本地政务公开网站', url: 'https://xxgk.xxx.gov.cn/...', frequency: '每周', lastCrawlTime: '2026-08-05 09:00:00', enabled: false }
])

const versionArchives = ref([
  { id: 'v1', docTitle: '关于就业补贴申领工作的通知', versionNo: 'V1.3', effectTime: '2026-07-01', expireTime: '-', operator: '李科长', changeDesc: '更新补贴标准至每人每月800元' },
  { id: 'v2', docTitle: '社会保险经办操作规程', versionNo: 'V2.1', effectTime: '2026-06-15', expireTime: '2026-07-31', operator: '王姐', changeDesc: '新增网上办理流程章节' },
  { id: 'v3', docTitle: '高层次人才引进入户实施办法', versionNo: 'V1.0', effectTime: '2026-05-01', expireTime: '-', operator: '张科', changeDesc: '首次正式发布' }
])

const feedbackList = ref([
  { id: 'f1', user: '窗口小张', question: '高温补贴发放条件是什么？', feedbackType: '不准确', relatedDoc: '夏季防暑降温通知', status: '待处理', submitTime: '2026-08-06 10:15:00' },
  { id: 'f2', user: '街道小李', question: '残疾人就业保障金...', feedbackType: '缺失', relatedDoc: '-', status: '待处理', submitTime: '2026-08-05 16:42:00' },
  { id: 'f3', user: '社区老陈', question: '退休人员资格认证...', feedbackType: '需优化', relatedDoc: '养老待遇领取指南', status: '已处理', submitTime: '2026-08-04 09:30:00' }
])

const versionHistoryList = ref<any[]>([])

const filteredDocs = computed(() => {
  return docs.value.filter((d) => {
    if (searchKey.value && !d.title.includes(searchKey.value)) return false
    if (statusFilter.value && d.status !== statusFilter.value) return false
    if (typeFilter.value && d.type !== typeFilter.value) return false
    return true
  })
})

const getStatusTagType = (s: string) => {
  if (s === 'published') return 'success'
  if (s === 'pending') return 'warning'
  return 'info'
}

const getStatusText = (s: string) => {
  const m: Record<string, string> = { published: '已发布', pending: '待审核', draft: '草稿' }
  return m[s] || s
}

const handleSelectCategory = (data: any) => {
  selectedCategoryId.value = data.id
}

const handleView = (doc: any) => {
  ElMessage.info(`查看文档：${doc.title}`)
}

const handleVersionHistory = (doc: any) => {
  showVersionDialog.value = true
  versionHistoryList.value = [
    { id: '1', version: doc.version || 'V1.1', title: doc.title, time: '2026-08-01 发布', operator: '系统自动', changeDesc: '首次发布' },
    { id: '2', version: 'V1.0', title: doc.title, time: '2026-07-15 初稿', operator: '上传人', changeDesc: '文档初版入库' }
  ]
}

const handlePublish = (doc: any) => {
  doc.status = 'pending'
  ElMessage.success('文档已提交发布，等待审核')
}

const handleUnpublish = async (doc: any) => {
  await ElMessageBox.confirm(`确认下架文档「${doc.title}」吗？`, '提示', { type: 'warning' })
  doc.status = 'draft'
  ElMessage.success('文档已下架')
}

const handleDelete = async (doc: any) => {
  await ElMessageBox.confirm(`确认删除文档「${doc.title}」吗？`, '提示', { type: 'warning' })
  const idx = docs.value.indexOf(doc)
  if (idx > -1) docs.value.splice(idx, 1)
  ElMessage.success('文档已删除')
}

const handleBatchFileChange = (file: any) => {
  if (!batchFileList.value.some(f => f.name === file.name)) {
    batchFileList.value.push(file)
  }
}

const clearBatchFiles = () => {
  batchFileList.value = []
  parseProgress.value = 0
  parsedCount.value = 0
  failedCount.value = 0
}

const startBatchParse = async () => {
  if (batchFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  isParsing.value = true
  parseProgress.value = 0
  parsedCount.value = 0
  failedCount.value = 0
  const total = batchFileList.value.length
  for (let i = 1; i <= total; i++) {
    await new Promise(r => setTimeout(r, 500))
    parseProgress.value = Math.floor((i / total) * 100)
    parsedCount.value++
  }
  isParsing.value = false
  ElMessage.success(`批量解析完成，成功 ${parsedCount.value} 个文件`)
}

const saveCrawlerSource = () => {
  crawlerSources.value.push({ id: Date.now().toString(), ...crawlerForm.value, lastCrawlTime: '-', enabled: true })
  showCrawlerDialog.value = false
  ElMessage.success('抓取源配置已保存')
}

const handleUpload = () => {
  showUploadDialog.value = false
  ElMessage.success('文档上传成功，AI 正在自动解析、分片和向量化入库...')
}

onMounted(async () => {
  docs.value = await fetchKnowledgeDocs()
})
</script>

<style scoped>
.knowledge-page {
  height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-back-header {
  padding: 0;
}

.page-title-wrap {
  width: 100%;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border-radius: 12px;
  padding: 20px 24px;
}

.stat-1 { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
.stat-2 { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.stat-3 { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
.stat-4 { background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); }

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.main-layout-row {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.sidebar-col {
  width: 270px;
  flex-shrink: 0;
}

.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tree-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.tree-header {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  font-size: 14px;
}

.doc-count-tag {
  margin-left: auto;
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.batch-upload-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  margin-top: 20px;
}

.progress-title {
  font-weight: 600;
  font-size: 14px;
}

.progress-percent {
  color: #2563eb;
  font-weight: 600;
  font-size: 16px;
}

.progress-stats {
  display: flex;
  gap: 24px;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.upload-text {
  font-size: 15px;
  color: var(--text-primary);
  margin-top: 8px;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.ver-item-content {
  padding: 4px 0;
}

.ver-title {
  font-size: 14px;
}

.ver-desc {
  margin-top: 2px;
}
</style>
