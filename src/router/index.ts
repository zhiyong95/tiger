import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '工作台首页', icon: 'HomeFilled' },
  },
  {
    path: '/qa',
    name: 'QA',
    component: () => import('@/views/qa/index.vue'),
    meta: { title: '人社知识智能问答', icon: 'ChatDotRound' },
  },
  {
    path: '/document',
    name: 'Document',
    component: () => import('@/views/document/index.vue'),
    meta: { title: 'AI公文助手', icon: 'Document' },
  },
  {
    path: '/data',
    name: 'Data',
    component: () => import('@/views/data/index.vue'),
    meta: { title: '智能问数', icon: 'DataAnalysis' },
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/report/index.vue'),
    meta: { title: '智能分析报告', icon: 'TrendCharts' },
  },
  {
    path: '/policy',
    name: 'Policy',
    component: () => import('@/views/policy/index.vue'),
    meta: { title: '政策快研', icon: 'Reading' },
  },
  {
    path: '/audit',
    name: 'Audit',
    component: () => import('@/views/audit/index.vue'),
    meta: { title: '业务智能审核', icon: 'Checked' },
  },
  {
    path: '/task',
    name: 'Task',
    component: () => import('@/views/task/index.vue'),
    meta: { title: '风险预警与任务待办', icon: 'Bell' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: '个人中心', icon: 'User' },
  },
  // 后台管理端
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/users',
    meta: { title: '后台管理', icon: 'Setting' },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/users.vue'),
    meta: { title: '用户权限管理', icon: 'User' },
  },
  {
    path: '/admin/knowledge',
    name: 'AdminKnowledge',
    component: () => import('@/views/admin/knowledge.vue'),
    meta: { title: '知识库管理', icon: 'Collection' },
  },
  {
    path: '/admin/templates',
    name: 'AdminTemplates',
    component: () => import('@/views/admin/templates.vue'),
    meta: { title: '公文模板管理', icon: 'Tickets' },
  },
  {
    path: '/admin/metrics',
    name: 'AdminMetrics',
    component: () => import('@/views/admin/metrics.vue'),
    meta: { title: '指标口径管理', icon: 'DataLine' },
  },
  {
    path: '/admin/rules',
    name: 'AdminRules',
    component: () => import('@/views/admin/rules.vue'),
    meta: { title: '审核规则管理', icon: 'List' },
  },
  {
    path: '/admin/datasource',
    name: 'AdminDatasource',
    component: () => import('@/views/admin/datasource.vue'),
    meta: { title: '数据源管理', icon: 'Connection' },
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import('@/views/admin/logs.vue'),
    meta: { title: '日志审计', icon: 'Document' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 导航守卫
router.beforeEach((to, _from, next) => {
  const appStore = useAppStore()

  // 登录页不需要认证
  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  // 未登录则跳转登录页
  if (!appStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 工作人员不能访问后台管理页面
  if (appStore.userRole === 'staff' && to.path.startsWith('/admin')) {
    next({ path: '/dashboard' })
    return
  }

  // 管理员不能访问PC工作台页面（除了个人中心）
  if (appStore.userRole === 'admin' && !to.path.startsWith('/admin') && to.path !== '/profile') {
    next({ path: '/admin/users' })
    return
  }

  next()
})

export default router
