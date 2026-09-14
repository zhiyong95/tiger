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
    children?: Omit<MenuItemMeta, 'children' | 'icon'>[] // 子菜单
  }

  // 所有PC端菜单项（含 parentId 层级关系）
  const pcMenuMeta: MenuItemMeta[] = [
    { path: '/data', title: '智能问数', icon: 'DataAnalysis', parentId: '/' },
    {
      path: '/report', title: '智能报告', icon: 'TrendCharts', parentId: '/',
      children: [
        { path: '/report/research', title: '调研分析报告', parentId: '/report' },
        { path: '/report/data', title: '数据分析报告', parentId: '/report' },
      ]
    },
    { path: '/policy', title: '政策快研', icon: 'Reading', parentId: '/',
      children: [
        { path: '/policy/research', title: '政策研判', parentId: '/policy' },
        { path: '/policy/compare', title: '政策比对', parentId: '/policy' },
        { path: '/policy/draft', title: '政策编制', parentId: '/policy' },
        { path: '/policy/qa', title: '政策问答', parentId: '/policy' },
      ]
    },
    { path: '/qa', title: '人社知识智能问答', icon: 'ChatDotRound', parentId: '/' },
    { path: '/document', title: '公文助手', icon: 'Document', parentId: '/' },
    { path: '/audit', title: '业务智审', icon: 'Checked', parentId: '/' },
    { path: '/audit/policy-service', title: '政策主动服务', icon: 'Bell', parentId: '/' },
    {
      path: '/cockpit', title: '领导驾驶舱', icon: 'Monitor', parentId: '/',
      children: [
        { path: '/cockpit/labor', title: '辖区劳动力资源概况', parentId: '/cockpit' },
        { path: '/cockpit/enterprise', title: '市场主体用工概况', parentId: '/cockpit' },
        { path: '/cockpit/industry', title: '产业用工概况', parentId: '/cockpit' },
        { path: '/cockpit/service', title: '线下服务矩阵网络分布', parentId: '/cockpit' },
      ]
    },
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

    // 查找函数：先在顶层查，再在children中查
    const findItem = (p: string): { path: string; title: string; parentId: string } | undefined => {
      for (const m of pcMenuMeta) {
        if (m.path === p) return m
        if (m.children) {
          const child = m.children.find(c => c.path === p)
          if (child) return { ...child, parentId: m.path }
        }
      }
      return adminMenuMeta.find(m => m.path === p)
    }

    const item = findItem(path)

    if (item) {
      // 父级面包屑
      if (item.parentId && parentNodeMap[item.parentId]) {
        crumbs.push(parentNodeMap[item.parentId])
      }
      // 如果父级是菜单项（如 /report），也需要插入
      const parentAsMenuItem = pcMenuMeta.find(m => m.path === item.parentId)
      if (parentAsMenuItem && parentNodeMap[parentAsMenuItem.parentId]) {
        crumbs.push({ path: parentAsMenuItem.path, title: parentAsMenuItem.title })
      }
    }

    // 当前页面包屑（最后一项）
    if (item) {
      crumbs.push({ path: item.path, title: item.title })
    } else {
      crumbs.push({ path, title: '' })
    }

    return crumbs
  }

  // PC工作台权限矩阵
  const pcMenuItems = computed(() => {
    const role = userRole.value
    const items = pcMenuMeta.map(({ path, title, icon, children }) => ({
      path, title, icon,
      children: children ? children.map(c => ({ path: c.path, title: c.title })) : undefined
    }))
    // 工作人员与领导可见全部；管理员切换到 PC 工作台模块时同样可见
    if (role === 'staff' || role === 'leader') return items
    return items
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