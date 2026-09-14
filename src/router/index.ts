import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { lazyView } from '@/utils/lazyView'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: lazyView(() => import('@/views/login/index.vue')),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/data'
  },
  
  {
    path: '/qa',
    name: 'QA',
    component: lazyView(() => import('@/views/qa/index.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/document',
    name: 'Document',
    component: lazyView(() => import('@/views/document/index.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/data',
    name: 'Data',
    component: lazyView(() => import('@/views/data/index.vue')),
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
    component: lazyView(() => import('@/views/report/research.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/report/data',
    name: 'ReportData',
    component: lazyView(() => import('@/views/report/data.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/policy',
    redirect: '/policy/research',
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/policy/research',
    name: 'PolicyResearch',
    component: lazyView(() => import('@/views/policy/research.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/policy/compare',
    name: 'PolicyCompare',
    component: lazyView(() => import('@/views/policy/compare.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/policy/draft',
    name: 'PolicyDraft',
    component: lazyView(() => import('@/views/policy/draft.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/policy/qa',
    name: 'PolicyQA',
    component: lazyView(() => import('@/views/policy/qa.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/audit',
    name: 'Audit',
    component: lazyView(() => import('@/views/audit/index.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/audit/policy-service',
    name: 'PolicyService',
    component: lazyView(() => import('@/views/audit/policy-service.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  // 领导驾驶舱
  {
    path: '/cockpit',
    redirect: '/cockpit/labor',
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/cockpit/labor',
    name: 'CockpitLabor',
    component: lazyView(() => import('@/views/cockpit/labor.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/cockpit/enterprise',
    name: 'CockpitEnterprise',
    component: lazyView(() => import('@/views/cockpit/enterprise.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/cockpit/industry',
    name: 'CockpitIndustry',
    component: lazyView(() => import('@/views/cockpit/industry.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/cockpit/service',
    name: 'CockpitService',
    component: lazyView(() => import('@/views/cockpit/service.vue')),
    meta: { requiresAuth: true, roles: ['staff', 'leader'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: lazyView(() => import('@/views/profile/index.vue')),
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
    component: lazyView(() => import('@/views/admin/dashboard.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin', 'auditor'] }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: lazyView(() => import('@/views/admin/users.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin'] }
  },
  {
    path: '/admin/knowledge',
    name: 'AdminKnowledge',
    component: lazyView(() => import('@/views/admin/knowledge.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/feedback',
    name: 'AdminFeedback',
    component: lazyView(() => import('@/views/admin/feedback.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/templates',
    name: 'AdminTemplates',
    component: lazyView(() => import('@/views/admin/templates.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/policytags',
    name: 'AdminPolicyTags',
    component: lazyView(() => import('@/views/admin/policytags.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/metrics',
    name: 'AdminMetrics',
    component: lazyView(() => import('@/views/admin/metrics.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/rules',
    name: 'AdminRules',
    component: lazyView(() => import('@/views/admin/rules.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/datasource',
    name: 'AdminDatasource',
    component: lazyView(() => import('@/views/admin/datasource.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin'] }
  },
  {
    path: '/admin/taskflow',
    name: 'AdminTaskFlow',
    component: lazyView(() => import('@/views/admin/taskflow.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin'] }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: lazyView(() => import('@/views/admin/logs.vue')),
    meta: { requiresAuth: true, roles: ['sysadmin', 'bizadmin', 'auditor'] }
  },
  {
    path: '/admin/system',
    name: 'AdminSystem',
    component: lazyView(() => import('@/views/admin/system.vue')),
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
  const adminRoles = ['sysadmin', 'bizadmin', 'auditor']
  if (routeRoles && !routeRoles.includes(role)) {
    // 工作人员/领导不能进入后台管理，回到智能问数
    if (['staff', 'leader'].includes(role)) {
      next({ path: '/data' })
      return
    }
    // 管理员既可用后台，也可切换到 PC 工作台（PC 页面默认放行）
    if (adminRoles.includes(role) && !to.path.startsWith('/admin')) {
      next()
      return
    }
    // 管理员无权访问的后台页面，回到后台首页
    if (adminRoles.includes(role)) {
      next({ path: '/admin/dashboard' })
      return
    }
    next({ path: '/login' })
    return
  }

  next()
})

export default router