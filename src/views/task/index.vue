<template>
  <div class="task-page">
    <!-- 顶部面包屑 -->
    <div class="page-breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>工作台</el-breadcrumb-item>
        <el-breadcrumb-item>风险预警与任务待办</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 风险概览统计卡片 -->
    <div class="risk-overview">
      <div class="stat-card" v-for="stat in riskStats" :key="stat.label" :style="{ borderTop: `3px solid ${stat.color}` }">
        <div class="stat-icon" :style="{ background: stat.bgColor }">
          <el-icon :size="22"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <div class="stat-trend" :style="{ color: stat.trendColor }">
          {{ stat.trend }}
        </div>
      </div>
    </div>

    <!-- 功能区域：风险预警 + 任务待办双Tab -->
    <div class="task-content">
      <el-tabs v-model="activeTab" class="task-tabs">
        <!-- Tab 1: 风险预警 -->
        <el-tab-pane label="🚨 风险预警" name="risk">
          <div class="tab-content">
            <!-- 风险筛选栏 -->
            <div class="filter-bar">
              <div class="filter-left">
                <el-select v-model="riskFilter.level" placeholder="风险等级" size="default" style="width:130px" clearable>
                  <el-option label="高风险" value="high" />
                  <el-option label="中风险" value="medium" />
                  <el-option label="低风险" value="low" />
                </el-select>
                <el-select v-model="riskFilter.status" placeholder="处理状态" size="default" style="width:130px" clearable>
                  <el-option label="待处理" value="pending" />
                  <el-option label="处理中" value="processing" />
                  <el-option label="已完成" value="completed" />
                </el-select>
                <el-input v-model="riskFilter.keyword" placeholder="搜索预警标题..." size="default" style="width:220px" clearable prefix-icon="Search">
                </el-input>
              </div>
              <div class="filter-right">
                <el-button type="primary" size="default" @click="handleRefreshRisk">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </div>
            </div>

            <!-- 风险预警列表 -->
            <el-table :data="filteredRiskList" stripe style="width:100%" @row-click="(row: any) => handleRiskRowClick(row)" class="risk-table">
              <el-table-column prop="title" label="预警标题" min-width="220">
                <template #default="{ row }">
                  <div class="risk-title-cell">
                    <el-tag :type="riskLevelTagType(row.riskLevel)" size="small" effect="dark" class="risk-level-tag">
                      {{ riskLevelLabel(row.riskLevel) }}
                    </el-tag>
                    <span class="risk-title">{{ row.title }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="source" label="来源" width="140" />
              <el-table-column prop="createdAt" label="发现时间" width="160" />
              <el-table-column prop="deadline" label="截止时限" width="120">
                <template #default="{ row }">
                  <span :style="{ color: row.status !== 'completed' && isOverdue(row.deadline) ? '#ff4d4f' : '#666' }">
                    {{ row.deadline }}
                    <el-icon v-if="row.status !== 'completed' && isOverdue(row.deadline)" color="#ff4d4f" size="14"><WarningFilled /></el-icon>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="statusTagType(row.status)" size="small" effect="plain">
                    {{ statusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="280" fixed="right">
                <template #default="{ row }">
                  <div class="action-btns" @click.stop>
                    <el-button size="small" type="primary" text @click="handleViewRiskDetail(row as any)">查看详情</el-button>
                    <el-button v-if="row.status === 'pending'" size="small" type="success" text @click="handleAcceptRisk(row as any)">受理</el-button>
                    <el-button v-if="row.status === 'processing'" size="small" type="warning" text @click="handleProcessRisk(row as any)">处理</el-button>
                    <el-button v-if="row.status !== 'completed'" size="small" type="danger" text @click="handleEscalateRisk(row as any)">升级</el-button>
                    <el-button v-if="row.status === 'processing'" size="small" text @click="handleCompleteRisk(row as any)">办结</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-bar">
              <el-pagination background layout="prev, pager, next" :total="20" :page-size="10" small />
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 任务待办 -->
        <el-tab-pane label="📋 任务待办" name="task">
          <div class="tab-content">
            <div class="filter-bar">
              <div class="filter-left">
                <el-select v-model="taskFilter.status" placeholder="任务状态" size="default" style="width:130px" clearable>
                  <el-option label="待接收" value="pending" />
                  <el-option label="进行中" value="processing" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已逾期" value="overdue" />
                </el-select>
                <el-select v-model="taskFilter.priority" placeholder="优先级" size="default" style="width:130px" clearable>
                  <el-option label="紧急" value="urgent" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
                <el-input v-model="taskFilter.keyword" placeholder="搜索任务名称..." size="default" style="width:220px" clearable prefix-icon="Search" />
              </div>
              <div class="filter-right">
                <el-button type="primary" size="default" @click="handleCreateTask">
                  <el-icon><Plus /></el-icon> 新建任务
                </el-button>
              </div>
            </div>

            <!-- 任务列表 -->
            <el-table :data="filteredTaskList" stripe style="width:100%" class="task-table">
              <el-table-column prop="title" label="任务名称" min-width="200">
                <template #default="{ row }">
                  <div class="task-title-cell">
                    <el-tag v-if="row.priority === 'urgent'" type="danger" size="small" effect="dark" class="priority-tag">紧急</el-tag>
                    <el-tag v-else-if="row.priority === 'high'" type="warning" size="small" effect="dark" class="priority-tag">高</el-tag>
                    <span class="task-title">{{ row.title }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="assignee" label="负责人" width="120" />
              <el-table-column prop="dept" label="所属部门" width="140" />
              <el-table-column prop="createdAt" label="创建时间" width="160" />
              <el-table-column prop="deadline" label="截止时间" width="120">
                <template #default="{ row }">
                  <span :style="{ color: row.status !== 'completed' && isOverdue(row.deadline) ? '#ff4d4f' : '#666' }">
                    {{ row.deadline }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="statusTagType(row.status)" size="small" effect="plain">
                    {{ statusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="280" fixed="right">
                <template #default="{ row }">
                  <div class="action-btns" @click.stop>
                    <el-button size="small" type="primary" text @click="handleViewTaskDetail(row)">查看</el-button>
                    <el-button v-if="(row as any).status === 'pending'" size="small" type="success" text @click="handleReceiveTask(row as any)">接收</el-button>
                    <el-button v-if="(row as any).status === 'processing'" size="small" type="warning" text @click="handleSubmitTask(row as any)">提交</el-button>
                    <el-button v-if="(row as any).status !== 'completed'" size="small" type="danger" text @click="handleRejectTask(row as any)">退回</el-button>
                    <el-button size="small" text @click="handleTransferTask(row as any)">转办</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-bar">
              <el-pagination background layout="prev, pager, next" :total="20" :page-size="10" small />
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 数据看板 -->
        <el-tab-pane label="📊 数据看板" name="dashboard">
          <div class="dashboard-grid">
            <div class="dashboard-card">
              <div class="card-header">
                <span class="card-title">近7日风险预警趋势</span>
              </div>
              <div class="card-body" ref="trendChartRef" style="height:280px"></div>
            </div>
            <div class="dashboard-card">
              <div class="card-header">
                <span class="card-title">风险等级分布</span>
              </div>
              <div class="card-body" ref="pieChartRef" style="height:280px"></div>
            </div>
            <div class="dashboard-card full-width">
              <div class="card-header">
                <span class="card-title">各部门任务完成率</span>
              </div>
              <div class="card-body" ref="barChartRef" style="height:280px"></div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 风险详情弹窗 -->
    <el-dialog v-model="showRiskDetail" title="🚨 风险预警详情" width="680px" :close-on-click-modal="true" destroy-on-close>
      <template v-if="currentRisk">
        <div class="detail-header">
          <el-tag :type="riskLevelTagType(currentRisk.riskLevel)" size="default" effect="dark" class="mb-10">{{ riskLevelLabel(currentRisk.riskLevel) }}风险</el-tag>
          <h3 class="detail-title">{{ currentRisk.title }}</h3>
          <div class="detail-meta">
            <span>来源：{{ currentRisk.source }}</span>
            <span>发现时间：{{ currentRisk.createdAt }}</span>
            <span>截止：{{ currentRisk.deadline }}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>📝 预警描述</h4>
          <p>{{ currentRisk.description }}</p>
        </div>
        <div class="detail-section">
          <h4>🔍 AI 分析建议</h4>
          <div class="ai-suggestion-box">
            <p>经AI智能分析，建议对该预警事项进行以下处理：</p>
            <ul>
              <li>立即核实涉及人员信息，确认数据准确性</li>
              <li>比对历史记录，排除重复处理</li>
              <li>根据风险等级，在截止时限前完成处置</li>
              <li>处理完成后在系统内提交办结报告</li>
            </ul>
          </div>
        </div>
        <div class="detail-section">
          <h4>⏳ 处理时间轴</h4>
          <el-timeline>
            <el-timeline-item timestamp="2024-08-05 08:00" placement="top" type="warning" :hollow="false">
              <p>系统自动生成预警</p>
            </el-timeline-item>
            <el-timeline-item v-if="currentRisk.status !== 'pending'" timestamp="2024-08-05 09:30" placement="top" type="primary" :hollow="false">
              <p>已受理 - 流转至业务科室</p>
            </el-timeline-item>
            <el-timeline-item v-if="currentRisk.status === 'completed'" timestamp="2024-08-06 11:00" placement="top" type="success" :hollow="false">
              <p>已办结 - 处置完成</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <div class="detail-footer">
          <el-button @click="showRiskDetail = false">关闭</el-button>
          <el-button v-if="currentRisk?.status === 'pending'" type="primary" @click="handleAcceptRisk(currentRisk); showRiskDetail = false">受理预警</el-button>
          <el-button v-if="currentRisk?.status === 'processing'" type="success" @click="handleCompleteRisk(currentRisk); showRiskDetail = false">办结</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务详情弹窗 -->
    <el-dialog v-model="showTaskDetail" title="📋 任务详情" width="600px" :close-on-click-modal="true" destroy-on-close>
      <template v-if="currentTask">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="任务名称">{{ currentTask.title }}</el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="currentTask.priority === 'urgent' ? 'danger' : currentTask.priority === 'high' ? 'warning' : 'info'" size="small">
                {{ currentTask.priority === 'urgent' ? '紧急' : currentTask.priority === 'high' ? '高' : currentTask.priority === 'medium' ? '中' : '低' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="负责人">{{ currentTask.assignee }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{ currentTask.dept }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentTask.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="截止时间">{{ currentTask.deadline }}</el-descriptions-item>
            <el-descriptions-item label="状态" :span="2">
              <el-tag :type="statusTagType(currentTask.status)" size="small">{{ statusLabel(currentTask.status) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="detail-section">
          <h4>📝 任务描述</h4>
          <p>{{ currentTask.description }}</p>
        </div>
        <div class="detail-section">
          <h4>⏳ 处理记录</h4>
          <el-timeline>
            <el-timeline-item timestamp="2024-08-05 10:00" placement="top" type="info">
              <p>任务创建，分配至{{ currentTask.assignee }}</p>
            </el-timeline-item>
            <el-timeline-item v-if="currentTask.status !== 'pending'" timestamp="2024-08-05 14:00" placement="top" type="primary">
              <p>任务已接收，开始处理</p>
            </el-timeline-item>
            <el-timeline-item v-if="currentTask.status === 'completed'" timestamp="2024-08-06 09:00" placement="top" type="success">
              <p>任务已完成</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <el-button @click="showTaskDetail = false">关闭</el-button>
        <el-button v-if="currentTask?.status === 'pending'" type="primary" @click="handleReceiveTask(currentTask); showTaskDetail = false">接收任务</el-button>
        <el-button v-if="currentTask?.status === 'processing'" type="success" @click="handleSubmitTask(currentTask); showTaskDetail = false">提交完成</el-button>
      </template>
    </el-dialog>

    <!-- 处理弹窗 -->
    <el-dialog v-model="showProcessDialog" :title="processDialogTitle" width="500px" :close-on-click-modal="true" destroy-on-close>
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理意见">
          <el-input v-model="processForm.comment" type="textarea" :rows="4" placeholder="请输入处理意见..." />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="processForm.result">
            <el-radio value="pass">通过</el-radio>
            <el-radio value="reject">退回</el-radio>
            <el-radio value="transfer">转办</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="processForm.result === 'transfer'" label="转办至">
          <el-select v-model="processForm.transferTo" placeholder="选择接收人" style="width:100%">
            <el-option label="张明（业务科）" value="zhangming" />
            <el-option label="李华（审核科）" value="lihua" />
            <el-option label="王芳（综合科）" value="wangfang" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProcessDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmProcess">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="showCreateTask" title="📝 新建任务" width="550px" :close-on-click-modal="true" destroy-on-close>
      <el-form :model="createTaskForm" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="createTaskForm.title" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="createTaskForm.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
        </el-form-item>
        <el-form-item label="优先级" required>
          <el-radio-group v-model="createTaskForm.priority">
            <el-radio value="urgent">紧急</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责人" required>
          <el-select v-model="createTaskForm.assignee" placeholder="选择负责人" style="width:100%">
            <el-option label="张明（业务科）" value="张明" />
            <el-option label="李华（审核科）" value="李华" />
            <el-option label="王芳（综合科）" value="王芳" />
            <el-option label="赵强（办公室）" value="赵强" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止时间" required>
          <el-date-picker v-model="createTaskForm.deadline" type="date" placeholder="选择截止日期" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTask = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTask">创建任务</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, WarningFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// ============ 类型定义 ============
interface RiskItem {
  id: string; title: string; source: string; riskLevel: string; status: string; description: string; createdAt: string; deadline: string
}
interface TaskItem {
  id: string; title: string; description: string; priority: string; assignee: string; dept: string; status: string; createdAt: string; deadline: string
}

// ============ 数据 ============
const activeTab = ref('risk')

const riskStats = ref([
  { label: '高风险预警', value: 3, icon: 'WarningFilled', color: '#ff4d4f', bgColor: '#fff2f0', trend: '↗ 较昨日+1', trendColor: '#ff4d4f' },
  { label: '中风险预警', value: 4, icon: 'InfoFilled', color: '#fa8c16', bgColor: '#fff7e6', trend: '→ 持平', trendColor: '#fa8c16' },
  { label: '低风险预警', value: 8, icon: 'CircleCheck', color: '#52c41a', bgColor: '#f6ffed', trend: '↘ 较昨日-2', trendColor: '#52c41a' },
  { label: '待办任务', value: 6, icon: 'List', color: '#1677ff', bgColor: '#e6f4ff', trend: '↗ 较昨日+1', trendColor: '#1677ff' },
  { label: '已逾期', value: 2, icon: 'Timer', color: '#722ed1', bgColor: '#f9f0ff', trend: '⚠ 需关注', trendColor: '#722ed1' },
  { label: '本月完成', value: 28, icon: 'SuccessFilled', color: '#13c2c2', bgColor: '#e6fffb', trend: '✓ 达标率93%', trendColor: '#13c2c2' },
])

const mockRiskList = ref<RiskItem[]>([
  { id: '1', title: '重复领取就业补贴预警', source: '系统自动比对', riskLevel: 'high', status: 'pending', description: '发现3名人员可能存在重复领取就业补贴情况，涉及金额较大，需立即核实处理。', createdAt: '2026-08-19 08:00', deadline: '2026-08-21' },
  { id: '2', title: '社保缴纳异常提醒', source: '数据比对', riskLevel: 'medium', status: 'pending', description: '5名灵活就业人员社保缴纳状态异常，连续3个月未正常缴费。', createdAt: '2026-08-18 14:30', deadline: '2026-08-22' },
  { id: '3', title: '培训补贴审核待办', source: '业务流转', riskLevel: 'low', status: 'pending', description: '12份培训补贴申请待审核，已超过规定处理时限。', createdAt: '2026-08-18 10:00', deadline: '2026-08-23' },
  { id: '4', title: '政策到期提醒', source: '系统定时任务', riskLevel: 'medium', status: 'processing', description: '3项就业扶持政策即将到期，需评估延续方案。', createdAt: '2026-08-17 09:00', deadline: '2026-08-25' },
  { id: '5', title: '数据质量异常', source: '数据质量检查', riskLevel: 'low', status: 'completed', description: '2条就业统计数据格式异常，已修正。', createdAt: '2026-08-16 11:00', deadline: '2026-08-19' },
  { id: '6', title: '跨部门核验失败风险', source: '公安数据比对', riskLevel: 'high', status: 'processing', description: '2名申请人员身份信息与公安库不一致，需人工复核。', createdAt: '2026-08-19 06:00', deadline: '2026-08-20' },
  { id: '7', title: '补贴发放异常预警', source: '财政系统', riskLevel: 'high', status: 'pending', description: '本月就业补贴发放失败3笔，涉及金额共12,500元。', createdAt: '2026-08-19 07:00', deadline: '2026-08-21' },
  { id: '8', title: '档案信息不完整提醒', source: '系统自动扫描', riskLevel: 'low', status: 'pending', description: '15名灵活就业人员电子档案缺少关键材料。', createdAt: '2026-08-18 16:00', deadline: '2026-08-30' },
])

const mockTaskList = ref<TaskItem[]>([
  { id: '1', title: '审核2026年8月就业补贴申报材料', description: '本月共有45份就业补贴申请，需逐份审核材料完整性和合规性。', priority: 'urgent', assignee: '张明', dept: '业务科', status: 'pending', createdAt: '2026-08-19 08:00', deadline: '2026-08-21' },
  { id: '2', title: '汇总灵活就业人员社保补贴发放数据', description: '本季度灵活就业社保补贴发放数据汇总，需在月底前完成。', priority: 'high', assignee: '李华', dept: '审核科', status: 'processing', createdAt: '2026-08-18 09:00', deadline: '2026-08-25' },
  { id: '3', title: '更新就业创业政策汇编', description: '根据最新政策文件，更新就业创业政策汇编文档。', priority: 'medium', assignee: '王芳', dept: '综合科', status: 'pending', createdAt: '2026-08-17 10:00', deadline: '2026-08-28' },
  { id: '4', title: '处理12345转办工单', description: '收到3件涉及就业补贴的12345转办工单，需在5个工作日内回复。', priority: 'urgent', assignee: '赵强', dept: '办公室', status: 'processing', createdAt: '2026-08-16 14:00', deadline: '2026-08-20' },
  { id: '5', title: '组织就业援助月活动筹备', description: '筹备就业援助月专项活动，需协调场地、宣传物料、参会企业。', priority: 'low', assignee: '张明', dept: '业务科', status: 'completed', createdAt: '2026-08-15 08:00', deadline: '2026-08-18' },
  { id: '6', title: '开展企业稳岗返还政策宣传', description: '组织线上线下稳岗返还政策宣讲会，确保企业知晓率。', priority: 'medium', assignee: '王芳', dept: '综合科', status: 'pending', createdAt: '2026-08-19 09:00', deadline: '2026-08-30' },
  { id: '7', title: '完成三季度职业技能培训申报审批', description: '三季度各培训机构提交的培训计划需在月底前完成审批。', priority: 'high', assignee: '李华', dept: '审核科', status: 'pending', createdAt: '2026-08-18 11:00', deadline: '2026-08-24' },
  { id: '8', title: '核查创业担保贷款申请材料', description: '6份创业担保贷款申请材料核查，含企业经营状况、征信记录等。', priority: 'medium', assignee: '张明', dept: '业务科', status: 'processing', createdAt: '2026-08-17 13:00', deadline: '2026-08-23' },
])

// ============ 筛选 ============
const riskFilter = ref({ level: '', status: '', keyword: '' })
const taskFilter = ref({ status: '', priority: '', keyword: '' })

const filteredRiskList = computed(() => {
  return mockRiskList.value.filter(r => {
    if (riskFilter.value.level && r.riskLevel !== riskFilter.value.level) return false
    if (riskFilter.value.status && r.status !== riskFilter.value.status) return false
    if (riskFilter.value.keyword && !r.title.includes(riskFilter.value.keyword)) return false
    return true
  })
})

const filteredTaskList = computed(() => {
  return mockTaskList.value.filter(t => {
    if (taskFilter.value.status && t.status !== taskFilter.value.status) return false
    if (taskFilter.value.priority && t.priority !== taskFilter.value.priority) return false
    if (taskFilter.value.keyword && !t.title.includes(taskFilter.value.keyword)) return false
    return true
  })
})

// ============ 工具函数 ============
const isOverdue = (deadline: string) => {
  const now = new Date()
  const d = new Date(deadline)
  return d < now
}

const riskLevelLabel = (level: string) => {
  const map: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' }
  return map[level] || level
}

const riskLevelTagType = (level: string): 'info' | 'success' | 'warning' | 'danger' => {
  const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = { high: 'danger', medium: 'warning', low: 'info' }
  return map[level] || 'info'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', completed: '已完成', overdue: '已逾期' }
  return map[status] || status
}

const statusTagType = (status: string): 'info' | 'success' | 'warning' | 'danger' => {
  const map: Record<string, 'info' | 'success' | 'warning' | 'danger'> = { pending: 'info', processing: 'warning', completed: 'success', overdue: 'danger' }
  return map[status] || 'info'
}

// ============ 弹窗 ============
const showRiskDetail = ref(false)
const currentRisk = ref<RiskItem | null>(null)

const showTaskDetail = ref(false)
const currentTask = ref<TaskItem | null>(null)

const showProcessDialog = ref(false)
const processDialogTitle = ref('')
const processForm = ref({ comment: '', result: 'pass', transferTo: '' })

const showCreateTask = ref(false)
const createTaskForm = ref({ title: '', description: '', priority: 'medium', assignee: '', deadline: '' })

// ============ 交互函数 ============
const handleRefreshRisk = () => {
  ElMessage.success('风险预警已刷新')
}

const handleRiskRowClick = (row: RiskItem) => {
  currentRisk.value = row
  showRiskDetail.value = true
}

const handleViewRiskDetail = (row: any) => {
  currentRisk.value = row
  showRiskDetail.value = true
}

const handleAcceptRisk = (row: RiskItem) => {
  row.status = 'processing'
  ElMessage.success(`已受理预警：「${row.title}」`)
}

const handleProcessRisk = (row: RiskItem) => {
  processDialogTitle.value = `处理预警：「${row.title}」`
  processForm.value = { comment: '', result: 'pass', transferTo: '' }
  currentRisk.value = row
  showProcessDialog.value = true
}

const handleEscalateRisk = (row: RiskItem) => {
  ElMessageBox.confirm(`确认将「${row.title}」升级处理？`, '升级确认', {
    type: 'warning', confirmButtonText: '确认升级', cancelButtonText: '取消'
  }).then(() => {
    ElMessage.success(`已升级预警：「${row.title}」→ 已转至上级`)
  }).catch(() => {})
}

const handleCompleteRisk = (row: RiskItem) => {
  ElMessageBox.confirm(`确认办结「${row.title}」？`, '办结确认', {
    type: 'info', confirmButtonText: '确认办结', cancelButtonText: '取消'
  }).then(() => {
    row.status = 'completed'
    ElMessage.success(`已办结：「${row.title}」`)
  }).catch(() => {})
}

const handleViewTaskDetail = (row: any) => {
  currentTask.value = row
  showTaskDetail.value = true
}

const handleReceiveTask = (row: TaskItem) => {
  row.status = 'processing'
  ElMessage.success(`已接收任务：「${row.title}」`)
}

const handleSubmitTask = (row: TaskItem) => {
  processDialogTitle.value = `提交任务：「${row.title}」`
  processForm.value = { comment: '', result: 'pass', transferTo: '' }
  currentTask.value = row
  showProcessDialog.value = true
}

const handleRejectTask = (row: TaskItem) => {
  ElMessageBox.confirm(`确认退回「${row.title}」？`, '退回确认', {
    type: 'warning', confirmButtonText: '确认退回', cancelButtonText: '取消'
  }).then(() => {
    row.status = 'pending'
    ElMessage.warning(`已退回：「${row.title}」`)
  }).catch(() => {})
}

const handleTransferTask = (row: TaskItem) => {
  processDialogTitle.value = `转办任务：「${row.title}」`
  processForm.value = { comment: '', result: 'transfer', transferTo: '' }
  currentTask.value = row
  showProcessDialog.value = true
}

const handleCreateTask = () => {
  createTaskForm.value = { title: '', description: '', priority: 'medium', assignee: '', deadline: '' }
  showCreateTask.value = true
}

const confirmProcess = () => {
  if (!processForm.value.comment.trim()) {
    ElMessage.warning('请输入处理意见')
    return
  }
  if (processForm.value.result === 'transfer' && !processForm.value.transferTo) {
    ElMessage.warning('请选择转办对象')
    return
  }
  ElMessage.success('处理意见已提交')
  showProcessDialog.value = false
}

const confirmCreateTask = () => {
  if (!createTaskForm.value.title.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (!createTaskForm.value.assignee) {
    ElMessage.warning('请选择负责人')
    return
  }
  if (!createTaskForm.value.deadline) {
    ElMessage.warning('请选择截止时间')
    return
  }
  mockTaskList.value.unshift({
    id: String(Date.now()),
    title: createTaskForm.value.title,
    description: createTaskForm.value.description || '暂无描述',
    priority: createTaskForm.value.priority,
    assignee: createTaskForm.value.assignee,
    dept: '业务科',
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    deadline: createTaskForm.value.deadline
  })
  ElMessage.success('任务创建成功')
  showCreateTask.value = false
}

// ============ ECharts 图表 ============
const trendChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
const barChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const initCharts = () => {
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['08-13', '08-14', '08-15', '08-16', '08-17', '08-18', '08-19'], axisLabel: { fontSize: 11 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [
          { name: '高风险', type: 'line', data: [2, 1, 3, 2, 1, 2, 3], smooth: true, lineStyle: { color: '#ff4d4f', width: 2 }, itemStyle: { color: '#ff4d4f' }, areaStyle: { color: 'rgba(255,77,79,0.1)' } },
          { name: '中风险', type: 'line', data: [3, 4, 2, 3, 5, 4, 4], smooth: true, lineStyle: { color: '#fa8c16', width: 2 }, itemStyle: { color: '#fa8c16' }, areaStyle: { color: 'rgba(250,140,22,0.1)' } },
          { name: '低风险', type: 'line', data: [5, 6, 4, 7, 5, 6, 8], smooth: true, lineStyle: { color: '#52c41a', width: 2 }, itemStyle: { color: '#52c41a' }, areaStyle: { color: 'rgba(82,196,26,0.1)' } }
        ],
        legend: { bottom: 0, icon: 'circle', itemWidth: 8 }
      })
    }

    if (pieChartRef.value) {
      pieChart = echarts.init(pieChartRef.value)
      pieChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie', radius: ['40%', '70%'], center: ['50%', '50%'],
          data: [
            { value: 3, name: '高风险', itemStyle: { color: '#ff4d4f' } },
            { value: 4, name: '中风险', itemStyle: { color: '#fa8c16' } },
            { value: 8, name: '低风险', itemStyle: { color: '#52c41a' } }
          ],
          label: { show: true, formatter: '{b}: {d}%', fontSize: 11 },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } }
        }]
      })
    }

    if (barChartRef.value) {
      barChart = echarts.init(barChartRef.value)
      barChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: ['业务科', '审核科', '综合科', '办公室', '信息科'], axisLabel: { fontSize: 11 } },
        yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
        series: [{
          type: 'bar', data: [
            { value: 92, itemStyle: { color: '#52c41a' } },
            { value: 85, itemStyle: { color: '#1677ff' } },
            { value: 78, itemStyle: { color: '#fa8c16' } },
            { value: 88, itemStyle: { color: '#1677ff' } },
            { value: 95, itemStyle: { color: '#52c41a' } }
          ],
          barWidth: 28, borderRadius: [4, 4, 0, 0],
          label: { show: true, position: 'top', formatter: '{c}%', fontSize: 11 }
        }]
      })
    }
  })
}

