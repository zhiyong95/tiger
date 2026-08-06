<template>
  <div id="app-layout">
    <!-- 未登录时显示登录页 -->
    <router-view v-if="!appStore.isLoggedIn" />

    <!-- 已登录时显示主布局 -->
    <el-container v-else style="height: 100vh">
      <!-- 侧边栏 -->
      <el-aside :width="appStore.sidebarCollapsed ? '64px' : '240px'" class="sidebar">
        <div class="sidebar-header">
          <div class="logo-container">
            <span v-if="!appStore.sidebarCollapsed" class="logo-name">DATUM·政途</span>
          </div>
        </div>

        <!-- 模块切换（仅管理员可见） -->
        <div class="module-switch" v-if="!appStore.sidebarCollapsed && appStore.userRole === 'admin'">
          <el-radio-group v-model="appStore.currentModule" size="small" @change="onModuleChange">
            <el-radio-button value="pc">PC工作台</el-radio-button>
            <el-radio-button value="admin">后台管理</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 菜单 -->
        <el-menu
          :default-active="activeMenu"
          :collapse="appStore.sidebarCollapsed"
          router
          class="sidebar-menu"
        >
          <template v-if="appStore.userRole === 'admin' && appStore.currentModule === 'admin'">
            <el-menu-item v-for="item in appStore.adminMenuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
          <template v-else>
            <el-menu-item v-for="item in appStore.pcMenuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
              <component :is="appStore.sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item :to="{ path: appStore.userRole === 'admin' ? '/admin/users' : '/dashboard' }">
                {{ appStore.userRole === 'admin' ? '管理后台' : '首页' }}
              </el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-popover
              placement="bottom-end"
              :width="360"
              trigger="click"
              popper-class="notification-popover"
            >
              <template #reference>
                <el-badge :value="notifications.filter(n => !n.read).length" :max="99" class="header-badge">
                  <el-icon :size="20" style="cursor: pointer"><Bell /></el-icon>
                </el-badge>
              </template>
              <div class="notification-panel">
                <div class="notification-header">
                  <span class="notification-title">站内消息</span>
                  <el-button text size="small" @click="markAllRead">全部已读</el-button>
                </div>
                <el-divider style="margin: 8px 0" />
                <div class="notification-list">
                  <div
                    v-for="(item, index) in notifications"
                    :key="index"
                    class="notification-item"
                    :class="{ unread: !item.read }"
                    @click="handleNotificationClick(item)"
                  >
                    <div class="notification-dot" v-if="!item.read" />
                    <div class="notification-content">
                      <div class="notification-text">{{ item.content }}</div>
                      <div class="notification-time">{{ item.time }}</div>
                    </div>
                    <el-tag v-if="item.type" :type="item.type === 'risk' ? 'danger' : item.type === 'task' ? 'warning' : 'info'" size="small" class="notification-tag">{{ item.typeLabel }}</el-tag>
                  </div>
                </div>
                <el-divider style="margin: 8px 0" />
                <div class="notification-footer">
                  <el-button text size="small" @click="router.push('/task')">查看全部</el-button>
                </div>
              </div>
            </el-popover>
            <el-dropdown @command="handleDropdownCommand">
              <div class="user-info">
                <el-avatar :size="32" class="user-avatar">{{ appStore.userInfo.name[0] }}</el-avatar>
                <span class="user-name">{{ appStore.userInfo.name }}</span>
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>{{ appStore.userInfo.department }}</el-dropdown-item>
                  <el-dropdown-item>{{ appStore.userInfo.role }}</el-dropdown-item>
                  <el-dropdown-item divided command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 站内通知数据
const notifications = ref([
  { content: '您有3条待办审核任务待处理', time: '2026-08-06 09:30', read: false, type: 'task', typeLabel: '待办' },
  { content: '就业补贴数据异常预警：灵活就业社保补贴发放人数异常增长', time: '2026-08-06 09:15', read: false, type: 'risk', typeLabel: '风险' },
  { content: '系统公告：知识库已更新最新社保政策文件', time: '2026-08-06 08:00', read: false, type: 'info', typeLabel: '公告' },
  { content: '公文"关于2026年就业促进工作的报告"已完成审校', time: '2026-08-05 16:45', read: true, type: 'info', typeLabel: '消息' },
  { content: '智能分析报告2026年7月月报已生成', time: '2026-08-05 14:20', read: true, type: 'info', typeLabel: '消息' },
])

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const handleNotificationClick = (item: { content: string; time: string; read: boolean; type: string; typeLabel: string }) => {
  item.read = true
  if (item.type === 'task' || item.type === 'risk') {
    router.push('/task')
  }
}

const activeMenu = computed(() => route.path)

const currentTitle = computed(() => {
  return (route.meta.title as string) || '工作台'
})

const onModuleChange = (module: string | number | boolean | undefined) => {
  const mod = module as 'pc' | 'admin'
  if (mod === 'pc') {
    router.push('/dashboard')
  } else {
    router.push('/admin/users')
  }
}

const handleDropdownCommand = async (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      appStore.logout()
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #0f2a78 0%, #0d1f5f 100%);
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid rgba(255,255,255,0.05);
}

.sidebar-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.logo-name {
  color: white;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
}

.module-switch {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.module-switch :deep(.el-radio-button__inner) {
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  border-color: rgba(255, 255, 255, 0.2);
}

.module-switch :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(37, 99, 235, 0.4);
  color: white;
  border-left: 3px solid #3b82f6;
}

.header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.collapse-btn:hover {
  color: #1a56db;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  background: #1a56db;
  color: white;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.main-content {
  background: var(--bg-color);
  padding: 20px;
  overflow-y: auto;
}

/* 通知面板样式 */
.notification-panel {
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.notification-list {
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
  gap: 8px;
  position: relative;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #f0f5ff;
}

.notification-item.unread:hover {
  background: #e6f0ff;
}

.notification-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1a56db;
  flex-shrink: 0;
  margin-top: 6px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}

.notification-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.notification-tag {
  flex-shrink: 0;
  margin-left: 4px;
}

.notification-footer {
  text-align: center;
  padding: 0 4px;
}
</style>
