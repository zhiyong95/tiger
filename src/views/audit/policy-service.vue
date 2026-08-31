<template>
  <div class="policy-service-page">
    <!-- 左侧侧边栏 -->
    <div class="ps-sidebar">
      <!-- 服务/任务选择 -->
      <div class="ps-sidebar-section">
        <div class="ps-sidebar-title">
          <el-icon><List /></el-icon>
          <span>服务/任务选择</span>
        </div>
        <el-select v-model="selectedService" placeholder="选择服务/任务" style="width:100%;margin-bottom:12px">
          <el-option v-for="s in serviceList" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-input v-model="taskSearch" placeholder="搜索任务名称" clearable size="small" style="margin-bottom:12px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="ps-task-list">
          <div v-for="t in filteredTasks" :key="t.id"
            class="ps-task-item"
            :class="{ active: activeTask?.id === t.id }"
            @click="activeTask = t">
            <div class="ps-task-name">{{ t.name }}</div>
            <div class="ps-task-meta">
              <el-tag :type="t.status === '进行中' ? 'warning' : t.status === '已完成' ? 'success' : 'info'" size="small">{{ t.status }}</el-tag>
              <span class="ps-task-time">{{ t.time }}</span>
            </div>
          </div>
          <div v-if="filteredTasks.length === 0" class="ps-empty">暂无匹配任务</div>
        </div>
      </div>
      <!-- 推送历史 -->
      <div class="ps-sidebar-section">
        <div class="ps-sidebar-title">
          <el-icon><Clock /></el-icon>
          <span>推送历史</span>
        </div>
        <div class="ps-history-list">
          <div v-for="h in pushHistory" :key="h.id" class="ps-history-item" @click="viewHistory(h)">
            <div class="ps-history-name">{{ h.name }}</div>
            <div class="ps-history-meta">
              <span>{{ h.target }}</span>
              <span>{{ h.time }}</span>
            </div>
            <el-tag v-if="h.status === '成功'" type="success" size="small">成功</el-tag>
            <el-tag v-else-if="h.status === '部分成功'" type="warning" size="small">部分成功</el-tag>
            <el-tag v-else type="danger" size="small">失败</el-tag>
          </div>
          <div v-if="pushHistory.length === 0" class="ps-empty">暂无推送记录</div>
        </div>
      </div>
    </div>
    <!-- 右侧主内容 -->
    <div class="ps-main">
      <el-tabs v-model="activeTab" class="ps-tabs">
        <el-tab-pane label="政策匹配引擎" name="engine">
          <div class="ps-tab-content">
            <!-- 匹配配置区 -->
            <div class="ps-config-section">
              <div class="ps-section-title">匹配配置</div>
              <el-form :model="matchConfig" label-width="100px" size="small">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="服务/任务">
                      <el-select v-model="matchConfig.service" placeholder="选择服务/任务" style="width:100%">
                        <el-option v-for="s in serviceList" :key="s.value" :label="s.label" :value="s.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="匹配维度">
                      <el-select v-model="matchConfig.dimension" placeholder="选择匹配维度" style="width:100%">
                        <el-option label="年龄" value="age" />
                        <el-option label="户籍" value="household" />
                        <el-option label="就业状态" value="employment" />
                        <el-option label="社保缴纳" value="social" />
                        <el-option label="综合匹配" value="comprehensive" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="数据批次">
                      <el-select v-model="matchConfig.batch" placeholder="选择数据批次" style="width:100%">
                        <el-option label="2026年7月批次" value="202607" />
                        <el-option label="2026年6月批次" value="202606" />
                        <el-option label="2026年5月批次" value="202605" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="政策类型">
                      <el-select v-model="matchConfig.policyType" placeholder="选择政策类型" style="width:100%">
                        <el-option label="就业补贴政策" value="subsidy" />
                        <el-option label="社保减免政策" value="social" />
                        <el-option label="创业扶持政策" value="entrepreneur" />
                        <el-option label="培训补贴政策" value="training" />
                        <el-option label="全部政策" value="all" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="匹配阈值">
                      <el-slider v-model="matchConfig.threshold" :min="50" :max="100" :step="5" show-input />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8" style="display:flex;align-items:flex-end;justify-content:flex-end">
                    <el-button type="primary" @click="runMatch">开始匹配</el-button>
                    <el-button @click="resetMatchConfig">重置</el-button>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <!-- 匹配结果 -->
            <div v-if="matchResults.length > 0" class="ps-result-section">
              <div class="ps-section-title">
                匹配结果
                <span class="ps-result-count">共匹配 {{ matchResults.length }} 人</span>
              </div>
              <el-table :data="matchResults" stripe border size="small" style="width:100%">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="idCard" label="身份证号" width="180" />
                <el-table-column prop="age" label="年龄" width="60" />
                <el-table-column prop="household" label="户籍" width="100" />
                <el-table-column prop="employment" label="就业状态" width="100" />
                <el-table-column label="匹配政策" min-width="200">
                  <template #default="{ row }">
                    <el-tag v-for="p in row.matchedPolicies" :key="p" size="small" style="margin:2px">{{ p }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="匹配度" width="100">
                  <template #default="{ row }">
                    <el-progress :percentage="row.matchRate" :color="row.matchRate >= 80 ? '#10b981' : row.matchRate >= 60 ? '#f59e0b' : '#ef4444'" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewMatchDetail(row)">详情</el-button>
                    <el-button type="primary" link size="small" @click="pushToTarget(row)">推送</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="ps-match-actions">
                <el-button type="primary" @click="batchPush">批量推送匹配结果</el-button>
                <el-button @click="exportMatchResult">导出匹配结果</el-button>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-else class="ps-empty-state">
              <el-icon class="ps-empty-icon"><Search /></el-icon>
              <p>配置匹配参数后点击「开始匹配」</p>
              <p class="ps-empty-desc">系统将自动匹配符合条件的政策与人员</p>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="推送管理" name="push">
          <div class="ps-tab-content">
            <div class="ps-config-section">
              <div class="ps-section-title">推送任务配置</div>
              <el-form :model="pushConfig" label-width="100px" size="small">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="推送渠道">
                      <el-select v-model="pushConfig.channel" placeholder="选择推送渠道" style="width:100%">
                        <el-option label="短信通知" value="sms" />
                        <el-option label="微信服务号" value="wechat" />
                        <el-option label="APP推送" value="app" />
                        <el-option label="电话外呼" value="phone" />
                        <el-option label="综合推送" value="all" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="推送模板">
                      <el-select v-model="pushConfig.template" placeholder="选择推送模板" style="width:100%">
                        <el-option label="就业补贴通知模板" value="subsidy" />
                        <el-option label="社保减免通知模板" value="social" />
                        <el-option label="创业扶持通知模板" value="entrepreneur" />
                        <el-option label="培训通知模板" value="training" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="推送时间">
                      <el-date-picker v-model="pushConfig.time" type="datetime" placeholder="选择推送时间" style="width:100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="推送对象">
                      <el-select v-model="pushConfig.target" placeholder="选择推送对象" style="width:100%">
                        <el-option label="全部匹配人员" value="all" />
                        <el-option label="匹配度≥80%人员" value="high" />
                        <el-option label="指定人员" value="custom" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="批量限制">
                      <el-input-number v-model="pushConfig.limit" :min="10" :max="10000" :step="100" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8" style="display:flex;align-items:flex-end;justify-content:flex-end">
                    <el-button type="primary" @click="createPushTask">创建推送任务</el-button>
                    <el-button @click="resetPushConfig">重置</el-button>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <!-- 推送任务列表 -->
            <div class="ps-result-section">
              <div class="ps-section-title">推送任务列表</div>
              <el-table :data="pushTasks" stripe border size="small" style="width:100%">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="name" label="任务名称" width="160" />
                <el-table-column prop="channel" label="推送渠道" width="100" />
                <el-table-column prop="target" label="推送对象" width="160" />
                <el-table-column prop="total" label="推送人数" width="80" />
                <el-table-column prop="succeed" label="成功" width="80" />
                <el-table-column prop="failed" label="失败" width="80" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '已完成' ? 'success' : row.status === '进行中' ? 'warning' : 'info'">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewPushDetail(row)">详情</el-button>
                    <el-button v-if="row.status === '进行中'" type="warning" link size="small" @click="cancelPush(row)">取消</el-button>
                    <el-button v-if="row.status === '失败'" type="primary" link size="small" @click="retryPush(row)">重试</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="推送效果跟踪" name="track">
          <div class="ps-tab-content">
            <!-- 概览统计 -->
            <el-row :gutter="16" class="ps-stats-row">
              <el-col :span="6"><div class="ps-stat-card"><div class="ps-stat-label">推送总人次</div><div class="ps-stat-value">12,580</div><div class="ps-stat-trend up">↑ 12.3%</div></div></el-col>
              <el-col :span="6"><div class="ps-stat-card"><div class="ps-stat-label">成功触达</div><div class="ps-stat-value">11,246</div><div class="ps-stat-trend up">↑ 8.7%</div></div></el-col>
              <el-col :span="6"><div class="ps-stat-card"><div class="ps-stat-label">已读/点击率</div><div class="ps-stat-value">68.5%</div><div class="ps-stat-trend up">↑ 3.2%</div></div></el-col>
              <el-col :span="6"><div class="ps-stat-card"><div class="ps-stat-label">政策办理转化率</div><div class="ps-stat-value">23.8%</div><div class="ps-stat-trend up">↑ 5.1%</div></div></el-col>
            </el-row>
            <!-- 效果分析 -->
            <el-row :gutter="16" style="margin-top:16px">
              <el-col :span="12">
                <div class="ps-chart-card">
                  <div class="ps-section-title">推送渠道效果对比</div>
                  <div ref="channelChartRef" style="width:100%;height:300px"></div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="ps-chart-card">
                  <div class="ps-section-title">月度推送趋势</div>
                  <div ref="trendChartRef" style="width:100%;height:300px"></div>
                </div>
              </el-col>
            </el-row>
            <!-- 推送明细 -->
            <div class="ps-result-section" style="margin-top:16px">
              <div class="ps-section-title">推送明细记录</div>
              <el-table :data="pushDetails" stripe border size="small" style="width:100%">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="name" label="任务名称" width="140" />
                <el-table-column prop="channel" label="渠道" width="80" />
                <el-table-column prop="time" label="推送时间" width="160" />
                <el-table-column prop="total" label="推送数" width="70" />
                <el-table-column prop="reach" label="触达数" width="70" />
                <el-table-column prop="read" label="已读数" width="70" />
                <el-table-column prop="convert" label="转化数" width="70" />
                <el-table-column prop="rate" label="转化率" width="80">
                  <template #default="{ row }"><span style="color:#10b981">{{ row.rate }}%</span></template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }"><el-button type="primary" link size="small" @click="viewTrackDetail(row)">详情</el-button></template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="匹配结果支撑" name="support">
          <div class="ps-tab-content">
            <div class="ps-config-section">
              <div class="ps-section-title">匹配结果查询</div>
              <el-form :model="supportQuery" label-width="100px" size="small" inline>
                <el-form-item label="匹配批次">
                  <el-select v-model="supportQuery.batch" placeholder="选择批次" style="width:180px">
                    <el-option label="2026年7月" value="202607" />
                    <el-option label="2026年6月" value="202606" />
                    <el-option label="2026年5月" value="202605" />
                  </el-select>
                </el-form-item>
                <el-form-item label="政策类型">
                  <el-select v-model="supportQuery.type" placeholder="选择政策" style="width:180px">
                    <el-option label="就业补贴政策" value="subsidy" />
                    <el-option label="社保减免政策" value="social" />
                    <el-option label="创业扶持政策" value="entrepreneur" />
                  </el-select>
                </el-form-item>
                <el-form-item label="匹配度">
                  <el-select v-model="supportQuery.minMatch" placeholder="最低匹配度" style="width:120px">
                    <el-option label="≥ 90%" :value="90" />
                    <el-option label="≥ 80%" :value="80" />
                    <el-option label="≥ 70%" :value="70" />
                    <el-option label="≥ 60%" :value="60" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="querySupportResults">查询</el-button>
                  <el-button @click="resetSupportQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
            <!-- 支撑数据 -->
            <div v-if="supportResults.length > 0" class="ps-result-section">
              <div class="ps-section-title">
                匹配结果支撑数据
                <span class="ps-result-count">共 {{ supportResults.length }} 条</span>
              </div>
              <el-table :data="supportResults" stripe border size="small" style="width:100%">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="idCard" label="身份证号" width="180" />
                <el-table-column prop="policy" label="匹配政策" min-width="160" />
                <el-table-column prop="matchRate" label="匹配度" width="100">
                  <template #default="{ row }"><el-progress :percentage="row.matchRate" :color="row.matchRate >= 80 ? '#10b981' : row.matchRate >= 60 ? '#f59e0b' : '#ef4444'" /></template>
                </el-table-column>
                <el-table-column label="匹配依据" min-width="200">
                  <template #default="{ row }">
                    <el-tag v-for="b in row.basis" :key="b" size="small" style="margin:2px">{{ b }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="支撑材料" width="120">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewSupportMaterial(row)">查看材料</el-button>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewMatchDetail(row)">详情</el-button>
                    <el-button type="primary" link size="small" @click="exportSupport(row)">导出</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="ps-empty-state">
              <el-icon class="ps-empty-icon"><Search /></el-icon>
              <p>设置查询条件后点击「查询」</p>
              <p class="ps-empty-desc">查看匹配结果的详细支撑数据</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialog.visible" :title="detailDialog.title" width="600px" :close-on-click-modal="false">
      <div v-if="detailDialog.data">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ detailDialog.data.name }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ detailDialog.data.idCard }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ detailDialog.data.age }}</el-descriptions-item>
          <el-descriptions-item label="户籍">{{ detailDialog.data.household }}</el-descriptions-item>
          <el-descriptions-item label="就业状态">{{ detailDialog.data.employment }}</el-descriptions-item>
          <el-descriptions-item label="匹配度">{{ detailDialog.data.matchRate }}%</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:12px">
          <div class="ps-section-title">匹配政策详情</div>
          <div v-for="p in detailDialog.data.matchedPolicies || []" :key="p" class="ps-match-policy-item">
            <el-icon><Document /></el-icon>
            <span>{{ p }}</span>
          </div>
        </div>
        <div style="margin-top:12px">
          <div class="ps-section-title">匹配依据</div>
          <div v-if="detailDialog.data.basis" class="ps-basis-list">
            <div v-for="(b, i) in detailDialog.data.basis" :key="i" class="ps-basis-item">
              <span class="ps-basis-dot" />
              <span>{{ b }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="pushToTarget(detailDialog.data)">推送该人员</el-button>
      </template>
    </el-dialog>
    <!-- 推送弹窗 -->
    <el-dialog v-model="pushDialog.visible" title="推送确认" width="500px" :close-on-click-modal="false">
      <el-form :model="pushDialog.form" label-width="100px" size="small">
        <el-form-item label="推送对象">
          <el-input :model-value="pushDialog.targetName" disabled />
        </el-form-item>
        <el-form-item label="推送渠道">
          <el-select v-model="pushDialog.form.channel" style="width:100%">
            <el-option label="短信通知" value="sms" />
            <el-option label="微信服务号" value="wechat" />
            <el-option label="APP推送" value="app" />
          </el-select>
        </el-form-item>
        <el-form-item label="推送模板">
          <el-select v-model="pushDialog.form.template" style="width:100%">
            <el-option label="就业补贴通知模板" value="subsidy" />
            <el-option label="社保减免通知模板" value="social" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pushDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmPush">确认推送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { List, Clock, Search, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const activeTab = ref('engine')
const taskSearch = ref('')
const selectedService = ref('')
const activeTask = ref<any>(null)

const serviceList = [
  { value: 'subsidy', label: '就业补贴资格审核服务' },
  { value: 'loan', label: '创业担保贷款审核服务' },
  { value: 'training', label: '技能培训补贴审核服务' },
  { value: 'pension', label: '养老待遇认证服务' },
]

const tasks = [
  { id: 1, name: '2026年7月就业补贴匹配', status: '进行中', time: '2026-07-15' },
  { id: 2, name: '2026年6月社保减免匹配', status: '已完成', time: '2026-06-20' },
  { id: 3, name: '创业担保贷款资格筛查', status: '已完成', time: '2026-06-10' },
  { id: 4, name: '培训补贴人员匹配', status: '进行中', time: '2026-07-12' },
  { id: 5, name: '养老待遇认证提醒', status: '待开始', time: '2026-07-01' },
]

const filteredTasks = computed(() =>
  tasks.filter(t => t.name.includes(taskSearch.value))
)

const matchConfig = ref({
  service: '',
  dimension: 'comprehensive',
  batch: '202607',
  policyType: 'all',
  threshold: 70,
})

const mockData = [
  { name: '张三', idCard: '320101********0012', age: 35, household: '本市城镇', employment: '灵活就业', matchedPolicies: ['就业困难人员社保补贴', '灵活就业社会保险补贴'], matchRate: 92, basis: ['年龄35岁符合就业困难认定范围', '灵活就业状态符合补贴条件', '本市户籍城镇户口'] },
  { name: '李四', idCard: '320101********0034', age: 28, household: '本市农村', employment: '失业登记', matchedPolicies: ['失业人员职业培训补贴', '农村劳动力转移就业补贴'], matchRate: 85, basis: ['失业登记状态', '农村户籍', '年龄28岁'] },
  { name: '王五', idCard: '320102********0056', age: 45, household: '本省外市', employment: '企业职工', matchedPolicies: ['职业技能提升补贴', '企业职工岗位技能培训'], matchRate: 78, basis: ['企业职工身份', '年龄45岁'] },
  { name: '赵六', idCard: '320103********0078', age: 52, household: '本市城镇', employment: '就业困难人员', matchedPolicies: ['就业困难人员社保补贴', '公益性岗位安置', '灵活就业社会保险补贴'], matchRate: 95, basis: ['就业困难人员认定', '年龄52岁', '长期失业登记'] },
  { name: '钱七', idCard: '320104********0090', age: 22, household: '外省户籍', employment: '高校毕业生', matchedPolicies: ['高校毕业生就业补贴', '小微企业吸纳高校毕业生社保补贴'], matchRate: 88, basis: ['毕业两年内高校毕业生', '外省户籍来本地就业'] },
]

const matchResults = ref<any[]>([])

function runMatch() {
  if (!matchConfig.value.service) {
    ElMessage.warning('请选择服务/任务')
    return
  }
  ElMessage.success('匹配完成，共匹配 ' + mockData.length + ' 人')
  matchResults.value = mockData.map((d, i) => ({ ...d, id: i + 1 }))
}

function resetMatchConfig() {
  matchConfig.value = { service: '', dimension: 'comprehensive', batch: '202607', policyType: 'all', threshold: 70 }
  matchResults.value = []
}

function viewMatchDetail(row: any) {
  detailDialog.value = { visible: true, title: '匹配详情 - ' + row.name, data: row }
}

function pushToTarget(row: any) {
  pushDialog.value = { visible: true, targetName: row.name, form: { channel: 'sms', template: '' }, data: row }
}

function batchPush() {
  ElMessage.success('已创建批量推送任务，共 ' + matchResults.value.length + ' 人')
}

function exportMatchResult() {
  ElMessage.success('匹配结果导出成功')
}

const pushConfig = ref({
  channel: 'sms',
  template: '',
  time: null as any,
  target: 'all',
  limit: 1000,
})

const pushTasks = [
  { id: 1, name: '就业补贴推送任务-7月', channel: '短信', target: '匹配度≥80%人员', total: 1250, succeed: 1180, failed: 70, status: '已完成' },
  { id: 2, name: '社保减免推送任务-6月', channel: '微信服务号', target: '全部匹配人员', total: 3200, succeed: 2980, failed: 220, status: '已完成' },
  { id: 3, name: '创业扶持推送任务', channel: '综合推送', target: '匹配度≥90%人员', total: 580, succeed: 520, failed: 60, status: '进行中' },
  { id: 4, name: '培训补贴推送任务', channel: '短信', target: '指定人员', total: 150, succeed: 0, failed: 0, status: '待开始' },
]

function createPushTask() {
  if (!pushConfig.value.channel || !pushConfig.value.template) {
    ElMessage.warning('请完善推送配置')
    return
  }
  ElMessage.success('推送任务创建成功')
}

function resetPushConfig() {
  pushConfig.value = { channel: 'sms', template: '', time: null, target: 'all', limit: 1000 }
}

function viewPushDetail(row: any) {
  ElMessage.success('查看推送详情：' + row.name)
}

function cancelPush(row: any) {
  ElMessage.success('已取消推送任务：' + row.name)
}

function retryPush(row: any) {
  ElMessage.success('已重新推送：' + row.name)
}

const pushHistory = [
  { id: 1, name: '就业补贴推送', target: '短信-1250人', time: '2026-07-15 10:30', status: '成功' },
  { id: 2, name: '社保减免推送', target: '微信-3200人', time: '2026-06-20 14:00', status: '部分成功' },
  { id: 3, name: '创业扶持推送', target: '综合-580人', time: '2026-06-15 09:00', status: '成功' },
  { id: 4, name: '培训补贴推送', target: '短信-150人', time: '2026-06-10 16:00', status: '失败' },
]

function viewHistory(h: any) {
  ElMessage.success('查看推送历史：' + h.name)
}

const pushDetails = [
  { name: '就业补贴推送-7月', channel: '短信', time: '2026-07-15 10:30:00', total: 1250, reach: 1180, read: 856, convert: 312, rate: 24.96 },
  { name: '社保减免推送-6月', channel: '微信', time: '2026-06-20 14:00:00', total: 3200, reach: 2980, read: 2145, convert: 689, rate: 21.53 },
  { name: '创业扶持推送', channel: '综合', time: '2026-06-15 09:00:00', total: 580, reach: 520, read: 385, convert: 156, rate: 26.90 },
  { name: '培训补贴推送', channel: '短信', time: '2026-06-10 16:00:00', total: 150, reach: 120, read: 78, convert: 23, rate: 15.33 },
]

function viewTrackDetail(row: any) {
  ElMessage.success('查看推送详情：' + row.name)
}

const supportQuery = ref({ batch: '202607', type: 'subsidy', minMatch: 80 })
const supportResults = ref<any[]>([])

function querySupportResults() {
  supportResults.value = mockData.map((d, i) => ({ ...d, id: i + 1, policy: d.matchedPolicies[0] }))
}

function resetSupportQuery() {
  supportQuery.value = { batch: '202607', type: 'subsidy', minMatch: 80 }
  supportResults.value = []
}

function viewSupportMaterial(row: any) {
  ElMessage.success('查看支撑材料：' + row.name)
}

function exportSupport(row: any) {
  ElMessage.success('导出成功：' + row.name)
}

const detailDialog = ref({ visible: false, title: '', data: null as any })
const pushDialog = ref({ visible: false, targetName: '', form: { channel: 'sms', template: '' }, data: null as any })

function confirmPush() {
  ElMessage.success('推送成功')
  pushDialog.value.visible = false
}

const channelChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    if (channelChartRef.value) {
      const chart = echarts.init(channelChartRef.value)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['触达率', '点击率', '转化率'] },
        xAxis: { type: 'category', data: ['短信', '微信', 'APP', '电话外呼'] },
        yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
        series: [
          { name: '触达率', type: 'bar', data: [94.4, 93.1, 89.5, 76.8], itemStyle: { color: '#2563eb' } },
          { name: '点击率', type: 'bar', data: [72.5, 72.0, 65.3, 48.2], itemStyle: { color: '#60a5fa' } },
          { name: '转化率', type: 'bar', data: [24.9, 21.5, 18.6, 12.3], itemStyle: { color: '#93c5fd' } },
        ]
      })
    }
    if (trendChartRef.value) {
      const chart = echarts.init(trendChartRef.value)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['推送数', '触达数', '转化数'] },
        xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'] },
        yAxis: { type: 'value' },
        series: [
          { name: '推送数', type: 'line', smooth: true, data: [1800, 2200, 2600, 3100, 3500, 4200, 4800], itemStyle: { color: '#2563eb' }, areaStyle: { color: 'rgba(37,99,235,0.1)' } },
          { name: '触达数', type: 'line', smooth: true, data: [1650, 2050, 2400, 2880, 3250, 3920, 4500], itemStyle: { color: '#60a5fa' }, areaStyle: { color: 'rgba(96,165,250,0.1)' } },
          { name: '转化数', type: 'line', smooth: true, data: [320, 450, 520, 680, 780, 920, 1100], itemStyle: { color: '#10b981' }, areaStyle: { color: 'rgba(16,185,129,0.1)' } },
        ]
      })
    }
  })
})
</script>

