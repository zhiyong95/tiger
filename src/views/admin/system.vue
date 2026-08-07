<template>
  <div class="sys-params">
    <div class="page-header">
      <h2>系统参数配置</h2>
      <span class="subtitle">模型参数、敏感词、文件限制、消息策略</span>
    </div>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">AI模型参数</span></template>
          <el-form label-width="140px" size="small">
            <el-form-item label="问答模型">
              <el-select v-model="qaModel" style="width:100%">
                <el-option label="Doubao-pro-32k" value="doubao-pro" />
                <el-option label="DeepSeek-V3" value="deepseek-v3" />
                <el-option label="Kimi-k2" value="kimi-k2" />
              </el-select>
            </el-form-item>
            <el-form-item label="公文生成模型">
              <el-select v-model="docModel" style="width:100%">
                <el-option label="Doubao-pro-32k" value="doubao-pro" />
                <el-option label="DeepSeek-V3" value="deepseek-v3" />
              </el-select>
            </el-form-item>
            <el-form-item label="温度参数">
              <el-slider v-model="temperature" :min="0" :max="1" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="最大Token数">
              <el-input-number v-model="maxTokens" :min="512" :max="8192" :step="512" />
            </el-form-item>
          </el-form>
        </el-card>
        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">敏感词管理</span></template>
          <el-input v-model="sensitiveWords" type="textarea" :rows="4" placeholder="每行一个敏感词" />
          <div style="margin-top:8px;text-align:right">
            <el-button type="primary" size="small">保存</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">文件上传限制</span></template>
          <el-form label-width="140px" size="small">
            <el-form-item label="最大文件大小">
              <el-select v-model="maxFileSize" style="width:100%">
                <el-option label="10MB" value="10" />
                <el-option label="20MB" value="20" />
                <el-option label="50MB" value="50" />
              </el-select>
            </el-form-item>
            <el-form-item label="允许格式">
              <el-checkbox-group v-model="allowedFormats">
                <el-checkbox label="pdf" value="pdf" />
                <el-checkbox label="docx" value="docx" />
                <el-checkbox label="xlsx" value="xlsx" />
                <el-checkbox label="txt" value="txt" />
                <el-checkbox label="jpg" value="jpg" />
                <el-checkbox label="png" value="png" />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">消息与通知策略</span></template>
          <el-form label-width="140px" size="small">
            <el-form-item label="消息保留天数">
              <el-input-number v-model="msgRetention" :min="7" :max="365" />
            </el-form-item>
            <el-form-item label="新政策通知">
              <el-switch v-model="policyNotify" />
            </el-form-item>
            <el-form-item label="超时提醒">
              <el-switch v-model="timeoutAlert" />
            </el-form-item>
            <el-form-item label="提醒频率">
              <el-select v-model="alertFreq" style="width:100%">
                <el-option label="实时" value="realtime" />
                <el-option label="每日一次" value="daily" />
                <el-option label="每周一次" value="weekly" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const qaModel = ref('doubao-pro')
const docModel = ref('doubao-pro')
const temperature = ref(0.3)
const maxTokens = ref(2048)
const sensitiveWords = ref('政治敏感词1\n政治敏感词2\n违规词')
const maxFileSize = ref('20')
const allowedFormats = ref(['pdf', 'docx', 'xlsx', 'txt'])
const msgRetention = ref(90)
const policyNotify = ref(true)
const timeoutAlert = ref(true)
const alertFreq = ref('realtime')
</script>
<style scoped>
.sys-params { padding: 0; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin: 0; }
.subtitle { font-size: 13px; color: #9ca3af; }
</style>