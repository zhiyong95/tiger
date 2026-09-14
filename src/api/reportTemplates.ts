import { Document, DataAnalysis, TrendCharts, Money, User } from '@element-plus/icons-vue'
import type { Component } from 'vue'

/**
 * 报告模板数据源（模拟取自「公文模板管理」）
 * 仅返回：模板归属模块 =「智能报告/数据分析报告」且发布状态 =「已发布」的模板
 */
export interface ReportTemplate {
  id: string
  name: string
  icon: Component
  tag?: string
  tagType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  bg: string
  desc: string
  module: string // 模板归属模块
  status: 'draft' | 'live' // live 表示已发布
}

// 模拟公文模板管理库中的全量模板
const reportTemplateStore: ReportTemplate[] = [
  {
    id: 'rt-01',
    name: '城镇新增就业报表',
    icon: TrendCharts,
    tag: '热门',
    tagType: 'danger',
    bg: '#dbeafe',
    desc: '围绕城镇新增就业人数、同比环比增幅等指标生成分析报告',
    module: '智能报告/数据分析报告',
    status: 'live',
  },
  {
    id: 'rt-02',
    name: '职业技能培训报表',
    icon: DataAnalysis,
    tag: '常用',
    tagType: 'success',
    bg: '#d1fae5',
    desc: '围绕培训人数、合格率、取证率、就业转化率生成分析报告',
    module: '智能报告/数据分析报告',
    status: 'live',
  },
  {
    id: 'rt-03',
    name: '创业担保贷款发放报表',
    icon: Money,
    tag: '常用',
    tagType: 'primary',
    bg: '#fef3c7',
    desc: '围绕发放笔数、发放金额、带动就业人数生成分析报告',
    module: '智能报告/数据分析报告',
    status: 'live',
  },
  {
    id: 'rt-04',
    name: '重点群体就业帮扶报表',
    icon: User,
    tag: '重点',
    tagType: 'warning',
    bg: '#ede9fe',
    desc: '围绕就业困难人员帮扶人数、帮扶就业率、公益岗安置生成报告',
    module: '智能报告/数据分析报告',
    status: 'live',
  },
  // 不代表数据分析报告模块：草稿态或归属其他模块，不应被读取到
  {
    id: 'rt-99',
    name: '公文通知模板',
    icon: Document,
    bg: '#e5e7eb',
    desc: '通用公文通知类模板（归属公文助手，不参与本报告筛选）',
    module: '公文助手',
    status: 'live',
  },
  {
    id: 'rt-98',
    name: '就业形势调研模板（草稿）',
    icon: Document,
    bg: '#e5e7eb',
    desc: '尚在草稿，未发布，不应被读取到',
    module: '智能报告/数据分析报告',
    status: 'draft',
  },
]

/**
 * 读取可用于「数据分析报告」的报告模板。
 * 过滤条件：归属模块包含「智能报告/数据分析报告」且状态为已发布（live）。
 * 无可用模板时返回空数组，调用方据此展示空态。
 * @returns 可用的报告模板列表
 */
export function getDataReportTemplates(): ReportTemplate[] {
  return reportTemplateStore.filter(
    (t) => t.status === 'live' && t.module.includes('智能报告/数据分析报告'),
  )
}