import * as XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============ 通用样式工具 ============
const FONT_DEFAULT = { name: '微软雅黑', sz: 10 }
const FONT_TITLE = { name: '微软雅黑', sz: 14, bold: true, color: { rgb: 'FFFFFF' } }
const FONT_HEADER = { name: '微软雅黑', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }
const FONT_BOLD = { name: '微软雅黑', sz: 10, bold: true }
const FONT_RED = { name: '微软雅黑', sz: 10, color: { rgb: 'CC0000' } }
const FONT_GREEN = { name: '微软雅黑', sz: 10, color: { rgb: '107C41' } }
const FONT_BLUE = { name: '微软雅黑', sz: 10, color: { rgb: '2563eb' } }
const FONT_ORANGE = { name: '微软雅黑', sz: 10, color: { rgb: 'CC6600' } }

const BG_TITLE = { pattern: { fgColor: { rgb: '0a1e5c' } }, type: 'solid' }
const BG_HEADER = { pattern: { fgColor: { rgb: '1a3d8f' } }, type: 'solid' }
const BG_CAT_A = { pattern: { fgColor: { rgb: 'FCE4EC' } }, type: 'solid' }
const BG_CAT_B = { pattern: { fgColor: { rgb: 'E8F5E9' } }, type: 'solid' }
const BG_CAT_C = { pattern: { fgColor: { rgb: 'E3F2FD' } }, type: 'solid' }
const BG_LIGHT_GRAY = { pattern: { fgColor: { rgb: 'F5F5F5' } }, type: 'solid' }
const BG_WHITE = { pattern: { fgColor: { rgb: 'FFFFFF' } }, type: 'solid' }

const ALIGN_CENTER = { horizontal: 'center', vertical: 'center', wrapText: true }
const ALIGN_LEFT = { horizontal: 'left', vertical: 'center', wrapText: true }
const ALIGN_CENTER_MIDDLE = { horizontal: 'center', vertical: 'middle', wrapText: true }

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'D0D0D0' } },
  bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
  left: { style: 'thin', color: { rgb: 'D0D0D0' } },
  right: { style: 'thin', color: { rgb: 'D0D0D0' } },
}

function cell(v, opts = {}) {
  return { v, t: typeof v === 'string' ? 's' : 'n', s: { font: FONT_DEFAULT, alignment: ALIGN_LEFT, border: BORDER_THIN, ...opts } }
}

function headerCell(v) {
  return { v, t: 's', s: { font: FONT_HEADER, alignment: ALIGN_CENTER, border: BORDER_THIN, fill: BG_HEADER } }
}

// ============ 数据定义 ============

