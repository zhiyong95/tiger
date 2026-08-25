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

  // 菜单层级数据（用于面包屑自动推导）
  interface MenuItemMeta {
    path: string
    title: string
    icon: string
    parentId: string // 父级路径，空字符串表示根
  }

  // 所有PC端菜单项（含 parentId 层级关系）
  const pcMenuMeta: MenuItemMeta[] = [
    { path: '/dashboard', title: '工作台首页', icon: 'HomeFilled', parentId: '/' },
    { path: '/qa', title: '智能问答', icon: 'ChatDotRound', parentId: '/' },
    { path: '/document', title: '智能问数', icon: 'Document', parentId: '/' },
    { path: '/data', title: '智能公文', icon: 'DataAnalysis', parentId: '/' },
    { path: '/report', title: '智能分析报告', icon: 'TrendCharts', parentId: '/' },
    { path: '/policy', title: '政策快研', icon: 'Reading', parentId: '/' },
    { path: '/audit', title: '业务智审', icon: 'Checked', parentId: '/' },
    { path: '/task', title: '风险预警与任务待办', icon: 'Bell', parentId: '/' },
  ]

  // 所有后台管理端菜单项（含 parentId 层级关系）
  const adminMenuMeta: MenuItemMeta[] = [
    { path: '/admin/dashboard', title: '后台首页', icon: 'DataBoard', parentId: '/admin' },
    { path: '/admin/users', title: '用户权限管理', icon: 'User', parentId: '/admin' },
    { path: '/admin/knowledge', title: '知识库管理', icon: 'Collection', parentId: '/admin' },
    { path: '/admin/feedback', title: '知识反馈运营', icon: 'ChatLineSquare', parentId: '/admin' },
    { path: '/admin/templates', title: '公文模板管理', icon: 'Tickets', parentId: '/admin' },
    { path: '/admin/policytags', title: '政策标签管理', icon: 'PriceTag', parentId: '/admin' },
    { path: '/admin/metrics', title: '指标口径管理', icon: 'DataLine', parentId: '/admin' },
    { path: '/admin/rules', title: '审核规则管理', icon: 'List', parentId: '/admin' },
    { path: '/admin/datasource', title: '数据源管理', icon: 'Connection', parentId: '/admin' },
    { path: '/admin/taskflow', title: '任务流配置', icon: 'SetUp', parentId: '/admin' },
    { path: '/admin/logs', title: '日志审计', icon: 'Document', parentId: '/admin' },
    { path: '/admin/settings', title: '系统参数', icon: 'Setting', parentId: '/admin' },
  ]

  // 父级节点定义（用于面包屑中间层）
  const parentNodeMap: Record<string, { path: string; title: string }> = {
    '/': { path: '/', title: '工作台' },
    '/admin': { path: '/admin', title: '管理后台' },
  }

  // 根据当前路由路径自动推导面包屑（不硬编码，基于 menu parentId 反向追溯）
  const getBreadcrumb = (path: string): { path: string; title: string }[] => {
    const crumbs: { path: string; title: string }[] = [{ path: '', title: '首页' }]

    // 先在PC菜单中查找
    let item = pcMenuMeta.find(m => m.path === path)
    // 再在后台菜单中查找
    if (!item) {
      item = adminMenuMeta.find(m => m.path === path)
    }

    if (item && item.parentId && parentNodeMap[item.parentId]) {
      crumbs.push(parentNodeMap[item.parentId])
    }

    // 当前页面包屑（最后一项）
    if (item) {
      crumbs.push({ path: item.path, title: item.title })
    } else {
      // 未匹配菜单时取路由 meta.title
      crumbs.push({ path, title: '' })
    }

    return crumbs
  }

  // PC工作台权限矩阵
  const pcMenuItems = computed(() => {
    const role = userRole.value
    const items = pcMenuMeta.map(({ path, title, icon }) => ({ path, title, icon }))
    // 根据角色过滤菜单
    if (role === 'staff') return items
    if (role === 'leader') return items
    // 管理员默认不显示PC工作台
    return []
  })

  // 后台管理端权限矩阵
  const adminMenuItems = computed(() => {
    const role = userRole.value
    const allItems = adminMenuMeta.map(({ path, title, icon }) => ({ path, title, icon }))
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
    getBreadcrumb,
  }
})