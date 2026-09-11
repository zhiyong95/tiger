<template>
  <div class="login-container">
    <div class="login-background"></div>
    <div class="login-overlay"></div>

    <div class="login-wrapper">
      <!-- 左侧品牌展示区 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <img src="/logo.png" alt="DATUM 达途" class="brand-logo-image" />
          </div>
          <h1 class="brand-title">政途 · AI政务办公工作台</h1>
          <p class="brand-subtitle">DATUM 达途</p>
          <div class="brand-divider"></div>
          <p class="brand-desc">面向人社内部工作人员的<br/>AI 政务办公与经办辅助系统</p>

          <div class="brand-features">
            <div class="feature-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>智能问数</span>
            </div>
            <div class="feature-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>知识问答</span>
            </div>
            <div class="feature-item">
              <el-icon><Document /></el-icon>
              <span>智能公文</span>
            </div>
            <div class="feature-item">
              <el-icon><Checked /></el-icon>
              <span>业务智审</span>
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

          <div class="login-tabs">
            <button
              :class="['tab-btn', { active: loginMode === 'account' }]"
              @click="loginMode = 'account'"
            >
              <el-icon><User /></el-icon>
              账号密码
            </button>
            <button
              :class="['tab-btn', { active: loginMode === 'sscard' }]"
              @click="loginMode = 'sscard'"
            >
              <el-icon><CreditCard /></el-icon>
              电子社保码
            </button>
            <button
              :class="['tab-btn', { active: loginMode === 'phone' }]"
              @click="loginMode = 'phone'"
            >
              <el-icon><Iphone /></el-icon>
              手机号码
            </button>
          </div>

          <!-- 账号密码登录 -->
          <el-form
            v-if="loginMode === 'account'"
            ref="accountFormRef"
            :model="accountForm"
            :rules="accountRules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="accountForm.username"
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
                v-model="accountForm.password"
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
              <el-select
                v-model="accountForm.role"
                placeholder="请选择登录身份"
                size="large"
                class="role-select"
              >
                <el-option label="工作人员" value="staff">
                  <el-icon style="margin-right: 8px"><UserFilled /></el-icon>
                  <span>工作人员</span>
                </el-option>
                <el-option label="科室负责人/领导" value="leader">
                  <el-icon style="margin-right: 8px"><Histogram /></el-icon>
                  <span>科室负责人/领导</span>
                </el-option>
                <el-option label="系统管理员" value="sysadmin">
                  <el-icon style="margin-right: 8px"><Setting /></el-icon>
                  <span>系统管理员</span>
                </el-option>
                <el-option label="业务管理员" value="bizadmin">
                  <el-icon style="margin-right: 8px"><Management /></el-icon>
                  <span>业务管理员</span>
                </el-option>
                <el-option label="审计人员" value="auditor">
                  <el-icon style="margin-right: 8px"><View /></el-icon>
                  <span>审计人员</span>
                </el-option>
              </el-select>
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

          <!-- 电子社保码登录 -->
          <el-form
            v-if="loginMode === 'sscard'"
            ref="sscardFormRef"
            :model="sscardForm"
            :rules="sscardRules"
            class="login-form"
            @keyup.enter="handleSscardLogin"
          >
            <el-form-item prop="cardNo">
              <el-input
                v-model="sscardForm.cardNo"
                placeholder="请输入电子社保卡号"
                size="large"
                class="custom-input"
              >
                <template #prefix>
                  <el-icon class="input-icon"><CreditCard /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="sscardForm.password"
                type="password"
                placeholder="请输入社保卡密码"
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
              <el-select
                v-model="sscardForm.role"
                placeholder="请选择登录身份"
                size="large"
                class="role-select"
              >
                <el-option label="工作人员" value="staff">
                  <el-icon style="margin-right: 8px"><UserFilled /></el-icon>
                  <span>工作人员</span>
                </el-option>
                <el-option label="科室负责人/领导" value="leader">
                  <el-icon style="margin-right: 8px"><Histogram /></el-icon>
                  <span>科室负责人/领导</span>
                </el-option>
                <el-option label="系统管理员" value="sysadmin">
                  <el-icon style="margin-right: 8px"><Setting /></el-icon>
                  <span>系统管理员</span>
                </el-option>
                <el-option label="业务管理员" value="bizadmin">
                  <el-icon style="margin-right: 8px"><Management /></el-icon>
                  <span>业务管理员</span>
                </el-option>
                <el-option label="审计人员" value="auditor">
                  <el-icon style="margin-right: 8px"><View /></el-icon>
                  <span>审计人员</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="loading"
                @click="handleSscardLogin"
              >
                社保码登录
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 手机号码登录 -->
          <el-form
            v-if="loginMode === 'phone'"
            ref="phoneFormRef"
            :model="phoneForm"
            :rules="phoneRules"
            class="login-form"
            @keyup.enter="handlePhoneLogin"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="phoneForm.phone"
                placeholder="请输入手机号码"
                size="large"
                class="custom-input"
                maxlength="11"
              >
                <template #prefix>
                  <el-icon class="input-icon"><Iphone /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="code">
              <div class="code-row">
                <el-input
                  v-model="phoneForm.code"
                  placeholder="请输入验证码"
                  size="large"
                  class="custom-input code-input"
                  maxlength="6"
                >
                  <template #prefix>
                    <el-icon class="input-icon"><Key /></el-icon>
                  </template>
                </el-input>
                <el-button
                  size="large"
                  class="code-btn"
                  :disabled="codeSending || codeCountdown > 0"
                  @click="handleSendCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item prop="role">
              <el-select
                v-model="phoneForm.role"
                placeholder="请选择登录身份"
                size="large"
                class="role-select"
              >
                <el-option label="工作人员" value="staff">
                  <el-icon style="margin-right: 8px"><UserFilled /></el-icon>
                  <span>工作人员</span>
                </el-option>
                <el-option label="科室负责人/领导" value="leader">
                  <el-icon style="margin-right: 8px"><Histogram /></el-icon>
                  <span>科室负责人/领导</span>
                </el-option>
                <el-option label="系统管理员" value="sysadmin">
                  <el-icon style="margin-right: 8px"><Setting /></el-icon>
                  <span>系统管理员</span>
                </el-option>
                <el-option label="业务管理员" value="bizadmin">
                  <el-icon style="margin-right: 8px"><Management /></el-icon>
                  <span>业务管理员</span>
                </el-option>
                <el-option label="审计人员" value="auditor">
                  <el-icon style="margin-right: 8px"><View /></el-icon>
                  <span>审计人员</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="loading"
                @click="handlePhoneLogin"
              >
                手机登录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <p>© 2026 DATUM 达途 · 政途</p>
          </div>
        </div>
      </div>
    </div>
    <div class="login-footer">
      技术支持：广州德生智聘科技有限公司
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

