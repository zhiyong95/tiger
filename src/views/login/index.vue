<template>
  <div class="login-container">
    <div class="login-background"></div>
    <div class="login-overlay"></div>

    <div class="login-wrapper">
      <!-- 左侧品牌展示区 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon">政</div>
          </div>
          <h1 class="brand-title">政途 · AI政务办公工作台</h1>
          <p class="brand-subtitle">DATUM 达途</p>
          <div class="brand-divider"></div>
          <p class="brand-desc">面向人社内部工作人员的<br/>AI 政务办公与经办辅助系统</p>

          <div class="brand-features">
            <div class="feature-item">
              <el-icon><Document /></el-icon>
              <span>智能公文</span>
            </div>
            <div class="feature-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>知识问答</span>
            </div>
            <div class="feature-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>智能问数</span>
            </div>
            <div class="feature-item">
              <el-icon><Checked /></el-icon>
              <span>业务审核</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="form-section">
        <div class="form-card">
          <div class="form-header">
            <h2 class="form-title">欢迎登录</h2>
            <p class="form-subtitle">Welcome Back</p>
          </div>

          <el-form ref="formRef" :model="loginForm" :rules="rules" class="login-form" @keyup.enter="handleLogin">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                class="custom-input"
              >
                <template #prefix>
                  <el-icon class="input-icon"><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                class="custom-input"
                show-password
              >
                <template #prefix>
                  <el-icon class="input-icon"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="role">
              <div class="role-selector">
                <div class="role-option" :class="{ active: loginForm.role === 'staff' }" @click="loginForm.role = 'staff'">
                  <el-icon><User /></el-icon>
                  <span>工作人员</span>
                </div>
                <div class="role-option" :class="{ active: loginForm.role === 'admin' }" @click="loginForm.role = 'admin'">
                  <el-icon><Setting /></el-icon>
                  <span>管理员</span>
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="loading"
                @click="handleLogin"
              >
                登 录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <p>© 2026 DATUM 达途 · 政途</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { login as mockLogin } from '@/api/mock'

const router = useRouter()
const appStore = useAppStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  role: 'staff' as 'staff' | 'admin',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择登录身份', trigger: 'change' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await mockLogin(loginForm.username, loginForm.password, loginForm.role)
      appStore.setUserInfo(res.user)
      appStore.setToken(res.token)
      ElMessage.success(`欢迎回来，${res.user.name}！`)
      // 根据角色跳转到不同页面
      if (loginForm.role === 'admin') {
        router.push('/admin/users')
      } else {
        router.push('/dashboard')
      }
    } catch {
      ElMessage.error('用户名或密码错误')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/login-bg.jpeg') center/cover no-repeat;
  z-index: 0;
}

.login-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(10, 22, 40, 0.85) 0%, rgba(26, 45, 74, 0.75) 50%, rgba(13, 31, 60, 0.85) 100%);
  z-index: 1;
}

.login-wrapper {
  display: flex;
  width: 900px;
  max-width: 95vw;
  min-height: 560px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 2;
}

/* 左侧品牌展示区 */
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #1a56db 0%, #0d3a8c 100%);
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.brand-logo {
  margin-bottom: 24px;
}

.brand-logo .logo-icon {
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 32px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  margin: 0 auto;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brand-subtitle {
  font-size: 16px;
  font-weight: 400;
  margin: 0 0 24px;
  opacity: 0.9;
  letter-spacing: 4px;
}

.brand-divider {
  width: 60px;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  margin: 0 auto 24px;
}

.brand-desc {
  font-size: 15px;
  line-height: 1.8;
  opacity: 0.9;
  margin: 0 0 40px;
}

.brand-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.feature-item .el-icon {
  font-size: 18px;
}

/* 右侧登录表单区 */
.form-section {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  width: 100%;
  max-width: 380px;
}

.form-header {
  text-align: center;
  margin-bottom: 36px;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
  letter-spacing: 2px;
}

.form-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.custom-input {
  height: 48px;
}

.custom-input :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e5e7eb;
  transition: all 0.3s;
}

.custom-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #1a56db;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #1a56db;
}

.input-icon {
  color: #9ca3af;
  font-size: 18px;
}

.role-selector {
  display: flex;
  gap: 12px;
  width: 100%;
}

.role-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #6b7280;
  background: white;
}

.role-option:hover {
  border-color: #1a56db;
  color: #1a56db;
}

.role-option.active {
  border-color: #1a56db;
  background: #e8f0fe;
  color: #1a56db;
  font-weight: 500;
}

.role-option .el-icon {
  font-size: 18px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  letter-spacing: 6px;
  background: #1a56db;
  border: none;
  border-radius: 8px;
  margin-top: 8px;
}

.login-btn:hover {
  background: #1547b8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3);
}

.form-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.form-footer p {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
    width: 95vw;
    min-height: auto;
  }

  .brand-section {
    padding: 40px 30px;
  }

  .brand-title {
    font-size: 22px;
  }

  .brand-features {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .form-section {
    padding: 40px 30px;
  }
}
</style>
