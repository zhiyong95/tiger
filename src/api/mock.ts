// Mock API 服务 - 模拟后端数据
import type {
  QARecord,
  QASource,
  DocumentTemplate,
  DocumentRecord,
  MetricData,
  ReportTemplate,
  AuditTask,
  AuditRule,
  RiskTask,
  KnowledgeDoc,
  User,
  LogRecord,
  DocStats,
  TemplateCard,
} from '@/types'

// 模拟延迟
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// ============ 知识问答 ============
const mockQASources: QASource[] = [
  {
    id: '1',
    name: '《就业促进法》第二十五条',
    content: '各级人民政府创造就业条件，扩大就业规模，改善就业环境，完善就业服务，加强职业教育和培训，提供就业援助。',
    docName: '中华人民共和国就业促进法',
    chapter: '第二章 政策支持',
  },
  {
    id: '2',
    name: '《失业保险条例》第十四条',
    content: '具备下列条件的失业人员，可以领取失业保险金：（一）按照规定参加失业保险，所在单位和本人已按照规定履行缴费义务满1年的；（二）非因本人意愿中断就业的；（三）已办理失业登记，并有求职要求的。',
    docName: '失业保险条例',
    chapter: '第三章 失业保险金',
  },
  {
    id: '3',
    name: '《关于延续实施部分减负稳岗扩就业政策措施的通知》',
    content: '继续实施失业保险稳岗返还政策，对不裁员少裁员的参保企业，返还其上年度实际缴纳失业保险费的60%。',
    docName: '人社部发〔2024〕15号',
    chapter: '一、稳岗返还',
  },
]

export async function fetchQAAnswer(question: string, history: { role: string; content: string }[]): Promise<{ answer: string; sources: QASource[] }> {
  await delay(800)
  const answers: Record<string, string> = {
    default: `根据相关政策规定，${question}的具体内容如下：

1. **政策依据**：根据《就业促进法》及相关配套政策，人社部门在促进就业方面承担重要职责。

2. **具体措施**：
   - 提供就业信息服务和职业指导
   - 开展职业技能培训
   - 实施就业援助政策
   - 落实社保补贴和岗位补贴

3. **办理流程**：申请人可通过当地人社服务窗口或线上平台提交申请，经审核后享受相应政策。

> AI生成，仅供业务参考。具体以最新政策文件为准。`,
  }

  return {
    answer: answers.default,
    sources: mockQASources.slice(0, 2),
  }
}

export async function fetchQAHistory(): Promise<QARecord[]> {
  await delay()
  return [
    { id: '1', question: '失业保险金领取条件是什么？', answer: '根据《失业保险条例》...', time: '2024-08-05 14:30', feedback: 'useful' },
    { id: '2', question: '灵活就业社保补贴标准是多少？', answer: '根据当地政策...', time: '2024-08-05 11:20', feedback: null },
    { id: '3', question: '稳岗返还政策最新规定', answer: '根据人社部发〔2024〕15号...', time: '2024-08-04 16:45', feedback: 'useful' },
  ]
}

// ============ 公文助手 ============
const mockTemplates: DocumentTemplate[] = [
  { id: '1', name: '工作通知', category: '通知', fields: ['标题', '发文对象', '正文', '落款', '日期'] },
  { id: '2', name: '工作报告', category: '报告', fields: ['标题', '报告对象', '工作背景', '工作内容', '工作总结', '落款'] },
  { id: '3', name: '请示函', category: '请示', fields: ['标题', '请示对象', '请示事项', '理由说明', '落款'] },
  { id: '4', name: '公函', category: '函件', fields: ['标题', '发函单位', '收函单位', '函告事项', '落款'] },
  { id: '5', name: '批复', category: '批复', fields: ['标题', '批复对象', '批复事项', '批复意见', '落款'] },
]

export async function fetchDocumentTemplates(): Promise<DocumentTemplate[]> {
  await delay()
  return mockTemplates
}

