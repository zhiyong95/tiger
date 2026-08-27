<template>
  <div class="doc-types-page">
    <div class="top-bar">
      <el-input v-model="search" placeholder="搜索公文类型" clearable style="width:260px" />
      <el-button type="primary" @click="dialogVisible = true">+ 新增类型</el-button>
    </div>
    <el-table :data="typeList" stripe style="margin-top:16px">
      <el-table-column prop="code" label="类型编码" width="180" />
      <el-table-column prop="name" label="类型名称" width="180" />
      <el-table-column prop="desc" label="说明" />
      <el-table-column prop="count" label="关联模板数" width="140" align="center">
        <template #default="{ row }">
          <el-tag type="primary" size="small" effect="plain">{{ row.count }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="edit(row)">编辑</el-button>
          <el-button text size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑公文类型' : '新增公文类型'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="类型编码" required>
          <el-input v-model="form.code" placeholder="如：qingshi" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="类型名称" required>
          <el-input v-model="form.name" placeholder="如：请示" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.desc" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface DocType {
  code: string
  name: string
  desc: string
  count: number
}

const search = ref('')
const dialogVisible = ref(false)
const editing = ref<DocType | null>(null)

const typeList = ref<DocType[]>([
  { code: 'qingshi', name: '请示', desc: '向上级请求指示、批准事项', count: 12 },
  { code: 'tongzhi', name: '通知', desc: '发布、传达要求下级执行和周知的事项', count: 28 },
  { code: 'baogao', name: '报告', desc: '向上级汇报工作、反映情况', count: 19 },
  { code: 'pifu', name: '批复', desc: '答复下级请示事项', count: 7 },
  { code: 'han', name: '函', desc: '不相隶属单位之间商洽工作、询问和答复问题', count: 15 },
  { code: 'shenpibiao', name: '审批表', desc: '各类业务内部审核流转表单模板', count: 32 },
  { code: 'gaozhishu', name: '告知书', desc: '面向群众的各类行政文书、结果告知', count: 21 },
])

const form = reactive<DocType>({ code: '', name: '', desc: '', count: 0 })

const resultList = computed(() => typeList.value.filter(t => !search.value || t.name.includes(search.value) || t.desc.includes(search.value)))

function edit(t: any) {
  editing.value = t
  Object.assign(form, t)
  dialogVisible.value = true
}

async function remove(t: any) {
  if (t.count > 0) {
    ElMessage.warning('该类型下存在关联模板，无法删除')
    return
  }
  await ElMessageBox.confirm(`确认删除公文类型「${t.name}」吗？`, '提示', { type: 'warning' })
  const idx = typeList.value.findIndex(x => x.code === t.code)
  if (idx >= 0) typeList.value.splice(idx, 1)
  ElMessage.success('已删除')
}

function save() {
  if (!form.code || !form.name) {
    ElMessage.warning('请填写类型编码和名称')
    return
  }
  if (editing.value) {
    const idx = typeList.value.findIndex(x => x.code === editing.value!.code)
    if (idx >= 0) Object.assign(typeList.value[idx], form)
  } else {
    if (typeList.value.find(x => x.code === form.code)) {
      ElMessage.warning('类型编码已存在')
      return
    }
    typeList.value.push({ ...form, count: 0 })
  }
  dialogVisible.value = false
  editing.value = null
  ElMessage.success('保存成功')
}

watch(dialogVisible, v => {
  if (!v) { editing.value = null; Object.assign(form, { code: '', name: '', desc: '', count: 0 }) }
})
</script>
