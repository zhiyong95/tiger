/**
 * Coze 平台工作流调用模块
 *
 * 历史报告相关动作通过扣子开放平台工作流完成：
 *  - 「查看历史报告」→ 工作流「查询历史报告列表」  (VITE_WORKFLOW_HISTORY_LIST_ID)
 *  - 点击某条历史报告 / 询问对话过程 → 工作流「查询历史报告详情」 (VITE_WORKFLOW_HISTORY_DETAIL_ID)
 *
 * 运行时配置（.env / 环境变量）：
 *  - VITE_WORKFLOW_HISTORY_LIST_ID    历史报告列表工作流 ID（必填，未配置时降级为本地历史）
 *  - VITE_WORKFLOW_HISTORY_DETAIL_ID  历史报告详情工作流 ID（必填，未配置时降级为本地历史）
 *  - VITE_COZE_API_TOKEN              扣子 API Token（必填，未配置时降级）
 *  - VITE_COZE_API_BASE_URL           扣子 API 域名，默认 https://api.coze.cn
 */

// ====== 配置 ======
const wf = (import.meta as any).env || {}

export function isWorkflowConfigured(): boolean {
  const list = wf.VITE_WORKFLOW_HISTORY_LIST_ID
  const detail = wf.VITE_WORKFLOW_HISTORY_DETAIL_ID
  const token = wf.VITE_COZE_API_TOKEN
  return Boolean(list && detail && token)
}

function apiBase(): string {
  return wf.VITE_COZE_API_BASE_URL || 'https://api.coze.cn'
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${wf.VITE_COZE_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
  for (const pair of (wf.VITE_COZE_EXTRA_HEADERS || '').split(';')) {
    const idx = pair.indexOf('=')
    if (idx > 0) h[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
  }
  return h
}

/** 解析工作流返回的 data（可能是对象，也可能是 JSON 字符串） */
function normalize(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}

// ====== 工作流调用 ======
/**
 * 查询历史报告列表（工作流「查询历史报告列表」）
 * @param module 报告模块标识（research=调研分析报告 / data=数据分析报告）
 */
export async function queryReportHistoryList(module: 'research' | 'data' = 'research') {
  const res = await fetch(`${apiBase()}/v1/workflow/run`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      workflow_id: wf.VITE_WORKFLOW_HISTORY_LIST_ID,
      parameters: { module },
    }),
  })
  const result = await res.json()
  if (result.code !== undefined && result.code !== 0) {
    throw new Error(result.msg || `工作流返回错误 code=${result.code}`)
  }
  return normalize(result.data)
}

/**
 * 查询历史报告详情（工作流「查询历史报告详情」），返回该报告的历史交互对话记录
 * @param id 历史报告 ID（或报告标题，按工作流入参而定）
 */
export async function queryReportHistoryDetail(id: string | number) {
  const res = await fetch(`${apiBase()}/v1/workflow/run`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      workflow_id: wf.VITE_WORKFLOW_HISTORY_DETAIL_ID,
      parameters: { id: String(id) },
    }),
  })
  const result = await res.json()
  if (result.code !== undefined && result.code !== 0) {
    throw new Error(result.msg || `工作流返回错误 code=${result.code}`)
  }
  return normalize(result.data)
}