watch(activeTab, (val) => {
  if (val === 'dashboard') {
    setTimeout(initCharts, 200)
  }
})

onMounted(() => {
  if (activeTab.value === 'dashboard') {
    setTimeout(initCharts, 200)
  }
})

// 窗口resize重绘
window.addEventListener('resize', () => {
  trendChart?.resize()
  pieChart?.resize()
  barChart?.resize()
})
</script>

<style scoped>
.task-page { padding: 0; }
.page-breadcrumb { padding: 12px 20px; background: #fff; border-bottom: 1px solid #e8e8e8; }
.page-breadcrumb :deep(.el-breadcrumb__inner) { font-size: 13px; }
.page-breadcrumb :deep(.el-breadcrumb__inner.is-link) { color: #999; }
.page-breadcrumb :deep(.el-breadcrumb__inner.el-breadcrumb__inner--is-bold) { color: #1f1f1f; font-weight: 600; }

/* 统计卡片 */
.risk-overview { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; padding: 16px 20px; }
.stat-card { background: #fff; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid #e8e8e8; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-info { flex: 1; display: flex; flex-direction: column; }
.stat-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 12px; color: #999; margin-top: 2px; }
.stat-trend { font-size: 11px; white-space: nowrap; }

/* 任务内容区 */
.task-content { padding: 0 20px 20px; }
.task-tabs :deep(.el-tabs__header) { margin: 0 0 16px; background: #fff; padding: 0 6px; border-radius: 10px; }
.task-tabs :deep(.el-tabs__nav-wrap) { padding: 0; }
.task-tabs :deep(.el-tabs__item) { font-size: 14px; padding: 0 20px; height: 46px; line-height: 46px; }
.tab-content { background: #fff; border-radius: 10px; padding: 16px; border: 1px solid #e8e8e8; }

/* 筛选栏 */
.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.filter-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.filter-right { display: flex; gap: 8px; }

/* 表格 */
.risk-table, .task-table { margin-top: 4px; }
.risk-table :deep(.el-table__row), .task-table :deep(.el-table__row) { cursor: pointer; }
.risk-title-cell, .task-title-cell { display: flex; align-items: center; gap: 8px; }
.risk-level-tag, .priority-tag { flex-shrink: 0; }
.risk-title, .task-title { font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.action-btns { display: flex; gap: 2px; flex-wrap: wrap; }
.action-btns .el-button { padding: 4px 6px; font-size: 12px; }
.pagination-bar { display: flex; justify-content: flex-end; margin-top: 16px; }

/* 看板 */
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dashboard-card { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; overflow: hidden; }
.dashboard-card.full-width { grid-column: 1 / -1; }
.card-header { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; }
.card-title { font-size: 14px; font-weight: 600; color: #333; }
.card-body { padding: 8px; }

/* 详情弹窗 */
.detail-header { margin-bottom: 16px; }
.detail-title { font-size: 18px; font-weight: 600; color: #1f1f1f; margin: 10px 0 8px; }
.detail-meta { display: flex; gap: 20px; font-size: 12px; color: #999; }
.detail-section { margin-bottom: 16px; }
.detail-section h4 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
.detail-section p { font-size: 13px; color: #666; line-height: 1.8; }
.ai-suggestion-box { background: #f0f5ff; border: 1px solid #b3c6ff; border-radius: 8px; padding: 12px 16px; }
.ai-suggestion-box ul { margin: 8px 0 0; padding-left: 20px; }
.ai-suggestion-box li { font-size: 13px; color: #555; line-height: 2; }
.mb-10 { margin-bottom: 10px; }
.detail-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>