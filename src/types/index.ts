// ============ 知识问答 ============
export interface QASource {
  id: string
  name: string
  content: string
  docName: string
  chapter: string
}

export interface QARecord {
  id: string
  question: string
  answer: string
  time: string
  feedback: 'useful' | 'useless' | 'correction' | null
}

// ============ 公文助手 ============
export interface DocumentTemplate {
  id: string
  name: string
  category: '通知' | '报告' | '请示' | '函件' | '批复'
  fields: string[]
}

export interface DocumentRecord {
  id: string
  templateId: string
  templateName: string
  title: string
  content: string
  status: 'draft' | 'editing' | 'exported'
  createdAt: string
  issues: DocumentIssue[]
}

export interface DocumentIssue {
  type: 'typo' | 'format' | 'sensitive' | 'political'
  message: string
  position: string
}

// ============ 公文助手 - 新模板卡片 ============
export interface TemplateCard {
  id: string
  name: string
  subtitle: string
  docType: '请示' | '通知' | '报告' | '函件' | '批复' | '约谈通知'
  businessField: string
  iconColor: string
  badge?: { text: string; type: 'hot' | 'new' }
  tags: { text: string; color: string }[]
  usageCount: number
  rating?: number
  ratingCount?: number
  description?: string
  isFavorite: boolean
}

export interface DocStats {
  monthlyGenerated: number
  monthlyGrowth: number
  approvalRate: number
  aiSavedHours: number
  inProgress: number
  totalArchived: number
}

export type DocTab = 'template' | 'review' | 'archive' | 'supervise'

// ============ 智能问数 ============
export interface MetricData {
  id: string
  name: string
  value: number
  unit: string
  period: string
  trend: number
  source: string
}

// ============ 分析报告 ============
export interface ReportTemplate {
  id: string
  name: string
  category: '月报' | '季报' | '专题'
  indicators: string[]
}

// ============ 业务审核 ============
export type AuditSuggestion = 'suggest_pass' | 'suggest_reject' | 'need_review'
export type AuditStatus = 'pending' | 'confirmed' | 'rejected' | 'returned'
export type RiskLevel = 'high' | 'medium' | 'low'

export interface AuditTask {
  id: string
  matterName: string
  applicantName: string
  applicantId: string
  status: AuditStatus
  aiSuggestion: AuditSuggestion
  aiReason: string
  hitRules: string[]
  missingMaterials: string[]
  riskLevel: RiskLevel
  createdAt: string
}

export interface AuditRule {
  id: string
  matterName: string
  ruleName: string
  condition: string
  status: 'active' | 'inactive'
  version: string
}

// ============ 风险预警 ============
export type TaskStatus = 'pending' | 'processing' | 'completed'

export interface RiskTask {
  id: string
  title: string
  source: string
  riskLevel: RiskLevel
  status: TaskStatus
  description: string
  createdAt: string
  deadline: string
}

// ============ 后台管理 ============
export interface User {
  id: string
  username: string
  name: string
  deptName: string
  department: string
  role: string
  roleName: string
  employeeNo: string
  status: 'active' | 'inactive'
  lastLoginAt: string
  phone: string
}

export interface KnowledgeDoc {
  id: string
  title: string
  category: '政策' | '办事指南' | '业务口径' | '公文规范'
  type: '政策文件' | '办事指南' | '业务规范' | '常见问题' | '案例解析'
  status: 'published' | 'draft' | 'archived'
  uploader: string
  uploadTime: string
  version: string
}

export interface LogRecord {
  id: string
  user: string
  module: string
  action: string
  detail: string
  time: string
}
