<template>
  <div class="tpl-preview">
    <!-- 红头文件样式 -->
    <div class="red-header">
      <div class="red-header-line"></div>
      <h1 class="red-header-title">{{ template?.org || '（发文机关）' }}</h1>
      <div class="red-header-sep"></div>
      <div class="doc-no" v-if="template?.docNo">{{ template?.docNo }}</div>
      <div class="preview-body" v-html="template?.body || '<p>（暂无正文内容）</p>'" />
    </div>
    <!-- 权限信息卡 -->
    <div class="meta-card">
      <div class="meta-item">
        <span class="meta-label">模板名称</span>
        <span class="meta-value">{{ template?.name }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">公文类型</span>
        <el-tag size="small">{{ template?.type }}</el-tag>
      </div>
      <div class="meta-item">
        <span class="meta-label">可见范围</span>
        <el-tag :type="scopeTagType" size="small">{{ scopeLabel }}</el-tag>
      </div>
      <div class="meta-item">
        <span class="meta-label">创建人</span>
        <span class="meta-value">{{ creatorName }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">创建时间</span>
        <span class="meta-value">{{ template?.createdAt }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">使用次数</span>
        <span class="meta-value">{{ template?.usage }} 次</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ template: any }>()

const scopeLabel = computed(() => {
  const map: Record<string, string> = { public: '公开', department: '本部门', private: '仅自己' }
  return map[props.template?.scope] || '未知'
})

const scopeTagType = computed<'success' | 'warning' | 'info'>(() => {
  const map: Record<string, 'success' | 'warning' | 'info'> = { public: 'success', department: 'warning', private: 'info' }
  return map[props.template?.scope] || 'info'
})

const creatorName = computed(() => {
  const users: Record<string, string> = { u1: '赵磊', u2: '张伟', u3: '王芳', u4: '李明', u5: '孙悦', u6: '陈静' }
  return users[props.template?.createdBy] || props.template?.createdBy
})
</script>

<style scoped>
.tpl-preview { max-height: 60vh; overflow-y: auto; }
.red-header {
  background: #fff; padding: 32px 40px;
  border: 1px solid #e5e7eb; border-radius: 8px;
  font-family: 'SimSun', '宋体', serif;
}
.red-header-line { height: 2px; background: #c00; margin-bottom: 16px; }
.red-header-title {
  text-align: center; font-size: 22px; font-weight: 700;
  color: #c00; letter-spacing: 4px; margin: 0 0 4px;
  font-family: 'SimSun', '宋体', serif;
}
.red-header-sep { height: 1px; background: #c00; margin: 8px 0 16px; }
.doc-no { text-align: center; font-size: 14px; color: #333; margin-bottom: 16px; }
.preview-body {
  font-size: 14px; line-height: 2; color: #333;
  padding: 0 8px;
}
.preview-body :deep(h2) { text-align: center; font-size: 18px; margin: 16px 0; }
.preview-body :deep(p) { text-indent: 2em; margin: 4px 0; }
.meta-card {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  margin-top: 16px; padding: 16px; background: #f8f9fa;
  border-radius: 8px; border: 1px solid #e5e7eb;
}
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 12px; color: #6b7280; }
.meta-value { font-size: 13px; color: #1f2937; font-weight: 500; }
</style>