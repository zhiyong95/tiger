<template>
  <div class="policy-page">
    <!-- 左侧边栏 340px -->
    <div class="policy-sidebar">
      <div class="upload-section">
        <div class="section-title"><span class="title-bar"></span>政策上传</div>
        <div class="url-input-area">
          <label class="input-label">政策文件链接（每行一条）</label>
          <el-input v-model="urlText" type="textarea" :rows="3" placeholder="https://example.com/policy1&#10;https://example.com/policy2" class="url-input" />
        </div>
        <div class="divider-text"><span>或</span></div>
        <div class="drop-zone" :class="{ 'drop-zone-active': isDragOver }" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
          <div class="drop-icon">📁</div>
          <div class="drop-text">点击或拖拽上传文件（可多选）</div>
          <div class="drop-hint">支持 PDF、Word、TXT 格式</div>
        </div>
        <input ref="fileInputRef" type="file" multiple accept=".pdf,.doc,.docx,.txt" style="display:none" @change="onFileSelected" />
        <div v-if="uploadedItems.length > 0" class="uploaded-list-section">
          <div class="list-header">
            <span class="list-title">已上传政策（{{ uploadedItems.length }}）</span>
            <el-button text size="small" type="danger" @click="clearAllItems">清空全部</el-button>
          </div>
          <div class="uploaded-list">
            <div v-for="(item, idx) in uploadedItems" :key="item.id" class="uploaded-item" :class="{'uploaded-item-error':item.status==='error'}" draggable="true">
              <span class="drag-handle">⠿</span>
              <span class="item-icon"><template v-if="item.type==='url'">🔗</template><template v-else-if="item.format==='pdf'">📕</template><template v-else>📄</template></span>
              <span class="item-name">{{ item.name }}</span>
              <el-tag :type="item.type==='url'?'warning':'primary'" size="small" class="item-format-tag">{{ item.type==='url'?'URL':item.format?.toUpperCase() }}</el-tag>
              <span class="item-size">{{ item.size }}</span>
              <el-button text size="small" type="danger" @click="removeItem(idx)" style="flex-shrink:0;padding:0 4px">✕</el-button>
            </div>
          </div>
          <div class="compare-config">
            <div class="section-title" style="margin-top:12px"><span class="title-bar"></span>比对配置</div>
            <div class="config-row">
              <label class="config-label">比对维度</label>
              <el-checkbox-group v-model="compareDims">
                <el-checkbox value="条款差异" label="条款差异">条款差异</el-checkbox>
                <el-checkbox value="扶持标准" label="扶持标准">扶持标准</el-checkbox>
                <el-checkbox value="适用范围" label="适用范围">适用范围</el-checkbox>
                <el-checkbox value="责任主体" label="责任主体">责任主体</el-checkbox>
                <el-checkbox value="实施期限" label="实施期限">实施期限</el-checkbox>
                <el-checkbox value="补助金额" label="补助金额">补助金额</el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="config-row">
              <label class="config-label">输出偏好</label>
              <el-radio-group v-model="outputPrefer">
                <el-radio value="highlight">差异高亮清单</el-radio>
                <el-radio value="table">结构化对比表格</el-radio>
                <el-radio value="summary">变化总结报告</el-radio>
              </el-radio-group>
            </div>
          </div>
          <div style="margin-top:12px;padding:0 4px">
            <el-button type="primary" class="action-btn" :disabled="uploadedItems.length<2" @click="startCompare" style="width:100%">
              <el-icon style="margin-right:4px"><Promotion /></el-icon>开始比对分析
            </el-button>
          </div>
        </div>
      </div>
      <div class="history-section">
        <div class="section-title"><span class="title-bar"></span>比对历史</div>
        <div v-if="compareHistory.length===0" class="empty-hint">暂无比对记录</div>
        <div v-for="h in compareHistory" :key="h.id" class="history-item" @click="loadCompareResult(h)">
          <div class="history-name">{{ h.name }}</div>
          <div class="history-time">{{ h.time }}</div>
        </div>
      </div>
    </div>
    <!-- 右侧主内容 -->
    <div class="policy-main">
      <div v-if="!compareResult" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">多政策横向比对</div>
        <div class="empty-desc">上传至少 2 份政策文件，配置比对维度后开始分析</div>
      </div>
      <div v-else class="compare-result">
        <div class="result-header">
          <div class="result-title">{{ compareResult.name }}</div>
          <div class="result-actions">
            <el-button size="small" @click="exportResult">📥 导出</el-button>
          </div>
        </div>
        <div class="result-stats">
          <div class="stat-card"><div class="stat-value">{{ compareResult.stats.total }}</div><div class="stat-label">对比文件</div></div>
          <div class="stat-card"><div class="stat-value">{{ compareResult.stats.diffCount }}</div><div class="stat-label">差异点</div></div>
          <div class="stat-card"><div class="stat-value">{{ compareResult.stats.sameCount }}</div><div class="stat-label">相同点</div></div>
          <div class="stat-card"><div class="stat-value">{{ compareResult.stats.changeCount }}</div><div class="stat-label">变更项</div></div>
        </div>
        <div class="compare-tabs">
          <el-tabs v-model="activeCompareTab">
            <el-tab-pane label="差异对比表" name="diff">
              <el-table :data="compareResult.diffTable" stripe border size="small" style="width:100%">
                <el-table-column prop="dimension" label="维度" width="120" />
                <el-table-column label="政策A" width="200">
                  <template #default="{row}"><span :class="row.aStatus==='新增'?'diff-new':row.aStatus==='删除'?'diff-del':''">{{ row.aContent }}</span></template>
                </el-table-column>
                <el-table-column label="政策B" width="200">
                  <template #default="{row}"><span :class="row.bStatus==='新增'?'diff-new':row.bStatus==='删除'?'diff-del':''">{{ row.bContent }}</span></template>
                </el-table-column>
                <el-table-column prop="conclusion" label="结论" min-width="160" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="AI分析结论" name="ai">
              <div class="ai-conclusion-box">
                <div class="ai-header">🤖 AI 综合分析</div>
                <div class="ai-content" v-html="compareResult.aiConclusion"></div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="变化总结" name="summary">
              <div class="summary-content" v-html="compareResult.changeSummary"></div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'