// 登录方式
const loginMode = ref<'account' | 'sscard' | 'phone'>('account')
const loading = ref(false)
const codeSending = ref(false)
const codeCountdown = ref(0)
let codeTimer: ReturnType<typeof setInterval> | null = null

// 账号密码登录
const accountFormRef = ref<FormInstance>()
const accountForm = reactive({
  username: '',
  password: '',
  role: 'staff' as 'staff' | 'leader' | 'sysadmin' | 'bizadmin' | 'auditor',
})
const accountRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择登录身份', trigger: 'change' }],
}

// 电子社保码登录
const sscardFormRef = ref<FormInstance>()
const sscardForm = reactive({
  cardNo: '',
  password: '',
  role: 'staff' as 'staff' | 'leader' | 'sysadmin' | 'bizadmin' | 'auditor',
})
const sscardRules: FormRules = {
  cardNo: [{ required: true, message: '请输入电子社保卡号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入社保卡密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择登录身份', trigger: 'change' }],
}

// 手机号码登录
const phoneFormRef = ref<FormInstance>()
const phoneForm = reactive({
  phone: '',
  code: '',
  role: 'staff' as 'staff' | 'leader' | 'sysadmin' | 'bizadmin' | 'auditor',
})
const phoneRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择登录身份', trigger: 'change' }],
}

const doLogin = async (username: string, password: string, role: 'staff' | 'leader' | 'sysadmin' | 'bizadmin' | 'auditor') => {
  loading.value = true
  try {
    const res = await mockLogin(username, password, role)
    appStore.setUserInfo({
      name: res.user.name,
      department: res.user.department,
      role: res.user.role,
      roleType: role as any,
      avatar: '',
    })
    appStore.setRole(role as any)
    appStore.setToken(res.token)
    ElMessage.success(`欢迎回来，${res.user.name}！`)
    const adminRoles = ['sysadmin', 'bizadmin', 'auditor']
    if (adminRoles.includes(role)) {
      router.push('/admin/dashboard')
    } else {
      router.push('/data')
    }
  } catch {
    ElMessage.error('登录信息有误，请重试')
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  if (!accountFormRef.value) return
  await accountFormRef.value.validate(async (valid) => {
    if (!valid) return
    await doLogin(accountForm.username, accountForm.password, accountForm.role)
  })
}

const handleSscardLogin = async () => {
  if (!sscardFormRef.value) return
  await sscardFormRef.value.validate(async (valid) => {
    if (!valid) return
    await doLogin(sscardForm.cardNo, sscardForm.password, sscardForm.role)
  })
}

const handlePhoneLogin = async () => {
  if (!phoneFormRef.value) return
  await phoneFormRef.value.validate(async (valid) => {
    if (!valid) return
    await doLogin(phoneForm.phone, phoneForm.code, phoneForm.role)
  })
}

const handleSendCode = () => {
  if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的手机号码')
    return
  }
  codeSending.value = true
  // 模拟发送验证码
  setTimeout(() => {
    codeSending.value = false
    codeCountdown.value = 60
    ElMessage.success('验证码已发送至手机')
    if (codeTimer) clearInterval(codeTimer)
    codeTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        if (codeTimer) clearInterval(codeTimer)
      }
    }, 1000)
  }, 800)
}

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
})
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

.login-footer {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.5px;
  z-index: 2;
  pointer-events: none;
}

.login-wrapper {
  display: flex;
  width: 900px;
  max-width: 95vw;
  min-height: 560px;
  position: relative;
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
  background: linear-gradient(180deg, #0a2472 0%, #001a66 50%, #001055 100%);
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

.brand-logo-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
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

.login-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 5px;
  margin-bottom: 30px;
  background: #f1f4f9;
  border-radius: 12px;
  position: relative;
}

.tab-btn {
  appearance: none;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  color: #5b6679;
  background: transparent;
  border-radius: 9px;
  transition: color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
  white-space: nowrap;
}

.tab-btn .el-icon {
  font-size: 17px;
}

.tab-btn:hover {
  color: #1a56db;
}

.tab-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #1a4bd6 100%);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.32);
}

.tab-btn.active:hover {
  color: #fff;
}

.tab-btn:active {
  transform: scale(0.97);
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

.role-select {
  width: 100%;
}

.role-select :deep(.el-select__wrapper) {
  height: 48px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e5e7eb;
  transition: all 0.3s;
}

.role-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #1a56db;
}

.role-select :deep(.el-select__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #1a56db;
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
