<template>
  <div class="policy-page">
    <div class="policy-sidebar">
      <div class="upload-section">
        <div class="section-title"><span class="title-bar"></span>政策编制</div>
        <div class="draft-form">
          <div class="form-group">
            <label>政策标题</label>
            <el-input v-model="draftTitle" placeholder="请输入政策文件标题" />
          </div>
          <div class="form-group">
            <label>政策类型</label>
            <el-select v-model="draftType" placeholder="选择政策类型" style="width:100%">
              <el-option label="就业促进政策" value="就业" />
              <el-option label="社会保障政策" value="社保" />
              <el-option label="人才引进政策" value="人才" />
              <el-option label="创业扶持政策" value="创业" />
              <el-option label="技能培训政策" value="培训" />
            </el-select>
          </div>
          <div class="form-group">
            <label>参考依据</label>
            <el-input v-model="draftBasis" type="textarea" :rows="3" placeholder="输入参考上级文件、政策依据等" />
          </div>
          <div class="form-group">
            <label>起草单位</label>
            <el-input v-model="draftDept" placeholder="如：某某市人力资源和社会保障局" />
          </div>
          <div class="form-group">
            <label>编制要求</label>
            <el-checkbox-group v-model="draftReqs">
              <el-checkbox value="结构规范" label="结构规范" />
              <el-checkbox value="数据支撑" label="数据支撑" />
              <el-checkbox value="风险评估" label="风险评估" />
              <el-checkbox value="公众意见" label="公众意见" />
            </el-checkbox-group>
          </div>
          <el-button type="primary" :disabled="!draftTitle" @click="startDraft" style="width:100%;margin-top:8px">
            <el-icon style="margin-right:4px"><Edit /></el-icon>AI 辅助起草
          </el-button>
        </div>
      </div>
      <div class="history-section">
        <div class="section-title"><span class="title-bar"></span>起草历史</div>
        <div v-if="draftHistory.length===0" class="empty-hint">暂无起草记录</div>
        <div v-for="h in draftHistory" :key="h.id" class="history-item" @click="loadDraft(h)">
          <div class="history-name">{{ h.name }}</div>
          <div class="history-time">{{ h.time }} · {{ h.status }}</div>
        </div>
      </div>
    </div>
    <div class="policy-main">
      <div v-if="!draftResult" class="empty-state">
        <div class="empty-icon">✍️</div>
        <div class="empty-title">AI 政策起草</div>
        <div class="empty-desc">输入政策标题和基本信息，AI 辅助生成政策草案</div>
      </div>
      <div v-else class="draft-result">
        <div class="result-header">
          <div class="result-title">{{ draftResult.title }}</div>
          <div class="result-actions">
            <el-button size="small" @click="exportDraft">📥 导出</el-button>
            <el-button size="small" @click="regenerateDraft">🔄 重新生成</el-button>
          </div>
        </div>
        <div class="draft-meta">
          <span class="meta-item">类型：{{ draftResult.type }}</span>
          <span class="meta-item">起草单位：{{ draftResult.dept }}</span>
          <span class="meta-item">生成时间：{{ draftResult.time }}</span>
        </div>
        <div class="draft-content" v-html="draftResult.content"></div>
        <div class="draft-chat">
          <div class="chat-title">💬 政策调整助手</div>
          <div class="chat-messages">
            <div v-for="(m,idx) in draftChat" :key="idx" class="chat-msg" :class="m.role==='user'?'chat-user':'chat-ai'">
              <div class="chat-avatar">{{ m.role==='user'?'我':'🤖' }}</div>
              <div class="chat-bubble">{{ m.content }}</div>
            </div>
          </div>
          <div class="chat-input">
            <el-input v-model="draftChatInput" placeholder="输入调整要求..." size="small" @keyup.enter="sendDraftChat" />
            <el-button type="primary" size="small" @click="sendDraftChat">发送</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'

const draftTitle = ref('')
const draftType = ref('')
const draftBasis = ref('')
const draftDept = ref('')
const draftReqs = ref(['结构规范'])
const draftResult = ref<any>(null)
const draftChatInput = ref('')
const draftChat = ref<{role:string;content:string}[]>([])
const draftHistory = ref([
  { id: 1, name: '灵活就业人员社保补贴办法', time: '2026-08-25', status: '已生成' },
  { id: 2, name: '高校毕业生就业扶持政策', time: '2026-08-24', status: '已生成' }
])

