import { reactive } from 'vue'
import { DataAnalysis, TrendCharts, Money, User, Document } from '@element-plus/icons-vue'
import type { Component } from 'vue'

/** 系统已开放、可挂载模板的模块（路径严格按系统定义） */
export const TEMPLATE_MODULES = [
  '智能报告/调研分析报告',
  '智能报告/数据分析报告',
  '公文助手',
  '业务智审',
] as const

export type TemplateScope = 'public' | 'department' | 'private'
export type TemplateStatus = 'draft' | 'live'

/** 卡片图标可选 key（在编辑模板中配置） */
export const CARD_ICONS = ['trend', 'analysis', 'money', 'user', 'doc'] as const
export type CardIconKey = (typeof CARD_ICONS)[number]

export const CARD_ICON_MAP: Record<CardIconKey, Component> = {
  trend: TrendCharts,
  analysis: DataAnalysis,
  money: Money,
  user: User,
  doc: Document,
}

/** 卡片背景按图标固定分配 */
export const CARD_BG_MAP: Record<CardIconKey, string> = {
  trend: '#dbeafe',
  analysis: '#d1fae5',
  money: '#fef3c7',
  user: '#ede9fe',
  doc: '#e5e7eb',
}

/** 卡片标签可选项（在编辑模板中配置） */
export const CARD_TAG_OPTIONS = [
  { label: '热门', value: '热门', type: 'danger' as const },
  { label: '常用', value: '常用', type: 'success' as const },
  { label: '重点', value: '重点', type: 'warning' as const },
  { label: '无', value: '', type: 'info' as const },
]

export interface GovTemplate {
  id: string
  name: string
  type: string
  system?: boolean
  scope: TemplateScope
  createdBy: string
  createdDept: string
  createdAt: string
  updatedAt: string
  usage: number
  status: TemplateStatus
  org: string
  docNo: string
  title: string
  desc: string
  body: string
  /** 模板归属模块（多选） */
  modules: string[]
  /** 报告模板卡片展示配置 */
  cardIcon?: CardIconKey
  cardTag?: string
}

function dateOffset(offset: number): string {
  const x = new Date()
  x.setDate(x.getDate() - offset)
  return x.toISOString().slice(0, 16).replace('T', ' ')
}

