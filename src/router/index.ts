import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/qa',
    name: 'QA',
    component: () => import('@/views/qa/index.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/document',
    name: 'Document',
    component: () => import('@/views/document/index.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/data',
    name: 'Data',
    component: () => import('@/views/data/index.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/report',
    redirect: '/report/research',
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/report/research',
    name: 'ReportResearch',
    component: () => import('@/views/report/research.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/report/data',
    name: 'ReportData',
    component: () => import('@/views/report/data.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/policy',
    name: 'Policy',
    component: () => import('@/views/policy/index.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/audit',
    name: 'Audit',
    component: () => import('@/views/audit/index.vue'),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { requiresAuth: true }
  },
  // 后台管理端路由
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/dashboard.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin', 'auditor'] }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/users.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin'] }
  },
  {
    path: '/admin/knowledge',
    name: 'AdminKnowledge',
    component: () => import('@/views/admin/knowledge.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/feedback',
    name: 'AdminFeedback',
    component: () => import('@/views/admin/feedback.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/templates',
    name: 'AdminTemplates',
    component: () => import('@/views/admin/templates.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/policytags',
    name: 'AdminPolicyTags',
    component: () => import('@/views/admin/policytags.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/metrics',
    name: 'AdminMetrics',
    component: () => import('@/views/admin/metrics.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/rules',
    name: 'AdminRules',
    component: () => import('@/views/admin/rules.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/datasource',
    name: 'AdminDatasource',
    component: () => import('@/views/admin/datasource.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin'] }
  },
  {
    path: '/admin/taskflow',
    name: 'AdminTaskFlow',
    component: () => import('@/views/admin/taskflow.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import('@/views/admin/logs.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin', 'auditor'] }
  },
  {
    path: '/admin/system',
    name: 'AdminSystem',
    component: () => import('@/views/admin/system.vue'),
    meta: { requiresAuth: true, roles: ['sysadmin'] }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

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

  const role = appStore.userRole
  const routeRoles = to.meta.roles as string[] | undefined

  // 检查路由角色权限
  if (routeRoles && !routeRoles.includes(role)) {
    // 工作人员角色进入PC工作台首页
    if (['staff', 'leader'].includes(role)) {
      next({ path: '/dashboard' })
      return
    }
    // 管理员角色进入后台首页
    if (['sysadmin', 'bizadmin', 'auditor'].includes(role)) {
      next({ path: '/admin/dashboard' })
      return
    }
    next({ path: '/login' })
    return
  }

  next()
})

export default router