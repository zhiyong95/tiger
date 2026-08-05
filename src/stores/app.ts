import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const currentModule = ref<'pc' | 'admin'>('pc')
  const userInfo = ref({
    name: '张明',
    department: '就业促进科',
    role: '业务科室人员',
    avatar: '',
  })

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const switchModule = (module: 'pc' | 'admin') => {
    currentModule.value = module
  }

  const pcMenuItems = computed(() => [
    { path: '/dashboard', title: '工作台首页', icon: 'HomeFilled' },
    { path: '/qa', title: '人社知识智能问答', icon: 'ChatDotRound' },
    { path: '/document', title: 'AI公文助手', icon: 'Document' },
    { path: '/data', title: '智能问数', icon: 'DataAnalysis' },
    { path: '/report', title: '智能分析报告', icon: 'TrendCharts' },
    { path: '/policy', title: '政策快研', icon: 'Reading' },
    { path: '/audit', title: '业务智能审核', icon: 'Checked' },
    { path: '/task', title: '风险预警与任务待办', icon: 'Bell' },
  ])

  const adminMenuItems = computed(() => [
    { path: '/admin/users', title: '用户权限管理', icon: 'User' },
    { path: '/admin/knowledge', title: '知识库管理', icon: 'Collection' },
    { path: '/admin/templates', title: '公文模板管理', icon: 'Tickets' },
    { path: '/admin/metrics', title: '指标口径管理', icon: 'DataLine' },
    { path: '/admin/rules', title: '审核规则管理', icon: 'List' },
    { path: '/admin/datasource', title: '数据源管理', icon: 'Connection' },
    { path: '/admin/logs', title: '日志审计', icon: 'Document' },
  ])

  return {
    sidebarCollapsed,
    currentModule,
    userInfo,
    toggleSidebar,
    switchModule,
    pcMenuItems,
    adminMenuItems,
  }
})
