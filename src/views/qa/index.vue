<template>
  <div class="qa-page">
    <div class="qa-layout">
      <!-- 左侧主交互区 -->
      <div class="qa-main">
        <!-- 机器人问候栏 -->
        <div class="greeting-section">
          <div class="greeting-avatar">
            <div class="robot-icon">
              <el-icon :size="28"><ChatDotRound /></el-icon>
            </div>
          </div>
          <div class="greeting-bubble">
            <span>您好，我是您的政务智能问答助手，人社相关政策、办事指南等问题可以咨询我哟！</span>
          </div>
        </div>

        <!-- 大家都在问 - 热门服务 -->
        <div class="hot-section">
          <div class="section-header">
            <el-icon :size="20" color="#c41e3a"><QuestionFilled /></el-icon>
            <span class="section-title">大家都在问</span>
          </div>
          <div class="hot-tags">
            <el-tag
              v-for="topic in hotTopics"
              :key="topic"
              class="hot-tag"
              :class="{ 'tag-wide': topic.length > 18 }"
              @click="askQuestion(topic)"
            >
              {{ topic }}
            </el-tag>
          </div>
        </div>

        <!-- 对话消息区 -->
        <div class="chat-messages" ref="chatRef" v-show="messages.length > 0">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="message-item"
            :class="msg.role"
          >
            <div class="msg-avatar">
              <el-icon v-if="msg.role === 'ai'" :size="22" color="#c41e3a"><ChatDotRound /></el-icon>
              <el-icon v-else :size="20" color="#1a56db"><UserFilled /></el-icon>
            </div>
            <div class="msg-content">
              <div class="msg-bubble" v-if="msg.role === 'user'">{{ msg.content }}</div>
              <div class="msg-bubble ai-bubble" v-else>
                <div class="ai-answer">{{ msg.content }}</div>
                <div class="answer-footer" v-if="msg.sources">
                  <div class="sources">
                    <span class="source-label">来源：</span>
                    <span v-for="(s, si) in msg.sources" :key="si" class="source-item">
                      《{{ s.name }}》
                    </span>
                  </div>
                  <div class="ai-tag">AI生成，仅供业务参考</div>
                </div>
                <div class="feedback-actions" v-if="msg.sources">
                  <el-tag size="small" :type="msg.feedback === 'useful' ? 'success' : undefined" @click="giveFeedback(idx, 'useful')" class="feedback-btn">有用</el-tag>
                  <el-tag size="small" :type="msg.feedback === 'useless' ? 'danger' : undefined" @click="giveFeedback(idx, 'useless')" class="feedback-btn">无用</el-tag>
                </div>
              </div>
            </div>
          </div>
          <div v-if="loading" class="message-item ai">
            <div class="msg-avatar">
              <el-icon :size="22" color="#c41e3a"><ChatDotRound /></el-icon>
            </div>
            <div class="msg-content">
              <div class="msg-bubble ai-bubble loading-dots">
                <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部输入区 -->
        <div class="input-area">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              placeholder="请输入您想咨询的问题，例如：身份证补办"
              :disabled="loading"
              class="qa-input"
              @keyup.enter="sendMessage"
            />
            <el-button
              type="primary"
              class="send-btn"
              :loading="loading"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧辅助信息区 -->
      <div class="qa-sidebar">
        <!-- 常见问题 -->
        <div class="sidebar-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon :size="18" color="#c41e3a"><ChatLineSquare /></el-icon>
              <span>常见问题</span>
            </div>
            <div class="card-action" @click="refreshFAQ">
              <el-icon :size="16" color="#c41e3a"><Refresh /></el-icon>
              <span>换一换</span>
            </div>
          </div>
          <div class="faq-list">
            <div
              v-for="(q, idx) in faqList"
              :key="idx"
              class="faq-item"
              @click="askQuestion(q)"
            >
              <span class="faq-dot"></span>
              <span class="faq-text">{{ q }}</span>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="sidebar-card">
          <div class="card-header">
            <div class="card-title">
              <el-icon :size="18" color="#c41e3a"><Clock /></el-icon>
              <span>历史记录</span>
            </div>
            <div class="card-action" @click="clearHistory" v-if="historyList.length > 0">
              <el-icon :size="16" color="#999"><Delete /></el-icon>
              <span>清除</span>
            </div>
          </div>
          <div class="history-list">
            <div v-if="historyList.length === 0" class="empty-tip">
              暂无历史记录数据
            </div>
            <div
              v-for="(item, idx) in historyList"
              :key="idx"
              class="history-item"
              @click="askQuestion(item.question)"
            >
              <el-icon :size="14" color="#666"><Clock /></el-icon>
              <span class="history-text">{{ item.question }}</span>
              <span class="history-time">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChatDotRound, QuestionFilled, UserFilled, ChatLineSquare, Refresh, Clock, Delete } from '@element-plus/icons-vue'
import { fetchQAAnswer, faqQuestions } from '@/api/mock'

interface QAMessage {
  role: 'user' | 'ai'
  content: string
  sources?: { name: string; content: string }[]
  feedback?: 'useful' | 'useless'
}

interface HistoryItem {
  question: string
  time: string
}

const inputMessage = ref('')
const messages = ref<QAMessage[]>([])
const loading = ref(false)
const chatRef = ref<HTMLElement | null>(null)
const faqList = ref<string[]>([...faqQuestions])
const historyList = ref<HistoryItem[]>([])