// 模块级唯一数据源：公文模板管理与各业务页面共享
const templates = reactive<GovTemplate[]>([
  {
    id: 'tpl-001', name: '关于XX工作的请示', type: '请示', system: true,
    scope: 'public', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(30), updatedAt: dateOffset(10), usage: 28, status: 'live',
    org: 'XX市人力资源和社会保障局', docNo: 'X人社〔2026〕XX号',
    title: '关于XX工作的请示',
    desc: '用于向上级机关请示工作事项的标准模板',
    body: '<h2>关于【事项】工作的请示</h2><p>市政府：</p><p>根据【政策依据】要求，结合我市实际，现将【事项】有关情况请示如下：</p><p>一、【背景与缘由】</p><p>【详细说明背景、必要性等内容】</p><p>二、【请示事项】</p><p>【具体请示内容】</p><p>三、【建议方案】</p><p>【提出建议方案】</p><p>妥否，请批示。</p><p>XX市人力资源和社会保障局</p><p>2026年XX月XX日</p>',
    modules: ['公文助手'], cardIcon: 'doc', cardTag: '',
  },
  {
    id: 'tpl-002', name: '会议通知（通用）', type: '通知', system: true,
    scope: 'public', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(25), updatedAt: dateOffset(5), usage: 45, status: 'live',
    org: 'XX市人力资源和社会保障局', docNo: 'X人社办〔2026〕XX号',
    title: '关于召开【会议名称】的通知',
    desc: '召开各类会议的通用通知模板',
    body: '<h2>关于召开【会议名称】的通知</h2><p>各县（市、区）人力资源和社会保障局，局机关各科室、局属各单位：</p><p>经研究，定于【时间】召开【会议名称】。现将有关事项通知如下：</p>',
    modules: ['公文助手'], cardIcon: 'doc', cardTag: '',
  },
  // —— 以下为归属「智能报告/数据分析报告」且已发布的模板，将出现在数据分析报告页 ——
  {
    id: 'tpl-data-01', name: '城镇新增就业报表', type: '报告', system: true,
    scope: 'public', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(20), updatedAt: dateOffset(3), usage: 36, status: 'live',
    org: 'XX市人力资源和社会保障局', docNo: '',
    title: '城镇新增就业对比分析报告',
    desc: '围绕城镇新增就业人数、同比环比增幅等指标生成分析报告',
    body: '<h4>一、【分析周期】分析</h4><p>本期城镇新增就业【新增人数】，较【对比期】【增减情况】。</p><h4>二、趋势研判</h4><p>【趋势结论与行业波动说明】</p>',
    modules: ['智能报告/数据分析报告'], cardIcon: 'trend', cardTag: '热门',
  },
  {
    id: 'tpl-data-02', name: '职业技能培训报表', type: '报告', system: true,
    scope: 'public', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(18), updatedAt: dateOffset(2), usage: 27, status: 'live',
    org: 'XX市人力资源和社会保障局', docNo: '',
    title: '职业技能培训对比分析报告',
    desc: '围绕培训人数、合格率、取证率、就业转化率生成分析报告',
    body: '<h4>一、培训总体情况</h4><p>本期培训【培训人数】，合格率【合格率】，取证率【取证率】。</p>',
    modules: ['智能报告/数据分析报告'], cardIcon: 'analysis', cardTag: '常用',
  },
  {
    id: 'tpl-data-03', name: '创业担保贷款发放报表', type: '报告', system: true,
    scope: 'public', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(15), updatedAt: dateOffset(1), usage: 19, status: 'live',
    org: 'XX市人力资源和社会保障局', docNo: '',
    title: '创业担保贷款对比分析报告',
    desc: '围绕发放笔数、发放金额、带动就业人数生成分析报告',
    body: '<h4>一、发放总体情况</h4><p>本期发放创业担保贷款【发放笔数】，金额【发放金额】，扶持创业【扶持人数】。</p>',
    modules: ['智能报告/数据分析报告'], cardIcon: 'money', cardTag: '常用',
  },
  {
    id: 'tpl-data-04', name: '重点群体就业帮扶报表', type: '报告', system: true,
    scope: 'public', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(12), updatedAt: dateOffset(1), usage: 14, status: 'live',
    org: 'XX市人力资源和社会保障局', docNo: '',
    title: '重点群体就业帮扶分析报告',
    desc: '围绕就业困难人员帮扶人数、帮扶就业率、公益岗安置生成报告',
    body: '<h4>一、帮扶成效总览</h4><p>本期纳入帮扶【帮扶人数】，实现就业【就业人数】，帮扶就业率【帮扶就业率】。</p>',
    modules: ['智能报告/数据分析报告'], cardIcon: 'user', cardTag: '重点',
  },
  // 草稿态：归属数据分析报告但未发布，不应出现
  {
    id: 'tpl-data-draft', name: '灵活就业人员分析报表（草稿）', type: '报告', system: false,
    scope: 'private', createdBy: 'u1', createdDept: 'sys',
    createdAt: dateOffset(2), updatedAt: dateOffset(0), usage: 0, status: 'draft',
    org: 'XX市人力资源和社会保障局', docNo: '',
    title: '灵活就业人员分析报告',
    desc: '草稿模板，未发布，不应出现在数据分析报告页',
    body: '<p>【草稿正文】</p>',
    modules: ['智能报告/数据分析报告'], cardIcon: 'analysis', cardTag: '',
  },
])

/** 新增或更新模板 */
function upsertTemplate(tpl: GovTemplate): void {
  const idx = templates.findIndex((t) => t.id === tpl.id)
  if (idx >= 0) templates[idx] = tpl
  else templates.unshift(tpl)
}

function removeTemplate(id: string): void {
  const idx = templates.findIndex((t) => t.id === id)
  if (idx >= 0) templates.splice(idx, 1)
}

/**
 * 读取某业务模块页面可用的、已发布的报告模板。
 * 仅返回：归属模块包含 module 且 status === 'live'。
 */
function getPublishedTemplatesByModule(module: string): GovTemplate[] {
  return templates.filter((t) => t.status === 'live' && t.modules.includes(module))
}

export function useTemplateStore() {
  return {
    templates,
    upsertTemplate,
    removeTemplate,
    getPublishedTemplatesByModule,
  }
}