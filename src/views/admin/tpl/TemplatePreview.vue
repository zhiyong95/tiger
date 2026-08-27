<template>
  <div class="tpl-preview">
    <div class="preview-header">
      <h3>{{ tpl?.name }}</h3>
      <div class="preview-meta">
        <el-tag size="small">{{ tpl?.type }}</el-tag>
        <span v-if="tpl?.org" class="org-text">{{ tpl?.org }}</span>
      </div>
    </div>
    <div class="preview-body">
      <div class="body-content" v-html="tpl?.body"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  tpl: null | {
    name: string
    type: string
    org: string
    body: string
  }
}

defineProps<Props>()
</script>

<style scoped>
.tpl-preview {
  font-family: SimSun, serif;
}
.preview-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.preview-header h3 {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: #0a1e5c;
}
.preview-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}
.org-text {
  font-size: 13px;
  color: #6b7280;
}
.preview-body {
  margin-top: 16px;
  min-height: 300px;
}
.body-content {
  font-size: 15px;
  line-height: 1.8;
  color: #1f2937;
}
.body-content h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 20px 0 12px;
  text-align: center;
}
.body-content p {
  margin: 8px 0;
  text-indent: 2em;
}
</style>
