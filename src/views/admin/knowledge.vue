<template>
  <div class="admin-page">
    <div class="page-card">
      <div class="page-header">
        <div>
          <div class="page-title">知识库管理</div>
          <div class="page-subtitle">管理政策文件、办事指南、业务口径等知识文档</div>
        </div>
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon> 上传文档
        </el-button>
      </div>

      <!-- 分类筛选 -->
      <div class="filter-tabs">
        <el-radio-group v-model="filterCategory" size="default">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="政策">政策</el-radio-button>
          <el-radio-button value="办事指南">办事指南</el-radio-button>
          <el-radio-button value="业务口径">业务口径</el-radio-button>
          <el-radio-button value="公文规范">公文规范</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 文档列表 -->
      <el-table :data="filteredDocs" stripe style="width: 100%">
        <el-table-column prop="title" label="文档标题" min-width="200" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="uploader" label="上传人" width="100" />
        <el-table-column prop="uploadTime" label="上传时间" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary">查看</el-button>
            <el-button
              size="small"
              text
              :type="row.status === 'published' ? 'warning' : 'success'"
              @click="togglePublish(row)"
            >
              {{ row.status === 'published' ? '下架' : '发布' }}
            </el-button>
            <el-button size="small" text type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传知识文档" width="500px">
      <el-form label-width="80px">
        <el-form-item label="文档分类">
          <el-select v-model="uploadForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="政策" value="政策" />
            <el-option label="办事指南" value="办事指南" />
            <el-option label="业务口径" value="业务口径" />
            <el-option label="公文规范" value="公文规范" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload drag :auto-upload="false">
            <el-icon :size="32"><UploadFilled /></el-icon>
            <div class="upload-text">拖拽文件到此处或点击上传</div>
            <div class="upload-hint">支持 PDF、Word、Excel、TXT 格式</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload">上传并解析</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchKnowledgeDocs } from '@/api/mock'
import type { KnowledgeDoc } from '@/types'

const docs = ref<KnowledgeDoc[]>([])
const filterCategory = ref('')
const showUploadDialog = ref(false)
const uploadForm = ref({ category: '' })

onMounted(async () => {
  docs.value = await fetchKnowledgeDocs()
})

const filteredDocs = computed(() => {
  if (!filterCategory.value) return docs.value
  return docs.value.filter((d) => d.category === filterCategory.value)
})

const togglePublish = (doc: KnowledgeDoc) => {
  doc.status = doc.status === 'published' ? 'draft' : 'published'
  ElMessage.success(`已${doc.status === 'published' ? '发布' : '下架'}文档`)
}

const handleUpload = () => {
  showUploadDialog.value = false
  ElMessage.success('文档上传成功，正在解析...')
}
</script>

<style scoped>
.admin-page {
  height: calc(100vh - 96px);
}

.filter-tabs {
  margin-bottom: 16px;
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
</style>
