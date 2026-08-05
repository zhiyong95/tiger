import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
  history: createWebHistory(),
  routes,
})

export default router
