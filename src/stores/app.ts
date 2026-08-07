import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  name: string
  department: string
  role: string
  roleType: string
  avatar: string
  employeeId?: string
  phone?: string
  email?: string
}

export type UserRole = 'staff' | 'leader' | 'sysadmin' | 'bizadmin' | 'auditor'

const roleNameMap: Record<UserRole, string> = {
  staff: '工作人员',
  leader: '科室负责人/领导',
  sysadmin: '系统管理员',
  bizadmin: '业务管理员',
  auditor: '审计人员',
}

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const currentModule = ref<'pc' | 'admin'>('pc')
  const isLoggedIn = ref(false)
  const token = ref('')
  const userRole = ref<UserRole>('staff')
  const userInfo = ref<UserInfo>({
    name: '',
    department: '',
    role: '',
    roleType: '',
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
    userRole.value = info.roleType as UserRole
  }

  const setToken = (t: string) => {
    token.value = t
    isLoggedIn.value = true
  }

  const setRole = (role: UserRole) => {
    userRole.value = role
    if (role === 'sysadmin' || role === 'bizadmin' || role === 'auditor') {
      currentModule.value = 'admin'
    } else {
      currentModule.value = 'pc'
    }
  }

  const getRoleName = (role: UserRole) => roleNameMap[role] || '未知'

  const isAdminRole = computed(() => userRole.value === 'sysadmin' || userRole.value === 'bizadmin' || userRole.value === 'auditor')

  const logout = () => {
    isLoggedIn.value = false
    token.value = ''
    userInfo.value = { name: '', department: '', role: '', roleType: '', avatar: '' }
    userRole.value = 'staff'
    currentModule.value = 'pc'
  }

  // PC工作台权限矩阵
  const pcMenuItems = computed(() => {
    const role = userRole.value
    const items = [
      { path: '/dashboard', title: '工作台首页', icon: 'HomeFilled' },
      { path: '/qa', title: '人社知识智能问答', icon: 'ChatDotRound' },
      { path: '/document', title: 'AI公文助手', icon: 'Document' },
      { path: '/data', title: '智能问数', icon: 'DataAnalysis' },
      { path: '/report', title: '智能分析报告', icon: 'TrendCharts' },
      { path: '/policy', title: '政策快研', icon: 'Reading' },
      { path: '/audit', title: '业务智能审核', icon: 'Checked' },
      { path: '/task', title: '风险预警与任务待办', icon: 'Bell' },
    ]
    // 根据角色过滤菜单
    if (role === 'staff') return items
    if (role === 'leader') return items
    // 管理员默认不显示PC工作台
    return []
  })

  // 后台管理端权限矩阵
  const adminMenuItems = computed(() => {
    const role = userRole.value
    const allItems = [
      { path: '/admin/dashboard', title: '后台首页', icon: 'DataBoard' },
      { path: '/admin/users', title: '用户权限管理', icon: 'User' },
      { path: '/admin/knowledge', title: '知识库管理', icon: 'Collection' },
      { path: '/admin/feedback', title: '知识反馈运营', icon: 'ChatLineSquare' },
      { path: '/admin/templates', title: '公文模板管理', icon: 'Tickets' },
      { path: '/admin/policytags', title: '政策标签管理', icon: 'PriceTag' },
      { path: '/admin/metrics', title: '指标口径管理', icon: 'DataLine' },
      { path: '/admin/rules', title: '审核规则管理', icon: 'List' },
      { path: '/admin/datasource', title: '数据源管理', icon: 'Connection' },
      { path: '/admin/taskflow', title: '任务流配置', icon: 'SetUp' },
      { path: '/admin/logs', title: '日志审计', icon: 'Document' },
      { path: '/admin/settings', title: '系统参数', icon: 'Setting' },
    ]
    switch (role) {
      case 'sysadmin':
        return allItems // 系统管理员可见全部
      case 'bizadmin':
        return allItems.filter(i =>
          !['/admin/users', '/admin/settings'].includes(i.path)
        )
      case 'auditor':
        return allItems.filter(i =>
          ['/admin/dashboard', '/admin/logs'].includes(i.path)
        )
      default:
        return []
    }
  })

  return {
    sidebarCollapsed,
    currentModule,
    isLoggedIn,
    token,
    userRole,
    userInfo,
    isAdminRole,
    getRoleName,
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