const hotTopics = ref([
  '教师资格证',
  '生育服务',
  '老年人办事服务',
  '军人退役',
  '公积金提取',
  '医疗保险登记',
  '育儿补贴制度政策问答',
  '中共中央办公厅 国务院办公厅印发《育儿补贴制度实施方案》',
])

function refreshFAQ() {
  const shuffled = [...faqQuestions].sort(() => Math.random() - 0.5)
  faqList.value = shuffled.slice(0, 5)
}

function askQuestion(q: string) {
  inputMessage.value = q
  sendMessage()
}

async function sendMessage() {
  const text = inputMessage.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  addHistory(text)
  inputMessage.value = ''
  loading.value = true

  try {
    const res = await fetchQAAnswer(text, messages.value)
    messages.value.push({
      role: 'ai',
      content: res.answer,
      sources: res.sources,
    })
  } catch {
    messages.value.push({
      role: 'ai',
      content: '抱歉，暂时无法回答您的问题，请稍后重试。',
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function addHistory(question: string) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  historyList.value = historyList.value.filter(h => h.question !== question)
  historyList.value.unshift({ question, time })
  if (historyList.value.length > 10) historyList.value.pop()
}

function clearHistory() {
  historyList.value = []
}

function giveFeedback(idx: number, type: 'useful' | 'useless') {
  const msg = messages.value[idx]
  if (msg && msg.role === 'ai') {
    msg.feedback = msg.feedback === type ? undefined : type
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight
    }
  }, 100)
}

onMounted(() => {
  refreshFAQ()
})
</script>

<style scoped>
.qa-page {
  height: calc(100vh - 100px);
  background: linear-gradient(135deg, #fdf6f0 0%, #fefefe 50%, #f5f0eb 100%);
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.qa-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

/* 左侧主区域 */
.qa-main {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

/* 问候栏 */
.greeting-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.greeting-avatar {
  flex-shrink: 0;
}

.robot-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 2px solid #c41e3a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c41e3a;
  box-shadow: 0 2px 8px rgba(196, 30, 58, 0.08);
}

.greeting-bubble {
  background: white;
  border-radius: 4px 12px 12px 12px;
  padding: 14px 18px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  max-width: 85%;
}

.greeting-bubble::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 14px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid white;
}

/* 热门服务 */
.hot-section {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hot-tag {
  background: #f5f5f5 !important;
  border: none !important;
  color: #333 !important;
  font-size: 13px;
  padding: 0 14px;
  height: 32px;
  line-height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-tag:hover {
  background: #c41e3a !important;
  color: white !important;
}

.tag-wide {
  width: 100%;
}

/* 对话消息区 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.message-item {
  display: flex;
  gap: 10px;
  max-width: 90%;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-item.ai .msg-avatar {
  background: #fef0ef;
}

.message-item.user .msg-avatar {
  background: #e8f0fe;
}

.msg-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.user .msg-bubble {
  background: #1a56db;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.ai .msg-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.ai-answer {
  margin-bottom: 8px;
  line-height: 1.7;
}

.answer-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  margin-top: 8px;
}

.sources {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.source-label {
  color: #999;
}

.source-item {
  color: #1a56db;
  cursor: pointer;
}

.source-item:hover {
  text-decoration: underline;
}

.ai-tag {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.feedback-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.feedback-btn {
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.loading-dots {
  display: flex;
  gap: 2px;
  padding: 12px 20px;
}

.dot {
  font-size: 24px;
  color: #c41e3a;
  animation: bounce 1.4s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-4px); }
}

/* 输入区 */
.input-area {
  flex-shrink: 0;
  padding-top: 8px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #eee;
}

.qa-input {
  flex: 1;
}

.qa-input :deep(.el-input__wrapper) {
  border: none !important;
  box-shadow: none !important;
  padding: 0 4px;
  background: transparent;
}

.qa-input :deep(.el-input__inner) {
  border: none;
  font-size: 14px;
  color: #333;
  height: 40px;
}

.qa-input :deep(.el-input__inner::placeholder) {
  color: #bbb;
}

.send-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 28px;
  font-size: 14px;
  border-radius: 8px;
  background: #c41e3a !important;
  border-color: #c41e3a !important;
  font-weight: 500;
  letter-spacing: 1px;
}

.send-btn:hover {
  background: #a81830 !important;
  border-color: #a81830 !important;
}

/* 右侧侧边栏 */
.qa-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 240px;
  max-width: 320px;
}

.sidebar-card {
  background: white;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.sidebar-card:first-child {
  flex-shrink: 0;
}

.sidebar-card:last-child {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #c41e3a;
  cursor: pointer;
  transition: opacity 0.2s;
}

.card-action:hover {
  opacity: 0.7;
}

/* 常见问题列表 */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.faq-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: color 0.2s;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-item:hover {
  color: #c41e3a;
}

.faq-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c41e3a;
  margin-top: 7px;
}

.faq-text {
  font-size: 13px;
  color: #444;
  line-height: 1.5;
}

.faq-item:hover .faq-text {
  color: #c41e3a;
}

/* 历史记录 */
.history-list {
  flex: 1;
  overflow-y: auto;
}

.history-list::-webkit-scrollbar {
  width: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.empty-tip {
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 30px 0;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: color 0.2s;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  color: #c41e3a;
}

.history-text {
  flex: 1;
  font-size: 13px;
  color: #444;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
}

.history-item:hover .history-text {
  color: #c41e3a;
}
</style>