const startDraft = () => {
  draftResult.value = {
    title: draftTitle.value,
    type: draftType.value || '就业促进政策',
    dept: draftDept.value || '某某市人力资源和社会保障局',
    time: new Date().toLocaleString(),
    content: `<h3>${draftTitle.value}（草案）</h3>
<p style="text-align:right;color:#6b7280;font-size:13px;margin-bottom:20px">${draftDept.value || '某某市人力资源和社会保障局'}<br>${new Date().toLocaleDateString()}</p>
<h4>第一条 目的与依据</h4>
<p>为贯彻落实党中央、国务院关于稳就业保就业的决策部署，进一步做好就业困难人员帮扶工作，根据《中华人民共和国就业促进法》《就业服务与就业管理规定》等法律法规，结合本市实际，制定本办法。</p>
<h4>第二条 适用范围</h4>
<p>本办法适用于本市行政区域内登记认定的就业困难人员，包括但不限于：零就业家庭成员、低保家庭成员、残疾人、退役军人、长期失业人员等。</p>
<h4>第三条 扶持措施</h4>
<p>（一）社会保险补贴。对招用就业困难人员的用人单位，按其实际缴纳的基本养老保险费、基本医疗保险费、失业保险费给予补贴，不包括个人应缴纳部分。补贴期限最长不超过3年。</p>
<p>（二）岗位补贴。对就业困难人员实现灵活就业并缴纳社会保险费的，给予每人每月不超过实际缴费2/3的社会保险补贴。</p>
<p>（三）公益性岗位安置。对通过市场渠道难以实现就业的就业困难人员，可通过公益性岗位予以安置，并给予岗位补贴和社会保险补贴。</p>
<h4>第四条 申请程序</h4>
<p>符合条件的人员可向户籍所在地或常住地街道（乡镇）人社服务中心提出申请，提交身份证明、就业失业登记证、相关证明材料等。街道（乡镇）人社服务中心应在5个工作日内完成初审，区县人社部门在10个工作日内完成审核。</p>
<h4>第五条 监督与管理</h4>
<p>各级人社部门应建立健全就业困难人员帮扶工作机制，加强资金使用监管，定期开展就业帮扶效果评估。对虚报冒领补贴资金的，依法追回并追究相关责任。</p>
<h4>第六条 附则</h4>
<p>本办法自发布之日起施行，有效期5年。各区县可根据本办法制定实施细则。</p>`
  }
  draftChat.value = []
  draftHistory.value.unshift({ id: Date.now(), name: draftTitle.value, time: new Date().toLocaleString(), status: '已生成' })
  ElMessage.success('政策草案生成完成')
}
const exportDraft = () => { ElMessage.success('导出成功') }
const regenerateDraft = () => { if (draftTitle.value) startDraft() }
const sendDraftChat = () => {
  if (!draftChatInput.value.trim()) return
  draftChat.value.push({ role: 'user', content: draftChatInput.value })
  draftChatInput.value = ''
  setTimeout(() => {
    draftChat.value.push({ role: 'ai', content: '已根据您的调整要求修改完毕，请查看更新后的草案内容。如需进一步调整，请继续提出要求。' })
  }, 800)
}
const loadDraft = (h: any) => { /* 加载历史 */ }
</script>

<style scoped>
.policy-page { display:flex; height:100%; background:#f5f6fa; }
.policy-sidebar { width:340px; min-width:340px; background:#fff; border-right:1px solid #e5e7eb; display:flex; flex-direction:column; overflow-y:auto; padding:16px; }
.policy-main { flex:1; overflow-y:auto; padding:20px; }
.section-title { font-size:14px; font-weight:600; color:#1f2937; display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.title-bar { display:inline-block; width:3px; height:14px; background:#2563eb; border-radius:2px; }
.form-group { margin-bottom:12px; }
.form-group label { font-size:12px; color:#6b7280; display:block; margin-bottom:4px; font-weight:500; }
.history-section { margin-top:16px; flex:1; overflow-y:auto; }
.history-item { padding:8px 10px; border-radius:6px; cursor:pointer; margin-bottom:4px; }
.history-item:hover { background:#f3f4f6; }
.history-name { font-size:13px; color:#374151; }
.history-time { font-size:11px; color:#9ca3af; margin-top:2px; }
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#9ca3af; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-title { font-size:18px; font-weight:600; color:#374151; margin-bottom:8px; }
.empty-desc { font-size:13px; }
.draft-result { background:#fff; border-radius:12px; padding:20px; }
.result-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.result-title { font-size:18px; font-weight:600; color:#1f2937; }
.result-actions { display:flex; gap:8px; }
.draft-meta { display:flex; gap:20px; padding:10px 16px; background:#f9fafb; border-radius:8px; margin-bottom:16px; }
.meta-item { font-size:12px; color:#6b7280; }
.draft-content { font-size:14px; color:#374151; line-height:2; padding:20px; background:#fefefe; border:1px solid #e5e7eb; border-radius:8px; }
.draft-content h3 { font-size:18px; text-align:center; margin-bottom:16px; color:#1f2937; }
.draft-content h4 { font-size:14px; margin:16px 0 8px; color:#1f2937; }
.draft-content p { text-indent:2em; margin-bottom:8px; }
.draft-chat { margin-top:16px; border:1px solid #e5e7eb; border-radius:10px; padding:16px; background:#fafafa; }
.chat-title { font-size:14px; font-weight:600; color:#1f2937; margin-bottom:12px; }
.chat-messages { max-height:200px; overflow-y:auto; margin-bottom:12px; }
.chat-msg { display:flex; gap:8px; margin-bottom:10px; }
.chat-avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; background:#e5e7eb; flex-shrink:0; }
.chat-user { flex-direction:row-reverse; }
.chat-ai .chat-avatar { background:#dbeafe; }
.chat-user .chat-avatar { background:#2563eb; color:#fff; }
.chat-bubble { max-width:80%; padding:8px 12px; border-radius:8px; font-size:13px; line-height:1.5; }
.chat-ai .chat-bubble { background:#fff; border:1px solid #e5e7eb; }
.chat-user .chat-bubble { background:#2563eb; color:#fff; }
.chat-input { display:flex; gap:8px; }
</style>