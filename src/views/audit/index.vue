<template>
  <div class="precheck-page">
    <!-- 面包屑 -->
    <div class="page-breadcrumb">
      <span class="crumb-item" @click="$router.push('/dashboard')">首页</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-item" @click="$router.push('/dashboard')">工作台</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-item active">业务智能审核</span>
    </div>

    <!-- 双模式 Tab 切换 -->
    <div class="mode-tabs">
      <div class="mode-tab" :class="{ active: precheckMode === 'batch' }" @click="switchMode('batch')">
        <span class="tab-icon">☁️</span>
        <span>批量 AI 审核</span>
      </div>
      <div class="mode-tab" :class="{ active: precheckMode === 'single' }" @click="switchMode('single')">
        <span class="tab-icon">👤</span>
        <span>单人 AI 审核</span>
      </div>
    </div>

    <!-- ============= 批量 AI 审核模式 ============= -->
    <div v-if="precheckMode === 'batch'" class="batch-body">
      <!-- 左侧：配置面板 -->
      <div class="config-panel">
        <!-- 区域一：AI 核查配置 -->
        <div class="config-section">
          <div class="section-title"><span class="title-bar"></span>⚙️ AI 核查配置</div>
          <div class="form-item">
            <label>补贴类型</label>
            <el-select v-model="batchSubsidyType" placeholder="请选择补贴类型" style="width:100%">
              <el-option label="就业补贴" value="就业补贴" />
              <el-option label="社保补贴" value="社保补贴" />
              <el-option label="培训补贴" value="培训补贴" />
              <el-option label="创业补贴" value="创业补贴" />
            </el-select>
          </div>
          <div class="form-item">
            <label>补贴名称</label>
            <el-select v-model="batchSubsidyName" placeholder="请选择补贴名称" style="width:100%">
              <el-option v-for="n in filteredSubsidyNames" :key="n" :label="n" :value="n" />
            </el-select>
          </div>
          <div class="form-item">
            <label>核查人员名单</label>
            <div class="upload-area" @click="triggerBatchUpload" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="onDrop" :class="{ 'drag-over': dragOver }">
              <div class="upload-icon">📁</div>
              <div class="upload-text">点击上传 Excel / CSV</div>
              <div class="upload-hint">需包含：姓名、身份证号</div>
            </div>
            <input ref="batchFileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="onBatchFileSelect" />
            <div v-if="batchFileName" class="file-tag">
              <el-icon><Document /></el-icon>
              <span>{{ batchFileName }}</span>
              <el-icon class="file-close" @click="clearBatchFile"><Close /></el-icon>
            </div>
          </div>
          <div class="form-actions">
            <el-button size="small" @click="downloadTemplate">⬇️ 模板下载</el-button>
            <el-button size="small" @click="showHistory=true">📋 核查历史</el-button>
          </div>
          <el-button class="start-btn" :disabled="!canBatchStart" @click="startBatchCheck" :loading="batchChecking">
            🚀 启动 AI 批量核查
          </el-button>
        </div>

        <!-- 区域二：AI 能力运行指标 -->
        <div class="metrics-section">
          <div class="section-title">🤖 AI 能力运行指标</div>
          <div class="metric-item">
            <div class="metric-label"><span>模型准确率</span><span class="metric-val blue">96.8%</span></div>
            <div class="metric-bar"><div class="bar-fill blue" style="width:96.8%"></div></div>
          </div>
          <div class="metric-item">
            <div class="metric-label"><span>规则命中率</span><span class="metric-val green">94.2%</span></div>
            <div class="metric-bar"><div class="bar-fill green" style="width:94.2%"></div></div>
          </div>
          <div class="metric-item">
            <div class="metric-label"><span>人工覆写率</span><span class="metric-val orange">3.5%</span></div>
            <div class="metric-bar"><div class="bar-fill orange" style="width:3.5%"></div></div>
          </div>
        </div>

        <!-- 区域三：历史核查记录 -->
        <div class="history-section">
          <div class="section-title">
            🕐 历史核查记录
            <el-tag size="small" type="info" style="margin-left:auto">{{ batchHistory.length }}条</el-tag>
          </div>
          <div v-for="(h, i) in batchHistory" :key="i" class="history-item" @click="loadHistory(h)">
            <div class="h-top">
              <span class="h-name">{{ h.name }}</span>
              <el-tag :type="h.status === '符合' ? 'success' : h.status === '不符合' ? 'danger' : 'warning'" size="small">{{ h.status }}</el-tag>
            </div>
            <div class="h-bottom">
              <span>{{ h.subsidy }}</span>
              <span class="h-time">{{ h.time }}</span>
            </div>
          </div>
          <div v-if="batchHistory.length === 0" class="history-empty">暂无历史记录</div>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-area">
        <!-- 空状态 -->
        <div v-if="!batchChecking && batchData.length === 0" class="empty-state">
          <div class="empty-icon">🧠</div>
          <div class="empty-title">上传人员名单，启动 AI 资格审核</div>
          <div class="empty-desc">AI 将自动进行身份核验、参保状态查询、历史领取交叉比对及政策条件推理</div>
        </div>

        <!-- 核查中 -->
        <div v-if="batchChecking" class="checking-state">
          <div class="spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-center">🤖</div>
          </div>
          <div class="checking-text">AI 正在进行人员资格推理核查…</div>
          <div class="checking-progress">已核查 {{ batchCheckedCount }} / {{ batchTotalCount }} 人 · 思维链分析中</div>
        </div>

        <!-- 核查结果 -->
        <div v-if="!batchChecking && batchData.length > 0" class="result-content">
          <!-- 统计卡片 -->
          <div class="stat-grid">
            <div class="stat-card"><div class="stat-num">{{ batchData.length }}</div><div class="stat-label">核查总人数</div></div>
            <div class="stat-card pass"><div class="stat-num">{{ batchData.filter(d=>d.result==='符合').length }}</div><div class="stat-label">符合条件</div></div>
            <div class="stat-card fail"><div class="stat-num">{{ batchData.filter(d=>d.result==='不符合').length }}</div><div class="stat-label">不符合条件</div></div>
            <div class="stat-card doubt"><div class="stat-num">{{ batchData.filter(d=>d.result==='存疑').length }}</div><div class="stat-label">存疑需核实</div></div>
            <div class="stat-card risk"><div class="stat-num">{{ batchData.filter(d=>d.risk==='高').length }}</div><div class="stat-label">AI 风险预警</div></div>
          </div>

          <!-- 批量推理思维链 -->
          <div class="chain-card">
            <div class="chain-title">🔗 AI 批量推理思维链</div>
            <div class="chain-steps">
              <div v-for="(step, si) in batchChainSteps" :key="si" class="chain-step" :class="{ done: si <= batchChainDone }">
                <div class="step-icon" :style="{ background: si <= batchChainDone ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#d9d9d9' }">{{ step.icon }}</div>
                <div class="step-name">{{ step.name }}</div>
                <div class="step-desc">{{ step.desc }}</div>
                <div v-if="si < batchChainSteps.length-1" class="step-line" :class="{ done: si < batchChainDone }"></div>
              </div>
            </div>
          </div>

          <!-- 批量操作栏 -->
          <div class="batch-actions">
            <el-checkbox v-model="batchSelectAll" @change="toggleBatchAll" style="margin-right:8px">全选</el-checkbox>
            <span class="selected-count">已选 {{ batchSelectedCount }} 人</span>
            <div class="action-right">
              <el-button size="small" type="success" plain @click="batchMark('符合')">✓ 标记符合</el-button>
              <el-button size="small" type="danger" plain @click="batchMark('不符合')">✕ 标记不符合</el-button>
              <el-button size="small" plain @click="exportReport">⬇️ 导出 AI 核查报告</el-button>
            </div>
          </div>

          <!-- 核查结果表格 -->
          <el-table :data="batchData" stripe style="width:100%" @selection-change="onBatchSelect">
            <el-table-column type="selection" width="40" />
            <el-table-column label="姓名" prop="name" width="80" />
            <el-table-column label="身份证号" width="140">
              <template #default="{ row }"><span class="idcard">{{ maskId(row.idCard) }}</span></template>
            </el-table-column>
            <el-table-column label="核查补贴" prop="subsidyName" width="130" />
            <el-table-column label="AI 结论" width="90">
              <template #default="{ row }">
                <el-tag :type="row.result === '符合' ? 'success' : row.result === '不符合' ? 'danger' : 'warning'" size="small">{{ row.result }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="置信度" width="70">
              <template #default="{ row }"><span class="conf">{{ row.confidence }}%</span></template>
            </el-table-column>
            <el-table-column label="风险等级" width="80">
              <template #default="{ row }">
                <el-tag :type="row.risk === '高' ? 'danger' : row.risk === '中' ? 'warning' : 'success'" size="small">{{ row.risk }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="AI 判定原因" min-width="160">
              <template #default="{ row }">
                <span class="reason-text" :title="row.reason">{{ row.reason }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row, $index }">
                <el-button size="small" type="primary" link @click="showDetail(row, $index)">AI 详情</el-button>
                <el-button size="small" type="primary" link style="color:#722ed1" @click="showSimilar(row)">相似案例</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination background layout="prev,pager,next,total" :total="batchData.length" :page-size="50" style="margin-top:12px;justify-content:center" />
        </div>
      </div>
    </div>

    <!-- ============= 单人 AI 审核模式 ============= -->
    <div v-if="precheckMode === 'single'" class="single-body">
      <!-- 左侧：人员查询面板 -->
      <div class="query-panel">
        <div class="query-section">
          <div class="section-title"><span class="title-bar"></span>🔍 AI 人员查询</div>
          <div class="form-item">
            <label>身份证号</label>
            <el-input v-model="singleIdCard" placeholder="请输入身份证号" maxlength="18" />
          </div>
          <el-button class="query-btn" type="primary" :disabled="singleIdCard.length < 18" @click="queryPerson" :loading="querying">
            🔍 AI 查询
          </el-button>

          <div v-if="currentPerson" class="person-card">
            <div class="card-title">📋 AI 已加载人员档案</div>
            <div class="person-grid">
              <div class="p-item"><label>姓名</label><span>{{ currentPerson.name }}</span></div>
              <div class="p-item"><label>性别</label><span>{{ currentPerson.gender }}</span></div>
              <div class="p-item"><label>户籍</label><span>{{ currentPerson.huji }}</span></div>
              <div class="p-item"><label>年龄</label><span>{{ currentPerson.age }}岁</span></div>
              <div class="p-item"><label>参保状态</label><span>{{ currentPerson.insurance }}</span></div>
              <div class="p-item"><label>参保时长</label><span>{{ currentPerson.insuranceMonths }}月</span></div>
            </div>
          </div>

          <div class="form-item" style="margin-top:12px">
            <label>核查补贴类型</label>
            <el-select v-model="singleSubsidyType" placeholder="请选择" style="width:100%">
              <el-option label="就业补贴" value="就业补贴" />
              <el-option label="社保补贴" value="社保补贴" />
              <el-option label="培训补贴" value="培训补贴" />
              <el-option label="创业补贴" value="创业补贴" />
            </el-select>
          </div>
          <div class="form-item">
            <label>核查补贴名称</label>
            <el-select v-model="singleSubsidyName" placeholder="请选择" style="width:100%">
              <el-option v-for="n in filteredSingleNames" :key="n" :label="n" :value="n" />
            </el-select>
          </div>
          <el-button class="start-btn" :disabled="!canSingleStart" @click="startSingleCheck" :loading="singleChecking">
            🧠 启动 AI 深度核查
          </el-button>
        </div>

        <!-- 历史核查记录 -->
        <div class="history-section" style="flex:1;margin-top:0;border-top:1px solid #eee">
          <div class="section-title">🕐 核查历史</div>
          <div v-for="(h, i) in singleHistory" :key="i" class="history-item" @click="loadSingleHistory(h)">
            <div class="h-top">
              <span class="h-name">{{ h.name }}</span>
              <el-tag :type="h.status === '符合' ? 'success' : h.status === '不符合' ? 'danger' : 'warning'" size="small">{{ h.status }}</el-tag>
            </div>
            <div class="h-bottom">
              <span>{{ h.subsidy }}</span>
              <span class="h-time">{{ h.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：AI 核查结果区 -->
      <div class="result-area">
        <!-- 空状态 -->
        <div v-if="!singleHasResult" class="empty-state">
          <div class="empty-icon">🧠</div>
          <div class="empty-title">录入人员信息，启动 AI 深度资格核查</div>
          <div class="empty-desc">AI 将进行身份核验、政策推理、历史交叉比对及风险预测</div>
        </div>

        <!-- 核查结果 -->
        <div v-if="singleHasResult" class="result-content">
          <!-- ① AI 推理思维链 -->
          <div class="chain-card">
            <div class="chain-title">🔗 AI 推理思维链（Chain-of-Thought）</div>
            <div class="chain-steps">
              <div v-for="(step, si) in singleResult.aiChain" :key="si" class="chain-step" :class="{ done: step.pass, fail: !step.pass }">
                <div class="step-icon" :style="{ background: step.pass ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#ff4d4f,#cf1322)' }">{{ step.icon }}</div>
                <div class="step-name">{{ step.name }}</div>
                <div class="step-desc">{{ step.desc }}</div>
                <div class="step-time">{{ step.time }}</div>
                <div v-if="si < singleResult.aiChain.length-1" class="step-line" :class="{ done: step.pass, fail: !step.pass }"></div>
              </div>
            </div>
          </div>

          <!-- ② 总评结论卡片 -->
          <div class="conclusion-card">
            <div class="conclusion-left">
              <div class="conclusion-icon" :class="singleResult.overall === '符合' ? 'pass' : singleResult.overall === '不符合' ? 'fail' : 'doubt'">
                {{ singleResult.overall === '符合' ? '✅' : singleResult.overall === '不符合' ? '❌' : '⚠️' }}
              </div>
              <div class="conclusion-text">
                <div class="conclusion-title">AI 资格核查结论：<span :style="{ color: singleResult.overall === '符合' ? '#52c41a' : singleResult.overall === '不符合' ? '#ff4d4f' : '#fa8c16' }">{{ singleResult.overall }}</span></div>
                <div class="conclusion-summary">{{ singleResult.summary }}</div>
              </div>
            </div>
            <div class="conclusion-right">
              <div class="confidence-badge">AI 置信度 {{ singleResult.confidence }}%</div>
              <div class="ai-time">推理耗时 {{ singleResult.aiTime }}ms</div>
            </div>
          </div>

          <!-- ③ 政策条件逐项比对 + 政策溯源 -->
          <div class="conditions-card">
            <div class="conditions-title">📋 政策条件逐项比对 <span class="hint">hover 条件名称查看政策原文</span></div>
            <div v-for="(cond, ci) in singleResult.conditions" :key="ci" class="condition-item">
              <div class="cond-icon" :class="cond.pass ? 'pass' : 'fail'">{{ cond.pass ? '✅' : '❌' }}</div>
              <div class="cond-body">
                <div class="cond-row">
                  <span class="cond-name" @mouseenter="cond.showPolicy = true" @mouseleave="cond.showPolicy = false">{{ cond.name }}</span>
                  <el-tag :type="cond.pass ? 'success' : 'danger'" size="small">{{ cond.pass ? '满足' : '不满足' }}</el-tag>
                  <el-tag v-if="cond.aiFeature" size="small" style="background:#f0f5ff;color:#1677ff;border-color:#b3c6ff;margin-left:4px">{{ cond.aiFeature }}</el-tag>
                </div>
                <div class="cond-detail">{{ cond.detail }}</div>
                <div class="cond-compare">
                  <span>要求：{{ cond.requirement }}</span>
                  <span>实际：<span :class="{ 'actual-fail': !cond.pass }">{{ cond.actual }}</span></span>
                </div>
                <!-- 政策溯源悬浮窗 -->
                <transition name="fade">
                  <div v-if="cond.showPolicy" class="policy-tooltip">
                    <div class="tooltip-arrow"></div>
                    <div class="tooltip-title">📖 政策依据</div>
                    <div class="tooltip-name">{{ cond.policyRef }}</div>
                    <div class="tooltip-clause">{{ cond.policyClause }}</div>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <!-- ④ AI 决策特征权重（SHAP） -->
          <div class="shap-card">
            <div class="shap-title">📊 AI 决策特征权重（SHAP 可解释性）</div>
            <div v-for="(f, fi) in singleResult.features" :key="fi" class="shap-item">
              <span class="shap-label">{{ f.name }}</span>
              <div class="shap-bar-bg">
                <div class="shap-bar" :style="{ width: Math.abs(f.value) + '%', background: f.type === 'positive' ? 'linear-gradient(90deg,#52c41a,#389e0d)' : f.type === 'negative' ? 'linear-gradient(90deg,#ff4d4f,#cf1322)' : 'linear-gradient(90deg,#fa8c16,#d46b08)' }"></div>
              </div>
              <span class="shap-value" :style="{ color: f.type === 'positive' ? '#52c41a' : f.type === 'negative' ? '#ff4d4f' : '#fa8c16' }">{{ f.value > 0 ? '+' : '' }}{{ f.value }}%</span>
            </div>
            <div class="shap-tip">💡 绿色表示正向促进因素，红色表示负向阻碍因素，AI 基于上述特征权重综合推理得出核查结论</div>
          </div>

          <!-- ⑤ 历史领取 + 相似案例 -->
          <div class="dual-grid">
            <div class="history-card">
              <div class="sub-title">📜 历史领取记录交叉核验</div>
              <div v-for="(h, hi) in singleResult.history" :key="hi" class="h-record">
                <span>{{ h.name }}</span>
                <span class="h-period">{{ h.period }}</span>
                <el-tag :type="h.status === '正常' ? 'success' : 'danger'" size="small">{{ h.status }}</el-tag>
              </div>
              <div v-if="singleResult.history.length === 0" class="no-data">暂无历史领取记录</div>
            </div>
            <div class="similar-card">
              <div class="sub-title">🔍 AI 相似案例推荐</div>
              <div v-for="(c, ci) in singleResult.similarCases" :key="ci" class="similar-item">
                <div class="s-top">
                  <span class="s-name">{{ c.name }}</span>
                  <el-tag size="small" style="background:#1677ff;color:#fff;border:none">相似度 {{ c.similarity }}%</el-tag>
                </div>
                <div class="s-grid">
                  <span>补贴：{{ c.subsidy }}</span>
                  <span>结论：{{ c.result }}</span>
                  <span>年龄：{{ c.age }}岁</span>
                  <span>参保：{{ c.insurance }}月</span>
                </div>
                <div class="s-reason">{{ c.reason }}</div>
              </div>
            </div>
          </div>

          <!-- ⑥ 风险预警 -->
          <div v-if="singleResult.risks.length > 0" class="risk-card">
            <div class="risk-header">
              <span>🚨 AI 风险预警</span>
              <el-tag type="danger" size="small">{{ singleResult.risks.length }}项</el-tag>
            </div>
            <ul class="risk-list">
              <li v-for="(r, ri) in singleResult.risks" :key="ri">{{ r }}</li>
            </ul>
          </div>

          <!-- ⑦ AI 核查建议 -->
          <div class="suggest-card">
            <div class="suggest-header">
              <span>💡 AI 核查建议</span>
              <el-tag size="small" style="background:#1677ff;color:#fff;border:none">AI生成</el-tag>
            </div>
            <ol class="suggest-list">
              <li v-for="(s, si) in singleResult.suggestions" :key="si">{{ s }}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- ============= 弹窗 ============= -->
    <!-- AI 详情弹窗 -->
    <el-dialog v-model="detailDialog" title="🧠 AI 核查详情" width="680px" :close-on-click-modal="true" destroy-on-close>
      <div class="detail-subtitle">思维链可视化</div>
      <div v-if="detailData" class="detail-body">
        <div class="detail-section">
          <div class="ds-title">AI 推理过程</div>
          <div class="chain-steps vertical">
            <div v-for="(step, si) in detailData.aiChain" :key="si" class="chain-step" :class="{ done: step.pass, fail: !step.pass }">
              <div class="step-icon" :style="{ background: step.pass ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#ff4d4f,#cf1322)' }">{{ step.icon }}</div>
              <div class="step-info">
                <div class="step-name">{{ step.name }}</div>
                <div class="step-desc">{{ step.desc }}</div>
                <div class="step-time">{{ step.time }}</div>
              </div>
              <el-tag :type="step.pass ? 'success' : 'danger'" size="small">{{ step.pass ? '通过' : '异常' }}</el-tag>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <div class="ds-title">政策条件比对明细</div>
          <div v-for="(cond, ci) in detailData.conditions" :key="ci" class="cond-item mini">
            <div class="cond-icon" :class="cond.pass ? 'pass' : 'fail'">{{ cond.pass ? '✅' : '❌' }}</div>
            <div class="cond-body">
              <div class="cond-row"><span class="cond-name">{{ cond.name }}</span><el-tag :type="cond.pass ? 'success' : 'danger'" size="small">{{ cond.pass ? '满足' : '不满足' }}</el-tag></div>
              <div class="cond-compare"><span>要求：{{ cond.requirement }}</span><span>实际：{{ cond.actual }}</span></div>
              <div class="cond-policy">依据：{{ cond.policyRef }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 相似案例弹窗 -->
    <el-dialog v-model="similarDialog" title="🔍 AI 相似案例推荐" width="520px" :close-on-click-modal="true" destroy-on-close>
      <div class="similar-desc">基于人员特征、补贴类型、条件匹配度，AI 推荐以下相似历史案例供参考</div>
      <div v-if="similarData" class="similar-body">
        <div v-for="(c, ci) in similarData" :key="ci" class="similar-case-card">
          <div class="s-top">
            <span class="s-name">{{ c.name }}</span>
            <el-tag size="small" style="background:#1677ff;color:#fff;border:none">相似度 {{ c.similarity }}%</el-tag>
          </div>
          <div class="s-grid">
            <span>补贴：{{ c.subsidy }}</span>
            <span>结论：{{ c.result }}</span>
            <span>年龄：{{ c.age }}岁</span>
            <span>参保：{{ c.insurance }}月</span>
          </div>
          <div class="s-reason">{{ c.reason }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Close } from '@element-plus/icons-vue'

/* ====== 模式切换 ====== */
const precheckMode = ref<'batch' | 'single'>('batch')
const switchMode = (mode: 'batch' | 'single') => {
  precheckMode.value = mode
}

/* ====== 批量模式 ====== */
const batchSubsidyType = ref('')
const batchSubsidyName = ref('')
const batchFileName = ref('')
const batchFileInput = ref<HTMLInputElement>()
const dragOver = ref(false)
const batchChecking = ref(false)
const batchCheckedCount = ref(0)
const batchTotalCount = ref(0)
const batchChainDone = ref(0)
const batchSelectAll = ref(false)
const batchSelectedRows = ref<any[]>([])

const subsidyNames: Record<string, string[]> = {
  '就业补贴': ['灵活就业社保补贴', '公益性岗位补贴', '就业见习补贴'],
  '社保补贴': ['失业保险金', '社保缓缴补贴', '退休人员取暖补贴'],
  '培训补贴': ['职业技能培训补贴', '企业新型学徒制补贴', '创业培训补贴'],
  '创业补贴': ['一次性创业补贴', '创业担保贷款贴息', '创业场地租赁补贴'],
}

const filteredSubsidyNames = computed(() => batchSubsidyType.value ? subsidyNames[batchSubsidyType.value] || [] : [])

const canBatchStart = computed(() => batchSubsidyType.value && batchSubsidyName.value && batchFileName.value)

const batchChainSteps = [
  { icon: '📥', name: '数据加载', desc: '加载人员名单' },
  { icon: '🔍', name: '身份核验', desc: '核验身份信息' },
  { icon: '📊', name: '规则匹配', desc: '匹配政策条件' },
  { icon: '⚠️', name: '风险检测', desc: '检测异常风险' },
  { icon: '🎯', name: '结论生成', desc: '生成核查结论' },
]

interface BatchItem {
  id: number
  selected: boolean
  name: string
  idCard: string
  subsidyName: string
  result: string
  confidence: number
  risk: string
  reason: string
  aiChain: any[]
  conditions: any[]
}

const batchData = ref<BatchItem[]>([])
const batchHistory = ref([
  { name: '6月就业补贴核查', subsidy: '就业补贴', time: '2026-08-15', status: '符合' },
  { name: '7月社保补贴核查', subsidy: '社保补贴', time: '2026-08-12', status: '存疑' },
  { name: '培训补贴批次', subsidy: '培训补贴', time: '2026-08-10', status: '不符合' },
])

const batchPassCount = computed(() => batchData.value.filter(d => d.result === '符合').length)
const batchPassPct = computed(() => batchData.value.length ? Math.round(batchPassCount.value / batchData.value.length * 100) : 0)
const batchSelectedCount = computed(() => batchSelectedRows.value.length)

const triggerBatchUpload = () => batchFileInput.value?.click()
const onDrop = (e: DragEvent) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}
const onBatchFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}
const handleFile = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
    ElMessage.warning('仅支持 Excel (.xlsx/.xls) 和 CSV 格式')
    return
  }
  batchFileName.value = file.name
  ElMessage.success(`已上传：${file.name}`)
}
const clearBatchFile = () => {
  batchFileName.value = ''
  if (batchFileInput.value) batchFileInput.value.value = ''
}
const downloadTemplate = () => {
  ElMessage.success('模板下载已开始（模拟）')
}

const startBatchCheck = () => {
  if (!canBatchStart.value) {
    ElMessage.warning('请选择补贴类型、名称并上传文件')
    return
  }
  batchChecking.value = true
  batchCheckedCount.value = 0
  batchTotalCount.value = 6
  batchChainDone.value = 0

  const mockData: BatchItem[] = [
    { id: 1, selected: false, name: '张三', idCard: '310***********1234', subsidyName: batchSubsidyName.value, result: '符合', confidence: 98, risk: '低', reason: '年龄28岁✓ 本市户籍✓ 参保18月✓', aiChain: [], conditions: [] },
    { id: 2, selected: false, name: '李四', idCard: '310***********5678', subsidyName: batchSubsidyName.value, result: '符合', confidence: 95, risk: '低', reason: '年龄35岁✓ 本市户籍✓ 参保24月✓', aiChain: [], conditions: [] },
    { id: 3, selected: false, name: '王五', idCard: '320***********9012', subsidyName: batchSubsidyName.value, result: '不符合', confidence: 92, risk: '中', reason: '缴费年限不足（实际2年，要求3年）', aiChain: [], conditions: [] },
    { id: 4, selected: false, name: '赵六', idCard: '440***********3456', subsidyName: batchSubsidyName.value, result: '不符合', confidence: 96, risk: '中', reason: '年龄未达法定退休标准（实际55岁，要求60岁）', aiChain: [], conditions: [] },
    { id: 5, selected: false, name: '孙七', idCard: '510***********7890', subsidyName: batchSubsidyName.value, result: '存疑', confidence: 78, risk: '高', reason: '重复申报记录：该身份证号已存在有效申报记录', aiChain: [], conditions: [] },
    { id: 6, selected: false, name: '周八', idCard: '330***********2345', subsidyName: batchSubsidyName.value, result: '存疑', confidence: 72, risk: '高', reason: '企业欠缴社保期间不予受理，需补缴后重新申请', aiChain: [], conditions: [] },
  ].map((d, i) => ({
    ...d,
    aiChain: [
      { icon: '📥', name: '数据加载', desc: '成功读取人员档案', time: '14:32:0' + (i + 1), pass: true },
      { icon: '🔍', name: '身份核验', desc: '身份证OCR识别通过，与公安库比对一致', time: '14:32:0' + (i + 2), pass: true },
      { icon: '📊', name: '规则匹配', desc: d.result === '符合' ? '年龄✓ 户籍✓ 参保✓' : d.result === '不符合' ? '条件不满足' : '部分条件存疑', time: '14:32:0' + (i + 3), pass: d.result === '符合' },
      { icon: '⚠️', name: '风险检测', desc: d.risk === '高' ? '检测到异常风险' : '无异常', time: '14:32:0' + (i + 4), pass: d.risk !== '高' },
      { icon: '🎯', name: '结论生成', desc: `置信度${d.confidence}%，${d.result === '符合' ? '符合申领条件' : d.result === '不符合' ? '不符合条件' : '需人工复核'}`, time: '14:32:0' + (i + 5), pass: d.result === '符合' },
    ],
    conditions: [
      { name: '年龄要求', pass: true, detail: '符合16-60岁范围', requirement: '16-60岁', actual: '28岁', policyRef: '《就业促进法》第15条', policyClause: '年满16周岁且未达到法定退休年龄', showPolicy: false, aiFeature: 'AI自动提取' },
      { name: '户籍要求', pass: true, detail: '本市户籍', requirement: '本市户籍', actual: '本市XX区', policyRef: '《就业补助资金管理办法》', policyClause: '具有本市户籍或在本地常住', showPolicy: false, aiFeature: 'AI自动提取' },
      { name: d.result === '不符合' ? '缴费年限要求' : '参保要求', pass: d.result === '符合', detail: d.result === '符合' ? '参保18月' : '实际2年，要求3年', requirement: '≥3年', actual: d.result === '符合' ? '18月' : '2年', policyRef: '《社会保险法》第16条', policyClause: '累计缴费满三年', showPolicy: false, aiFeature: 'OCR识别' },
    ],
  }))

  batchData.value = []
  let idx = 0
  const interval = setInterval(() => {
    if (idx < mockData.length) {
      batchData.value.push(mockData[idx])
      batchCheckedCount.value = idx + 1
      idx++
    }
    if (batchChainDone.value < 5) {
      batchChainDone.value++
    }
    if (idx >= mockData.length && batchChainDone.value >= 5) {
      clearInterval(interval)
      batchChecking.value = false
      ElMessage.success('AI 批量核查完成')
    }
  }, 600)
}

const toggleBatchAll = (val: any) => {
  batchData.value.forEach(d => d.selected = val)
}
const onBatchSelect = (rows: any[]) => {
  batchSelectedRows.value = rows
}
const batchMark = (result: string) => {
  if (batchSelectedRows.value.length === 0) {
    ElMessage.warning('请先选择人员')
    return
  }
  batchSelectedRows.value.forEach(r => r.result = result)
  ElMessage.success(`已标记 ${batchSelectedRows.value.length} 人为「${result}」`)
}
const exportReport = () => {
  ElMessage.success('AI 核查报告导出中（模拟）')
}
const maskId = (id: string) => id.replace(/^(.{3})(.*)(.{4})$/, '$1***********$3')

const detailDialog = ref(false)
const detailData = ref<any>(null)
const showDetail = (row: any, idx: number) => {
  detailData.value = batchData.value.find(d => d.id === row.id) || batchData.value[idx]
  detailDialog.value = true
}

const similarDialog = ref(false)
const similarData = ref<any>(null)
const showSimilar = (row: any) => {
  similarData.value = [
    { name: '刘某某', similarity: 92, subsidy: batchSubsidyName.value, result: '符合', age: 29, insurance: 20, reason: '条件高度相似，历史审核通过' },
    { name: '陈某某', similarity: 85, subsidy: batchSubsidyName.value, result: '符合', age: 31, insurance: 22, reason: '相似度高，审核通过' },
    { name: '杨某某', similarity: 78, subsidy: batchSubsidyName.value, result: '存疑', age: 27, insurance: 6, reason: '部分相似，参保时长不足' },
  ]
  similarDialog.value = true
}

const loadHistory = (h: any) => {
  ElMessage.info(`加载历史记录：${h.name}`)
}
const showHistory = ref(false)

/* ====== 单人模式 ====== */
const singleIdCard = ref('')
const singleSubsidyType = ref('')
const singleSubsidyName = ref('')
const querying = ref(false)
const singleChecking = ref(false)
const singleHasResult = ref(false)
const currentPerson = ref<any>(null)

const filteredSingleNames = computed(() => singleSubsidyType.value ? subsidyNames[singleSubsidyType.value] || [] : [])
const canSingleStart = computed(() => currentPerson.value && singleSubsidyType.value && singleSubsidyName.value)

const singleHistory = ref([
  { name: '张三', subsidy: '就业补贴', time: '2026-08-15', status: '符合' },
  { name: '李四', subsidy: '社保补贴', time: '2026-08-14', status: '不符合' },
  { name: '王五', subsidy: '培训补贴', time: '2026-08-12', status: '存疑' },
])

const singleResult = ref({
  overall: '符合',
  confidence: 96,
  aiTime: 1240,
  summary: '该人员符合灵活就业社保补贴申领条件，身份核验通过，参保状态正常，无重复申领记录。',
  aiChain: [
    { icon: '📥', name: '数据加载', desc: '成功读取人员档案：张三，身份证310***********1234', time: '14:32:01', pass: true },
    { icon: '🔍', name: '身份核验', desc: '身份证OCR识别通过，与公安库比对一致', time: '14:32:02', pass: true },
    { icon: '📊', name: '规则匹配', desc: '年龄28岁✓ 本市户籍✓ 参保18月✓', time: '14:32:03', pass: true },
    { icon: '⚠️', name: '风险检测', desc: '无重复申领记录，无异常行为', time: '14:32:04', pass: true },
    { icon: '🎯', name: '结论生成', desc: '置信度96%，符合申领条件', time: '14:32:05', pass: true },
  ],
  conditions: [
    { name: '年龄要求', pass: true, detail: '申请人年龄 28 岁，符合 16-60 岁范围', requirement: '16-60岁', actual: '28岁', policyRef: '《就业促进法》第15条', policyClause: '年满16周岁且未达到法定退休年龄', showPolicy: false, aiFeature: 'AI自动提取' },
    { name: '户籍要求', pass: true, detail: '申请人具有本市户籍', requirement: '本市户籍', actual: '本市XX区', policyRef: '《就业补助资金管理办法》', policyClause: '具有本市户籍或在本地常住', showPolicy: false, aiFeature: 'AI自动提取' },
    { name: '参保要求', pass: true, detail: '灵活就业参保18个月', requirement: '≥12个月', actual: '18个月', policyRef: '《社会保险法》第16条', policyClause: '累计缴费满十二个月', showPolicy: false, aiFeature: 'OCR识别' },
    { name: '收入要求', pass: false, detail: '上年度收入略高于低收入标准', requirement: '低于当地最低工资标准', actual: '高于标准', policyRef: '《就业困难人员认定办法》', policyClause: '家庭人均收入低于当地最低工资标准', showPolicy: false, aiFeature: 'AI自动提取' },
    { name: '重复申领检测', pass: true, detail: '无重复申领记录', requirement: '无重复申领', actual: '无', policyRef: '《就业补助资金管理办法》', policyClause: '同一补贴不得重复申领', showPolicy: false, aiFeature: 'AI自动提取' },
  ],
  features: [
    { name: '年龄因素', value: 25, type: 'positive' },
    { name: '参保时长', value: 18, type: 'positive' },
    { name: '户籍匹配', value: 12, type: 'positive' },
    { name: '历史领取', value: -15, type: 'negative' },
    { name: '收入水平', value: -8, type: 'negative' },
    { name: '政策匹配度', value: 20, type: 'positive' },
  ],
  history: [
    { name: '灵活就业社保补贴', period: '2024-01至2024-06', status: '正常' },
    { name: '公益性岗位补贴', period: '2023-07至2023-12', status: '结束' },
  ],
  similarCases: [
    { name: '刘某某', similarity: 92, subsidy: '灵活就业社保补贴', result: '符合', age: 29, insurance: 20, reason: '条件高度相似，历史审核通过' },
    { name: '陈某某', similarity: 85, subsidy: '灵活就业社保补贴', result: '符合', age: 31, insurance: 22, reason: '相似度高，审核通过' },
    { name: '杨某某', similarity: 78, subsidy: '灵活就业社保补贴', result: '存疑', age: 27, insurance: 6, reason: '部分相似，参保时长不足' },
  ],
  risks: ['该人员上年度收入略高于低收入标准，可能影响就业困难人员认定资格', '民政系统婚姻登记记录与申报信息略有出入'],
  suggestions: ['建议补充收入证明，核实家庭经济状况', '建议与民政部门核实婚姻登记信息，确保一致性', '建议审核人员关注参保连续性，确认无中断缴费'],
})

const queryPerson = () => {
  if (singleIdCard.value.length < 18) {
    ElMessage.warning('请输入完整的18位身份证号')
    return
  }
  querying.value = true
  setTimeout(() => {
    currentPerson.value = {
      name: '张三',
      gender: '男',
      huji: '本市XX区',
      age: 28,
      insurance: '灵活就业参保',
      insuranceMonths: 18,
    }
    querying.value = false
    ElMessage.success('人员档案加载成功')
  }, 800)
}

const startSingleCheck = () => {
  if (!canSingleStart.value) {
    ElMessage.warning('请先查询人员信息并选择补贴类型')
    return
  }
  singleChecking.value = true
  singleHasResult.value = false
  setTimeout(() => {
    singleChecking.value = false
    singleHasResult.value = true
    ElMessage.success('AI 深度核查完成')
  }, 2000)
}

const loadSingleHistory = (h: any) => {
  singleHasResult.value = true
  ElMessage.info(`加载历史记录：${h.name}`)
}
</script>

<style scoped>
.precheck-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}
.page-breadcrumb {
  padding: 10px 24px;
  background: #fff;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}
.crumb-item { color: #666; cursor: pointer; }
.crumb-item:hover { color: #1677ff; }
.crumb-item.active { color: #1f1f1f; font-weight: 600; }
.crumb-sep { margin: 0 8px; color: #ccc; }

/* 模式切换 Tab */
.mode-tabs {
  display: flex;
  background: #fff;
  padding: 0 24px;
  border-bottom: 1px solid #e8e8e8;
  gap: 0;
}
.mode-tab {
  padding: 12px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.mode-tab:hover { color: #1677ff; }
.mode-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-bottom: 2px solid #1d4ed8;
}
.tab-icon { font-size: 16px; }

/* 批量模式 */
.batch-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  overflow: hidden;
}
.config-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.config-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  padding: 16px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.title-bar {
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
  margin-right: 6px;
}
.form-item {
  margin-bottom: 12px;
}
.form-item label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-area:hover, .upload-area.drag-over {
  border-color: #1677ff;
  background: #f0f5ff;
}
.upload-icon { font-size: 28px; margin-bottom: 4px; }
.upload-text { font-size: 13px; color: #333; }
.upload-hint { font-size: 11px; color: #aaa; margin-top: 2px; }
.file-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  margin-top: 8px;
  font-size: 12px;
}
.file-close { cursor: pointer; color: #999; margin-left: auto; }
.file-close:hover { color: #ff4d4f; }
.form-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.start-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* AI 能力指标 */
.metrics-section {
  background: linear-gradient(135deg, #f0f5ff, #e6f0ff);
  border: 1px solid #b3c6ff;
  border-radius: 10px;
  padding: 16px;
}
.metric-item {
  margin-bottom: 10px;
}
.metric-item:last-child { margin-bottom: 0; }
.metric-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}
.metric-val { font-weight: 600; }
.metric-val.blue { color: #1677ff; }
.metric-val.green { color: #52c41a; }
.metric-val.orange { color: #fa8c16; }
.metric-bar {
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s;
}
.bar-fill.blue { background: linear-gradient(90deg, #1677ff, #4096ff); }
.bar-fill.green { background: linear-gradient(90deg, #52c41a, #73d13d); }
.bar-fill.orange { background: linear-gradient(90deg, #fa8c16, #ffa940); }

/* 历史记录 */
.history-section {
  background: #fafafa;
  border-radius: 10px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}
.history-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #e8e8e8;
}
.history-item:hover {
  border-color: #1677ff;
  background: #f0f5ff;
}
.h-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.h-name { font-size: 13px; font-weight: 600; color: #333; }
.h-bottom { display: flex; justify-content: space-between; font-size: 11px; color: #999; }
.h-time { color: #bbb; }
.history-empty { text-align: center; color: #ccc; padding: 20px 0; font-size: 13px; }

/* 右侧结果区 */
.result-area {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  padding: 20px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
.empty-icon { font-size: 56px; opacity: 0.5; margin-bottom: 16px; }
.empty-title { font-size: 16px; color: #666; font-weight: 600; margin-bottom: 8px; }
.empty-desc { font-size: 13px; color: #aaa; max-width: 400px; text-align: center; }

/* 核查中 */
.checking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
.spinner { position: relative; width: 64px; height: 64px; margin-bottom: 16px; }
.spinner-ring {
  width: 64px; height: 64px;
  border: 4px solid #e8e8e8;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}
.checking-text { font-size: 15px; color: #333; font-weight: 600; margin-bottom: 8px; }
.checking-progress { font-size: 13px; color: #999; }

/* 统计卡片 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}
.stat-card .stat-num { font-size: 24px; font-weight: 700; color: #1f1f1f; }
.stat-card .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
.stat-card.pass .stat-num { color: #52c41a; }
.stat-card.fail .stat-num { color: #ff4d4f; }
.stat-card.doubt .stat-num { color: #fa8c16; }
.stat-card.risk .stat-num { color: #722ed1; }

/* 思维链 */
.chain-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.chain-title { font-size: 14px; font-weight: 600; margin-bottom: 16px; }
.chain-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
}
.chain-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}
.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 6px;
}
.step-name { font-size: 12px; font-weight: 600; }
.step-desc { font-size: 11px; color: #999; text-align: center; }
.step-time { font-size: 10px; color: #bbb; }
.step-line {
  position: absolute;
  top: 18px;
  left: calc(50% + 20px);
  width: calc(100% - 40px);
  height: 2px;
  background: #d9d9d9;
}
.step-line.done { background: #1677ff; }
.step-line.fail { background: #ff4d4f; }
.chain-steps.vertical {
  flex-direction: column;
  gap: 12px;
}
.chain-steps.vertical .chain-step {
  flex-direction: row;
  gap: 12px;
  align-items: center;
}
.chain-steps.vertical .step-line {
  top: auto;
  left: 18px;
  bottom: -12px;
  width: 2px;
  height: 12px;
}

/* 批量操作栏 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}
.selected-count { font-size: 12px; color: #999; }
.action-right { margin-left: auto; display: flex; gap: 8px; }

/* 表格 */
.idcard { font-family: monospace; font-size: 12px; color: #666; }
.conf { font-size: 12px; color: #1677ff; font-weight: 600; }
.reason-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  display: inline-block;
  font-size: 12px;
  color: #666;
}

/* ====== 单人模式 ====== */
.single-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  overflow: hidden;
}
.query-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.query-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  padding: 16px;
}
.query-btn {
  width: 100%;
  margin-bottom: 12px;
}

/* 人员档案卡片 */
.person-card {
  background: #f0f5ff;
  border: 1px solid #b3c6ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.card-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.person-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.p-item { display: flex; flex-direction: column; }
.p-item label { font-size: 11px; color: #999; }
.p-item span { font-size: 13px; color: #333; font-weight: 600; }

/* 结论卡片 */
.conclusion-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.conclusion-left { display: flex; align-items: center; gap: 12px; }
.conclusion-icon { font-size: 36px; }
.conclusion-title { font-size: 20px; font-weight: 700; color: #1f1f1f; }
.conclusion-summary { font-size: 13px; color: #666; margin-top: 4px; max-width: 500px; }
.conclusion-right { text-align: right; }
.confidence-badge {
  background: linear-gradient(135deg, #1677ff, #0958d9);
  color: #fff;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.ai-time { font-size: 11px; color: #999; }

/* 条件比对 */
.conditions-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.conditions-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.hint { font-size: 11px; font-weight: 400; color: #999; margin-left: 8px; }
.condition-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;
}
.cond-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.cond-icon.pass { background: #f6ffed; border: 1px solid #b7eb8f; }
.cond-icon.fail { background: #fff2f0; border: 1px solid #ffccc7; }
.cond-body { flex: 1; min-width: 0; }
.cond-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.cond-name { font-size: 13px; font-weight: 600; color: #333; cursor: pointer; }
.cond-name:hover { color: #1677ff; }
.cond-detail { font-size: 12px; color: #666; margin-bottom: 4px; }
.cond-compare { display: flex; gap: 16px; font-size: 12px; color: #999; }
.cond-compare span { }
.actual-fail { color: #cf1322; font-weight: 600; }

/* 政策溯源悬浮窗 */
.policy-tooltip {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 8px;
  z-index: 100;
  background: #1f1f1f;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  min-width: 280px;
}
.tooltip-arrow {
  position: absolute;
  top: -6px;
  left: 20px;
  width: 12px;
  height: 12px;
  background: #1f1f1f;
  transform: rotate(45deg);
}
.tooltip-title { color: #ffd591; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.tooltip-name { color: #fff; font-size: 12px; margin-bottom: 4px; }
.tooltip-clause { color: #aaa; font-size: 11px; border-top: 1px solid #444; padding-top: 6px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* SHAP */
.shap-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.shap-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.shap-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.shap-label { width: 100px; text-align: right; font-size: 12px; color: #666; flex-shrink: 0; }
.shap-bar-bg { flex: 1; height: 20px; background: #f5f5f5; border-radius: 10px; overflow: hidden; }
.shap-bar { height: 100%; border-radius: 10px; transition: width 0.8s; }
.shap-value { width: 50px; text-align: right; font-size: 12px; font-weight: 600; }
.shap-tip { font-size: 11px; color: #999; background: #fafafa; border-radius: 6px; padding: 8px; margin-top: 8px; }

/* 双列网格 */
.dual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.history-card, .similar-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px;
}
.sub-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
.h-record { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 12px; border-bottom: 1px solid #f5f5f5; }
.h-record:last-child { border-bottom: none; }
.h-period { color: #999; }
.no-data { text-align: center; color: #ccc; padding: 20px; font-size: 13px; }
.similar-item {
  background: #f0f5ff;
  border: 1px solid #b3c6ff;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}
.similar-item:last-child { margin-bottom: 0; }
.s-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.s-name { font-size: 13px; font-weight: 600; color: #1677ff; }
.s-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; color: #666; margin-bottom: 6px; }
.s-reason { background: #fff; border-radius: 4px; padding: 6px; font-size: 11px; color: #666; }

/* 风险预警 */
.risk-card {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}
.risk-header { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.risk-list { padding-left: 20px; line-height: 2; font-size: 13px; color: #666; }
</style>