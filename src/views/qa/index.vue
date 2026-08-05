<template>
  <div class="qa-page">
    <div class="page-card qa-container">
      <!-- 聊天消息区 -->
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="empty-state">
          <el-icon :size="48" color="#c0c4cc"><ChatDotRound /></el-icon>
          <p class="empty-title">人社政策知识问答</p>
          <p class="empty-desc">输入您的问题，我将基于政策知识库为您解答</p>
          <div class="quick-questions">
            <el-tag
              v-for="q in quickQuestions"
              :key="q"
              class="quick-q"
              @click="inputMessage = q"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="chat-message"
          :class="msg.role"
        >
          <div class="chat-avatar">
            {{ msg.role === 'ai' ? 'AI' : '我' }}
          </div>
          <div class="chat-bubble-wrapper">
            <div class="chat-bubble" v-html="formatContent(msg.content)"></div>
            <!-- 来源引用 -->
            <div v-if="msg.sources && msg.sources.length > 0" class="source-refs">
              <div v-for="source in msg.sources" :key="source.id" class="source-ref">
                <div class="source-ref-title">
                  <el-icon><Document /></el-icon> {{ source.docName }} - {{ source.chapter }}
                </div>
                <div class="source-ref-content">{{ source.content }}</div>
              </div>
            </div>
            <!-- 反馈按钮 -->
            <div v-if="msg.role === 'ai'" class="feedback-actions">
              <el-button size="small" text @click="msg.feedback = 'useful'">
                <el-icon v-if="msg.feedback === 'useful'" color="#10b981"><CircleCheck /></el-icon>
                <el-icon v-else><CircleCheck /></el-icon> 有用
              </el-button>
              <el-button size="small" text @click="msg.feedback = 'useless'">
                <el-icon v-if="msg.feedback === 'useless'" color="#ef4444"><CircleClose /></el-icon>
                <el-icon v-else><CircleClose /></el-icon> 无用
              </el-button>
            </div>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="chat-message ai">
          <div class="chat-avatar">AI</div>
          <div class="chat-bubble">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input-area">
        <div class="ai-notice">
          <el-icon><InfoFilled /></el-icon>
          AI生成内容仅供业务参考，具体以最新政策文件为准
        </div>
        <div class="input-row">
          <el-input
            v-model="inputMessage"
            placeholder="请输入您的问题，例如：失业保险金领取条件是什么？"
            @keyup.enter="sendMessage"
            :disabled="loading"
            class="qa-input"
          />
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="loading"
            :disabled="!inputMessage.trim()"
            class="send-btn"
          >
            <el-icon><Promotion /></el-icon> 发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { fetchQAAnswer } from '@/api/mock'
import type { QASource } from '@/types'

interface Message {
  role: 'user' | 'ai'
  content: string
  sources?: QASource[]
  feedback?: 'useful' | 'useless' | null
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const loading = ref(false)
const messagesRef = ref<HTMLElement>()

const quickQuestions = [
  '失业保险金领取条件是什么？',
  '灵活就业社保补贴标准是多少？',
  '稳岗返还政策最新规定',
  '就业困难人员认定条件',
]

const formatContent = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/&gt; (.*)/g, '<em style="color:#6b7280;font-size:12px">$1</em>')
}

const sendMessage = async () => {
  const question = inputMessage.value.trim()
  if (!question || loading.value) return

  messages.value.push({ role: 'user', content: question })
  inputMessage.value = ''
  loading.value = true

  await nextTick()
  scrollToBottom()

  try {
    const history = messages.value.map((m) => ({ role: m.role, content: m.content }))
    const result = await fetchQAAnswer(question, history)
    messages.value.push({
      role: 'ai',
      content: result.answer,
      sources: result.sources,
      feedback: null,
    })
  } catch {
    messages.value.push({ role: 'ai', content: '抱歉，服务暂时不可用，请稍后重试。' })
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}
</script>

<style scoped>
.qa-page {
  height: calc(100vh - 96px);
}

.qa-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
}

.empty-desc {
  font-size: 14px;
  margin-top: 8px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  justify-content: center;
}

.quick-q {
  cursor: pointer;
  transition: all 0.2s;
}

.quick-q:hover {
  background: #1a56db;
  color: white;
  border-color: #1a56db;
}

.chat-message {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-message.ai .chat-avatar {
  background: #1a56db;
  color: white;
}

.chat-message.user .chat-avatar {
  background: #6366f1;
  color: white;
}

.chat-bubble-wrapper {
  max-width: 70%;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.8;
}

.chat-message.ai .chat-bubble {
  background: #f3f4f6;
  border-bottom-left-radius: 4px;
}

.chat-message.user .chat-bubble {
  background: #1a56db;
  color: white;
  border-bottom-right-radius: 4px;
}

.source-refs {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-ref {
  padding: 10px 14px;
  background: #f0f7ff;
  border-left: 3px solid #1a56db;
  border-radius: 4px;
}

.source-ref-title {
  font-weight: 600;
  color: #1a56db;
  font-size: 13px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.source-ref-content {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
}

.feedback-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.ai-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.input-row {
  display: flex;
  gap: 12px;
}

.qa-input {
  flex: 1;
}

.send-btn {
  min-width: 100px;
}
</style>
