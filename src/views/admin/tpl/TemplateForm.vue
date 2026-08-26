<template>
  <div class="tpl-form">
    <el-form :model="form" label-width="100px" label-position="top">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="模板名称" required>
            <el-input v-model="form.name" placeholder="请输入模板名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公文类型" required>
            <el-select v-model="form.type" style="width:100%">
              <el-option label="通知" value="通知" />
              <el-option label="请示" value="请示" />
              <el-option label="报告" value="报告" />
              <el-option label="纪要" value="纪要" />
              <el-option label="函" value="函" />
              <el-option label="告知书" value="告知书" />
              <el-option label="审批表" value="审批表" />
              <el-option label="清单" value="清单" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发文机关名称">
            <el-input v-model="form.org" placeholder="如：XX市人力资源和社会保障局" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发文字号">
            <el-input v-model="form.docNo" placeholder="如：X人社〔2026〕XX号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="模板说明">
        <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="简要说明模板用途" />
      </el-form-item>

      <!-- 可见范围 -->
      <el-form-item label="可见范围" required>
        <div class="scope-cards">
          <div
            class="scope-card" :class="{ active: form.scope === 'public' }"
            @click="form.scope = 'public'"
          >
            <el-icon :size="28" color="#10b981"><Share /></el-icon>
            <div class="scope-title">公开</div>
            <div class="scope-desc">全单位所有科室可见</div>
          </div>
          <div
            class="scope-card" :class="{ active: form.scope === 'department' }"
            @click="form.scope = 'department'"
          >
            <el-icon :size="28" color="#f59e0b"><OfficeBuilding /></el-icon>
            <div class="scope-title">本部门</div>
            <div class="scope-desc">仅创建人所在科室可见</div>
          </div>
          <div
            class="scope-card" :class="{ active: form.scope === 'private' }"
            @click="form.scope = 'private'"
          >
            <el-icon :size="28" color="#6b7280"><Lock /></el-icon>
            <div class="scope-title">仅自己</div>
            <div class="scope-desc">仅创建人本人可见</div>
          </div>
        </div>
      </el-form-item>

      <!-- 公文正文 -->
      <el-form-item label="公文正文">
        <div class="editor-toolbar">
          <el-button-group size="small">
            <el-button @click="execCmd('bold')"><b>B</b></el-button>
            <el-button @click="execCmd('italic')"><i>I</i></el-button>
            <el-button @click="execCmd('underline')"><u>U</u></el-button>
            <el-button @click="execCmd('insertOrderedList')">1.</el-button>
            <el-button @click="execCmd('insertUnorderedList')">•</el-button>
            <el-button @click="insertPlaceholder">【占位符】</el-button>
          </el-button-group>
        </div>
        <div
          ref="editorRef"
          class="editor-body"
          contenteditable="true"
          @input="onEditorInput"
          v-html="form.body"
        />
      </el-form-item>

      <!-- 底部按钮 -->
      <el-form-item>
        <div class="form-actions">
          <el-button @click="$emit('cancel')">取消</el-button>
          <el-button type="primary" @click="saveDraft">存为草稿</el-button>
          <el-button type="primary" @click="saveAndPublish" style="background:#ff7c00;border-color:#ff7c00">
            保存并发布
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Share, OfficeBuilding, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  template: any
  currentUser: any
}>()

const emit = defineEmits<{
  save: [data: any]
  cancel: []
}>()

const editorRef = ref<HTMLDivElement | null>(null)

const form = reactive({
  name: '',
  type: '通知',
  org: '',
  docNo: '',
  desc: '',
  scope: 'private',
  status: 'draft',
  body: '',
})

onMounted(() => {
  if (props.template) {
    Object.assign(form, {
      name: props.template.name || '',
      type: props.template.type || '通知',
      org: props.template.org || '',
      docNo: props.template.docNo || '',
      desc: props.template.desc || '',
      scope: props.template.scope || 'private',
      body: props.template.body || '',
    })
  }
})

function execCmd(cmd: string) {
  document.execCommand(cmd, false)
  editorRef.value?.focus()
}

function insertPlaceholder() {
  document.execCommand('insertText', false, '【占位】')
  editorRef.value?.focus()
}

function onEditorInput() {
  form.body = editorRef.value?.innerHTML || ''
}

function saveDraft() {
  emit('save', { ...form, status: 'draft' })
}

function saveAndPublish() {
  if (!form.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  emit('save', { ...form, status: 'live' })
}
</script>

<style scoped>
.tpl-form { padding: 4px 0; }
.scope-cards { display: flex; gap: 16px; width: 100%; }
.scope-card {
  flex: 1; border: 2px solid #e5e7eb; border-radius: 12px;
  padding: 16px; cursor: pointer; text-align: center;
  transition: all 0.2s; background: #fafafa;
}
.scope-card:hover { border-color: #2563eb; background: #f0f4ff; }
.scope-card.active { border-color: #2563eb; background: #e8f0fe; }
.scope-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 8px; }
.scope-desc { font-size: 12px; color: #6b7280; margin-top: 4px; }
.editor-toolbar { margin-bottom: 8px; }
.editor-body {
  min-height: 280px; border: 1px solid #d1d5db; border-radius: 8px;
  padding: 16px; font-size: 14px; line-height: 1.8; outline: none;
  background: #fff; font-family: 'SimSun', '宋体', serif;
}
.editor-body:focus { border-color: #2563eb; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; width: 100%; }
</style>