<style scoped>
.policy-service-page {
  display: flex; height: 100%; background: #f8f9fa; border-radius: 12px; overflow: hidden;
}
.ps-sidebar {
  width: 280px; min-width: 280px; background: #fff; border-right: 1px solid #e5e7eb;
  display: flex; flex-direction: column; overflow-y: auto;
}
.ps-sidebar-section {
  padding: 16px;
}
.ps-sidebar-section + .ps-sidebar-section {
  border-top: 1px solid #e5e7eb;
}
.ps-sidebar-title {
  display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px;
  color: #1f2937; margin-bottom: 12px;
}
.ps-sidebar-title .el-icon { color: #2563eb; }
.ps-task-list, .ps-history-list {
  max-height: 320px; overflow-y: auto;
}
.ps-task-item, .ps-history-item {
  padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
  margin-bottom: 4px; border: 1px solid transparent;
}
.ps-task-item:hover, .ps-history-item:hover { background: #e8f0fe; }
.ps-task-item.active { background: #e8f0fe; border-color: #2563eb; }
.ps-task-name { font-size: 13px; font-weight: 500; color: #1f2937; margin-bottom: 4px; }
.ps-task-meta, .ps-history-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9ca3af; }
.ps-history-item { display: flex; flex-direction: column; gap: 4px; }
.ps-history-name { font-size: 13px; font-weight: 500; color: #1f2937; }
.ps-empty { text-align: center; color: #9ca3af; font-size: 13px; padding: 20px 0; }
.ps-main { flex: 1; overflow-y: auto; padding: 0; }
.ps-tabs { height: 100%; }
.ps-tabs :deep(.el-tabs__header) { margin: 0; padding: 0 20px; background: #fff; border-bottom: 1px solid #e5e7eb; }
.ps-tabs :deep(.el-tabs__content) { padding: 20px; }
.ps-tab-content { min-height: 400px; }
.ps-config-section {
  background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e5e7eb;
}
.ps-section-title {
  font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.ps-result-count { font-size: 12px; font-weight: 400; color: #9ca3af; }
.ps-result-section {
  background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;
}
.ps-match-actions {
  margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;
}
.ps-empty-state {
  text-align: center; padding: 80px 20px; color: #9ca3af;
}
.ps-empty-icon { font-size: 48px; color: #d1d5db; margin-bottom: 16px; }
.ps-empty-desc { font-size: 13px; color: #d1d5db; margin-top: 8px; }
.ps-stats-row { margin-bottom: 0; }
.ps-stat-card {
  background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; text-align: center;
}
.ps-stat-label { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.ps-stat-value { font-size: 28px; font-weight: 700; color: #1f2937; }
.ps-stat-trend { font-size: 12px; margin-top: 4px; }
.ps-stat-trend.up { color: #10b981; }
.ps-stat-trend.down { color: #ef4444; }
.ps-chart-card {
  background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;
}
.ps-match-policy-item {
  display: flex; align-items: center; gap: 6px; padding: 6px 0; color: #2563eb; font-size: 13px;
}
.ps-basis-list { display: flex; flex-direction: column; gap: 6px; }
.ps-basis-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4b5563; }
.ps-basis-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563eb; flex-shrink: 0; }
</style>