const features = [
  // === A类 - 核心数据类 ===
  {
    cat: 'A类',
    catLabel: '核心数据类\n（强依赖业务数据）',
    module: '工作台首页',
    desc: 'AI辅助办公工作台驾驶舱，含效益看板、AI功能快捷入口、图表统计、使用记录',
    dataSources: ['就业登记库', '社保参保库', '失业登记库', '补贴发放库'],
    sensitivity: '高度敏感',
    sensitivityLevel: 3,
    hasDataOffer: '全功能开通，展示实时业务数据看板',
    noDataOffer: '展示B类模块使用统计，隐去A类看板，提供模拟数据效果展示',
    remark: '数据涉及个人身份证号、社保记录、收入等敏感信息',
  },
  {
    cat: 'A类',
    catLabel: '核心数据类\n（强依赖业务数据）',
    module: '智能问数',
    desc: 'AI对话式数据查询，支持图表可视化，多维度分析',
    dataSources: ['就业登记库', '社保参保库', '失业登记库', '劳动力资源库', '统计报表'],
    sensitivity: '高度敏感',
    sensitivityLevel: 3,
    hasDataOffer: '全功能开通，连接业务库实时查询',
    noDataOffer: '提供Demo预览模式，支持用户上传Excel/CSV进行查询',
    remark: '市县无数据库时可提供Excel导入查询替代方案',
  },
  {
    cat: 'A类',
    catLabel: '核心数据类\n（强依赖业务数据）',
    module: '智能分析报告',
    desc: '根据业务数据自动生成分析报告，支持台账上传',
    dataSources: ['就业登记库', '社保参保库', '劳动力库', '统计报表', '（可选）上传台账'],
    sensitivity: '高度敏感',
    sensitivityLevel: 3,
    hasDataOffer: '全功能开通，系统数据+台账双源',
    noDataOffer: '支持用户上传Excel/CSV台账数据生成报告，提供系统内置模板',
    remark: '已实现台账上传替代方案，无数据源客户也可使用',
  },
  {
    cat: 'A类',
    catLabel: '核心数据类\n（强依赖业务数据）',
    module: '业务智能审核',
    desc: 'AI批量/单人审核，资格预核查，CoT思维链+SHAP可解释性',
    dataSources: ['业务申请数据', '人员信息库', '历史审核记录', '政策规则库'],
    sensitivity: '高度敏感',
    sensitivityLevel: 3,
    hasDataOffer: '全功能开通，对接业务系统实时审核',
    noDataOffer: '提供审核流程框架展示，模拟数据演示，不可实际运行',
    remark: '涉及个人业务申请材料，隐私保护要求最高',
  },
  // === B类 - 知识服务类 ===
  {
    cat: 'B类',
    catLabel: '知识服务类\n（依赖政策库，非敏感）',
    module: '人社知识智能问答',
    desc: 'AI政策问答，支持多轮对话，引用政策原文溯源',
    dataSources: ['政策法规库（公开数据）', '知识库（人工维护）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通，对接国家/省级公开政策库',
    noDataOffer: '全功能开通，预置国家/省级公开政策库即可使用',
    remark: '数据源为公开政策文件，无隐私风险，所有客户均可使用',
  },
  {
    cat: 'B类',
    catLabel: '知识服务类\n（依赖政策库，非敏感）',
    module: '政策快研',
    desc: '政策文件上传研判，自动提取要点，政策问答互动',
    dataSources: ['政策文件库', '政策标签体系'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通，支持用户上传政策文件进行分析',
    remark: '支持用户上传本地政策文件，无需预置数据库',
  },
  {
    cat: 'B类',
    catLabel: '知识服务类\n（依赖政策库，非敏感）',
    module: 'AI公文助手',
    desc: 'AI公文写作，模板库、合规审校、排版导出、检索归档',
    dataSources: ['公文模板库（内置）', '政策法规库（公开数据）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通，模板内置，AI生成无需业务数据',
    remark: '所有客户均可使用，功能完全不受限',
  },
  // === C类 - 管理支撑类 ===
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '后台首页',
    desc: '系统运行概览，管理端数据看板',
    dataSources: ['无（系统统计数据）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '展示系统自身运行数据，无需外部数据源',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '用户权限管理',
    desc: '组织架构、角色权限、用户管理',
    dataSources: ['无（系统配置）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '客户自行配置本单位人员',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '知识库管理',
    desc: '知识文档上传、分类、版本管理',
    dataSources: ['无（管理功能）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '管理客户自行上传的知识库内容',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '知识反馈运营',
    desc: '知识问答反馈分析、运营数据',
    dataSources: ['无（运营数据）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '基于用户使用数据，非外部业务数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '公文模板管理',
    desc: '公文模板维护、分类管理',
    dataSources: ['无（管理功能）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '模板为系统内置资源，无需外部数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '政策标签管理',
    desc: '政策标签分类体系维护',
    dataSources: ['无（管理功能）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '标签体系为管理配置，无需外部数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '指标口径管理',
    desc: '业务指标定义、计算口径配置',
    dataSources: ['无（定义配置）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '指标定义配置，本身不存储业务数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '审核规则管理',
    desc: '审核规则配置、规则维护',
    dataSources: ['无（规则配置）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '规则框架配置，不涉及业务数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '数据源管理',
    desc: '数据源连接配置管理',
    dataSources: ['无（配置功能）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '配置功能保留，但无法实际连接（无数据源）',
    remark: '配置功能本身可用，连接后访问实际数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '任务流配置',
    desc: '业务流程配置、节点管理',
    dataSources: ['无（流程配置）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '流程配置独立于业务数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '日志审计',
    desc: '系统操作日志记录与审计',
    dataSources: ['无（系统日志）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '系统自身产生的日志，非外部数据',
  },
  {
    cat: 'C类',
    catLabel: '管理支撑类\n（无需业务数据）',
    module: '系统参数配置',
    desc: '系统参数设置、运行配置',
    dataSources: ['无（配置功能）'],
    sensitivity: '非敏感',
    sensitivityLevel: 1,
    hasDataOffer: '全功能开通',
    noDataOffer: '全功能开通',
    remark: '纯系统配置，无需任何外部数据',
  },
]

// ============ Sheet 1: 功能清单总表 ============
const headers1 = [
  '分类', '功能模块', '功能描述',
  '所需数据源', '数据敏感度',
  '有数据源客户（可用功能）', '无数据源客户（可用功能）',
  '备注',
]

const ws1Data = [headers1]

features.forEach((f) => {
  ws1Data.push([
    f.cat + ' - ' + f.catLabel.replace('\n', ''),
    f.module,
    f.desc,
    f.dataSources.join('、'),
    f.sensitivity,
    f.hasDataOffer,
    f.noDataOffer,
    f.remark,
  ])
})

const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)

// 设置列宽
ws1['!cols'] = [
  { wch: 18 }, { wch: 16 }, { wch: 36 },
  { wch: 30 }, { wch: 12 },
  { wch: 34 }, { wch: 38 },
  { wch: 30 },
]

// 设置行高
ws1['!rows'] = [{ hpt: 24 }]
for (let i = 1; i <= features.length; i++) {
  ws1['!rows'].push({ hpt: 36 })
}

// 分类颜色映射
const catColors = {
  'A类': BG_CAT_A,
  'B类': BG_CAT_B,
  'C类': BG_CAT_C,
}

// 敏感度颜色映射
const sensitivityColors = {
  '高度敏感': { font: FONT_RED, fill: { pattern: { fgColor: { rgb: 'FFF0F0' } }, type: 'solid' } },
  '非敏感': { font: FONT_GREEN, fill: { pattern: { fgColor: { rgb: 'F0FFF0' } }, type: 'solid' } },
}

// 应用样式到数据单元格
for (let R = 0; R < ws1Data.length; R++) {
  for (let C = 0; C < ws1Data[R].length; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C })
    if (!ws1[addr]) continue
    if (R === 0) {
      // 标题行
      ws1[addr].s = { font: FONT_HEADER, alignment: ALIGN_CENTER, border: BORDER_THIN, fill: BG_HEADER }
    } else {
      const f = features[R - 1]
      let extraStyle = {}
      // 分类列颜色
      if (C === 0 && f) {
        extraStyle.fill = catColors[f.cat]
        extraStyle.font = { ...FONT_BOLD }
      }
      // 敏感度列颜色
      if (C === 4 && f) {
        const s = sensitivityColors[f.sensitivity]
        extraStyle.fill = s.fill
        extraStyle.font = { ...s.font, bold: true }
      }
      // 无数据源列 - 不同颜色
      if (C === 6) {
        extraStyle.fill = BG_LIGHT_GRAY
      }

      ws1[addr].s = {
        font: FONT_DEFAULT,
        alignment: C === 0 || C === 4 ? ALIGN_CENTER : ALIGN_LEFT,
        border: BORDER_THIN,
        ...extraStyle,
      }
    }
  }
}

// 冻结首行
ws1['!freeze'] = { x: 0, y: 1 }

// ============ Sheet 2: 分类汇总说明 ============
const summaryData = [
  ['类别', '类别说明', '功能数量', '数据源要求', '敏感度', '无数据源客户可用性', '典型客户场景'],
  ['A类 - 核心数据类', '强依赖本地业务数据库，需要接入社保、就业等核心业务数据', '4个', '必须有社保库、就业库', '高度敏感', '仅提供Demo演示或Excel上传替代方案', '市级/有数据区县'],
  ['B类 - 知识服务类', '依赖政策法规库/知识库，数据源为公开政策文件', '3个', '有政策库即可（公开数据）', '非敏感', '全功能可用，不受限制', '所有客户'],
  ['C类 - 管理支撑类', '纯管理配置功能，不依赖任何业务数据', '11个', '无需外部数据源', '非敏感', '全功能可用，不受限制', '所有客户'],
]

const ws2 = XLSX.utils.aoa_to_sheet(summaryData)

ws2['!cols'] = [
  { wch: 22 }, { wch: 48 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 36 }, { wch: 22 },
]

// 分类汇总样式
for (let R = 0; R < summaryData.length; R++) {
  for (let C = 0; C < summaryData[R].length; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C })
    if (!ws2[addr]) continue
    if (R === 0) {
      ws2[addr].s = { font: FONT_HEADER, alignment: ALIGN_CENTER, border: BORDER_THIN, fill: BG_HEADER }
    } else {
      const catStyles = {
        'A类 - 核心数据类': { fill: BG_CAT_A, font: FONT_BOLD },
        'B类 - 知识服务类': { fill: BG_CAT_B, font: FONT_BOLD },
        'C类 - 管理支撑类': { fill: BG_CAT_C, font: FONT_BOLD },
      }
      const style = C === 0 ? catStyles[summaryData[R][0]] || {} : {}
      ws2[addr].s = {
        font: C === 0 ? { ...FONT_BOLD, ...style.font } : FONT_DEFAULT,
        alignment: C === 0 || C === 3 || C === 4 ? ALIGN_CENTER : ALIGN_LEFT,
        border: BORDER_THIN,
        fill: style.fill || (R % 2 === 0 ? BG_WHITE : BG_LIGHT_GRAY),
      }
    }
  }
}

ws2['!freeze'] = { x: 0, y: 1 }

// 合并标题行
ws2['!merges'] = []

// ============ Sheet 3: 客户方案对照 ============
const planHeaders = ['客户类型', '数据条件', '推荐方案', '可选功能模块', '不可用功能', '备注']
const planData = [
  planHeaders,
  ['市级客户\n（有完整数据库）', '具备社保参保库、就业登记库、失业库、劳动力资源库等完整业务数据库', '全功能方案', '全部18个功能模块\nA类4个 + B类3个 + C类11个', '无', '推荐全量部署，发挥最大价值'],
  ['区县客户\n（有部分数据库）', '具备部分核心业务数据库，可能不完整或不规范', '标准方案', 'A类：智能分析报告（台账上传）、智能问数（Excel导入）\nB类：全部3个\nC类：全部11个', 'A类：工作台首页看板、业务智能审核\n（需数据库完整对接）', '根据实际数据情况评估，逐步对接'],
  ['乡镇/街道\n（无数据库）', '无本地业务数据库，仅有基础办公网络', '基础方案', 'B类：全部3个\nC类：全部11个\nA类：智能分析报告（台账上传）', 'A类：工作台首页看板、智能问数、业务智能审核', '推荐先上B类+C类，后续数据条件成熟后升级'],
  ['专项客户\n（仅政策研究）', '无业务数据库，但有政策研究需求', '知识服务方案', 'B类：全部3个\nC类：后台管理（部分）', 'A类：全部4个\nC类：数据源管理', '如需政策问答和公文写作场景，此方案性价比最高'],
]

const ws3 = XLSX.utils.aoa_to_sheet(planData)

ws3['!cols'] = [
  { wch: 18 }, { wch: 34 }, { wch: 18 }, { wch: 38 }, { wch: 34 }, { wch: 34 },
]

for (let R = 0; R < planData.length; R++) {
  for (let C = 0; C < planData[R].length; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C })
    if (!ws3[addr]) continue
    if (R === 0) {
      ws3[addr].s = { font: FONT_HEADER, alignment: ALIGN_CENTER, border: BORDER_THIN, fill: BG_HEADER }
    } else {
      ws3[addr].s = {
        font: FONT_DEFAULT,
        alignment: ALIGN_CENTER_MIDDLE,
        border: BORDER_THIN,
        fill: R % 2 === 0 ? BG_WHITE : BG_LIGHT_GRAY,
      }
    }
  }
}

ws3['!freeze'] = { x: 0, y: 1 }
ws3['!rows'] = [{ hpt: 24 }, { hpt: 72 }, { hpt: 72 }, { hpt: 72 }, { hpt: 72 }]

// ============ 创建工作簿并写入文件 ============
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws1, '功能清单总表')
XLSX.utils.book_append_sheet(wb, ws2, '分类汇总说明')
XLSX.utils.book_append_sheet(wb, ws3, '客户方案对照')

const outputPath = path.join(__dirname, '..', 'public', '政途功能清单与数据源对比.xlsx')
XLSX.writeFile(wb, outputPath)

console.log('✅ Excel 文件已生成：' + outputPath)