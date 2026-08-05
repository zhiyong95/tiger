<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="8">
        <el-card shadow="hover" class="profile-card">
          <div class="profile-header">
            <el-avatar :size="80" class="profile-avatar">
              {{ appStore.userInfo.name[0] }}
            </el-avatar>
            <h2 class="profile-name">{{ appStore.userInfo.name }}</h2>
            <p class="profile-role">{{ appStore.userInfo.role }}</p>
            <p class="profile-dept">{{ appStore.userInfo.department }}</p>
          </div>
          <el-divider />
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">{{ stats.qaCount }}</div>
              <div class="stat-label">知识问答</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.docCount }}</div>
              <div class="stat-label">公文生成</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.auditCount }}</div>
              <div class="stat-label">审核任务</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 信息编辑 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button type="primary" size="small" @click="handleSave" :loading="saving">
                保存修改
              </el-button>
            </div>
          </template>
          <el-form :model="profileForm" label-width="100px" class="profile-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="姓名">
                  <el-input v-model="profileForm.name" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工号">
                  <el-input v-model="profileForm.employeeId" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="所属部门">
                  <el-input v-model="profileForm.department" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="角色">
                  <el-input v-model="profileForm.role" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="手机号">
                  <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱">
                  <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form :model="passwordForm" label-width="100px" class="profile-form">
            <el-form-item label="当前密码">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="changingPwd">
                确认修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <span>操作记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in recentLogs"
              :key="log.id"
              :timestamp="log.time"
              placement="top"
            >
              <el-text>{{ log.action }}</el-text>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const saving = ref(false)
const changingPwd = ref(false)

const stats = reactive({
  qaCount: 128,
  docCount: 36,
  auditCount: 24,
})

const profileForm = reactive({
  name: appStore.userInfo.name,
  employeeId: 'RS20240001',
  department: appStore.userInfo.department,
  role: appStore.userInfo.role,
  phone: '138****5678',
  email: 'zhangming@rsj.gov.cn',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const recentLogs = ref([
  { id: 1, time: '2026-08-05 14:30', action: '导出公文《关于开展2026年就业帮扶工作的通知》' },
  { id: 2, time: '2026-08-05 11:20', action: '完成审核任务：灵活就业社保补贴资格核查' },
  { id: 3, time: '2026-08-04 16:45', action: '生成智能分析报告：2026年7月就业形势月报' },
  { id: 4, time: '2026-08-04 09:15', action: '查询指标：本月就业困难人员补贴发放人数' },
  { id: 5, time: '2026-08-03 15:30', action: '登录系统' },
])

const handleSave = async () => {
  saving.value = true
  await new Promise((r) => setTimeout(r, 800))
  appStore.userInfo.name = profileForm.name
  saving.value = false
  ElMessage.success('个人信息已更新')
}

const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.error('密码长度不能少于6位')
    return
  }
  changingPwd.value = true
  await new Promise((r) => setTimeout(r, 800))
  changingPwd.value = false
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  ElMessage.success('密码修改成功')
}
</script>

<style scoped>
.profile-container {
  padding: 0;
}

.profile-card {
  text-align: center;
}

.profile-header {
  padding: 20px 0 10px;
}

.profile-avatar {
  background: #1a56db;
  color: white;
  font-size: 32px;
  font-weight: 600;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 16px 0 4px;
}

.profile-role {
  font-size: 14px;
  color: #1a56db;
  margin: 0 0 4px;
}

.profile-dept {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a56db;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-form {
  max-width: 600px;
}
</style>
