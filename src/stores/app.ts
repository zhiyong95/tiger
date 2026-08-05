import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  name: string
  department: string
  role: string
  avatar: string
  employeeId?: string
  phone?: string
  email?: string
}

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const currentModule = ref<'pc' | 'admin'>('pc')
  const isLoggedIn = ref(false)
  const token = ref('')
  const userRole = ref<'staff' | 'admin'>('staff')
  const userInfo = ref<UserInfo>({
    name: '',
    department: '',
    role: '',
    avatar: '',
  })

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const switchModule = (module: 'pc' | 'admin') => {
    currentModule.value = module
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const setToken = (t: string) => {
    token.value = t
    isLoggedIn.value = true
  }

  const setRole = (role: 'staff' | 'admin') => {
    userRole.value = role
    currentModule.value = role === 'admin' ? 'admin' : 'pc'
  }

  const logout = () => {
    isLoggedIn.value = false
    token.value = ''
    userInfo.value = { name: '', department: '', role: '', avatar: '' }
    userRole.value = 'staff'
    currentModule.value = 'pc'
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
    isLoggedIn,
    token,
    userRole,
    userInfo,
    toggleSidebar,
    switchModule,
    setUserInfo,
    setToken,
    setRole,
    logout,
    pcMenuItems,
    adminMenuItems,
  }
})
