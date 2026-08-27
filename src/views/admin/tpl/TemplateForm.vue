<template>
  <div class="tpl-form">
    <el-form :model="form" label-width="100px" label-position="top">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="模板名称" required>
            <el-input v-model="form.name" placeholder="如：关于XX工作的请示" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公文类型" required>
            <el-select v-model="form.type" style="width:100%">
              <el-option label="请示" value="请示" />
              <el-option label="通知" value="通知" />
              <el-option label="报告" value="报告" />
              <el-option label="批复" value="批复" />
              <el-option label="函" value="函" />
              <el-option label="审批表" value="审批表" />
              <el-option label="告知书" value="告知书" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="发文单位">
            <el-input v-model="form.org" placeholder="XX市人力资源和社会保障局" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发文字号">
            <el-input v-model="form.docNo" placeholder="X人社〔2026〕XX号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="公文标题">
        <el-input v-model="form.title" placeholder="关于【事项】的请示/通知/报告" />
      </el-form-item>
      <el-form-item label="共享范围" required>
        <el-radio-group v-model="form.scope">
          <el-radio value="private">个人私有</el-radio>
          <el-radio value="department">部门内部</el-radio>
          <el-radio value="public">公开共享</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="发布状态">
        <el-radio-group v-model="form.status">
          <el-radio value="draft">草稿</el-radio>
          <el-radio value="live">已发布</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="简要说明">
        <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="描述该模板的用途、适用场景" />
      </el-form-item>
      <el-form-item label="正文内容">
        <el-input v-model="form.body" type="textarea" :rows="10" placeholder="支持HTML格式公文正文内容" />
      </el-form-item>
    </el-form>
    <div class="form-footer">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="doSave" :disabled="!form.name || !form.type">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface Props {
  template: null | {
    id: string
    name: string
    type: string
    scope: string
    org: string
    docNo: string
    title: string
    desc: string
    body: string
    status: string
  }
  currentUser: { id: string }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [data: Record<string, any>]
  cancel: []
}>()

const form = reactive({
  name: '',
  type: '通知',
  scope: 'private',
  org: '',
  docNo: '',
  title: '',
  desc: '',
  body: '',
  status: 'draft',
})

watch(() => props.template, (tpl) => {
  if (tpl) {
    form.name = tpl.name || ''
    form.type = tpl.type || '通知'
    form.scope = (tpl.scope as any) || 'private'
    form.org = tpl.org || ''
    form.docNo = tpl.docNo || ''
    form.title = tpl.title || ''
    form.desc = tpl.desc || ''
    form.body = tpl.body || ''
    form.status = tpl.status || 'draft'
  } else {
    form.name = ''
    form.type = '通知'
    form.scope = 'private'
    form.org = ''
    form.docNo = ''
    form.title = ''
    form.desc = ''
    form.body = ''
    form.status = 'draft'
  }
}, { immediate: true, deep: true })

function doSave() {
  emit('save', { ...form })
}
</script>

<style scoped>
.tpl-form {
  padding: 0;
}
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}
</style>