const urlText = ref('')
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const uploadedItems = ref<any[]>([])
const compareDims = ref(['条款差异', '扶持标准', '适用范围'])
const outputPrefer = ref('highlight')
const activeCompareTab = ref('diff')
const compareHistory = ref<any[]>([])
const compareResult = ref<any>(null)

const mockCompareHistory = [
  { id: 1, name: '就业补贴政策新旧对比', time: '2026-08-25 10:30' },
  { id: 2, name: '省市创业扶持政策比对', time: '2026-08-24 15:20' }
]
compareHistory.value = mockCompareHistory

const triggerFileInput = () => fileInputRef.value?.click()
const onDragOver = (e: DragEvent) => { isDragOver.value = true }
const onDragLeave = () => { isDragOver.value = false }
const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files) handleFiles(Array.from(files))
}
const onFileSelected = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) handleFiles(Array.from(files))
}
const handleFiles = (files: File[]) => {
  files.forEach(f => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      ElMessage.warning(`不支持格式: ${f.name}`)
      return
    }
    uploadedItems.value.push({ id: Date.now() + Math.random(), name: f.name, format: ext, size: formatSize(f.size), type: 'file', status: 'done' })
  })
}
const formatSize = (bytes: number) => bytes < 1024 ? bytes + 'B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + 'KB' : (bytes / 1048576).toFixed(1) + 'MB'
const removeItem = (idx: number) => { uploadedItems.value.splice(idx, 1) }
const clearAllItems = () => { uploadedItems.value = []; compareResult.value = null }
const startCompare = () => {
  if (uploadedItems.value.length < 2) { ElMessage.warning('请至少上传 2 份政策文件'); return }
  compareResult.value = {
    name: '多政策比对分析结果',
    stats: { total: uploadedItems.value.length, diffCount: 8, sameCount: 12, changeCount: 5 },
    diffTable: [
      { dimension: '扶持标准', aContent: '每人每月补贴 800 元', aStatus: '新增', bContent: '每人每月补贴 600 元', bStatus: '删除', conclusion: '标准提高 200 元/月' },
      { dimension: '适用范围', aContent: '本市户籍失业人员', aStatus: '新增', bContent: '本市户籍就业困难人员', bStatus: '修改', conclusion: '适用范围扩大' },
      { dimension: '实施期限', aContent: '2026年1月-2026年12月', aStatus: '新增', bContent: '2025年1月-2025年12月', bStatus: '删除', conclusion: '期限延至2026年底' },
      { dimension: '补助金额', aContent: '最高 5000 元/人', aStatus: '新增', bContent: '最高 3000 元/人', bStatus: '修改', conclusion: '补助金额上限提高 2000 元' },
      { dimension: '责任主体', aContent: '区县人社部门', aStatus: '新增', bContent: '市级人社部门', bStatus: '修改', conclusion: '权限下放至区县' },
      { dimension: '条款差异', aContent: '新增第 12 条监督机制', aStatus: '新增', bContent: '无此条款', bStatus: '删除', conclusion: '新增监督机制' }
    ],
    aiConclusion: '<p>经 AI 综合分析，两份政策文件在<strong>扶持标准、补助金额、适用范围</strong>三个维度存在显著差异：</p><ul><li><strong>扶持标准</strong>：新政策较旧政策提高 200 元/月，增幅 25%</li><li><strong>适用范围</strong>：从"就业困难人员"扩大至"失业人员"，覆盖人群更广</li><li><strong>补助金额</strong>：上限从 3000 元提升至 5000 元，增幅 66.7%</li><li><strong>责任主体</strong>：从市级下放至区县，管理权限下沉</li></ul><p>建议：关注政策调整后的预算增加幅度，确保区县执行能力。</p>',
    changeSummary: '<h4>主要变化</h4><ol><li>扶持标准提高 200 元/月（+25%）</li><li>适用范围从就业困难人员扩大到失业人员</li><li>补助金额上限从 3000 元提升至 5000 元</li><li>责任主体从市级下放至区县人社部门</li><li>新增监督机制条款</li></ol>'
  }
  compareHistory.value.unshift({ id: Date.now(), name: '政策比对分析', time: new Date().toLocaleString() })
  ElMessage.success('比对分析完成')
}
const loadCompareResult = (h: any) => { /* 加载历史 */ }
const exportResult = () => { ElMessage.success('导出成功') }
</script>

