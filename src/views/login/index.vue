<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-wrapper">
          <div class="logo-icon">政</div>
        </div>
        <h1 class="login-title">政途 · AI政务办公工作台</h1>
        <p class="login-subtitle">DATUM 达途 — 面向人社内部工作人员的 AI 政务办公与经办辅助系统</p>
      </div>

      <el-form ref="formRef" :model="loginForm" :rules="rules" class="login-form" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="role">
          <div class="role-selector">
            <span class="role-label">登录身份：</span>
            <el-radio-group v-model="loginForm.role" size="large">
              <el-radio-button value="staff">
                <el-icon><User /></el-icon>
                工作人员
              </el-radio-button>
              <el-radio-button value="admin">
                <el-icon><Setting /></el-icon>
                管理员
              </el-radio-button>
            </el-radio-group>
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

      <div class="login-footer">
        <p>© 2026 DATUM 达途 · 政途 AI政务办公工作台</p>
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
  background: linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #0d1f3c 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 50%, rgba(26, 86, 219, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(26, 86, 219, 0.05) 0%, transparent 40%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-2%, -1%); }
}

.login-card {
  width: 440px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 12px;
  padding: 48px 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1a56db, #4f8ef7);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3);
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
}

.login-form {
  margin-top: 8px;
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.role-label {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
}

.role-selector :deep(.el-radio-group) {
  flex: 1;
}

.role-selector :deep(.el-radio-button__inner) {
  padding: 10px 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
  background: #1a56db;
  border: none;
}

.login-btn:hover {
  background: #1547b8;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.login-footer p {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}
</style>
