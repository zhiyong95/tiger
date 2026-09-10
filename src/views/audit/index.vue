<template>
  <div class="audit-page">
    <div class="audit-body">
      <!-- 左侧业务服务栏 -->
      <div class="service-sidebar">
        <div class="sidebar-title">业务服务</div>
        <div class="sidebar-search">
          <svg class="si" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="serviceSearch" placeholder="请输入服务名称进行查询" />
        </div>
        <div class="service-count">共 {{ filteredServices.length }} 个业务服务</div>
        <div class="service-list">
          <div v-for="svc in filteredServices" :key="svc.id" class="svc-item" :class="{ active: activeService === svc.id }" @click="selectService(svc.id)">
            <span class="svc-ic" :class="svc.color"><component :is="svc.icon" /></span>
            <span class="svc-name">{{ svc.name }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="audit-content">
        <!-- 顶部导航 -->
        <div class="top-nav">
          <div v-for="t in topTabs" :key="t.key" class="nav-tab" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.label }}</div>
        </div>

        <div class="content-head">
          <div class="ch-left">
            <span class="ch-icon" :class="currentService.color"><component :is="currentService.icon" /></span>
            <span class="ch-title">{{ currentService.name }}</span>
          </div>
          <div class="ch-desc">{{ currentService.desc }}</div>
        </div>

        <!-- ===== 模块A 数据源 ===== -->
        <div class="tab-body" v-show="activeTab === 'datasource'">
          <div class="ds-wrap">
            <div class="ds-left">
              <div class="ds-search">
                <input v-model="tableSearch" placeholder="输入数据表名查询" />
                <button class="btn blue" @click="tableSearch = ''">查询</button>
              </div>
              <div class="table-list">
                <div v-for="t in shownTables" :key="t.id" class="tbl-item" :class="{ active: activeTable === t.id }" @click="viewTable(t.id)">
                  <svg class="tt" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.6"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></svg>
                  <div class="tl-mid">
                    <div class="tl-name">{{ t.name }}</div>
                    <div class="tl-code">{{ t.code }}</div>
                  </div>
                  <span class="tl-rows">{{ t.rows }}行</span>
                </div>
                <div v-if="!tableFull && serviceTables.length < allTables.length" class="show-all" @click="tableFull = true">显示全部</div>
              </div>
            </div>
            <div class="ds-right">
              <template v-if="activeTableObj">
                <div class="ds-head">
                  <div class="ds-head-l">
                    <span class="ds-name">{{ activeTableObj.name }}</span>
                    <span class="tag" :class="activeTableObj.category">{{ activeTableObj.category }}</span>
                    <span class="ds-code">{{ activeTableObj.code }}</span>
                  </div>
                  <div class="ds-head-r">{{ currentService.name }} · {{ activeTableObj.columns.length }}个字段 · {{ activeTableObj.rows }}行数据</div>
                </div>
                <div class="sub-tabs">
                  <span class="st" :class="{ on: activeSubView === 'data' }" @click="activeSubView = 'data'">数据列表</span>
                  <span class="st" :class="{ on: activeSubView === 'cols' }" @click="activeSubView = 'cols'">列</span>
                </div>
                <div v-if="activeSubView === 'cols'" class="sub-body">
                  <div class="filter-row">
                    <input v-model="colSearch" placeholder="字段名/说明筛选" />
                    <button class="btn" @click="colSearch = ''">查询</button>
                    <button class="btn" @click="colSearch = ''">重置</button>
                  </div>
                  <table class="g-tbl">
                    <thead><tr><th>字段名</th><th>类型</th><th>说明</th></tr></thead>
                    <tbody>
                      <tr v-for="c in filteredCols" :key="c.name">
                        <td><span class="mono">{{ c.name }}</span> <span v-if="c.key" class="tag key">主键</span></td>
                        <td><span class="tag type">{{ c.type }}</span></td>
                        <td>{{ c.label }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="sub-body">
                  <div class="filter-row">
                    <input v-model="dataSearch" placeholder="输入身份证号/姓名查询" />
                    <button class="btn" @click="dataSearch = ''">查询</button>
                    <button class="btn" @click="dataSearch = ''">重置</button>
                  </div>
                  <div class="tbl-scroll">
                    <table class="g-tbl">
                      <thead><tr><th v-for="c in displayCols" :key="c">{{ c }}</th></tr></thead>
                      <tbody>
                        <tr v-for="(row, ri) in filteredData" :key="ri">
                          <td v-for="c in displayCols" :key="c">{{ row[c] }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </template>
              <div v-else class="ds-empty">请选择数据表</div>
            </div>
          </div>
        </div>

        <!-- ===== 模块B 业务规则 ===== -->
        <div class="tab-body" v-show="activeTab === 'rules'">
          <template v-if="configRule">
            <div class="cfg-back-row"><button class="btn plain" @click="exitConfig">← 返回规则列表</button></div>
            <div class="cfg-grid">
              <div class="cfg-card">
                <div class="card-title">配置规则</div>
                <textarea v-model="configRule.desc" class="ta"></textarea>
                <div class="radio-row">
                  <label class="rl"><input type="radio" value="正面规则" v-model="configRule.type" /> 正面规则</label>
                  <label class="rl"><input type="radio" value="负面规则" v-model="configRule.type" /> 负面规则</label>
                </div>
              </div>
              <div class="cfg-card">
                <div class="card-title">子规则配置 <button class="btn blue small" @click="addSubRule">+ 添加子规则</button></div>
                <div v-for="(sr, i) in configRule.subRules" :key="i" class="sub-rule">
                  <div class="sr-head"><span>子规则{{ i + 1 }}</span><button class="link danger" @click="configRule.subRules.splice(i, 1)">删除</button></div>
                  <input v-model="sr.type" placeholder="子规则类型" class="inp" />
                  <input v-model="sr.desc" placeholder="子规则描述" class="inp" />
                  <div class="sr-row">
                    <select v-model="sr.table" class="inp"><option v-for="t in serviceTables" :key="t.code" :value="t.code">{{ t.name }}</option></select>
                    <input v-model="sr.value" placeholder="子规则值" class="inp" />
                  </div>
                  <div class="sr-row">
                    <label class="rl">权重 <input type="number" v-model.number="sr.weight" class="inp inp-num" /></label>
                    <label class="rl">优先级 <input type="number" v-model.number="sr.priority" class="inp inp-num" /></label>
                  </div>
                </div>
              </div>
              <div class="cfg-card">
                <div class="card-title">生成 SQL</div>
                <pre class="sql-box">{{ generatedSql || '-- 点击"生成SQL"按钮生成' }}</pre>
                <button class="btn blue" @click="generateSql">生成SQL</button>
              </div>
              <div class="cfg-card">
                <div class="card-title">执行验证</div>
                <div class="verify-tip">（一）确认上方生成SQL语句，可编辑 （二）验证数据源：选择数据表/输入身份证进行验证 （三）结果将在下方呈现</div>
                <div class="radio-row">
                  <label class="rl"><input type="radio" value="table" v-model="verifyMode" /> 选择数据表</label>
                  <label class="rl"><input type="radio" value="card" v-model="verifyMode" /> 输入身份证</label>
                </div>
                <div v-if="verifyMode === 'table'"><select v-model="verifyTable" class="inp"><option v-for="t in serviceTables" :key="t.code" :value="t.code">{{ t.name }}</option></select></div>
                <div v-else><input v-model="verifyIdcard" placeholder="输入身份证号" class="inp" /></div>
                <div class="sr-row">
                  <label class="rl">执行数据量 <input type="number" v-model.number="verifyLimit" class="inp inp-num" /></label>
                  <button class="btn blue" @click="runVerify">执行SQL验证</button>
                </div>
              </div>
              <div class="cfg-card">
                <div class="card-title">验证结果 <button class="btn plain small" @click="runVerify">重新执行</button></div>
                <div v-if="verifyResult">
                  <div class="res-line">执行数据量：<b>{{ verifyResult.total }}</b> &nbsp; 命中记录数：<b class="text-blue">{{ verifyResult.hit }}</b></div>
                  <div class="res-line">命中身份证：<span v-for="(m, i) in verifyResult.ids" :key="i" class="chip">{{ m }}</span></div>
                  <div class="res-ok">执行完成</div>
                </div>
                <div v-else class="res-empty">暂无执行结果，请先执行验证</div>
              </div>
              <div class="cfg-card">
                <div class="card-title">确认规则</div>
                <div class="rl">子规则间关系（且）</div>
                <div class="chips"><span v-for="(sr, i) in configRule.subRules" :key="i" class="chip">{{ sr.desc || '子规则' + (i + 1) }}</span></div>
                <div class="rl" style="margin-top:10px">子规则间关系（或）</div>
                <el-select v-model="orRules" multiple size="small" style="width:100%;margin:6px 0" placeholder="请选择子规则">
                  <el-option v-for="(sr, i) in configRule.subRules" :key="i" :label="sr.desc || '子规则' + (i + 1)" :value="i" />
                </el-select>
                <div class="btn-row"><button class="btn blue" @click="confirmRuleConfig">保存</button><button class="btn" @click="exitConfig">取消</button></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="toolbar-row">
              <input v-model="ruleQuery" placeholder="规则描述输入" class="inp wider" />
              <select v-model="enableFilter" class="inp"><option value="">请选择启用状态</option><option>启用</option><option>停用</option></select>
              <select v-model="cfgFilter" class="inp"><option value="">请选择配置状态</option><option>已配置</option><option>未配置</option></select>
              <input type="date" v-model="createStart" class="inp" /> — <input type="date" v-model="createEnd" class="inp" />
              <button class="btn blue" @click="resetRuleFilter">查询</button>
              <button class="btn" @click="resetRuleFilter">重置</button>
              <button class="btn blue" @click="openAddRule">新增</button>
              <button class="btn plain" @click="openPublicConfig">公共配置</button>
            </div>
            <div class="count-line">共 {{ filteredRules.length }} 条规则（业务服务：{{ currentService.name }}）</div>
            <table class="g-tbl">
              <thead><tr><th>规则名称</th><th>规则类型</th><th>配置状态</th><th>创建人</th><th>创建时间</th><th>启用状态</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="r in filteredRules" :key="r.id">
                  <td>{{ r.desc }}</td>
                  <td><span class="tag" :class="r.type === '正面规则' ? 'pos' : 'neg'">{{ r.type }}</span></td>
                  <td><span class="tag" :class="r.configStatus === '已配置' ? 'pos' : 'gray'">{{ r.configStatus }}</span></td>
                  <td>{{ r.creator }}</td>
                  <td>{{ r.createTime }}</td>
                  <td><span class="stt" :class="r.enable ? 'on' : 'off'">{{ r.enable ? '已启用' : '已停用' }}</span></td>
                  <td>
                    <button class="link blue" @click="enterConfig(r)">配置</button>
                    <button class="link lb" @click="openEditRule(r)">编辑</button>
                    <button class="link" :class="r.enable ? 'green' : 'gray'" @click="toggleRule(r)">{{ r.enable ? '停用' : '启用' }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="!filteredRules.length" class="empty-state">暂无规则数据</div>
          </template>
        </div>

        <!-- ===== 模块C 任务执行 ===== -->
        <div class="tab-body" v-show="activeTab === 'tasks'">
          <div class="task-sub-tabs">
            <span class="st" :class="{ on: taskView === 'new' }" @click="taskView = 'new'">新建任务</span>
            <span class="st" :class="{ on: taskView === 'list' }" @click="taskView = 'list'">任务列表</span>
          </div>
          <div v-if="taskView === 'new'" class="wizard-wrap">
            <div class="steps">
              <div v-for="(s, i) in steps" :key="i" class="step" :class="{ cur: wizardStep === i + 1, done: wizardStep > i + 1 }">
                <div class="step-dot">{{ wizardStep > i + 1 ? '✓' : i + 1 }}</div>
                <div class="step-lb">{{ s }}</div>
              </div>
            </div>
            <div v-if="wizardStep === 1" class="wz-body">
              <div class="radio-row">
                <label class="rl"><input type="radio" value="import" v-model="taskType" /> 通过导入方式</label>
                <label class="rl"><input type="radio" value="filter" v-model="taskType" /> 通过筛选方式</label>
              </div>
              <div v-if="taskType === 'import'" class="upload-zone">
                <div class="uz-inner" @click="pickTaskFile">
                  <svg class="si big" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.4"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                  <div v-if="!taskFile" class="uz-tx">拖放 Excel 文件到这里，或者点击选择文件导入<br /><span class="weak">支持 .xlsx 格式文件</span></div>
                  <div v-else class="uz-file">{{ taskFile }}</div>
                </div>
                <input ref="taskFileInput" type="file" accept=".xlsx" style="display:none" @change="onTaskFile" />
              </div>
              <div v-else class="filter-mode">
                <input v-model="filterTaskName" placeholder="任务名称" class="inp wider" />
                <div class="label-line">任务规则（取当前业务规则前 4 条）</div>
                <table class="g-tbl"><thead><tr><th>序号</th><th>规则描述</th></tr></thead>
                  <tbody><tr v-for="(r, i) in filteredRules.slice(0, 4)" :key="r.id"><td>{{ i + 1 }}</td><td>{{ r.desc }}</td></tr></tbody>
                </table>
              </div>
              <button v-if="taskType === 'import'" class="btn plain" @click="downloadTemplate">下载名单模板</button>
              <div class="btn-row"><button class="btn blue" @click="nextStep">下一步</button></div>
            </div>
            <div v-else-if="wizardStep === 2" class="wz-body">
              <div class="form-line"><label>任务名称</label><input v-model="newTaskName" class="inp wider" /></div>
              <div class="form-line"><label>任务说明</label><textarea v-model="newTaskDesc" class="ta" rows="2"></textarea></div>
              <div class="form-line"><label>关联数据表</label><select v-model="newTaskTable" class="inp wider"><option v-for="t in serviceTables" :key="t.code" :value="t.code">{{ t.name }}</option></select></div>
              <div class="form-line"><label>数据条数</label><span class="ro-tx">{{ taskType === 'import' ? 158 : filteredRules.slice(0, 4).length * 1000 }} 条<br /><span class="weak tiny">导入=158条；筛选=规则数×1000条</span></span></div>
              <div class="btn-row"><button class="btn" @click="wizardStep = 1">返回</button><button class="btn blue" @click="wizardStep = 3">下一步</button></div>
            </div>
            <div v-else class="wz-body">
              <div class="radio-row">
                <label class="rl"><input type="radio" value="now" v-model="executeMode" /> 立即执行</label>
                <label class="rl"><input type="radio" value="timer" v-model="executeMode" /> 定时执行</label>
              </div>
              <div v-if="executeMode === 'timer'" class="timer-box">
                <div class="form-line"><label>执行时间</label><input type="datetime-local" v-model="scheduleTime" class="inp" /></div>
                <div class="form-line"><label>周期</label><select v-model="scheduleCycle" class="inp"><option>仅执行一次</option><option>每日执行</option><option>每周执行</option><option>每月执行</option></select></div>
              </div>
              <div class="btn-row"><button class="btn" @click="wizardStep = 2">返回</button><button class="btn blue" @click="finishTask">完成</button></div>
            </div>
          </div>
          <div v-else class="task-list-wrap">
            <div class="toolbar-row">
              <input v-model="taskQuery" placeholder="任务名称" class="inp wider" />
              <input v-model="taskIdcard" placeholder="身份证" class="inp" />
              <select v-model="taskStatusFilter" class="inp"><option value="">请选择任务状态</option><option>已完成</option><option>执行中</option><option>待执行</option><option>失败</option></select>
              <input type="date" v-model="taskStart" class="inp" /> — <input type="date" v-model="taskEnd" class="inp" />
              <button class="btn blue" @click="resetTaskFilter">查询</button>
              <button class="btn" @click="resetTaskFilter">重置</button>
            </div>
            <div class="count-line">共 {{ filteredTasks.length }} 条任务（业务服务：{{ currentService.name }}）</div>
            <div class="task-grid">
              <div v-for="t in filteredTasks" :key="t.id" class="task-card">
                <div class="tc-top"><span class="tc-name">{{ t.name }}</span><span class="tag gray">{{ t.count }}条</span></div>
                <div class="tc-mid">创建人 <b>workbench</b> · <span class="weak">{{ t.createTime }}</span></div>
                <div class="tc-bottom">
                  <span class="stt" :class="statClass(t.status)">{{ t.status }}</span>
                  <span><button class="link blue" @click="openEditTask(t)">编辑</button><button class="link danger" @click="deleteTask(t)">删除</button></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 模块D 结果分析 ===== -->
        <div class="tab-body" v-show="activeTab === 'results'">
          <div class="res-wrap">
            <div class="res-left">
              <div class="res-left-head"><b>任务列表</b><button class="link blue" @click="showAllTasks = !showAllTasks">{{ showAllTasks ? '收起' : '展开' }}</button></div>
              <div class="res-task-list">
                <div v-for="t in shownResultTasks" :key="t.id" class="res-task" :class="{ active: activeResultTask === t.id }" @click="selectResultTask(t.id)">
                  <span class="res-dot" :class="statClass(t.status)"></span><span class="res-tname">{{ t.name }}</span>
                </div>
              </div>
            </div>
            <div class="res-right">
              <div class="res-stats">
                <div class="rstat blue"><b>{{ resultStats.checked }}</b><span>已核查（人）</span></div>
                <div class="rstat green"><b>{{ resultStats.passed }}</b><span>通过</span></div>
                <div class="rstat red"><b>{{ resultStats.failed }}</b><span>不通过</span></div>
                <div class="rstat orange"><b>{{ resultStats.review }}</b><span>建议复核</span></div>
              </div>
              <div class="res-filter">
                <input v-model="resIdcard" placeholder="身份证" class="inp" />
                <select v-model="resCategory" class="inp"><option value="">请选择人员类别</option><option v-for="c in categories" :key="c">{{ c }}</option></select>
                <select v-model="resAiType" class="inp"><option value="">请选择AI查询类别情况</option><option>建议复核</option><option>通过</option><option>不通过</option></select>
                <input type="date" v-model="resStart" class="inp" /> — <input type="date" v-model="resEnd" class="inp" />
                <button class="btn plain" @click="showMoreFilter = !showMoreFilter">展开</button>
                <button class="btn blue" @click="resetResultFilter">查询</button>
                <button class="btn" @click="resetResultFilter">重置</button>
                <button class="btn blue" :disabled="!filteredResults.length" @click="exportResult">结果导出</button>
              </div>
              <div v-if="showMoreFilter" class="res-filter row2">
                <select v-model="resTaskName" class="inp"><option value="">请选择任务</option><option v-for="t in resultTasks" :key="t.id" :value="t.name">{{ t.name }}</option></select>
                <select v-model="resScoreRange" class="inp"><option value="">结论区间</option><option>70分以上（建议复核）</option><option>60-69分</option><option>60分以下</option></select>
                <input v-model="resRuleCount" placeholder="命中规则数" class="inp" />
              </div>
              <div class="count-line">已为您查询到 {{ filteredResults.length }} 条数据</div>
              <div v-if="!filteredResults.length" class="empty-state">该任务暂无结果数据</div>
              <div v-for="rc in filteredResults" :key="rc.idCard" class="res-card">
                <div class="res-card-top">
                  <span class="stt review">建议复核</span>
                  <span class="mono">{{ rc.idCard }}</span> {{ rc.name }} {{ rc.age }}岁 {{ rc.gender }}
                  <span class="rc-time">培训时间：{{ rc.trainTime }}</span>
                </div>
                <div class="res-card-ai">{{ rc.aiResult }} <span class="score">总分 <b>{{ rc.score }}</b> 分</span></div>
                <button class="btn plain small right" @click="openDetail(rc)">查看明细</button>
              </div>
              <div class="pager"><span>共{{ filteredResults.length }}条 / 10条/页</span><span class="pg-num">1</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增规则弹窗 -->
    <div v-if="showAddRule" class="mask" @click.self="showAddRule = false">
      <div class="modal">
        <div class="modal-head"><b>新增规则</b><span class="x" @click="showAddRule = false">✕</span></div>
        <div class="modal-body">
          <label class="form-label">规则描述</label>
          <textarea v-model="addRuleForm.desc" class="ta" rows="3" placeholder="请输入规则描述"></textarea>
          <label class="form-label">上传政策依据</label>
          <div class="upload-zone sm" @click="pickRuleFile">
            <div v-if="!ruleFile" class="uz-tx sm-tx">拖放相关政策依据文件到这里或点击选择<br /><span class="weak">支持 .doc、.pdf、.png、.jpg</span></div>
            <div v-else class="uz-file">{{ ruleFile }}</div>
          </div>
          <input ref="ruleFileInput" type="file" style="display:none" @change="onRuleFile" />
          <div class="radio-row"><label class="rl"><input type="radio" value="正面规则" v-model="addRuleForm.type" /> 正面规则</label><label class="rl"><input type="radio" value="负面规则" v-model="addRuleForm.type" /> 负面规则</label></div>
          <div class="radio-row"><label class="rl"><input type="radio" value="true" v-model="addRuleForm.enable" /> 启用</label><label class="rl"><input type="radio" value="false" v-model="addRuleForm.enable" /> 禁用</label></div>
        </div>
        <div class="modal-foot"><button class="btn" @click="showAddRule = false">取消</button><button class="btn blue" @click="saveAddRule">保存</button></div>
      </div>
    </div>

    <!-- 编辑规则弹窗 -->
    <div v-if="editRuleForm" class="mask" @click.self="editRuleForm = null">
      <div class="modal">
        <div class="modal-head"><b>编辑规则</b><span class="x" @click="editRuleForm = null">✕</span></div>
        <div class="modal-body">
          <label class="form-label">规则描述</label>
          <textarea v-model="editRuleForm.desc" class="ta" rows="3"></textarea>
          <div class="radio-row"><label class="rl"><input type="radio" value="正面规则" v-model="editRuleForm.type" /> 正面规则</label><label class="rl"><input type="radio" value="负面规则" v-model="editRuleForm.type" /> 负面规则</label></div>
          <div class="radio-row"><label class="rl"><input type="radio" value="true" v-model="editRuleForm.enable" /> 启用</label><label class="rl"><input type="radio" value="false" v-model="editRuleForm.enable" /> 禁用</label></div>
          <label class="form-label">修改记录</label>
          <div class="rec-list"><div class="rec"><span class="weak">admin 2026-06-25 15:45:44</span> 修改规则状态</div><div class="rec"><span class="weak">admin 2026-04-14 16:43:56</span> 新增规则</div></div>
        </div>
        <div class="modal-foot"><button class="btn" @click="editRuleForm = null">取消</button><button class="btn blue" @click="saveEditRule">保存</button></div>
      </div>
    </div>

    <!-- 公共配置弹窗 -->
    <div v-if="showPublicCfg" class="mask" @click.self="showPublicCfg = false">
      <div class="modal wide">
        <div class="modal-head"><b>公共配置</b><span class="x" @click="showPublicCfg = false">✕</span></div>
        <div class="modal-body">
          <div class="radio-row">
            <label class="rl"><input type="radio" value="all" v-model="pubScene" /> 正负面综合</label>
            <label class="rl"><input type="radio" value="pos" v-model="pubScene" /> 仅正面规则</label>
            <label class="rl"><input type="radio" value="neg" v-model="pubScene" /> 仅负面规则</label>
          </div>
          <table class="g-tbl">
            <thead><tr><th>ID</th><th>规则描述</th><th>权重</th><th>优先级</th></tr></thead>
            <tbody>
              <tr v-for="r in pubFilteredRules" :key="r.id">
                <td>{{ r.id }}</td>
                <td class="pub-rule" @click="toggleAndChip(r)">{{ r.desc }}</td>
                <td><span class="stepper"><button @click="stepWeight(r, -1)">-</button>{{ r.weight }}<button @click="stepWeight(r, 1)">+</button></span></td>
                <td><span class="stepper"><button @click="stepPriority(r, -1)">-</button>{{ r.priority }}<button @click="stepPriority(r, 1)">+</button></span></td>
              </tr>
            </tbody>
          </table>
          <div class="rl" style="margin-top:10px">规则间关系（且）</div>
          <div class="chips"><span v-for="(r, i) in andChips" :key="i" class="chip">{{ r.desc }}<b class="cx" @click="removeAndChip(i)">×</b></span></div>
          <div class="rl" style="margin-top:10px">规则间关系（或）</div>
          <el-select v-model="pubOrRules" multiple size="small" style="width:100%" placeholder="请选择规则，支持多选">
            <el-option v-for="r in pubFilteredRules" :key="r.id" :label="r.desc" :value="r.id" />
          </el-select>
        </div>
        <div class="modal-foot"><button class="btn" @click="showPublicCfg = false">取消</button><button class="btn blue" @click="savePublicCfg">保存</button></div>
      </div>
    </div>

    <!-- 编辑任务弹窗 -->
    <div v-if="editTask" class="mask" @click.self="editTask = null">
      <div class="modal">
        <div class="modal-head"><b>编辑任务</b><span class="x" @click="editTask = null">✕</span></div>
        <div class="modal-body">
          <div class="form-line"><label>任务名称</label><input v-model="editTask.name" class="inp wider" /></div>
          <div class="form-line"><label>任务说明</label><textarea v-model="editTask.desc" class="ta" rows="2"></textarea></div>
          <div class="form-line"><label>数据条数</label><span class="ro-tx">{{ editTask.count }}条</span></div>
        </div>
        <div class="modal-foot"><button class="btn" @click="editTask = null">取消</button><button class="btn blue" @click="saveEditTask">保存更新</button></div>
      </div>
    </div>

    <!-- 结果明细弹窗 -->
    <div v-if="detailResult" class="mask" @click.self="detailResult = null">
      <div class="modal wide">
        <div class="modal-head"><b>核查明细</b><span class="x" @click="detailResult = null">✕</span></div>
        <div class="modal-body">
          <div class="detail-head"><span class="stt review">建议复核</span> <span class="mono">{{ detailResult.idCard }}</span> {{ detailResult.name }} {{ detailResult.age }}岁 {{ detailResult.gender }} · {{ detailResult.category }} · {{ detailResult.trainTime }}</div>
          <div class="detail-score">总分 <b class="text-blue">{{ detailResult.score }}</b> 分 &nbsp; 建议复核</div>
          <div class="rule-blocks">
            <div v-for="(item, i) in detailResult.items" :key="i" class="rb" :class="{ hit: detailResult.hits[i] }">
              <span class="rb-no">{{ item.no }}</span>
              <span class="rb-desc">{{ item.text }}</span>
              <span class="rb-state" :class="detailResult.hits[i] ? 'hit' : 'no'">{{ detailResult.hits[i] ? '命中（执行成功）' : '未命中' }}</span>
            </div>
          </div>
          <div class="full-text">{{ detailResult.aiResult }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 底部 toast 提示 -->
  <transition name="toast-fade">
    <div v-if="toast" class="toast">{{ toast }}</div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Wallet, OfficeBuilding, Present, Coin, DataAnalysis, Lock } from '@element-plus/icons-vue'

/* ============ 类型 ============ */
interface Column { name: string; type: string; label: string; key?: boolean }
interface TableDef { id: number; name: string; code: string; category: string; rows: number; serviceIds: number[]; columns: Column[]; sample: Record<string, string>[] }
interface ServiceDef { id: number; name: string; icon: any; color: string; desc: string }
interface RuleDef { id: number; desc: string; type: string; configStatus: string; creator: string; createTime: string; enable: boolean; weight?: number; priority?: number }
interface TaskDef { id: number; name: string; count: number; desc: string; createTime: string; status: string }

/* ============ 16 张数据表 ============ */
function ct(list: string[], key: string): Column[] {
  const types: Record<string, string> = { NAME: 'varchar', ID_CARD: 'varchar', GENDER: 'char', STATUS: 'char', AMOUNT: 'decimal', AGE: 'int' }
  return list.map((n) => ({ name: n, type: types[n] || 'varchar', label: n.toLowerCase(), key: n === key }))
}
function sample(n: number) {
  const rows: Record<string, string>[] = []
  for (let i = 0; i < n; i++) rows.push({ ID_CARD: '6542241990' + (100100 + i), NAME: '测试' + (i + 1), GENDER: i % 2 ? '男' : '女', STATUS: '有效', AMOUNT: String(3000 + i * 100), AGE: String(20 + i) })
  return rows
}
const allTables: TableDef[] = [
  { id: 1, name: '灵活就业补贴申请人员信息表', code: 'APPLICANTS_FOR_FLEXIBLE_EMPLOYMENT_SUBSIDIES', category: '业务表', rows: 1240, serviceIds: [1], columns: ct(['ID_CARD', 'NAME', 'GENDER', 'EMPLOYMENT_STATUS', 'APPLY_DATE'], 'ID_CARD'), sample: sample(8) },
  { id: 2, name: '法人信息表', code: 'LEGAL_PERSON_INFO', category: '基础表', rows: 862, serviceIds: [2, 4, 5], columns: ct(['LEGAL_PERSON_ID', 'LEGAL_PERSON_NAME', 'ID_CARD', 'UNIT_ID', 'CONTACT'], 'LEGAL_PERSON_ID'), sample: sample(8) },
  { id: 3, name: '股东信息表', code: 'SHAREHOLDER_INFO', category: '基础表', rows: 1543, serviceIds: [2, 3], columns: ct(['SHAREHOLDER_ID', 'NAME', 'ID_CARD', 'UNIT_ID', 'SHARE_RATE'], 'SHAREHOLDER_ID'), sample: sample(8) },
  { id: 4, name: '单位基本信息表', code: 'UNIT_BASIC_INFO', category: '基础表', rows: 698, serviceIds: [2, 3, 5], columns: ct(['UNIT_ID', 'UNIT_NAME', 'UNIT_TYPE', 'REG_ADDR', 'STATUS'], 'UNIT_ID'), sample: sample(8) },
  { id: 5, name: '单位参保情况表', code: 'UNIT_INSURANCE_STATUS', category: '业务表', rows: 698, serviceIds: [3], columns: ct(['UNIT_ID', 'INSURANCE_TYPE', 'COVERAGE', 'PAY_MONTH'], 'UNIT_ID'), sample: sample(8) },
  { id: 6, name: '单位征缴明细表', code: 'UNIT_COLLECTION_DETAIL', category: '明细表', rows: 8360, serviceIds: [3], columns: ct(['COLLECT_ID', 'UNIT_ID', 'EMPLOYEE_ID', 'AMOUNT', 'PERIOD'], 'COLLECT_ID'), sample: sample(8) },
  { id: 7, name: '人员基本信息表', code: 'PERSON_BASIC_INFO', category: '基础表', rows: 52480, serviceIds: [2, 4, 6], columns: ct(['ID_CARD', 'NAME', 'GENDER', 'BIRTH_DATE', 'NATION'], 'ID_CARD'), sample: sample(8) },
  { id: 8, name: '个人参保关系表', code: 'PERSON_INSURANCE_RELATION', category: '业务表', rows: 48230, serviceIds: [2, 5, 7], columns: ct(['ID_CARD', 'INSURANCE_TYPE', 'STATUS', 'UNIT_ID', 'JOIN_DATE'], 'ID_CARD'), sample: sample(8) },
  { id: 9, name: '个人信息_基础表', code: 'PERSON_INFO_BASIC', category: '基础表', rows: 52480, serviceIds: [2], columns: ct(['ID_CARD', 'NAME', 'ADDRESS', 'PHONE', 'EDU_LEVEL'], 'ID_CARD'), sample: sample(8) },
  { id: 10, name: '企业社保(岗位)补贴申请人员花名册', code: 'ENTERPRISE_SUBSIDY_APPLICANT_ROSTER', category: '业务表', rows: 1860, serviceIds: [2, 3], columns: ct(['ROSTER_ID', 'UNIT_ID', 'ID_CARD', 'NAME', 'SUBSIDY_TYPE'], 'ROSTER_ID'), sample: sample(8) },
  { id: 11, name: '失业登记信息表', code: 'UNEMPLOYMENT_REGISTRATION', category: '业务表', rows: 4210, serviceIds: [6, 7], columns: ct(['REGISTRATION_ID', 'ID_CARD', 'NAME', 'REASON', 'REG_DATE'], 'REGISTRATION_ID'), sample: sample(8) },
  { id: 12, name: '就业登记信息表', code: 'EMPLOYMENT_REGISTRATION', category: '业务表', rows: 5380, serviceIds: [4, 6], columns: ct(['ID_CARD', 'NAME', 'EMPLOY_TYPE', 'UNIT_ID', 'EMP_DATE'], 'ID_CARD'), sample: sample(8) },
  { id: 13, name: '就业困难人员认定信息表', code: 'DIFFICULT_PERSON_APPROVAL', category: '业务表', rows: 2410, serviceIds: [4], columns: ct(['APPROVAL_ID', 'ID_CARD', 'NAME', 'DIFFICULT_TYPE', 'APPROVE_DATE'], 'APPROVAL_ID'), sample: sample(8) },
  { id: 14, name: '人员基础信息表', code: 'PERSON_BASIC_FOUNDATION', category: '基础表', rows: 52480, serviceIds: [5, 6, 7], columns: ct(['ID_CARD', 'NAME', 'GENDER', 'BIRTH_DATE', 'STATUS'], 'ID_CARD'), sample: sample(8) },
  { id: 15, name: '人员参保关系', code: 'PERSON_SOCIAL_SECURITY_RELATION', category: '业务表', rows: 48230, serviceIds: [3, 5, 7], columns: ct(['ID_CARD', 'INSURANCE_TYPE', 'STATUS', 'UNIT_ID', 'JOIN_DATE'], 'ID_CARD'), sample: sample(8) },
  { id: 16, name: '养老保险人员实收明细', code: 'PENSION_RECEIVED_DETAIL', category: '明细表', rows: 28640, serviceIds: [5, 7], columns: ct(['PENSION_ID', 'ID_CARD', 'UNIT_ID', 'AMOUNT', 'PERIOD'], 'PENSION_ID'), sample: sample(8) }
]

/* ============ 7 个业务服务 ============ */
const services: ServiceDef[] = [
  { id: 1, name: '就业补贴资格审核服务', icon: User, color: 'blue', desc: '对就业补贴申请人员的资格条件进行AI智能审核' },
  { id: 2, name: '个人创业担保贷款放贷资格审核', icon: Wallet, color: 'purple', desc: '对个人申请创业担保贷款的资格进行AI审核' },
  { id: 3, name: '小微企业创业担保贷款资格审核', icon: OfficeBuilding, color: 'green', desc: '对小微企业申请创业担保贷款的资格进行AI审核' },
  { id: 4, name: '技能培训补贴使用资格审核', icon: Present, color: 'cyan', desc: '对技能培训补贴使用资格进行AI审核' },
  { id: 5, name: '职业技能培训补贴资金审核', icon: Coin, color: 'orange', desc: '对职业技能培训补贴资金进行AI审核' },
  { id: 6, name: '劳动力信息采集费用准确性核查', icon: DataAnalysis, color: 'amber', desc: '对劳动力信息采集费用准确性进行核查' },
  { id: 7, name: '养老待遇认证AI审查服务', icon: Lock, color: 'red', desc: '对养老待遇认证进行AI审查' }
]

/* ============ 各服务规则/任务 ============ */
const ruleSeeds: [string, boolean, boolean][] = [
  ['必须有就业登记，并且登记的就业形式是灵活就业', true, true],
  ['申请人必须要有就业困难人员认定', true, true],
  ['申请人生存状态必须为生存，并且数据标识为有效', true, true],
  ['申请人是企业股东并且企业状态为在营（开业）的直接排除', false, false],
  ['2025年1月到6月期间城镇职工养老保险都是企业缴纳的直接排除', false, true],
  ['同一周期重复申领补贴的直接排除', false, false]
]
function rulesOf(id: number): RuleDef[] {
  return ruleSeeds.map((s, i) => ({ id: id * 100 + i + 1, desc: s[0], type: s[1] ? '正面规则' : '负面规则', configStatus: s[2] ? '已配置' : '未配置', creator: 'admin', createTime: '2026-0' + ((i % 5) + 1) + '-1' + (i + 1) + ' 10:00:00', enable: s[2] }))
}
const taskNames = ['就业补贴资格审核', '创业担保贷款放贷', '小微企业贷款', '技能培训补贴', '培训补贴资金', '劳动力费用核查', '养老待遇认证']
function tasksOf(id: number): TaskDef[] {
  const name = taskNames[(id - 1) % taskNames.length]
  const counts = [158, 47, 0, 86, 120, 35]
  const status = ['已完成', '执行中', '待执行', '失败', '已完成', '已完成']
  return counts.map((c, i) => ({ id: id * 100 + i, name: name + '核查_' + (20260904000000 + id * 1000 + i), count: c, desc: '', createTime: '2026-09-04 1' + i + ':00:00', status: status[i] }))
}

/* ============ 结果 ============ */
const resultPersons = [
  { idCard: '14062420040106352', name: '李磊', age: 22, gender: '男' },
  { idCard: '42098120090814242', name: '王芷妍', age: 17, gender: '男' },
  { idCard: '411681200412106026', name: '李佳茹', age: 21, gender: '男' }
]
const categories = ['城镇登记失业人员', '城乡未继续升学的应届初高中毕业生', '就业援助对象', '脱贫劳动力人员', '农村转移就业劳动者']

/* ============ 全局状态 ============ */
const topTabs = [{ key: 'datasource', label: '数据源' }, { key: 'rules', label: '业务规则' }, { key: 'tasks', label: '任务执行' }, { key: 'results', label: '结果分析' }]
const steps = ['导入名单', '编辑任务信息', '执行任务']
const serviceSearch = ref('')
const activeService = ref(1)
const activeTab = ref('datasource')
const toast = ref('')
const filteredServices = computed(() => services.filter((s) => !serviceSearch.value || s.name.includes(serviceSearch.value)))
const currentService = computed(() => services.find((s) => s.id === activeService.value)!)
const serviceTables = computed(() => allTables.filter((t) => t.serviceIds.includes(activeService.value) || t.serviceIds.length === 0))
function selectService(id: number) {
  activeService.value = id
  activeTable.value = serviceTables.value[0]?.id || 1
  tableFull.value = false
}
function toastMsg(m: string) { toast.value = m; setTimeout(() => (toast.value = ''), 2200) }
function nowStr() { return new Date().toLocaleString('zh-CN').replace(/\//g, '-') }
function statClass(s: string) { return s === '已完成' || s === '通过' ? 'on' : s === '执行中' || s === '待执行' ? 'wait' : s === '失败' || s === '不通过' ? 'off' : '' }

/* ============ 数据源 ============ */
const tableSearch = ref(''); const tableFull = ref(false)
const activeTable = ref(1); const activeSubView = ref('data'); const colSearch = ref(''); const dataSearch = ref('')
const activeTableObj = ref(allTables[0])
watch([activeTable, activeService], () => { activeTableObj.value = allTables.find((t) => t.id === activeTable.value)! })
const shownTables = computed(() => {
  const pool = tableFull.value ? allTables : serviceTables.value
  return tableSearch.value ? pool.filter((t) => t.name.includes(tableSearch.value)) : pool
})
const displayCols = computed(() => { const c = activeTableObj.value.columns.map((x) => x.name); return c.slice(0, 4) })
const filteredCols = computed(() => activeTableObj.value.columns.filter((c) => !colSearch.value || c.name.includes(colSearch.value) || c.label.includes(colSearch.value)))
const filteredData = computed(() => {
  let d = activeTableObj.value.sample
  if (dataSearch.value) d = d.filter((r) => r.ID_CARD?.includes(dataSearch.value) || r.NAME?.includes(dataSearch.value))
  return d
})
function viewTable(id: number) { activeTable.value = id; dataSearch.value = ''; colSearch.value = '' }

/* ============ 业务规则 ============ */
const ruleQuery = ref(''); const enableFilter = ref(''); const cfgFilter = ref(''); const createStart = ref(''); const createEnd = ref('')
const configRule = ref<any>(null); const orRules = ref<number[]>([])
const verifyMode = ref('table'); const verifyTable = ref(''); const verifyIdcard = ref(''); const verifyLimit = ref(100); const verifyResult = ref<{ total: number; hit: number; ids: string[] } | null>(null)
const generatedSql = ref('')
const showAddRule = ref(false); const addRuleForm = ref({ desc: '', type: '正面规则', enable: 'true', id: 0 }); const ruleFile = ref(''); const ruleFileInput = ref<any>(null)
const editRuleForm = ref<any>(null)
const showPublicCfg = ref(false); const pubScene = ref('pos'); const pubOrRules = ref<number[]>([]); const andChips = ref<RuleDef[]>([])
const currentRules = ref<RuleDef[]>(rulesOf(1))
watch(activeService, () => { currentRules.value = rulesOf(activeService.value); andChips.value = currentRules.value.slice(0, 1) })
const filteredRules = computed(() => currentRules.value.filter((r) =>
  (!ruleQuery.value || r.desc.includes(ruleQuery.value)) &&
  (!enableFilter.value || (enableFilter.value === '启用' ? r.enable : !r.enable)) &&
  (!cfgFilter.value || r.configStatus === cfgFilter.value)))
const pubFilteredRules = computed(() => currentRules.value.filter((r) =>
  pubScene.value === 'all' ? true : pubScene.value === 'pos' ? r.type === '正面规则' : r.type === '负面规则'))
function resetRuleFilter() { ruleQuery.value = ''; enableFilter.value = ''; cfgFilter.value = ''; createStart.value = ''; createEnd.value = '' }
function openAddRule() { showAddRule.value = true; addRuleForm.value = { desc: '', type: '正面规则', enable: 'true', id: Date.now() }; ruleFile.value = '' }
function pickRuleFile() { ruleFileInput.value?.click() }
function onRuleFile(e: any) { ruleFile.value = e.target.files?.[0]?.name || '' }
function saveAddRule() {
  if (!addRuleForm.value.desc.trim()) { ElMessage.warning('请输入规则描述'); return }
  currentRules.value.unshift({ id: addRuleForm.value.id, desc: addRuleForm.value.desc, type: addRuleForm.value.type, configStatus: '未配置', creator: 'admin', createTime: nowStr(), enable: addRuleForm.value.enable === 'true' })
  showAddRule.value = false; toastMsg('新增规则成功')
}
function openEditRule(r: RuleDef) { editRuleForm.value = { ...r } }
function saveEditRule() { if (!editRuleForm.value) return; const i = currentRules.value.findIndex((x) => x.id === editRuleForm.value.id); if (i >= 0) currentRules.value[i] = { ...editRuleForm.value }; editRuleForm.value = null; toastMsg('规则已更新') }
function toggleRule(r: RuleDef) { r.enable = !r.enable; toastMsg('规则已' + (r.enable ? '启用' : '停用')) }
function enterConfig(r: RuleDef) {
  configRule.value = { ...r, subRules: [{ type: '子规则', desc: r.desc, table: serviceTables.value[0]?.code || '', value: '', weight: 1, priority: 1 }] }
  generatedSql.value = ''; verifyResult.value = null
}
function exitConfig() { configRule.value = null }
function addSubRule() { configRule.value.subRules.push({ type: '子规则', desc: '', table: serviceTables.value[0]?.code || '', value: '', weight: 1, priority: 1 }) }
function generateSql() {
  const subs = configRule.value.subRules
  generatedSql.value = '-- 规则生成SQL（子规则间关系：且）\nSELECT ID_CARD\n' + subs.filter((s: any) => s.table).map((s: any) => `FROM APPUSER.${s.table}\nWHERE ${s.table}.字段 = ${s.value || '值'}`).join('\n')
}
function runVerify() { verifyResult.value = { total: verifyLimit.value, hit: Math.max(1, Math.floor(verifyLimit.value * 0.3)), ids: ['6542241990100100', '6542241990100105', '6542241990100108'] } }
function confirmRuleConfig() {
  configRule.value.configStatus = '已配置'
  const i = currentRules.value.findIndex((x) => x.id === configRule.value.id)
  if (i >= 0) currentRules.value[i] = { desc: configRule.value.desc, type: configRule.value.type, configStatus: '已配置', creator: currentRules.value[i].creator, createTime: currentRules.value[i].createTime, enable: currentRules.value[i].enable, id: currentRules.value[i].id }
  toastMsg('规则已配置'); exitConfig()
}
function openPublicConfig() { showPublicCfg.value = true; pubScene.value = 'pos'; andChips.value = currentRules.value.slice(0, 1); pubOrRules.value = [] }
function toggleAndChip(r: RuleDef) { const i = andChips.value.findIndex((x) => x.id === r.id); i >= 0 ? andChips.value.splice(i, 1) : andChips.value.push(r) }
function removeAndChip(i: number) { andChips.value.splice(i, 1) }
function stepWeight(r: any, d: number) { r.weight = (r.weight as number || 1) + d; if (r.weight < 1) r.weight = 1 }
function stepPriority(r: any, d: number) { r.priority = (r.priority as number || 1) + d; if (r.priority < 1) r.priority = 1 }
function savePublicCfg() { showPublicCfg.value = false; toastMsg('保存成功：' + andChips.value.length + ' 条且关系、' + pubOrRules.value.length + ' 条或关系') }

/* ============ 任务执行 ============ */
const taskView = ref('new'); const wizardStep = ref(1); const taskType = ref('import'); const taskFile = ref(''); const taskFileInput = ref<any>(null)
const filterTaskName = ref(''); const newTaskName = ref(''); const newTaskDesc = ref(''); const newTaskTable = ref('')
const executeMode = ref('now'); const scheduleTime = ref(''); const scheduleCycle = ref('仅执行一次')
const taskQuery = ref(''); const taskIdcard = ref(''); const taskStatusFilter = ref(''); const taskStart = ref(''); const taskEnd = ref('')
const editTask = ref<any>(null)
const currentTasks = ref<TaskDef[]>(tasksOf(1))
watch(activeService, () => { currentTasks.value = tasksOf(activeService.value) })
const filteredTasks = computed(() => currentTasks.value.filter((t) => !taskQuery.value || t.name.includes(taskQuery.value) || (!taskStatusFilter.value || t.status === taskStatusFilter.value)))
function pickTaskFile() { taskFileInput.value?.click() }
function onTaskFile(e: any) { taskFile.value = e.target.files?.[0]?.name || '' }
function downloadTemplate() { toastMsg('模板下载已触发（.xlsx）') }
function nextStep() {
  if (taskType.value === 'import' && !taskFile.value) { ElMessage.warning('请先上传Excel名单文件'); return }
  if (taskType.value === 'filter' && !filterTaskName.value) { ElMessage.warning('请填写任务名称'); return }
  newTaskTable.value = serviceTables.value[0]?.code || ''; wizardStep.value = 2
}
function finishTask() {
  const name = newTaskName.value || currentService.value.name + '核查_' + Date.now()
  if (!filterTaskName.value && taskType.value === 'filter' && !name) { ElMessage.warning('请填写任务名称'); return }
  const count = taskType.value === 'import' ? 158 : filteredRules.value.slice(0, 4).length * 1000
  const t: TaskDef = { id: Date.now(), name, count, desc: newTaskDesc.value, createTime: nowStr(), status: executeMode.value === 'timer' ? '待执行' : '执行中' }
  currentTasks.value.unshift(t); wizardStep.value = 1; taskView.value = 'list'; newTaskName.value = ''
  if (executeMode.value === 'now') { toastMsg('任务已创建，开始执行…'); setTimeout(() => { t.status = '已完成'; toastMsg('任务执行完成') }, 2000) }
  else toastMsg('任务已创建，等待定时执行')
}
function resetTaskFilter() { taskQuery.value = ''; taskIdcard.value = ''; taskStatusFilter.value = ''; taskStart.value = ''; taskEnd.value = '' }
function openEditTask(t: TaskDef) { editTask.value = { ...t } }
function saveEditTask() { const i = currentTasks.value.findIndex((x) => x.id === editTask.value.id); if (i >= 0) currentTasks.value[i] = { ...editTask.value }; editTask.value = null; toastMsg('任务已更新') }
function deleteTask(t: TaskDef) {
  ElMessageBox.confirm('确认删除该任务？', '提示', { type: 'warning' }).then(() => { currentTasks.value = currentTasks.value.filter((x) => x.id !== t.id); toastMsg('任务已删除') }).catch(() => {})
}

/* ============ 结果分析 ============ */
const showAllTasks = ref(false); const activeResultTask = ref<number | null>(null)
const resIdcard = ref(''); const resCategory = ref(''); const resAiType = ref(''); const resStart = ref(''); const resEnd = ref(''); const showMoreFilter = ref(false)
const resTaskName = ref(''); const resScoreRange = ref(''); const resRuleCount = ref(''); const detailResult = ref<any>(null)
const resultTasks = computed(() => currentTasks.value)
const shownResultTasks = computed(() => showAllTasks.value ? resultTasks.value : resultTasks.value.slice(0, 6))
const resultList = computed(() => resultPersons.map((p, i) => {
  const score = (i + 2) % 3 === 0 ? 65 : i % 2 ? 72 : 58
  const hits = [i % 2 === 1, i % 3 === 0, i % 2 === 0, i % 3 !== 0, i % 4 === 0]
  const items = [
    { no: '一', text: '查询到有效的就业登记记录' }, { no: '二', text: '查询到有效失业登记记录' },
    { no: '三', text: '查询到办理就业创业证记录' }, { no: '四', text: '学员的参保状态为暂停参保' },
    { no: '五', text: '符合9类补贴对象范围' }
  ]
  const hitCount = hits.filter(Boolean).length
  const full = 'AI核查结果：建议复核。一、查询到有效的就业登记记录：' + (hits[0] ? '命中' : '未命中') + '；二、查询到有效失业登记记录：' + (hits[1] ? '命中' : '未命中') + '；三、查询到办理就业创业证记录：' + (hits[2] ? '命中' : '未命中') + '（执行失败）；四、学员的参保状态为暂停参保：' + (hits[3] ? '命中子规则：参保状态暂停' : '未命中') + '；五、符合9类补贴对象范围：' + (hits[4] ? '命中' : '未命中') + '。【规则汇总】命中规则' + hitCount + '条，未命中规则' + (5 - hitCount) + '条|总分' + score + '分【最终结论】总分' + score + '分，落入REVIEW区间，建议人工复核。'
  return { ...p, category: categories[i % 5], trainTime: '2026-06-30 至 2026-07-30', score, aiResult: full, items, hits }
}))
const resultStats = computed(() => ({ checked: 286, passed: 158, failed: 47, review: 86 }))
const filteredResults = computed(() => {
  let d = resultList.value
  if (resIdcard.value) d = d.filter((r) => r.idCard.includes(resIdcard.value) || r.name.includes(resIdcard.value))
  if (resCategory.value) d = d.filter((r) => r.category === resCategory.value)
  if (resScoreRange.value) { d = resScoreRange.value.includes('70') ? d.filter((r) => r.score >= 70) : resScoreRange.value.includes('60-69') ? d.filter((r) => r.score >= 60 && r.score < 70) : d.filter((r) => r.score < 60) }
  return d
})
function resetResultFilter() { resIdcard.value = ''; resCategory.value = ''; resAiType.value = ''; resStart.value = ''; resEnd.value = ''; resTaskName.value = ''; resScoreRange.value = ''; resRuleCount.value = '' }
function selectResultTask(id: number) { activeResultTask.value = id }
function openDetail(rc: any) { detailResult.value = rc }
function exportResult() {
  if (!filteredResults.value.length) { ElMessage.warning('无可导出数据'); return }
  const head = '身份证号,姓名,年龄,性别,人员类别,AI核查结果,总分,培训时间\n'
  const rows = filteredResults.value.map((r) => [r.idCard, r.name, r.age, r.gender, r.category, r.aiResult, r.score, r.trainTime].join(',')).join('\n')
  const blob = new Blob(['\ufeff' + head + rows], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '结果分析_' + Date.now() + '.csv'; a.click(); URL.revokeObjectURL(a.href)
  toastMsg('结果已导出')
}
</script>

<style scoped>
.audit-page { background: #f7f8fa; min-height: 100vh; }
.audit-body { display: flex; height: calc(100vh - 56px); overflow: hidden; }
.service-sidebar { width: 224px; flex-shrink: 0; background: linear-gradient(180deg, #0a1a5f, #0b3296); color: #fff; display: flex; flex-direction: column; padding: 14px 10px; }
.sidebar-title { font-weight: 700; font-size: 15px; padding: 4px 8px 12px; }
.sidebar-search { position: relative; margin-bottom: 8px; }
.sidebar-search .si { position: absolute; left: 8px; top: 8px; width: 15px; height: 15px; color: #9fb0cf; }
.sidebar-search input { width: 100%; box-sizing: border-box; padding: 7px 10px 7px 28px; border-radius: 7px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.12); color: #fff; font-size: 13px; outline: none; }
.sidebar-search input::placeholder { color: #9fb0cf; }
.service-count { font-size: 12px; color: #c3cdf0; padding: 4px 8px 10px; }
.service-list { flex: 1; overflow-y: auto; }
.svc-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; font-size: 13px; color: #e6ebf7; }
.svc-item:hover { background: rgba(255,255,255,.08); }
.svc-item.active { background: #2563eb; color: #fff; }
.svc-ic { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.svc-ic svg { width: 16px; height: 16px; }
.svc-ic.blue { background: #EAF0FE; color: #1D4FA8; } .svc-ic.purple { background: #F0ECFE; color: #7C3AED; }
.svc-ic.green { background: #E8F6EE; color: #15934A; } .svc-ic.cyan { background: #E6F7F8; color: #0E7490; }
.svc-ic.orange { background: #FCF1E6; color: #E07A2F; } .svc-ic.amber { background: #FBF3DB; color: #B45309; }
.svc-ic.red { background: #FCEBEA; color: #D63B3B; }
.svc-name { line-height: 1.3; }

.audit-content { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
.top-nav { display: flex; background: #fff; border-bottom: 1px solid #E6EBF2; }
.nav-tab { padding: 12px 28px; font-size: 14px; cursor: pointer; color: #51617E; border-bottom: 2px solid transparent; }
.nav-tab.active { color: #1D4FA8; font-weight: 600; border-bottom-color: #1D4FA8; }
.content-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px 4px; }
.ch-left { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: #1A2740; }
.ch-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.ch-icon svg { width: 18px; height: 18px; }
.ch-icon.blue { background: #EAF0FE; color: #1D4FA8; } .ch-icon.purple { background: #F0ECFE; color: #7C3AED; }
.ch-icon.green { background: #E8F6EE; color: #15934A; } .ch-icon.cyan { background: #E6F7F8; color: #0E7490; }
.ch-icon.orange { background: #FCF1E6; color: #E07A2F; } .ch-icon.amber { background: #FBF3DB; color: #B45309; }
.ch-icon.red { background: #FCEBEA; color: #D63B3B; }
.ch-desc { color: #8B98B4; font-size: 13px; }
.tab-body { flex: 1; overflow: auto; padding: 12px 20px 20px; }

.btn { padding: 6px 14px; border-radius: 7px; border: 1px solid #E6EBF2; background: #fff; color: #51617E; font-size: 13px; cursor: pointer; }
.btn.blue { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.blue:hover { background: #1D4FA8; }
.btn.plain { background: #fff; border-color: #E6EBF2; }
.btn.small { padding: 2px 10px; font-size: 12px; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.link { background: none; border: none; font-size: 13px; cursor: pointer; padding: 0 4px; }
.link.blue { color: #2563eb; } .link.lb { color: #5b8def; } .link.green { color: #15934A; } .link.gray { color: #8B98B4; } .link.danger { color: #D63B3B; }
.inp { height: 32px; padding: 0 10px; border: 1px solid #E6EBF2; border-radius: 7px; font-size: 13px; outline: none; margin-right: 8px; box-sizing: border-box; }
.inp:focus { border-color: #2563eb; }
.inp.wider { width: 220px; } .inp.inp-num { width: 64px; }
select.inp { height: 32px; }
.ta { width: 100%; box-sizing: border-box; border: 1px solid #E6EBF2; border-radius: 7px; padding: 8px 10px; font-size: 13px; outline: none; resize: vertical; font-family: inherit; }
.weak { color: #8B98B4; } .tiny { font-size: 11px; } .mono, .ds-code { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; }
.text-blue { color: #2563eb; }

.g-tbl { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; font-size: 13px; }
.g-tbl th { background: #F5F7FB; color: #51617E; font-weight: 600; text-align: left; padding: 10px 12px; border-bottom: 1px solid #E6EBF2; white-space: nowrap; }
.g-tbl td { padding: 9px 12px; border-bottom: 1px solid #F0F2F6; color: #1A2740; }
.g-tbl tbody tr:nth-child(even) { background: #FAFBFD; }
.g-tbl tbody tr:hover { background: #EFF4FF; }
.tag { padding: 2px 8px; border-radius: 5px; font-size: 12px; white-space: nowrap; }
.tag.业务表, .tag.pos { background: #EAF0FE; color: #1D4FA8; }
.tag.基础表, .tag.gray { background: #EEF1F5; color: #8B98B4; }
.tag.明细表, .tag.type { background: #E6F7F8; color: #0E7490; }
.tag.neg { background: #FCF1E6; color: #E07A2F; }
.tag.key { background: #F0ECFE; color: #7C3AED; }
.stt { padding: 3px 10px; border-radius: 999px; font-size: 12px; }
.stt.on { background: #E8F6EE; color: #15934A; } .stt.off { background: #FCEBEA; color: #D63B3B; }
.stt.wait, .stt.执行中, .stt.待执行 { background: #EAF0FE; color: #1D4FA8; } .stt.review { background: #FCF1E6; color: #E07A2F; }

.empty-state { text-align: center; color: #8B98B4; padding: 40px 0; }
.toolbar-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.count-line { font-size: 13px; color: #8B98B4; margin-bottom: 10px; }

/* 数据源 */
.ds-wrap { display: flex; gap: 14px; height: 100%; }
.ds-left { width: 300px; flex-shrink: 0; background: #fff; border-radius: 8px; border: 1px solid #E6EBF2; display: flex; flex-direction: column; overflow: hidden; }
.ds-search { display: flex; gap: 8px; padding: 10px; border-bottom: 1px solid #F0F2F6; }
.ds-search input { flex: 1; height: 32px; border: 1px solid #E6EBF2; border-radius: 7px; padding: 0 10px; font-size: 13px; outline: none; }
.table-list { flex: 1; overflow-y: auto; }
.tbl-item { display: flex; align-items: center; gap: 8px; padding: 10px; cursor: pointer; border-bottom: 1px solid #F5F7FB; }
.tbl-item:hover { background: #EFF4FF; } .tbl-item.active { background: #EAF0FE; }
.tt { width: 18px; height: 18px; color: #8B98B4; flex-shrink: 0; }
.tl-mid { flex: 1; min-width: 0; } .tl-name { font-size: 12.5px; color: #1A2740; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-code { font-size: 10px; color: #8B98B4; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-rows { font-size: 11px; color: #8B98B4; flex-shrink: 0; }
.show-all { text-align: center; color: #2563eb; font-size: 13px; padding: 10px; cursor: pointer; }
.ds-right { flex: 1; background: #fff; border-radius: 8px; border: 1px solid #E6EBF2; padding: 14px; min-width: 0; }
.ds-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
.ds-head-l { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ds-name { font-weight: 700; color: #1A2740; font-size: 15px; }
.ds-head-r { color: #8B98B4; font-size: 12px; }
.sub-tabs { display: flex; gap: 4px; border-bottom: 1px solid #E6EBF2; margin-bottom: 12px; }
.sub-tabs .st { padding: 8px 16px; font-size: 13px; cursor: pointer; color: #51617E; border-bottom: 2px solid transparent; }
.sub-tabs .st.on { color: #1D4FA8; font-weight: 600; border-bottom-color: #1D4FA8; }
.filter-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
.filter-row input { height: 32px; border: 1px solid #E6EBF2; border-radius: 7px; padding: 0 10px; font-size: 13px; outline: none; }
.tbl-scroll { overflow: auto; max-height: calc(100vh - 300px); }
.ds-empty { color: #8B98B4; text-align: center; padding: 60px 0; }
.si { width: 15px; height: 15px; } .si.big { width: 30px; height: 30px; }

/* 规则 */
.cfg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cfg-card { background: #fff; border: 1px solid #E6EBF2; border-radius: 8px; padding: 14px; }
.card-title { font-weight: 700; color: #1A2740; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.cfg-back-row { margin-bottom: 10px; }
.sub-rule { border: 1px dashed #D5DCE8; border-radius: 7px; padding: 10px; margin-bottom: 10px; }
.sr-head { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 6px; }
.sr-row { display: flex; gap: 8px; margin: 6px 0; align-items: center; }
.sr-row .inp { flex: 1; }
.radio-row { display: flex; gap: 16px; margin: 8px 0; } .rl { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; }
.sql-box { background: #101828; color: #7ee787; padding: 12px; border-radius: 7px; font-size: 12px; min-height: 80px; white-space: pre-wrap; font-family: monospace; }
.verify-tip { font-size: 12px; color: #8B98B4; background: #F7F9FC; padding: 8px; border-radius: 6px; margin-bottom: 8px; }
.res-line { font-size: 13px; margin-bottom: 6px; } .res-ok { color: #15934A; font-size: 12px; margin-top: 6px; } .res-empty { color: #8B98B4; font-size: 13px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
.chip { background: #EAF0FE; color: #1D4FA8; padding: 3px 9px; border-radius: 999px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
.cx { cursor: pointer; margin-left: 2px; }
.stepper { display: inline-flex; align-items: center; gap: 4px; } .stepper button { width: 22px; height: 22px; border: 1px solid #E6EBF2; background: #fff; border-radius: 4px; cursor: pointer; }
.pub-rule { color: #2563eb; cursor: pointer; }
.btn-row { display: flex; gap: 10px; margin-top: 12px; justify-content: flex-end; }

/* 任务 */
.task-sub-tabs { display: inline-flex; gap: 4px; border: 1px solid #E6EBF2; background: #fff; border-radius: 20px; padding: 3px; margin-bottom: 14px; }
.task-sub-tabs .st { padding: 5px 18px; border-radius: 18px; font-size: 13px; cursor: pointer; color: #51617E; }
.task-sub-tabs .st.on { background: #2563eb; color: #fff; }
.steps { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.step { display: flex; align-items: center; gap: 8px; }
.step-dot { width: 26px; height: 26px; border-radius: 50%; background: #EEF1F5; color: #8B98B4; display: flex; align-items: center; justify-content: center; font-size: 13px; margin-left: 12px; }
.step:first-child .step-dot { margin-left: 0; }
.step.cur .step-dot { background: #2563eb; color: #fff; } .step.done .step-dot { background: #15934A; color: #fff; }
.step-lb { font-size: 13px; color: #51617E; }
.wz-body { background: #fff; border: 1px solid #E6EBF2; border-radius: 8px; padding: 20px; max-width: 760px; }
.upload-zone { border: 1.5px dashed #B9C6DC; border-radius: 8px; padding: 26px; text-align: center; cursor: pointer; margin-bottom: 10px; color: #8B98B4; }
.upload-zone.sm { padding: 16px; } .uz-file { color: #2563eb; font-size: 13px; }
.uz-tx { font-size: 13px; line-height: 1.6; } .sm-tx { font-size: 12px; }
.form-line { display: flex; align-items: flex-start; margin: 10px 0; gap: 10px; }
.form-line label { width: 84px; flex-shrink: 0; color: #51617E; font-size: 13px; padding-top: 6px; } .form-line .wider { flex: 1; }
.ro-tx { font-size: 13px; } .timer-box { background: #F7F9FC; padding: 12px; border-radius: 7px; }
.task-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 12px; }
.task-card { background: #fff; border: 1px solid #E6EBF2; border-radius: 8px; padding: 14px; }
.tc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.tc-name { font-weight: 600; color: #1A2740; font-size: 13px; word-break: break-all; }
.tc-mid { font-size: 12px; color: #51617E; margin: 4px 0; }
.tc-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }

/* 结果 */
.res-wrap { display: flex; gap: 14px; height: 100%; }
.res-left { width: 240px; flex-shrink: 0; background: #fff; border: 1px solid #E6EBF2; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
.res-left-head { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #F0F2F6; }
.res-task-list { flex: 1; overflow-y: auto; }
.res-task { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #F5F7FB; }
.res-task:hover { background: #EFF4FF; } .res-task.active { background: #EAF0FE; }
.res-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.res-dot.on { background: #15934A; } .res-dot.off { background: #D63B3B; } .res-dot.run, .res-dot.wait, .res-dot.执行中 { background: #2563eb; }
.res-tname { font-size: 12px; color: #1A2740; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.res-right { flex: 1; min-width: 0; }
.res-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.rstat { background: #fff; border: 1px solid #E6EBF2; border-radius: 8px; padding: 14px; border-top: 3px solid transparent; }
.rstat b { font-size: 24px; display: block; color: #1A2740; }
.rstat span { font-size: 13px; color: #8B98B4; }
.rstat.blue { border-top-color: #2563eb; } .rstat.green { border-top-color: #15934A; } .rstat.red { border-top-color: #D63B3B; } .rstat.orange { border-top-color: #E07A2F; }
.res-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; align-items: center; }
.res-filter.row2 { background: #fff; border: 1px solid #E6EBF2; padding: 10px; border-radius: 8px; }
.res-card { background: #fff; border: 1px solid #E6EBF2; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
.res-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.res-card-ai { font-size: 13px; color: #51617E; line-height: 1.7; }
.score { color: #E07A2F; font-size: 13px; }
.right { float: right; } .pager { display: flex; gap: 12px; align-items: center; font-size: 13px; color: #8B98B4; margin-top: 10px; }
.pg-num { display: inline-block; background: #2563eb; color: #fff; padding: 2px 8px; border-radius: 5px; }

/* 弹窗 */
.mask { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 10px; width: 520px; max-height: 84vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,.15); }
.modal.wide { width: 760px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #F0F2F6; font-size: 15px; }
.x { cursor: pointer; color: #8B98B4; }
.modal-body { padding: 16px 18px; overflow-y: auto; }
.modal-foot { padding: 12px 18px; border-top: 1px solid #F0F2F6; display: flex; justify-content: flex-end; gap: 10px; }
.form-label { display: block; font-size: 13px; color: #51617E; margin: 10px 0 6px; }
.rec { font-size: 12px; color: #51617E; padding: 4px 0; border-bottom: 1px dashed #F0F2F6; }
.rule-blocks { margin: 10px 0; }
.rb { display: flex; gap: 10px; padding: 9px; border-radius: 6px; margin-bottom: 6px; background: #F7F9FC; font-size: 13px; align-items: center; }
.rb.hit { background: #FCF1E6; }
.rb-no { font-weight: 700; } .rb-desc { flex: 1; } .rb-state { font-size: 12px; }
.rb-state.hit { color: #E07A2F; } .rb-state.no { color: #8B98B4; }
.detail-score { font-size: 14px; margin: 4px 0 8px; color: #51617E; }
.full-text { background: #F7F9FC; padding: 10px; border-radius: 6px; font-size: 12px; color: #51617E; line-height: 1.7; max-height: 180px; overflow-y: auto; white-space: pre-wrap; }
.detail-head { margin-bottom: 6px; font-size: 14px; }
.toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,.92); color: #fff; padding: 10px 20px; border-radius: 8px; z-index: 200; font-size: 13px; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .2s, transform .2s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translate(-50%, 8px); }
.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