export async function generateDocument(templateId: string, params: Record<string, string>): Promise<DocumentRecord> {
  await delay(1500)
  const template = mockTemplates.find((t) => t.id === templateId)
  return {
    id: Date.now().toString(),
    templateId,
    templateName: template?.name || '未知模板',
    title: params.title || '未命名公文',
    content: `【${template?.name || '公文'}】

${params.title || '关于XXX的通知'}

${params.target || '各相关单位：'}

${params.content || '根据工作需要，现将有关事宜通知如下：\n\n一、工作内容\n二、工作要求\n三、其他事项'}

${params.signature || 'XX市人力资源和社会保障局'}
${params.date || new Date().toLocaleDateString('zh-CN')}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    issues: [
      { type: 'format', message: '建议将"XX"替换为具体单位名称', position: '正文第1段' },
      { type: 'sensitive', message: '请确认涉政表述是否准确', position: '正文第2段' },
    ],
  }
}

// ============ 公文助手 - 模板卡片数据 ============
export const mockDocStats: DocStats = {
  monthlyGenerated: 387,
  monthlyGrowth: 32,
  approvalRate: 98.6,
  aiSavedHours: 156,
  inProgress: 24,
  totalArchived: 12438,
}

export const mockTemplateCards: TemplateCard[] = [
  {
    id: 't1', name: '请示模板·向上级请示事项', subtitle: '综合管理·请示', docType: '请示',
    businessField: '综合管理', iconColor: '#3b82f6',
    badge: { text: '热门', type: 'hot' },
    tags: [{ text: '人社专用', color: '#3b82f6' }, { text: '含套红', color: '#d97706' }],
    usageCount: 28, isFavorite: true,
  },
  {
    id: 't2', name: '会议通知模板', subtitle: '综合管理·通知', docType: '通知',
    businessField: '综合管理', iconColor: '#10b981',
    badge: { text: '新增', type: 'new' },
    tags: [{ text: '人社专用', color: '#3b82f6' }, { text: '2026新版', color: '#10b981' }],
    usageCount: 15, isFavorite: true,
  },
  {
    id: 't3', name: '就业工作报告模板', subtitle: '就业促进·报告', docType: '报告',
    businessField: '就业促进', iconColor: '#8b5cf6',
    badge: { text: '热门', type: 'hot' },
    tags: [{ text: '含数据图表', color: '#8b5cf6' }],
    usageCount: 42, isFavorite: true,
  },
  {
    id: 't4', name: '约谈通知模板', subtitle: '劳动关系·通知', docType: '约谈通知',
    businessField: '劳动关系', iconColor: '#f59e0b',
    tags: [{ text: '人社专用', color: '#3b82f6' }],
    usageCount: 8, isFavorite: true,
  },
  {
    id: 't5', name: '社保补贴审批函', subtitle: '社会保险·函件', docType: '函件',
    businessField: '社会保险', iconColor: '#ec4899',
    tags: [{ text: '含套红', color: '#d97706' }, { text: '2026新版', color: '#10b981' }],
    usageCount: 21, isFavorite: false,
  },
  {
    id: 't6', name: '人才引进工作批复', subtitle: '人才开发·批复', docType: '批复',
    businessField: '人才开发', iconColor: '#6366f1',
    tags: [{ text: '人社专用', color: '#3b82f6' }],
    usageCount: 12, isFavorite: false,
  },
]

export const mockHotTemplateCards: TemplateCard[] = [
  {
    id: 'h1', name: '季度工作总结报告模板', subtitle: '综合管理·报告', docType: '报告',
    businessField: '综合管理', iconColor: '#8b5cf6',
    badge: { text: '热门', type: 'hot' },
    tags: [{ text: '含数据图表', color: '#8b5cf6' }, { text: '2026新版', color: '#10b981' }],
    usageCount: 186, rating: 4.8, ratingCount: 142,
    description: '结构化呈现季度工作完成情况，自动关联关键指标数据，支持同比环比分析。',
    isFavorite: false,
  },
  {
    id: 'h2', name: '就业补贴申请报告模板', subtitle: '就业促进·报告', docType: '报告',
    businessField: '就业促进', iconColor: '#8b5cf6',
    tags: [{ text: '人社专用', color: '#3b82f6' }, { text: '含套红', color: '#d97706' }],
    usageCount: 153, rating: 4.7, ratingCount: 128,
    description: '适用于就业困难人员社保补贴、灵活就业补贴等各类补贴申请报告。',
    isFavorite: false,
  },
  {
    id: 'h3', name: '请示函·专项资金申请', subtitle: '规划财务·请示', docType: '请示',
    businessField: '规划财务', iconColor: '#3b82f6',
    tags: [{ text: '含数据图表', color: '#8b5cf6' }],
    usageCount: 97, rating: 4.6, ratingCount: 85,
    description: '向上级部门申请专项资金的请示函模板，包含预算明细和项目说明。',
    isFavorite: false,
  },
  {
    id: 'h4', name: '政策解读通知模板', subtitle: '政策法规·通知', docType: '通知',
    businessField: '政策法规', iconColor: '#10b981',
    tags: [{ text: '人社专用', color: '#3b82f6' }, { text: '2026新版', color: '#10b981' }],
    usageCount: 78, rating: 4.5, ratingCount: 63,
    description: '用于发布新政策解读文件，包含政策背景、核心条款、实施要点等模块。',
    isFavorite: false,
  },
]

export async function fetchDocStats(): Promise<DocStats> {
  await delay(300)
  return mockDocStats
}

export async function fetchTemplateCards(): Promise<TemplateCard[]> {
  await delay(300)
  return mockTemplateCards
}

export async function fetchHotTemplateCards(): Promise<TemplateCard[]> {
  await delay(300)
  return mockHotTemplateCards
}

// ============ 智能问数 ============
const mockMetrics: MetricData[] = [
  { id: '1', name: '城镇新增就业人数', value: 12580, unit: '人', period: '2024年7月', trend: 5.2, source: '就业统计系统' },
  { id: '2', name: '失业登记人数', value: 3420, unit: '人', period: '2024年7月', trend: -2.1, source: '失业监测系统' },
  { id: '3', name: '就业困难人员帮扶数', value: 856, unit: '人', period: '2024年7月', trend: 3.8, source: '就业援助系统' },
  { id: '4', name: '职业技能培训人数', value: 4230, unit: '人', period: '2024年7月', trend: 8.5, source: '培训管理系统' },
  { id: '5', name: '失业保险金发放人数', value: 2150, unit: '人', period: '2024年7月', trend: -1.3, source: '社保系统' },
  { id: '6', name: '稳岗返还企业数', value: 1860, unit: '家', period: '2024年7月', trend: 12.4, source: '社保系统' },
]

export async function queryMetric(question: string): Promise<{ data: MetricData[]; chartType: string; explanation: string }> {
  await delay(1000)
  return {
    data: mockMetrics.slice(0, 4),
    chartType: 'bar',
    explanation: '指标口径：城镇新增就业人数指报告期内城镇单位就业人员增加数，数据来源为就业统计系统，更新时间为每月5日。',
  }
}

export async function fetchMetrics(): Promise<MetricData[]> {
  await delay()
  return mockMetrics
}

// ============ 分析报告 ============
const mockReportTemplates: ReportTemplate[] = [
  { id: '1', name: '就业形势月报', category: '月报', indicators: ['城镇新增就业', '失业登记', '技能培训'] },
  { id: '2', name: '就业工作季报', category: '季报', indicators: ['新增就业', '失业率', '培训人数', '补贴发放'] },
  { id: '3', name: '就业援助专题报告', category: '专题', indicators: ['困难人员', '帮扶措施', '就业效果'] },
]

export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  await delay()
  return mockReportTemplates
}

const reportTypeNames: Record<string, string> = {
  monthly: '就业形势月度分析报告',
  quarterly: '社保运行季报',
  monitor: '重点群体就业监测报告',
  gig: '零工市场运行分析报告',
  custom: '自定义专题分析报告'
}

const reportContents: Record<string, { content: string; suggestions: string[] }> = {
  monthly: {
    content: `一、总体情况
{period}，我市就业形势总体稳定，各项指标保持在合理区间，主要指标完成情况良好。

二、主要指标分析
1. 城镇新增就业：累计新增就业12,580人，同比增长5.2%，完成年度目标任务的105.3%。
2. 失业登记：累计失业登记3,420人，同比下降2.1%，就业稳定性持续增强。
3. 技能培训：累计开展技能培训4,230人，同比增长8.5%，培训覆盖面和精准度进一步提升。

三、存在问题
1. 部分行业就业压力仍然较大，特别是传统制造业转型升级带来的就业结构调整压力。
2. 结构性矛盾依然突出，高技能人才供给不足与普通劳动力过剩并存。

四、下一步工作建议
1. 加大职业技能培训力度，特别是针对新兴产业和新业态的技能培训。
2. 完善就业服务体系，加强就业信息平台建设，提高人岗匹配效率。
3. 强化重点群体就业帮扶，确保高校毕业生、困难人员等重点群体就业稳定。`,
    suggestions: [
      '建议加强第四季度就业形势监测，重点关注返乡农民工就业情况',
      '建议加大对新业态从业人员社保覆盖力度',
      '建议优化就业服务信息系统，实现"一网通办"'
    ]
  },
  quarterly: {
    content: `一、总体情况
{period}，我市社保运行总体平稳，参保覆盖面持续扩大，基金运行安全稳健。

二、主要指标分析
1. 参保人数：全市参保总人数428.6万人，同比增长5.8%，其中企业职工参保占比68.3%。
2. 基金收入：社保基金总收入156.8亿元，同比增长7.2%。
3. 基金支出：社保基金总支出123.4亿元，同比增长6.5%，基金累计结余387.2亿元。

三、存在问题
1. 部分中小企业参保率偏低，参保意识有待加强。
2. 基金保值增值压力增大，投资渠道需进一步拓宽。

四、下一步工作建议
1. 加大社保政策宣传力度，提高中小企业参保积极性。
2. 优化基金投资策略，提高基金运营效率。
3. 推进社保经办服务数字化转型，提升服务效能。`,
    suggestions: [
      '建议优化社保基金投资结构，提高长期收益水平',
      '建议推进社保卡"一卡通"应用，拓展服务场景',
      '建议加强社保基金风险预警，确保基金安全'
    ]
  },
  monitor: {
    content: `一、总体情况
{period}，我市重点群体就业形势总体稳定，各项帮扶政策落实到位。

二、主要指标分析
1. 高校毕业生：2025届高校毕业生就业去向落实率86.5%，同比增长2.3个百分点。
2. 困难人员：帮扶困难人员就业2,156人，完成目标任务的107.8%。
3. 退役军人：退役军人就业安置率93.2%，保持较高水平。

三、存在问题
1. 部分高校毕业生就业期望与实际岗位存在差距。
2. 困难人员就业稳定性有待提高，部分岗位流动性较大。

四、下一步工作建议
1. 加强高校毕业生就业指导，引导树立合理就业预期。
2. 完善困难人员就业跟踪服务机制，提高就业稳定性。
3. 加大公益性岗位开发力度，兜底保障困难群体就业。`,
    suggestions: [
      '建议建立高校毕业生就业去向跟踪机制',
      '建议开展困难人员"一对一"就业帮扶',
      '建议完善退役军人就业创业扶持政策'
    ]
  },
  gig: {
    content: `一、总体情况
{period}，我市零工市场运行活跃，灵活就业规模持续扩大，平台经济带动效应明显。

二、主要指标分析
1. 灵活就业人数：全市灵活就业人员5.87万人，同比增长12.9%。
2. 零工市场交易：线上零工平台日均发布岗位1,280个，日均成交订单860单。
3. 新业态从业：外卖骑手、网约车司机等新就业形态从业者1.86万人。

三、存在问题
1. 灵活就业人员社保覆盖不足，参保率仅为42.3%。
2. 零工市场信息不对称，部分岗位存在信息不透明问题。

四、下一步工作建议
1. 完善灵活就业人员社保政策，探索按单参保模式。
2. 规范零工市场信息发布，建立信用评价体系。
3. 加强新就业形态劳动者权益保障，推动平台企业履行社会责任。`,
    suggestions: [
      '建议探索灵活就业人员"按单参保"新模式',
      '建议建立零工市场信用评价和信息公示制度',
      '建议加强新就业形态劳动者劳动权益保障'
    ]
  },
  custom: {
    content: `一、总体情况
{period}，我市人力资源和社会保障各项工作稳步推进，各项指标完成情况良好。

二、主要指标分析
1. 就业指标：城镇新增就业1.26万人，同比增长5.2%。
2. 社保指标：参保人数428.6万人，同比增长5.8%。
3. 人才指标：引进各类人才3.2万人，同比增长12.6%。

三、存在问题
1. 人才引进与产业需求匹配度有待提高。
2. 基层人社服务能力需要进一步加强。

四、下一步工作建议
1. 深化人才发展体制机制改革，优化人才引进政策。
2. 加强基层人社服务平台建设，提升服务能力。
3. 推进人社领域数字化转型，提高工作效率。`,
    suggestions: [
      '建议统筹推进就业、社保、人才等各项工作',
      '建议加强基层人社服务平台标准化建设',
      '建议推进人社业务"一网通办"，提升服务体验'
    ]
  }
}

export async function generateReport(reportType: string, period: string): Promise<{ title: string; content: string; suggestions: string[] }> {
  await delay(2000)
  const name = reportTypeNames[reportType] || '智能分析报告'
  const data = reportContents[reportType] || reportContents.custom
  return {
    title: `${name} - ${period}`,
    content: data.content.replace(/\{period\}/g, period),
    suggestions: data.suggestions,
  }
}

// ============ 业务审核 ============
const mockAuditTasks: AuditTask[] = [
  {
    id: '1',
    matterName: '就业补贴资格预审',
    applicantName: '李某某',
    applicantId: '320102199001011234',
    status: 'pending',
    aiSuggestion: 'suggest_pass',
    aiReason: '申请人符合就业补贴申请条件，年龄、参保状态、就业状态均满足要求。',
    hitRules: ['年龄18-60周岁', '参保满6个月', '非全日制就业'],
    missingMaterials: [],
    riskLevel: 'low',
    createdAt: '2024-08-05 10:30',
  },
  {
    id: '2',
    matterName: '灵活就业社保补贴',
    applicantName: '王某某',
    applicantId: '320102198505052345',
    status: 'pending',
    aiSuggestion: 'need_review',
    aiReason: '申请人参保状态异常，需人工核实最近3个月社保缴纳记录。',
    hitRules: ['灵活就业登记', '社保补贴未超期'],
    missingMaterials: ['最近3个月社保缴纳证明'],
    riskLevel: 'medium',
    createdAt: '2024-08-05 09:15',
  },
  {
    id: '3',
    matterName: '就业补贴资格预审',
    applicantName: '赵某某',
    applicantId: '320102199208083456',
    status: 'pending',
    aiSuggestion: 'suggest_reject',
    aiReason: '申请人已超过补贴享受期限，不符合本次申请条件。',
    hitRules: ['补贴期限已超24个月'],
    missingMaterials: [],
    riskLevel: 'high',
    createdAt: '2024-08-04 16:20',
  },
]

export async function fetchAuditTasks(): Promise<AuditTask[]> {
  await delay()
  return mockAuditTasks
}

export async function submitAuditReview(taskId: string, decision: 'confirm' | 'reject' | 'return', comment: string): Promise<{ success: boolean }> {
  await delay(500)
  return { success: true }
}

// ============ 风险预警与任务 ============
const mockRiskTasks: RiskTask[] = [
  { id: '1', title: '重复领取就业补贴预警', source: '系统自动比对', riskLevel: 'high', status: 'pending', description: '发现3名人员可能存在重复领取就业补贴情况', createdAt: '2024-08-05 08:00', deadline: '2024-08-07' },
  { id: '2', title: '社保缴纳异常提醒', source: '数据比对', riskLevel: 'medium', status: 'pending', description: '5名灵活就业人员社保缴纳状态异常', createdAt: '2024-08-04 14:30', deadline: '2024-08-08' },
  { id: '3', title: '培训补贴审核待办', source: '业务流转', riskLevel: 'low', status: 'pending', description: '12份培训补贴申请待审核', createdAt: '2024-08-04 10:00', deadline: '2024-08-10' },
  { id: '4', title: '政策到期提醒', source: '系统定时任务', riskLevel: 'medium', status: 'processing', description: '3项就业扶持政策即将到期，需评估延续方案', createdAt: '2024-08-03 09:00', deadline: '2024-08-15' },
  { id: '5', title: '数据质量异常', source: '数据质量检查', riskLevel: 'low', status: 'completed', description: '2条就业统计数据格式异常，已修正', createdAt: '2024-08-02 11:00', deadline: '2024-08-05' },
]

export async function fetchRiskTasks(): Promise<RiskTask[]> {
  await delay()
  return mockRiskTasks
}

export async function handleRiskTask(taskId: string, action: string, comment: string): Promise<{ success: boolean }> {
  await delay(500)
  return { success: true }
}

// ============ 首页数据 ============
export async function fetchDashboardData() {
  await delay()
  return {
    // 伴您办公天数
    workDays: 186,
    // 效益总览指标
    benefits: [
      { id: '1', name: '累计节省工时', value: 2856, unit: '小时', icon: 'Timer', trend: 12.5 },
      { id: '2', name: 'AI生成成果总数', value: 1532, unit: '篇', icon: 'Document', trend: 8.3 },
      { id: '3', name: '知识问答服务次数', value: 8472, unit: '次', icon: 'ChatDotRound', trend: 23.1 },
      { id: '4', name: '智能审核减负条数', value: 3689, unit: '条', icon: 'Checked', trend: 15.6 },
    ],
    // 各AI工具使用次数
    functionUsage: [
      { name: '智能问数', count: 1268, path: '/data' },
      { name: '智能分析报告', count: 532, path: '/report' },
      { name: '政策快研', count: 876, path: '/policy' },
      { name: '人社知识智能问答', count: 2547, path: '/qa' },
      { name: 'AI公文助手', count: 1893, path: '/document' },
      { name: '业务智能审核', count: 765, path: '/audit' },
    ],
    // 各AI工具效益贡献数据（柱状图）
    contributionData: {
      thisWeek: [
        { name: '智能问数', value: 45 },
        { name: '智能分析报告', value: 28 },
        { name: '政策快研', value: 36 },
        { name: '知识问答', value: 52 },
        { name: 'AI公文助手', value: 41 },
        { name: '业务审核', value: 33 },
      ],
      thisMonth: [
        { name: '智能问数', value: 186 },
        { name: '智能分析报告', value: 112 },
        { name: '政策快研', value: 154 },
        { name: '知识问答', value: 228 },
        { name: 'AI公文助手', value: 175 },
        { name: '业务审核', value: 138 },
      ],
      thisQuarter: [
        { name: '智能问数', value: 520 },
        { name: '智能分析报告', value: 335 },
        { name: '政策快研', value: 460 },
        { name: '知识问答', value: 680 },
        { name: 'AI公文助手', value: 510 },
        { name: '业务审核', value: 390 },
      ],
      all: [
        { name: '智能问数', value: 1268 },
        { name: '智能分析报告', value: 532 },
        { name: '政策快研', value: 876 },
        { name: '知识问答', value: 2547 },
        { name: 'AI公文助手', value: 1893 },
        { name: '业务审核', value: 765 },
      ],
    },
    // 最近AI使用记录
    recentRecords: [
      { id: '1', time: '2026-08-25 15:32', module: 'AI公文助手', title: '关于2026年就业促进工作的报告', status: 'completed' },
      { id: '2', time: '2026-08-25 14:15', module: '智能问数', title: '2026年7月就业数据查询', status: 'completed' },
      { id: '3', time: '2026-08-25 11:40', module: '政策快研', title: '关于失业保险稳岗返还政策的研究', status: 'completed' },
      { id: '4', time: '2026-08-25 09:20', module: '人社知识智能问答', title: '灵活就业人员社会保险补贴政策咨询', status: 'completed' },
      { id: '5', time: '2026-08-24 16:50', module: '智能分析报告', title: '2026年7月就业形势分析报告', status: 'completed' },
      { id: '6', time: '2026-08-24 15:00', module: '业务智能审核', title: '就业困难人员认定资格批量审核', status: 'completed' },
      { id: '7', time: '2026-08-24 11:10', module: 'AI公文助手', title: '关于加强高校毕业生就业服务的通知', status: 'completed' },
      { id: '8', time: '2026-08-24 09:30', module: '智能问数', title: '2026年各区县就业数据对比', status: 'completed' },
    ],
  }
}

// ============ 后台管理 ============
export async function fetchUsers(): Promise<User[]> {
  await delay()
  return [
    { id: '1', username: 'zhangming', name: '张明', deptName: '就业促进科', department: '就业促进科', roleName: '业务科室人员', role: '业务科室人员', employeeNo: 'RZ-001', status: 'active', phone: '138****1234', lastLoginAt: '2024-08-05 14:30' },
    { id: '2', username: 'lihua', name: '李华', deptName: '社会保险科', department: '社会保险科', roleName: '业务科室人员', role: '业务科室人员', employeeNo: 'RZ-002', status: 'active', phone: '139****5678', lastLoginAt: '2024-08-05 10:15' },
    { id: '3', username: 'wangfang', name: '王芳', deptName: '人才开发科', department: '人才开发科', roleName: '窗口经办人员', role: '窗口经办人员', employeeNo: 'RZ-003', status: 'active', phone: '137****9012', lastLoginAt: '2024-08-04 16:45' },
    { id: '4', username: 'admin', name: '赵强', deptName: '系统管理', department: '系统管理', roleName: '系统管理员', role: '系统管理员', employeeNo: 'RZ-000', status: 'active', phone: '136****3456', lastLoginAt: '2024-08-05 09:00' },
    { id: '5', username: 'chenjing', name: '陈静', deptName: '劳动关系科', department: '劳动关系科', roleName: '业务科室人员', role: '业务科室人员', employeeNo: 'RZ-004', status: 'inactive', phone: '135****7890', lastLoginAt: '2024-07-20 11:20' },
  ]
}

export async function fetchKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  await delay()
  return [
    { id: '1', title: '《就业促进法》全文', category: '政策', type: '政策文件', status: 'published', uploader: '赵强', uploadTime: '2024-07-01', version: 'v1.0' },
    { id: '2', title: '失业保险办事指南', category: '办事指南', type: '办事指南', status: 'published', uploader: '张明', uploadTime: '2024-07-15', version: 'v2.1' },
    { id: '3', title: '就业补贴业务口径', category: '业务口径', type: '业务规范', status: 'published', uploader: '李华', uploadTime: '2024-08-01', version: 'v1.3' },
    { id: '4', title: '公文写作规范手册', category: '公文规范', type: '业务规范', status: 'draft', uploader: '王芳', uploadTime: '2024-08-03', version: 'v1.0' },
  ]
}

export async function fetchAuditRules(): Promise<AuditRule[]> {
  await delay()
  return [
    { id: '1', matterName: '就业补贴资格预审', ruleName: '年龄条件', condition: '申请人年龄在18-60周岁之间', status: 'active', version: 'v1.0' },
    { id: '2', matterName: '就业补贴资格预审', ruleName: '参保条件', condition: '连续参保满6个月', status: 'active', version: 'v1.0' },
    { id: '3', matterName: '灵活就业社保补贴', ruleName: '登记条件', condition: '已办理灵活就业登记', status: 'active', version: 'v1.1' },
    { id: '4', matterName: '灵活就业社保补贴', ruleName: '期限条件', condition: '补贴享受期限不超过24个月', status: 'active', version: 'v1.1' },
  ]
}

export async function fetchLogs(): Promise<LogRecord[]> {
  await delay()
  return [
    { id: '1', user: '张明', module: '知识问答', action: '提问', detail: '查询失业保险金领取条件', time: '2024-08-05 14:30:22' },
    { id: '2', user: '张明', module: '公文助手', action: '生成', detail: '生成工作通知初稿', time: '2024-08-05 14:25:10' },
    { id: '3', user: '李华', module: '智能问数', action: '查询', detail: '查询本月新增就业人数', time: '2024-08-05 11:20:45' },
    { id: '4', user: '王芳', module: '业务审核', action: '复核', detail: '确认就业补贴预审结果', time: '2024-08-05 10:30:18' },
    { id: '5', user: '赵强', module: '系统管理', action: '配置', detail: '更新审核规则v1.1', time: '2024-08-04 16:00:00' },
    { id: '6', user: '张明', module: '知识问答', action: '反馈', detail: '标记答案"有用"', time: '2024-08-04 14:30:22' },
  ]
}

// ============ 知识问答 FAQ 和热门问题 ============
export const faqQuestions = [
  '车辆进京通行证核发',
  '残疾人两项补贴查询',
  '申请开具有无犯罪记录证明',
  '如何申请高龄老年人津贴?',
  '企业注册时，提示"统一社会信用代码已被其他企业注册使用"如何处理?',
]

export const hotTopics = [
  '教师资格证',
  '生育服务',
  '老年人办事服务',
  '军人退役',
  '公积金提取',
  '医疗保险登记',
  '育儿补贴制度政策问答',
  '中共中央办公厅 国务院办公厅印发《育儿补贴制度实施方案》',
]

// ============ 登录认证 ============
export async function login(username: string, _password: string, role: 'staff' | 'leader' | 'sysadmin' | 'bizadmin' | 'auditor'): Promise<{ token: string; user: { name: string; department: string; role: string; avatar: string } }> {
  await delay(500)
  // 模拟登录验证（任意用户名密码均可登录）
  const staffUsers: Record<string, { name: string; department: string; role: string }> = {
    admin: { name: '赵强', department: '系统管理', role: '系统管理员' },
    zhangming: { name: '张明', department: '就业促进科', role: '业务科室人员' },
    lihua: { name: '李华', department: '社会保险科', role: '业务科室人员' },
    wangfang: { name: '王芳', department: '人才开发科', role: '窗口经办人员' },
  }

  // 手机验证码登录自动识别
  const isPhoneLogin = /^1[3-9]\d{9}$/.test(username)
  // 电子社保卡号登录（以62开头18位数字模拟）
  const isSscardLogin = /^62\d{16}$/.test(username)

  let userKey = username.toLowerCase()
  let userInfo: { name: string; department: string; role: string }

  if (isPhoneLogin) {
    // 手机号登录：验证码为 123456 可登录
    if (_password !== '123456') {
      throw new Error('验证码错误')
    }
    // 根据手机号映射用户
    const phoneUsers: Record<string, { name: string; department: string; role: string }> = {
      '13800138000': { name: '张明', department: '就业促进科', role: '业务科室人员' },
      '13900139000': { name: '李华', department: '社会保险科', role: '业务科室人员' },
    }
    userInfo = phoneUsers[username] || { name: username.slice(-4) + '用户', department: '人社服务大厅', role: '窗口经办人员' }
  } else if (isSscardLogin) {
    // 电子社保码登录：密码为 888888 可登录
    if (_password !== '888888') {
      throw new Error('社保卡密码错误')
    }
    const sscardUsers: Record<string, { name: string; department: string; role: string }> = {
      '620000000000000001': { name: '张明', department: '就业促进科', role: '业务科室人员' },
      '620000000000000002': { name: '李华', department: '社会保险科', role: '业务科室人员' },
    }
    userInfo = sscardUsers[username] || { name: '社保用户', department: '人社服务大厅', role: '窗口经办人员' }
  } else {
    userInfo = staffUsers[userKey] || { name: username, department: '人社服务大厅', role: '窗口经办人员' }
  }

  // 根据角色映射显示名称
  const roleNames: Record<string, string> = {
    staff: '工作人员',
    leader: '科室负责人/领导',
    sysadmin: '系统管理员',
    bizadmin: '业务管理员',
    auditor: '审计人员',
  }

  return {
    token: `mock-${role}-token-` + Date.now(),
    user: {
      name: userInfo.name,
      department: role === 'sysadmin' || role === 'bizadmin' || role === 'auditor' ? '系统管理' : userInfo.department,
      role: roleNames[role] || userInfo.role,
      avatar: '',
    },
  }
}