<style scoped>
.policy-page { display:flex; height:100%; background:#f5f6fa; }
.policy-sidebar { width:340px; min-width:340px; background:#fff; border-right:1px solid #e5e7eb; display:flex; flex-direction:column; overflow-y:auto; padding:16px; }
.policy-main { flex:1; overflow-y:auto; padding:20px; }
.section-title { font-size:14px; font-weight:600; color:#1f2937; display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.title-bar { display:inline-block; width:3px; height:14px; background:#2563eb; border-radius:2px; }
.url-input-area { margin-bottom:12px; }
.input-label { font-size:12px; color:#6b7280; margin-bottom:4px; display:block; }
.divider-text { text-align:center; color:#9ca3af; font-size:12px; margin:8px 0; position:relative; }
.divider-text::before, .divider-text::after { content:''; position:absolute; top:50%; width:calc(50% - 20px); height:1px; background:#e5e7eb; }
.divider-text::before { left:0; } .divider-text::after { right:0; }
.drop-zone { border:2px dashed #d1d5db; border-radius:8px; padding:16px; text-align:center; cursor:pointer; transition:all .2s; background:#f9fafb; }
.drop-zone:hover, .drop-zone-active { border-color:#2563eb; background:#eff6ff; }
.drop-icon { font-size:28px; margin-bottom:6px; }
.drop-text { font-size:13px; color:#374151; }
.drop-hint { font-size:11px; color:#9ca3af; margin-top:4px; }
.uploaded-list-section { margin-top:12px; }
.list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.list-title { font-size:13px; font-weight:500; color:#374151; }
.uploaded-list { max-height:220px; overflow-y:auto; }
.uploaded-item { display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:6px; margin-bottom:4px; background:#f9fafb; cursor:default; }
.uploaded-item-error { background:#fef2f2; }
.drag-handle { cursor:grab; color:#9ca3af; font-size:14px; }
.item-icon { font-size:16px; }
.item-name { flex:1; font-size:12px; color:#374151; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.item-format-tag { flex-shrink:0; }
.item-size { font-size:11px; color:#9ca3af; flex-shrink:0; }
.compare-config { background:#f9fafb; border-radius:8px; padding:8px 12px; margin-top:8px; }
.config-row { margin-bottom:8px; }
.config-row:last-child { margin-bottom:0; }
.config-label { font-size:12px; color:#6b7280; display:block; margin-bottom:4px; font-weight:500; }
.action-btn { height:36px; font-size:13px; }
.history-section { margin-top:16px; flex:1; overflow-y:auto; }
.history-item { padding:8px 10px; border-radius:6px; cursor:pointer; margin-bottom:4px; }
.history-item:hover { background:#f3f4f6; }
.history-name { font-size:13px; color:#374151; }
.history-time { font-size:11px; color:#9ca3af; margin-top:2px; }
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#9ca3af; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-title { font-size:18px; font-weight:600; color:#374151; margin-bottom:8px; }
.empty-desc { font-size:13px; }
.compare-result { background:#fff; border-radius:12px; padding:20px; }
.result-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.result-title { font-size:18px; font-weight:600; color:#1f2937; }
.result-actions { display:flex; gap:8px; }
.result-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
.stat-card { background:linear-gradient(135deg,#eff6ff,#dbeafe); border-radius:10px; padding:16px; text-align:center; }
.stat-value { font-size:24px; font-weight:700; color:#2563eb; }
.stat-label { font-size:12px; color:#6b7280; margin-top:4px; }
.compare-tabs { margin-top:8px; }
.diff-new { color:#10b981; font-weight:500; } .diff-del { color:#ef4444; text-decoration:line-through; }
.ai-conclusion-box { background:linear-gradient(135deg,#eff6ff,#f0f9ff); border-radius:10px; padding:20px; }
.ai-header { font-size:15px; font-weight:600; color:#1f2937; margin-bottom:12px; }
.ai-content { font-size:13px; color:#374151; line-height:1.8; }
.ai-content ul { padding-left:20px; } .ai-content li { margin-bottom:4px; }
.summary-content { font-size:13px; color:#374151; line-height:1.8; }
.summary-content h4 { font-size:14px; color:#1f2937; margin:12px 0 8px; }
.summary-content ol { padding-left:20px; } .summary-content li { margin-bottom:6px; }
</style>