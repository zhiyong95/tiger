<template>
  <div class="policy-tags">
    <div class="page-header">
      <h2>政策标签管理</h2>
      <span class="subtitle">政策分类、适用对象、事项标签配置</span>
      <el-button type="primary" size="small" style="margin-left:auto" @click="handleAddTag">+ 新增标签</el-button>
    </div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">分类体系</span></template>
          <div v-for="cat in categories" :key="cat.name" class="cat-item" :class="{ active: activeCat === cat.name }" @click="onCatChange(cat.name)">
            <el-icon :color="cat.color" style="margin-right:8px"><component :is="cat.icon" /></el-icon>
            <span>{{ cat.name }}</span>
            <el-tag size="small" style="margin-left:auto">{{ cat.count }}</el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">标签列表 - {{ activeCat }}</span></template>
          <el-table :data="currentTags" stripe style="width:100%">
            <el-table-column prop="name" label="标签名称" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="关联文档" width="100" align="center" />
            <el-table-column label="操作" width="140" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="handleEditTag(row as any)">编辑</el-button>
                <el-button size="small" text type="danger" @click="handleDeleteTag(row as any)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑标签对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" :close-on-click-modal="false">
      <el-form :model="tagForm" label-width="100px">
        <el-form-item label="所属分类">
          <el-select v-model="tagForm.category" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat.name" :label="cat.name" :value="cat.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签名称">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签类型">
          <el-select v-model="tagForm.type" placeholder="请选择类型">
            <el-option label="适用对象" value="适用对象" />
            <el-option label="补贴类型" value="补贴类型" />
            <el-option label="事项标签" value="事项标签" />
            <el-option label="政策类型" value="政策类型" />
            <el-option label="业务领域" value="业务领域" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTag">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder } from '@element-plus/icons-vue'

interface TagItem {
  id?: number
  category: string
  name: string
  type: string
  count: number
}

const activeCat = ref('就业')
const dialogVisible = ref(false)
const dialogTitle = ref('新增标签')
const editingId = ref<number | null>(null)
let nextId = 10

const categories = ref([
  { name: '就业', icon: Folder, color: '#2563eb', count: 28 },
  { name: '社保', icon: Folder, color: '#059669', count: 24 },
  { name: '劳动关系', icon: Folder, color: '#d97706', count: 16 },
  { name: '人才', icon: Folder, color: '#7c3aed', count: 20 },
  { name: '人事', icon: Folder, color: '#0891b2', count: 12 },
  { name: '综合', icon: Folder, color: '#6b7280', count: 18 },
])

const allTags = ref<TagItem[]>([
  // 就业分类标签
  { id: 1, category: '就业', name: '就业困难人员', type: '适用对象', count: 12 },
  { id: 2, category: '就业', name: '高校毕业生', type: '适用对象', count: 18 },
  { id: 3, category: '就业', name: '退役军人', type: '适用对象', count: 8 },
  { id: 4, category: '就业', name: '灵活就业人员', type: '适用对象', count: 15 },
  { id: 5, category: '就业', name: '社保补贴', type: '补贴类型', count: 10 },
  { id: 6, category: '就业', name: '岗位补贴', type: '补贴类型', count: 6 },
  { id: 7, category: '就业', name: '培训补贴', type: '补贴类型', count: 7 },
  { id: 8, category: '就业', name: '技能提升', type: '事项标签', count: 5 },
  // 社保分类标签
  { id: 9, category: '社保', name: '养老保险', type: '业务领域', count: 22 },
  { id: 10, category: '社保', name: '医疗保险', type: '业务领域', count: 19 },
  { id: 11, category: '社保', name: '失业保险', type: '业务领域', count: 14 },
  { id: 12, category: '社保', name: '工伤保险', type: '业务领域', count: 11 },
  // 劳动关系分类标签
  { id: 13, category: '劳动关系', name: '劳动合同', type: '政策类型', count: 9 },
  { id: 14, category: '劳动关系', name: '劳动仲裁', type: '事项标签', count: 7 },
  // 人才分类标签
  { id: 15, category: '人才', name: '高层次人才', type: '适用对象', count: 13 },
  { id: 16, category: '人才', name: '技能人才', type: '适用对象', count: 17 },
])

const tagForm = ref<Partial<TagItem>>({
  category: '就业',
  name: '',
  type: '适用对象',
})

const currentTags = computed(() => allTags.value.filter(t => t.category === activeCat.value))

const onCatChange = (name: string) => {
  activeCat.value = name
  ElMessage.info(`当前已切换至「${name}」分类`)
}

const getTypeTagType = (type: string) => {
  const map: Record<string, any> = {
    '适用对象': 'success',
    '补贴类型': 'warning',
    '事项标签': 'info',
    '政策类型': 'primary',
    '业务领域': '',
  }
  return map[type] || ''
}

const handleAddTag = () => {
  dialogTitle.value = '新增标签'
  editingId.value = null
  tagForm.value = {
    category: activeCat.value,
    name: '',
    type: '适用对象',
  }
  dialogVisible.value = true
}

const handleEditTag = (row: TagItem) => {
  dialogTitle.value = '编辑标签'
  editingId.value = row.id || null
  tagForm.value = { ...row }
  dialogVisible.value = true
}

const handleDeleteTag = (row: TagItem) => {
  ElMessageBox.confirm(
    `确定要删除标签「${row.name}」吗？删除后关联文档将失去此标签。`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idx = allTags.value.findIndex(t => t.id === row.id)
    if (idx !== -1) allTags.value.splice(idx, 1)
    // 更新分类计数
    const cat = categories.value.find(c => c.name === row.category)
    if (cat) cat.count = Math.max(0, cat.count - 1)
    ElMessage.success('标签已删除')
  }).catch(() => {})
}

const handleSaveTag = () => {
  if (!tagForm.value.name || !tagForm.value.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  if (!tagForm.value.category) {
    ElMessage.warning('请选择所属分类')
    return
  }
  if (!tagForm.value.type) {
    ElMessage.warning('请选择标签类型')
    return
  }
  if (editingId.value === null) {
    // 新增
    nextId++
    allTags.value.push({
      id: nextId,
      category: tagForm.value.category,
      name: tagForm.value.name,
      type: tagForm.value.type,
      count: 0,
    })
    const cat = categories.value.find(c => c.name === tagForm.value.category)
    if (cat) cat.count += 1
    ElMessage.success(`标签「${tagForm.value.name}」已新增`)
  } else {
    // 编辑
    const idx = allTags.value.findIndex(t => t.id === editingId.value)
    if (idx !== -1) {
      allTags.value[idx] = {
        ...allTags.value[idx],
        ...tagForm.value as Pick<TagItem, 'category' | 'name' | 'type'>
      }
    }
    ElMessage.success(`标签「${tagForm.value.name}」已更新`)
  }
  dialogVisible.value = false
}
</script>
<style scoped>
.policy-tags { padding: 0; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; }
.subtitle { font-size: 13px; color: #9ca3af; }
.cat-item { display: flex; align-items: center; padding: 10px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; font-size: 14px; transition: all 0.2s; }
.cat-item:hover { background: #f3f4f6; }
.cat-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
</style>
