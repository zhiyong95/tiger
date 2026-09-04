<template>
  <div class="audit-page">
    <div class="audit-body">
      <!-- 左侧服务导航 -->
      <div class="service-sidebar">
        <div class="sidebar-title">业务服务</div>
        <el-input
          v-model="serviceSearch"
          placeholder="请输入服务名称进行查询"
          clearable
          size="small"
          class="service-search"
          prefix-icon="Search"
        />
        <div class="service-list">
          <div
            v-for="svc in filteredServices"
            :key="svc.id"
            class="service-item"
            :class="{ active: activeService === svc.id }"
            @click="activeService = svc.id"
          >
            <span class="service-icon">{{ svc.icon }}</span>
            <span class="service-name">{{ svc.name }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="audit-content">
        <!-- 当前服务标题 -->
        <div class="service-header">
          <div class="service-title-row">
            <span class="service-badge">{{ currentService.icon }}</span>
            <span class="service-title-text">{{ currentService.name }}</span>
            <el-tag size="small" type="info" effect="plain">{{ currentService.id }}</el-tag>
          </div>
          <div class="service-desc">{{ currentService.desc }}</div>
        </div>

        <!-- 4个Tab -->
        <el-tabs v-model="activeTab" class="audit-tabs">
          <el-tab-pane label="数据源" name="datasource">
            <div class="tab-content">
              <!-- 数据源管理 -->
              <div class="tab-toolbar">
                <div class="toolbar-left">
                  <el-button size="small" type="primary" @click="showAddDataSource = true">+ 新增数据源</el-button>
                  <el-button size="small" @click="refreshDataSource">刷新</el-button>
                </div>
                <div class="toolbar-right">
                  <el-input v-model="dsSearch" placeholder="搜索数据源" size="small" clearable style="width:200px" prefix-icon="Search" />
                </div>
              </div>
              <el-table :data="currentServiceData.dataSources" stripe style="width:100%" @row-click="viewDataSource" :highlight-current-row="true" size="small">
                <el-table-column prop="name" label="数据源名称" min-width="140" />
                <el-table-column prop="type" label="类型" width="90">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'API' ? 'primary' : row.type === '数据库' ? 'success' : 'warning'" size="small">{{ row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="source" label="来源" min-width="120" />
                <el-table-column prop="updateTime" label="更新时间" width="100" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="140" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click.stop="viewDataSource(row)">查看</el-button>
                    <el-button link type="warning" size="small" @click.stop="editDataSource(row)">编辑</el-button>
                    <el-popconfirm title="确认删除？" @confirm="deleteDataSource(row)">
                      <template #reference>
                        <el-button link type="danger" size="small" @click.stop>删除</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="业务规则" name="rules">
            <div class="tab-content">
              <div class="tab-toolbar">
                <div class="toolbar-left">
                  <el-button size="small" type="primary" @click="showAddRule = true">+ 新增规则</el-button>
                </div>
                <div class="toolbar-right">
                  <el-input v-model="ruleSearch" placeholder="搜索规则" size="small" clearable style="width:200px" prefix-icon="Search" />
                </div>
              </div>
              <el-table :data="currentServiceData.rules" stripe style="width:100%" size="small">
                <el-table-column prop="name" label="规则名称" min-width="140" />
                <el-table-column prop="type" label="规则类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.type === '校验规则' ? 'primary' : row.type === '匹配规则' ? 'success' : 'warning'" size="small">{{ row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="condition" label="判定条件" min-width="200" show-overflow-tooltip />
                <el-table-column prop="priority" label="优先级" width="70" />
                <el-table-column prop="status" label="状态" width="70">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="editRule(row)">编辑</el-button>
                    <el-button link type="primary" size="small" @click="testRule(row)">测试</el-button>
                    <el-popconfirm title="确认删除？" @confirm="deleteRule(row)">
                      <template #reference>
                        <el-button link type="danger" size="small" @click.stop>删除</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="任务执行" name="tasks">
            <div class="tab-content">
              <div class="tab-toolbar">
                <div class="toolbar-left">
                  <el-button size="small" type="primary" @click="showCreateTask = true">+ 新建任务</el-button>
                  <el-button size="small" @click="startBatchAudit">⚡ 开始批量审核</el-button>
                </div>
                <div class="toolbar-right">
                  <el-select v-model="taskStatusFilter" placeholder="任务状态" size="small" style="width:120px" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="待执行" value="待执行" />
                    <el-option label="执行中" value="执行中" />
                    <el-option label="已完成" value="已完成" />
                    <el-option label="失败" value="失败" />
                  </el-select>
                </div>
              </div>
              <el-table :data="filteredTasks" stripe style="width:100%" size="small">
                <el-table-column prop="taskName" label="任务名称" min-width="140" />
                <el-table-column prop="batch" label="批次号" width="120" />
                <el-table-column prop="totalCount" label="总人数" width="70" />
                <el-table-column prop="passedCount" label="通过" width="60" />
                <el-table-column prop="failedCount" label="不通过" width="60" />
                <el-table-column prop="progress" label="进度" width="140">
                  <template #default="{ row }">
                    <el-progress :percentage="row.progress" :status="row.progress === 100 ? 'success' : row.status === '失败' ? 'exception' : undefined" :stroke-width="10" />
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '已完成' ? 'success' : row.status === '执行中' ? 'primary' : row.status === '待执行' ? 'info' : 'danger'" size="small">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="100" />
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="viewTaskResult(row)">结果</el-button>
                    <el-button v-if="row.status === '待执行'" link type="primary" size="small" @click="executeTask(row)">执行</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="结果分析" name="results">
            <div class="tab-content">
              <!-- 结果概览统计 -->
              <div class="result-stats-row">
                <div class="stat-card blue">
                  <div class="stat-num">{{ currentServiceData.resultStats.total }}</div>
                  <div class="stat-label">审核总人次</div>
                </div>
                <div class="stat-card green">
                  <div class="stat-num">{{ currentServiceData.resultStats.passed }}</div>
                  <div class="stat-label">通过</div>
                </div>
                <div class="stat-card orange">
                  <div class="stat-num">{{ currentServiceData.resultStats.manual }}</div>
                  <div class="stat-label">需人工复核</div>
                </div>
                <div class="stat-card red">
                  <div class="stat-num">{{ currentServiceData.resultStats.rejected }}</div>
                  <div class="stat-label">不通过</div>
                </div>
              </div>

              <!-- 结果列表 -->
              <el-table :data="currentServiceData.resultList" stripe style="width:100%" size="small">
                <el-table-column prop="name" label="姓名" width="80" />
                <el-table-column prop="idNumber" label="身份证号" width="160" />
                <el-table-column prop="item" :label="currentService.resultLabel" min-width="120" />
                <el-table-column prop="result" label="审核结果" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.result === '通过' ? 'success' : row.result === '不通过' ? 'danger' : 'warning'" size="small">{{ row.result }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="riskLevel" label="风险等级" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.riskLevel === '低' ? 'success' : row.riskLevel === '中' ? 'warning' : 'danger'" size="small">{{ row.riskLevel }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="审核说明" min-width="200" show-overflow-tooltip />
                <el-table-column prop="auditTime" label="审核时间" width="100" />
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 数据源查看弹窗 -->
    <el-dialog v-model="showDataSourceDetail" :title="'数据源详情 - ' + (selectedDataSource?.name || '')" width="600px">
      <el-descriptions :column="2" border size="small" v-if="selectedDataSource">
        <el-descriptions-item label="数据源名称">{{ selectedDataSource.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ selectedDataSource.type }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ selectedDataSource.source }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ selectedDataSource.status }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ selectedDataSource.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="数据量">{{ selectedDataSource.count || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedDataSource.desc || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 新增数据源弹窗 -->
    <el-dialog v-model="showAddDataSource" title="新增数据源" width="500px">
      <el-form :model="newDataSource" label-width="100px" size="small">
        <el-form-item label="数据源名称">
          <el-input v-model="newDataSource.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newDataSource.type" style="width:100%">
            <el-option label="API" value="API" />
            <el-option label="数据库" value="数据库" />
            <el-option label="文件" value="文件" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="newDataSource.source" placeholder="请输入数据来源" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newDataSource.desc" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDataSource = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDataSource">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 新增规则弹窗 -->
    <el-dialog v-model="showAddRule" title="新增业务规则" width="550px">
      <el-form :model="newRule" label-width="100px" size="small">
        <el-form-item label="规则名称">
          <el-input v-model="newRule.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="newRule.type" style="width:100%">
            <el-option label="校验规则" value="校验规则" />
            <el-option label="匹配规则" value="匹配规则" />
            <el-option label="计算规则" value="计算规则" />
          </el-select>
        </el-form-item>
        <el-form-item label="判定条件">
          <el-input v-model="newRule.condition" type="textarea" :rows="3" placeholder="请输入判定条件描述" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="newRule.priority" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRule = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRule">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 新建任务弹窗 -->
    <el-dialog v-model="showCreateTask" title="新建审核任务" width="500px">
      <el-form :model="newTask" label-width="100px" size="small">
        <el-form-item label="任务名称">
          <el-input v-model="newTask.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="审核范围">
          <el-select v-model="newTask.scope" style="width:100%">
            <el-option label="全部数据" value="全部" />
            <el-option label="按条件筛选" value="筛选" />
            <el-option label="手动上传名单" value="手动" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核规则">
          <el-select v-model="newTask.ruleIds" multiple style="width:100%">
            <el-option v-for="r in currentServiceData.rules" :key="r.name" :label="r.name" :value="r.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTask = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTask">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 审核详情弹窗 -->
    <el-dialog v-model="showAuditDetail" :title="'审核详情 - ' + (auditDetail?.name || '')" width="700px">
      <template v-if="auditDetail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ auditDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ auditDetail.idNumber }}</el-descriptions-item>
          <el-descriptions-item :label="currentService.resultLabel">{{ auditDetail.item }}</el-descriptions-item>
          <el-descriptions-item label="审核结果">
            <el-tag :type="auditDetail.result === '通过' ? 'success' : auditDetail.result === '不通过' ? 'danger' : 'warning'" size="small">{{ auditDetail.result }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="auditDetail.riskLevel === '低' ? 'success' : auditDetail.riskLevel === '中' ? 'warning' : 'danger'" size="small">{{ auditDetail.riskLevel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ auditDetail.auditTime }}</el-descriptions-item>
          <el-descriptions-item label="审核说明" :span="2">{{ auditDetail.reason }}</el-descriptions-item>
        </el-descriptions>
        <div class="audit-detail-section">
          <div class="detail-section-title">AI 审核依据</div>
          <div class="detail-section-body">
            <div v-for="(r, i) in auditDetail.rules" :key="i" class="rule-item">
              <span class="rule-check">✓</span>
              <span>{{ r }}</span>
            </div>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

interface DataSource {
  name: string; type: string; source: string; updateTime: string; status: string; count?: string; desc?: string
}
interface RuleItem {
  name: string; type: string; condition: string; priority: number; status: string
}
interface TaskItem {
  taskName: string; batch: string; totalCount: number; passedCount: number; failedCount: number; progress: number; status: string; createTime: string
}
interface ResultItem {
  name: string; idNumber: string; item: string; result: string; riskLevel: string; reason: string; auditTime: string; rules?: string[]
}
interface AuditService {
  id: string; name: string; icon: string; desc: string; resultLabel: string
  dataSources: DataSource[]; rules: RuleItem[]; tasks: TaskItem[]; resultStats: { total: number; passed: number; manual: number; rejected: number }; resultList: ResultItem[]
}

const serviceSearch = ref('')
const activeService = ref('employment-subsidy')
const activeTab = ref('datasource')
const dsSearch = ref('')
const ruleSearch = ref('')
const taskStatusFilter = ref('')
const showAddDataSource = ref(false)
const showDataSourceDetail = ref(false)
const showAddRule = ref(false)
const showCreateTask = ref(false)
const showAuditDetail = ref(false)
const selectedDataSource = ref<DataSource | null>(null)
const auditDetail = ref<ResultItem | null>(null)

const newDataSource = ref({ name: '', type: 'API', source: '', desc: '' })
const newRule = ref({ name: '', type: '校验规则', condition: '', priority: 5 })
const newTask = ref({ taskName: '', scope: '全部', ruleIds: [] as string[] })

// 7个业务服务数据
const services = ref<AuditService[]>([
  {
    id: 'employment-subsidy', name: '就业补贴资格审核服务', icon: '💰', desc: '对就业补贴申请人员的资格条件进行AI智能审核，包括身份核验、就业状态、社保缴纳等多维度校验',
    resultLabel: '补贴项目',
    dataSources: [
      { name: '就业登记信息库', type: '数据库', source: '业务系统', updateTime: '2026-08-27', status: '正常', count: '56.2万', desc: '全市就业登记人员信息' },
      { name: '社保缴纳记录库', type: '数据库', source: '社保系统', updateTime: '2026-08-27', status: '正常', count: '128.5万', desc: '参保人员缴费记录' },
      { name: '补贴发放记录', type: 'API', source: '财政系统', updateTime: '2026-08-26', status: '正常', count: '8.3万', desc: '历史补贴发放明细' },
      { name: '工商注册信息', type: 'API', source: '市场监管', updateTime: '2026-08-25', status: '正常', desc: '企业工商登记信息' }
    ],
    rules: [
      { name: '就业状态校验', type: '校验规则', condition: '申请人当前处于就业状态，社保缴纳≥3个月', priority: 1, status: '启用' },
      { name: '补贴期限校验', type: '校验规则', condition: '同一补贴项目未重复申领，间隔≥12个月', priority: 2, status: '启用' },
      { name: '身份核验', type: '匹配规则', condition: '身份证号与公安库一致，年龄在法定劳动年龄内', priority: 1, status: '启用' },
      { name: '收入门槛校验', type: '校验规则', condition: '家庭人均收入低于当地最低工资标准2倍', priority: 3, status: '启用' },
      { name: '单位信息匹配', type: '匹配规则', condition: '用人单位已办理社保登记，无欠费记录', priority: 2, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年8月第3批就业补贴审核', batch: 'JY-202608-003', totalCount: 1560, passedCount: 1280, failedCount: 280, progress: 100, status: '已完成', createTime: '2026-08-25' },
      { taskName: '2026年8月第4批就业补贴审核', batch: 'JY-202608-004', totalCount: 2030, passedCount: 0, failedCount: 0, progress: 45, status: '执行中', createTime: '2026-08-27' },
      { taskName: '高校毕业生就业补贴专项', batch: 'JY-202608-005', totalCount: 890, passedCount: 0, failedCount: 0, progress: 0, status: '待执行', createTime: '2026-08-27' }
    ],
    resultStats: { total: 4480, passed: 3210, manual: 580, rejected: 690 },
    resultList: [
      { name: '张明', idNumber: '342****1234', item: '高校毕业生就业补贴', result: '通过', riskLevel: '低', reason: '身份核验通过，就业状态正常，社保缴纳满6个月，未重复申领', auditTime: '2026-08-27 10:23', rules: ['身份信息与公安库一致', '就业状态确认为在职', '社保连续缴纳≥6个月', '未享受过同类型补贴'] },
      { name: '李芳', idNumber: '342****5678', item: '灵活就业社保补贴', result: '不通过', riskLevel: '高', reason: '社保缴纳中断超过3个月，不符合连续缴纳条件', auditTime: '2026-08-27 10:25', rules: ['身份信息一致', '灵活就业登记有效', '社保缴纳中断超过3个月', '不符合连续缴纳条件'] },
      { name: '王强', idNumber: '342****9012', item: '就业困难人员补贴', result: '需人工复核', riskLevel: '中', reason: '收入证明不完整，需补充近3个月银行流水', auditTime: '2026-08-27 10:28', rules: ['身份信息一致', '就业困难认定有效', '收入证明缺失近3个月记录', '需人工核实'] },
      { name: '赵丽', idNumber: '342****3456', item: '高校毕业生就业补贴', result: '通过', riskLevel: '低', reason: '应届毕业生身份核验通过，已签订劳动合同', auditTime: '2026-08-27 10:30', rules: ['毕业证信息核验通过', '劳动合同备案有效', '社保已开始缴纳', '补贴标准符合规定'] },
      { name: '陈伟', idNumber: '342****7890', item: '就业困难人员补贴', result: '不通过', riskLevel: '高', reason: '家庭收入超出认定标准，不符合就业困难人员条件', auditTime: '2026-08-27 10:32', rules: ['身份信息一致', '就业困难认定已过期', '家庭收入核查超出标准', '不符合条件'] }
    ]
  },
  {
    id: 'personal-loan', name: '个人创业担保贷款放贷资格审核', icon: '🏦', desc: '对个人申请创业担保贷款的资格进行AI审核，包括创业状态、信用记录、担保条件等',
    resultLabel: '贷款用途',
    dataSources: [
      { name: '创业登记信息库', type: '数据库', source: '业务系统', updateTime: '2026-08-27', status: '正常', count: '12.3万', desc: '创业登记人员信息' },
      { name: '征信记录库', type: 'API', source: '人行征信', updateTime: '2026-08-27', status: '正常', desc: '个人信用报告' },
      { name: '担保人信息库', type: '数据库', source: '业务系统', updateTime: '2026-08-26', status: '正常', count: '3.1万', desc: '担保人信息及担保记录' }
    ],
    rules: [
      { name: '创业状态校验', type: '校验规则', condition: '申请人已办理营业执照，经营期限≥6个月', priority: 1, status: '启用' },
      { name: '信用记录校验', type: '校验规则', condition: '个人征信无不良记录，无逾期超过90天', priority: 1, status: '启用' },
      { name: '担保条件校验', type: '匹配规则', condition: '担保人符合资格要求，担保金额未超限额', priority: 2, status: '启用' },
      { name: '贷款额度校验', type: '校验规则', condition: '申请额度不超过最高限额30万，且不超经营需要', priority: 3, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年8月创业贷款第2批', batch: 'CY-202608-002', totalCount: 320, passedCount: 210, failedCount: 110, progress: 100, status: '已完成', createTime: '2026-08-20' },
      { taskName: '2026年8月创业贷款第3批', batch: 'CY-202608-003', totalCount: 450, passedCount: 180, failedCount: 270, progress: 100, status: '已完成', createTime: '2026-08-25' }
    ],
    resultStats: { total: 770, passed: 390, manual: 120, rejected: 260 },
    resultList: [
      { name: '刘洋', idNumber: '342****1122', item: '创业担保贷款15万', result: '通过', riskLevel: '低', reason: '创业满1年，信用良好，担保人资格符合', auditTime: '2026-08-25 14:10', rules: ['营业执照经营满1年', '征信无不良记录', '担保人资质审核通过', '额度在合理范围内'] },
      { name: '周敏', idNumber: '342****3344', item: '创业担保贷款10万', result: '不通过', riskLevel: '高', reason: '个人征信存在逾期记录，不符合贷款条件', auditTime: '2026-08-25 14:15', rules: ['创业状态有效', '征信存在逾期超过90天记录', '不符合贷款条件'] }
    ]
  },
  {
    id: 'small-micro-loan', name: '小微企业创业担保贷款资格审核', icon: '🏢', desc: '对小微企业申请创业担保贷款的资格进行AI审核，包括企业经营、用工、社保等',
    resultLabel: '贷款项目',
    dataSources: [
      { name: '企业登记信息库', type: '数据库', source: '市场监管', updateTime: '2026-08-27', status: '正常', desc: '企业工商登记信息' },
      { name: '企业社保缴纳库', type: '数据库', source: '社保系统', updateTime: '2026-08-27', status: '正常', desc: '企业参保缴费记录' },
      { name: '企业纳税信息', type: 'API', source: '税务系统', updateTime: '2026-08-26', status: '正常', desc: '企业纳税记录' }
    ],
    rules: [
      { name: '企业资质校验', type: '校验规则', condition: '企业注册满1年，符合小微企业认定标准', priority: 1, status: '启用' },
      { name: '用工规模校验', type: '校验规则', condition: '企业用工人数符合小微企业标准，社保缴纳正常', priority: 2, status: '启用' },
      { name: '经营状况校验', type: '校验规则', condition: '企业正常经营，无重大违法违规记录', priority: 1, status: '启用' },
      { name: '贷款额度校验', type: '计算规则', condition: '贷款额度不超过300万，且不超企业年营收50%', priority: 3, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年8月企业贷款审核', batch: 'QY-202608-001', totalCount: 56, passedCount: 38, failedCount: 18, progress: 100, status: '已完成', createTime: '2026-08-22' }
    ],
    resultStats: { total: 56, passed: 38, manual: 8, rejected: 10 },
    resultList: [
      { name: '明达科技', idNumber: '911****001X', item: '小微企业贷款200万', result: '通过', riskLevel: '低', reason: '小微企业认定通过，经营正常，社保缴纳合规', auditTime: '2026-08-22 09:30', rules: ['小微企业认定审核通过', '社保缴纳满12个月', '经营状态正常', '贷款额度在合理范围'] },
      { name: '宏远商贸', idNumber: '911****002X', item: '小微企业贷款150万', result: '不通过', riskLevel: '高', reason: '企业社保缴纳人数不足，不符合小微企业用工标准', auditTime: '2026-08-22 09:35', rules: ['企业登记有效', '社保缴纳人数不足5人', '不符合小微企业认定标准'] }
    ]
  },
  {
    id: 'training-subsidy', name: '技能培训补贴使用资格审核', icon: '📚', desc: '对参加技能培训人员的补贴使用资格进行AI审核，包括培训参与、考核结果等',
    resultLabel: '培训项目',
    dataSources: [
      { name: '培训报名信息库', type: '数据库', source: '培训系统', updateTime: '2026-08-27', status: '正常', count: '23.4万', desc: '培训报名及参与记录' },
      { name: '培训考核结果库', type: '数据库', source: '培训系统', updateTime: '2026-08-27', status: '正常', desc: '培训考核成绩记录' },
      { name: '补贴资金台账', type: '文件', source: '财政部门', updateTime: '2026-08-26', status: '正常', desc: '补贴资金使用台账' }
    ],
    rules: [
      { name: '培训参与校验', type: '校验规则', condition: '实际参加培训课时≥规定课时80%', priority: 1, status: '启用' },
      { name: '考核结果校验', type: '校验规则', condition: '培训考核成绩合格，获得结业证书', priority: 1, status: '启用' },
      { name: '补贴标准校验', type: '匹配规则', condition: '补贴金额不超过规定标准，且未超年度限额', priority: 2, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年第3期培训补贴审核', batch: 'PX-202608-001', totalCount: 680, passedCount: 520, failedCount: 160, progress: 100, status: '已完成', createTime: '2026-08-18' }
    ],
    resultStats: { total: 680, passed: 520, manual: 60, rejected: 100 },
    resultList: [
      { name: '孙磊', idNumber: '342****5566', item: '电工技能培训', result: '通过', riskLevel: '低', reason: '培训出勤率92%，考核合格，补贴标准合规', auditTime: '2026-08-18 15:20', rules: ['培训出勤率达标', '考核成绩合格', '补贴金额未超标准'] },
      { name: '吴静', idNumber: '342****7788', item: '电商运营培训', result: '不通过', riskLevel: '中', reason: '培训出勤率仅65%，未达到80%要求', auditTime: '2026-08-18 15:25', rules: ['培训出勤率不足80%', '不符合补贴条件'] }
    ]
  },
  {
    id: 'training-fund', name: '职业技能培训补贴资金审核', icon: '💵', desc: '对培训机构提交的培训补贴资金申请进行AI审核，包括培训执行、资金使用等',
    resultLabel: '资金项目',
    dataSources: [
      { name: '培训机构资质库', type: '数据库', source: '业务系统', updateTime: '2026-08-27', status: '正常', desc: '培训机构备案信息' },
      { name: '培训执行记录库', type: '数据库', source: '培训系统', updateTime: '2026-08-27', status: '正常', desc: '培训执行过程记录' },
      { name: '资金拨付记录', type: 'API', source: '财政系统', updateTime: '2026-08-26', status: '正常', desc: '补贴资金拨付记录' }
    ],
    rules: [
      { name: '机构资质校验', type: '校验规则', condition: '培训机构已备案且资质有效，未列入异常名录', priority: 1, status: '启用' },
      { name: '培训执行校验', type: '校验规则', condition: '培训计划与实际执行一致，课时、师资符合要求', priority: 1, status: '启用' },
      { name: '资金使用校验', type: '计算规则', condition: '补贴资金使用符合规定范围，票据齐全', priority: 2, status: '启用' },
      { name: '重复申请校验', type: '匹配规则', condition: '同一培训项目未重复申请补贴资金', priority: 3, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年8月培训资金审核', batch: 'ZJ-202608-001', totalCount: 45, passedCount: 32, failedCount: 13, progress: 100, status: '已完成', createTime: '2026-08-20' }
    ],
    resultStats: { total: 45, passed: 32, manual: 5, rejected: 8 },
    resultList: [
      { name: '新起点职业培训学校', idNumber: '524****003X', item: '家政服务培训补贴', result: '通过', riskLevel: '低', reason: '机构资质有效，培训执行合规，资金使用规范', auditTime: '2026-08-20 11:00', rules: ['机构资质审核通过', '培训计划与实际一致', '补贴资金使用合规', '无重复申请'] },
      { name: '蓝天技能培训中心', idNumber: '524****004X', item: '焊工培训补贴', result: '需人工复核', riskLevel: '中', reason: '培训课时记录与签到表存在差异，需人工核实', auditTime: '2026-08-20 11:05', rules: ['机构资质有效', '培训课时记录与签到不一致', '需人工核实'] }
    ]
  },
  {
    id: 'labor-info', name: '劳动力信息采集费用准确性核查', icon: '📋', desc: '对基层采集的劳动力信息数据质量及采集费用进行AI准确性核查',
    resultLabel: '采集项目',
    dataSources: [
      { name: '劳动力信息采集库', type: '数据库', source: '业务系统', updateTime: '2026-08-27', status: '正常', count: '186.2万', desc: '劳动力信息采集记录' },
      { name: '采集人员信息库', type: '数据库', source: '业务系统', updateTime: '2026-08-27', status: '正常', desc: '信息采集员信息' },
      { name: '费用标准配置', type: '文件', source: '业务系统', updateTime: '2026-08-26', status: '正常', desc: '采集费用标准配置' }
    ],
    rules: [
      { name: '数据完整性校验', type: '校验规则', condition: '采集信息必填字段完整，无缺失', priority: 1, status: '启用' },
      { name: '数据逻辑校验', type: '校验规则', condition: '采集数据逻辑合理，无异常值', priority: 1, status: '启用' },
      { name: '费用计算校验', type: '计算规则', condition: '采集费用按标准计算，数量与金额匹配', priority: 2, status: '启用' },
      { name: '重复采集校验', type: '匹配规则', condition: '同一人员信息未重复采集计费', priority: 3, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年8月采集费用核查', batch: 'CJ-202608-001', totalCount: 12500, passedCount: 11200, failedCount: 1300, progress: 100, status: '已完成', createTime: '2026-08-21' }
    ],
    resultStats: { total: 12500, passed: 11200, manual: 600, rejected: 700 },
    resultList: [
      { name: '张三（采集员）', idNumber: 'CJY-001', item: '2026年8月采集数据', result: '通过', riskLevel: '低', reason: '数据完整，逻辑合理，费用计算准确', auditTime: '2026-08-21 16:00', rules: ['采集数据完整', '逻辑校验通过', '费用计算准确'] },
      { name: '李四（采集员）', idNumber: 'CJY-002', item: '2026年8月采集数据', result: '不通过', riskLevel: '高', reason: '存在5条重复采集记录，涉及费用320元', auditTime: '2026-08-21 16:05', rules: ['数据完整性通过', '存在重复采集记录', '重复费用需扣除'] }
    ]
  },
  {
    id: 'pension-cert', name: '养老待遇认证AI审查服务', icon: '👴', desc: '对领取养老保险待遇人员的资格进行AI审查，包括生存认证、待遇资格等',
    resultLabel: '认证类型',
    dataSources: [
      { name: '养老保险待遇领取库', type: '数据库', source: '社保系统', updateTime: '2026-08-27', status: '正常', count: '45.6万', desc: '养老保险待遇领取人员信息' },
      { name: '生存认证记录库', type: '数据库', source: '认证系统', updateTime: '2026-08-27', status: '正常', desc: '年度生存认证记录' },
      { name: '公安户籍信息', type: 'API', source: '公安系统', updateTime: '2026-08-27', status: '正常', desc: '户籍及死亡注销信息' },
      { name: '民政殡葬信息', type: 'API', source: '民政系统', updateTime: '2026-08-26', status: '正常', desc: '殡葬火化信息' }
    ],
    rules: [
      { name: '生存状态校验', type: '校验规则', condition: '年度内完成生存认证，且认证结果有效', priority: 1, status: '启用' },
      { name: '户籍状态校验', type: '匹配规则', condition: '户籍信息正常，无死亡注销记录', priority: 1, status: '启用' },
      { name: '待遇资格校验', type: '校验规则', condition: '待遇领取资格有效，无暂停/终止记录', priority: 2, status: '启用' },
      { name: '重复领取校验', type: '匹配规则', condition: '同一人员未在多地区重复领取待遇', priority: 3, status: '启用' }
    ],
    tasks: [
      { taskName: '2026年第3季度养老认证审查', batch: 'YL-202608-001', totalCount: 45600, passedCount: 43200, failedCount: 2400, progress: 100, status: '已完成', createTime: '2026-08-15' },
      { taskName: '2026年8月新增退休人员认证', batch: 'YL-202608-002', totalCount: 1280, passedCount: 0, failedCount: 0, progress: 0, status: '待执行', createTime: '2026-08-27' }
    ],
    resultStats: { total: 46880, passed: 43200, manual: 1800, rejected: 1880 },
    resultList: [
      { name: '王建国', idNumber: '342****1111', item: '企业职工养老保险', result: '通过', riskLevel: '低', reason: '生存认证已完成，户籍正常，待遇资格有效', auditTime: '2026-08-15 09:00', rules: ['2026年度生存认证已完成', '户籍信息正常', '待遇资格有效'] },
      { name: '张秀英', idNumber: '342****2222', item: '城乡居民养老保险', result: '不通过', riskLevel: '高', reason: '公安户籍显示已死亡注销，需暂停待遇发放', auditTime: '2026-08-15 09:05', rules: ['生存认证已过期', '公安户籍已死亡注销', '需暂停待遇发放'] },
      { name: '李德福', idNumber: '342****3333', item: '企业职工养老保险', result: '需人工复核', riskLevel: '中', reason: '生存认证照片模糊，无法通过人脸比对，需人工确认', auditTime: '2026-08-15 09:10', rules: ['生存认证提交', '人脸比对置信度不足', '需人工核实'] }
    ]
  }
])

const currentService = computed(() => services.value.find(s => s.id === activeService.value) || services.value[0])
const currentServiceData = computed(() => currentService.value)
const filteredServices = computed(() => {
  if (!serviceSearch.value) return services.value
  return services.value.filter(s => s.name.includes(serviceSearch.value))
})
const filteredTasks = computed(() => {
  const tasks = currentServiceData.value.tasks
  if (!taskStatusFilter.value) return tasks
  return tasks.filter(t => t.status === taskStatusFilter.value)
})

function refreshDataSource() { ElMessage.success('数据源已刷新') }
function viewDataSource(row: any) { selectedDataSource.value = row; showDataSourceDetail.value = true }
function editDataSource(row: any) { ElMessage.info('编辑数据源：' + row.name) }
function deleteDataSource(row: any) { ElMessage.success('已删除：' + row.name) }
function confirmAddDataSource() {
  ElMessage.success('新增数据源：' + newDataSource.value.name)
  showAddDataSource.value = false
  newDataSource.value = { name: '', type: 'API', source: '', desc: '' }
}
function editRule(row: any) { ElMessage.info('编辑规则：' + row.name) }
function testRule(row: any) { ElMessage.success('规则测试已启动：' + row.name) }
function deleteRule(row: any) { ElMessage.success('已删除规则：' + row.name) }
function confirmAddRule() {
  ElMessage.success('新增规则：' + newRule.value.name)
  showAddRule.value = false
  newRule.value = { name: '', type: '校验规则', condition: '', priority: 5 }
}
function confirmCreateTask() {
  ElMessage.success('任务已创建：' + newTask.value.taskName)
  showCreateTask.value = false
  newTask.value = { taskName: '', scope: '全部', ruleIds: [] }
}
function startBatchAudit() { ElMessage.success('批量审核任务已启动') }
function viewTaskResult(row: any) { ElMessage.info('查看任务结果：' + row.taskName) }
function executeTask(row: any) { ElMessage.success('任务已开始执行：' + row.taskName) }
function viewDetail(row: any) { auditDetail.value = row; showAuditDetail.value = true }
</script>

<style scoped>
.audit-page { padding: 16px 20px; height: calc(100vh - 56px); display: flex; flex-direction: column; background: #f5f6fa; }
.audit-body { display: flex; gap: 16px; flex: 1; min-height: 0; }
.service-sidebar { width: 220px; flex-shrink: 0; background: #fff; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.sidebar-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
.service-search { margin-bottom: 12px; }
.service-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.service-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 13px; color: #374151; }
.service-item:hover { background: #f0f4ff; }
.service-item.active { background: linear-gradient(135deg, #eef2ff, #e0e7ff); color: #1e40af; font-weight: 500; border-left: 3px solid #2563eb; }
.service-icon { font-size: 18px; }
.service-name { flex: 1; }

.audit-content { flex: 1; background: #fff; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.service-header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.service-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.service-badge { font-size: 22px; }
.service-title-text { font-size: 16px; font-weight: 600; color: #1f2937; }
.service-desc { font-size: 13px; color: #6b7280; margin-left: 34px; }

.audit-tabs { flex: 1; display: flex; flex-direction: column; }
.audit-tabs :deep(.el-tabs__content) { flex: 1; overflow: auto; }
.tab-content { display: flex; flex-direction: column; gap: 12px; }
.tab-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-left { display: flex; gap: 8px; }
.toolbar-right { display: flex; gap: 8px; }

.result-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.stat-card { padding: 16px; border-radius: 10px; text-align: center; }
.stat-card.blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); }
.stat-card.green { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
.stat-card.orange { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.stat-card.red { background: linear-gradient(135deg, #fef2f2, #fee2e2); }
.stat-num { font-size: 28px; font-weight: 700; color: #1f2937; }
.stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }

.audit-detail-section { margin-top: 16px; }
.detail-section-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.detail-section-body { display: flex; flex-direction: column; gap: 8px; }
.rule-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; background: #f9fafb; border-radius: 6px; font-size: 13px; color: #374151; }
.rule-check { color: #10b981; font-weight: 700; }
</style>