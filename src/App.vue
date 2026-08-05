<template>
  <div id="app-layout">
    <el-container style="height: 100vh">
      <!-- 侧边栏 -->
      <el-aside :width="appStore.sidebarCollapsed ? '64px' : '240px'" class="sidebar">
        <div class="sidebar-header">
          <div v-if="!appStore.sidebarCollapsed" class="logo-text">
            <span class="logo-icon">政</span>
            <span class="logo-name">政途工作台</span>
          </div>
          <div v-else class="logo-icon-small">政</div>
        </div>

        <!-- 模块切换 -->
        <div class="module-switch" v-if="!appStore.sidebarCollapsed">
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
          <template v-if="appStore.currentModule === 'pc'">
            <el-menu-item v-for="item in appStore.pcMenuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
          <template v-else>
            <el-menu-item v-for="item in appStore.adminMenuItems" :key="item.path" :index="item.path">
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
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-badge :value="3" :max="99" class="header-badge">
              <el-icon :size="20" style="cursor: pointer"><Bell /></el-icon>
            </el-badge>
            <el-dropdown>
              <div class="user-info">
                <el-avatar :size="32" class="user-avatar">{{ appStore.userInfo.name[0] }}</el-avatar>
                <span class="user-name">{{ appStore.userInfo.name }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>{{ appStore.userInfo.department }}</el-dropdown-item>
                  <el-dropdown-item>{{ appStore.userInfo.role }}</el-dropdown-item>
                  <el-dropdown-item divided>个人中心</el-dropdown-item>
                  <el-dropdown-item>退出登录</el-dropdown-item>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

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
</script>

<style scoped>
.sidebar {
  background: #001529;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1a56db, #4f8ef7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
}

.logo-icon-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1a56db, #4f8ef7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
}

.logo-name {
  color: white;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
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
  background: #1a56db;
  color: white;
  border-color: #1a56db;
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
  background: #1a56db;
  color: white;
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
</style>
