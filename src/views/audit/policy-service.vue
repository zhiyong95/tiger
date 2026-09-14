<template>
  <div class="ps-root">
    <div class="ps-page-head">
      <span class="ps-page-title">政策主动服务</span>
    </div>
    <div class="ps-main">
      <!-- 二级菜单 Tab 切换 -->
      <div class="ps-tabs">
          <div
            v-for="t in innerTabs"
            :key="t.key"
            class="ps-tab"
            :class="{ active: activeTab === t.key }"
            @click="activeTab = t.key"
          >
            <el-icon><component :is="t.icon" /></el-icon>
            <span>{{ t.label }}</span>
          </div>
        </div>

        <!-- Tab1：AI政策库 -->
        <div v-show="activeTab === 'policyLib'" class="ps-pane">
          <div class="ps-pane-body">
            <!-- 左：分类树 -->
            <div class="ps-tree-panel">
              <div class="ps-panel-head">
                <span>政策分类</span>
                <el-icon class="ps-fold-btn" @click="treeCollapsed = !treeCollapsed">
                  <Menu />
                </el-icon>
              </div>
              <el-input
                v-model="treeSearch"
                class="ps-tree-search"
                placeholder="输入关键字进行过滤"
                :prefix-icon="Search"
                clearable
                size="small"
              />
              <el-tree
                ref="treeRef"
                v-show="!treeCollapsed"
                :data="categoryTree"
                :props="{ label: 'label' }"
                node-key="id"
                :default-expanded-keys="['1']"
                :filter-node-method="filterTree"
                highlight-current
                @node-click="onTreeClick"
                class="ps-tree"
              >
                <template #default="{ data }">
                  <span class="ps-tree-node">{{ data.label }}</span>
                </template>
              </el-tree>
            </div>

            <!-- 右：筛选 + 卡片 -->
            <div class="ps-policy-area">
              <div class="ps-filter-bar">
                <el-input v-model="libQuery.name" placeholder="请输入" clearable class="ps-f-name" :prefix-icon="Search" />
                <el-select v-model="libQuery.target" placeholder="请选择" clearable class="ps-f-target">
                  <el-option label="个人" value="个人" />
                  <el-option label="企业" value="企业" />
                </el-select>
                <el-button type="primary" @click="onLibSearch">搜索</el-button>
                <el-button @click="onLibReset">重置</el-button>
                <el-button type="primary" @click="goParse">智能解析</el-button>
              </div>

              <div class="ps-policy-grid">
                <div
                  v-for="p in filteredPolicies"
                  :key="p.id"
                  class="ps-policy-card"
                >
                  <div class="ps-policy-title">{{ p.name }}</div>
                  <div class="ps-policy-meta">
                    <span class="ps-meta-item">对象：<b>{{ p.target }}</b></span>
                    <span class="ps-meta-item">数量：<b>{{ p.count }}条</b></span>
                  </div>
                  <div class="ps-policy-time">创建时间：{{ p.createdAt }}</div>
                  <div class="ps-policy-actions">
                    <span class="ps-act green" @click="viewGrant(p)">发放记录</span>
                    <span class="ps-act blue" @click="openConfig(p)">配置</span>
                    <span class="ps-act red" @click="delPolicy(p)">删除</span>
                  </div>
                </div>
                <el-empty v-if="filteredPolicies.length === 0" description="暂无政策" />
              </div>

              <div class="ps-footer-bar">
                <span>共 {{ filteredPolicies.length }} 条</span>
                <el-pagination
                  layout="sizes, prev, pager, next, jumper"
                  :total="filteredPolicies.length"
                  :page-size="10"
                  :page-sizes="[10, 20, 50]"
                  background
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tab2：政策解析 -->
        <div v-show="activeTab === 'parse'" class="ps-pane">
          <div class="ps-steps">
            <div
              v-for="(s, i) in parseSteps"
              :key="s.key"
              class="ps-step"
              :class="{ done: i < parseStep, active: i === parseStep }"
              @click="i < parseStep && (parseStep = i)"
            >
              <span class="ps-step-dot">{{ i + 1 }}</span>
              <span class="ps-step-label">{{ s.label }}</span>
            </div>
          </div>

          <!-- Step1 上传 -->
          <div v-if="parseStep === 0" class="ps-step-panel">
            <p class="ps-step-tip">请上传补贴类的政策依据，将自动解析并精准匹配适用对象，助力政策主动兑现。</p>
            <el-form :model="parseForm" label-width="90px" class="ps-form">
              <el-form-item label="政策名称" required>
                <el-input v-model="parseForm.name" placeholder="请输入政策名称" />
              </el-form-item>
              <el-form-item label="对象" required>
                <el-radio-group v-model="parseForm.target">
                  <el-radio value="个人">个人</el-radio>
                  <el-radio value="企业">企业</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="政策分类">
                <el-cascader
                  v-model="parseForm.category"
                  :options="categoryOptions"
                  :props="{ label: 'label', value: 'id' }"
                  placeholder="请选择"
                  clearable
                  style="width:100%"
                />
              </el-form-item>
              <el-form-item label="政策条件" required>
                <el-input
                  v-model="parseForm.condition"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入政策条件"
                />
              </el-form-item>
              <el-form-item label="政策文件">
                <el-button type="primary" plain @click="parseFileInput.click()">上传</el-button>
                <input
                  ref="parseFileInput"
                  type="file"
                  accept=".doc,.docx,.pdf"
                  style="display:none"
                  @change="onParseFile"
                />
                <span v-if="parseFileName" class="ps-file-name">📄 {{ parseFileName }} ✓</span>
              </el-form-item>
            </el-form>
            <div class="ps-step-actions">
              <el-button type="primary" @click="goParseStep2">下一步</el-button>
            </div>
          </div>

          <!-- Step2 条件解析 -->
          <div v-else-if="parseStep === 1" class="ps-step-panel">
            <p class="ps-step-tip">AI 已自动解析政策条件，可编辑、删除或手动补充条件条目。</p>
            <div class="ps-parse-list">
              <div v-for="(c, i) in parseConditions" :key="i" class="ps-parse-item">
                <el-input v-model="c.text" size="small" />
                <el-icon class="ps-del" @click="parseConditions.splice(i, 1)"><Delete /></el-icon>
              </div>
              <el-button size="small" type="primary" plain @click="parseConditions.push({ text: '' })">
                ＋ 手动补充
              </el-button>
            </div>
            <div class="ps-step-actions">
              <el-button @click="parseStep = 0">上一步</el-button>
              <el-button type="primary" @click="parseStep = 2">下一步</el-button>
            </div>
          </div>

          <!-- Step3 生成规则 -->
          <div v-else class="ps-step-panel">
            <p class="ps-step-tip">AI 已生成匹配规则，可继续编辑与补充。</p>
            <div class="ps-rule-list">
              <div v-for="(r, i) in genRules" :key="i" class="ps-rule-card">
                <el-select v-model="r.type" size="small" class="ps-rule-type">
                  <el-option label="必须满足" value="必须满足" />
                  <el-option label="可达条件" value="可达条件" />
                </el-select>
                <el-input v-model="r.desc" size="small" class="ps-rule-desc" />
                <span class="ps-rule-tag">已生效</span>
                <el-icon class="ps-del" @click="genRules.splice(i, 1)"><Delete /></el-icon>
              </div>
              <el-button size="small" type="primary" plain @click="genRules.push({ type: '必须满足', desc: '' })">
                ＋ 添加规则
              </el-button>
            </div>
            <div class="ps-step-actions">
              <el-button @click="parseStep = 1">上一步</el-button>
              <el-button type="primary" @click="finishParse">完成</el-button>
            </div>
          </div>
        </div>

        <!-- Tab3：政策找人 -->
        <div v-show="activeTab === 'person'" class="ps-pane">
          <div class="ps-pane-body column">
            <div class="ps-filter-bar">
              <el-select v-model="personQuery.target" placeholder="请选择" clearable class="ps-f-target">
                <el-option label="个人" value="个人" />
                <el-option label="企业" value="企业" />
              </el-select>
              <el-input v-model="personQuery.name" placeholder="请输入" clearable class="ps-f-name" :prefix-icon="Search" />
              <el-select v-model="personQuery.progress" placeholder="请选择" clearable class="ps-f-target">
                <el-option label="待匹配" value="待匹配" />
                <el-option label="匹配中" value="匹配中" />
                <el-option label="已匹配" value="已匹配" />
              </el-select>
              <el-button type="primary" @click="openNewBatch">新增</el-button>
              <el-button type="primary" @click="onPersonSearch">搜索</el-button>
              <el-button @click="onPersonReset">重置</el-button>
            </div>

            <el-table :data="filteredBatches" stripe border class="ps-table" @selection-change="selBatches = $event">
              <el-table-column type="selection" width="46" />
              <el-table-column prop="batchNo" label="批次号" width="200" />
              <el-table-column prop="name" label="政策名称" min-width="180" />
              <el-table-column prop="target" label="对象" width="70" />
              <el-table-column prop="matchCount" label="匹配结果(条)" width="120" />
              <el-table-column label="匹配进度" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.progress === '已匹配' ? 'success' : row.progress === '匹配中' ? 'warning' : 'info'">
                    {{ row.progress }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="matchTime" label="匹配时间" width="170" />
              <el-table-column label="操作" width="230" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openMatchResult(row)">匹配结果</el-button>
                  <el-button type="primary" link size="small" @click="openPush(row)">推送</el-button>
                  <el-button type="warning" link size="small" @click="exportBatch(row)">导出</el-button>
                  <el-button link size="small" @click="openBatchDetail(row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="ps-footer-bar">
              <span>共 {{ filteredBatches.length }} 条</span>
              <el-pagination layout="sizes, prev, pager, next, jumper" :total="filteredBatches.length" :page-size="10" :page-sizes="[10,20,50]" background />
            </div>
          </div>
        </div>

        <!-- Tab4：推送记录 -->
        <div v-show="activeTab === 'record'" class="ps-pane">
          <div class="ps-pane-body column">
            <div class="ps-filter-bar right">
              <el-select v-model="recordQuery.target" placeholder="请选择" clearable class="ps-f-target">
                <el-option label="个人" value="个人" />
                <el-option label="企业" value="企业" />
              </el-select>
              <el-input v-model="recordQuery.name" placeholder="请输入" clearable class="ps-f-name" :prefix-icon="Search" />
              <el-button type="primary" @click="onRecordSearch">搜索</el-button>
              <el-button @click="onRecordReset">重置</el-button>
            </div>

            <el-table :data="filteredRecords" stripe border class="ps-table">
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="name" label="政策名称" min-width="220" />
              <el-table-column prop="target" label="对象" width="80" />
              <el-table-column prop="count" label="推送数量" width="100" />
              <el-table-column label="推送状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === '成功' ? 'success' : row.status === '失败' ? 'danger' : 'warning'">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="time" label="推送时间" width="170" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="viewRecordDetail(row)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="ps-footer-bar">
              <span>共 {{ filteredRecords.length }} 条</span>
              <el-pagination layout="sizes, prev, pager, next, jumper" :total="filteredRecords.length" :page-size="10" :page-sizes="[10,20,50]" background />
            </div>
          </div>
        </div>

        <!-- Tab5：标注 -->
        <div v-show="activeTab === 'mark'" class="ps-pane">
          <div class="ps-pane-body column">
            <div class="ps-filter-bar right">
              <el-input v-model="markQuery" placeholder="请输入" clearable class="ps-f-name" :prefix-icon="Search" />
              <el-button type="primary" @click="onMarkSearch">搜索</el-button>
              <el-button @click="onMarkReset">重置</el-button>
            </div>

            <div class="ps-mark-grid">
              <div v-for="m in filteredMarks" :key="m.id" class="ps-mark-card">
                <div class="ps-mark-name">{{ m.name }}</div>
                <div class="ps-mark-desc">{{ m.desc }}</div>
                <div class="ps-mark-time">{{ m.createdAt }}</div>
                <div class="ps-policy-actions">
                  <span class="ps-act blue" @click="openMarkEdit(m)">编辑</span>
                  <span class="ps-act red" @click="delMark(m)">删除</span>
                </div>
              </div>
              <el-empty v-if="filteredMarks.length === 0" description="暂无标注" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗：政策配置规则 -->
    <el-dialog v-model="configVisible" title="规则配置" width="720px" destroy-on-close>
      <el-form :model="configForm" label-width="90px" class="ps-form">
        <el-form-item label="政策名称" required>
          <el-input v-model="configForm.name" placeholder="自动带入当前政策名，可改" />
        </el-form-item>
        <el-form-item label="政策分类">
          <el-cascader
            v-model="configForm.category"
            :options="categoryOptions"
            :props="{ label: 'label', value: 'id' }"
            placeholder="请选择"
            clearable
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="政策条件" required>
          <el-input v-model="configForm.condition" type="textarea" :rows="3" placeholder="请输入政策条件" />
        </el-form-item>
        <el-form-item label="补贴对象" required>
          <el-select v-model="configForm.target" placeholder="请选择" style="width:100%">
            <el-option label="个人" value="个人" />
            <el-option label="企业" value="企业" />
          </el-select>
        </el-form-item>
        <el-form-item label="政策文件">
          <el-button type="primary" plain @click="configFileInput.click()">上传</el-button>
          <input ref="configFileInput" type="file" accept=".doc,.docx,.pdf" style="display:none" @change="onConfigFile" />
          <span v-if="configFileName" class="ps-file-name">📄 {{ configFileName }} ✓</span>
        </el-form-item>
      </el-form>

      <div class="ps-rule-head">
        <span>匹配规则</span>
        <el-button size="small" type="primary" plain @click="configRules.push({ type: '必须满足', desc: '' })">＋ 添加规则</el-button>
      </div>
      <div class="ps-rule-list">
        <div v-for="(r, i) in configRules" :key="i" class="ps-rule-card">
          <el-select v-model="r.type" size="small" class="ps-rule-type">
            <el-option label="必须满足" value="必须满足" />
            <el-option label="可达条件" value="可达条件" />
          </el-select>
          <el-input v-model="r.desc" size="small" class="ps-rule-desc" />
          <span class="ps-rule-tag">已生效</span>
          <el-icon class="ps-del" @click="configRules.splice(i, 1)"><Delete /></el-icon>
        </div>
      </div>

      <template #footer>
        <el-button @click="configVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">确定</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：新建批次 -->
    <el-dialog v-model="newBatchVisible" title="新增匹配批次" width="520px" destroy-on-close>
      <el-form :model="newBatchForm" label-width="90px">
        <el-form-item label="政策名称" required>
          <el-input v-model="newBatchForm.name" placeholder="请输入政策名称" />
        </el-form-item>
        <el-form-item label="对象" required>
          <el-radio-group v-model="newBatchForm.target">
            <el-radio value="个人">个人</el-radio>
            <el-radio value="企业">企业</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newBatchVisible = false">取消</el-button>
        <el-button type="primary" @click="createBatch">创建并匹配</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：匹配结果明细 -->
    <el-dialog v-model="matchResultVisible" :title="matchResultTitle" width="860px" destroy-on-close>
      <div class="ps-filter-bar">
        <el-select v-model="resultFilter" placeholder="请选择" clearable class="ps-f-target">
          <el-option label="完全满足" value="完全满足" />
          <el-option label="部分满足" value="部分满足" />
        </el-select>
        <el-button type="primary" size="small">搜索</el-button>
        <el-button size="small" @click="resultFilter = ''">重置</el-button>
      </div>
      <el-table :data="matchPersons" stripe border class="ps-table" max-height="400">
        <el-table-column prop="id" label="编号" width="200" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="idCard" label="身份证" width="130" />
        <el-table-column prop="edu" label="学历" width="100" />
        <el-table-column prop="gradTime" label="毕业时间" width="110" />
        <el-table-column prop="employ" label="就业方式" min-width="130" />
        <el-table-column prop="phone" label="联系方式" width="120" />
        <el-table-column prop="type" label="人员类型" min-width="120" />
        <el-table-column prop="result" label="匹配结果" width="90" />
        <el-table-column label="原因" min-width="220">
          <template #default="{ row }">
            <span class="ps-reason" @click="showReason(row)">{{ row.resultHint }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="ps-footer-bar">
        <span>共 26755 条</span>
        <el-pagination layout="sizes, prev, pager, next, jumper" :total="26755" :page-size="10" :page-sizes="[10,20,50]" background />
      </div>
    </el-dialog>

    <!-- 弹窗：政策推送 -->
    <el-dialog v-model="pushVisible" title="政策推送" width="900px" destroy-on-close>
      <el-table :data="pushPersons" stripe border class="ps-table" max-height="280" size="small">
        <el-table-column prop="id" label="编号" width="190" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="idCard" label="身份证" width="120" />
        <el-table-column prop="edu" label="学历" width="100" />
        <el-table-column prop="gradTime" label="毕业时间" width="110" />
        <el-table-column prop="employ" label="就业方式" min-width="120" />
        <el-table-column prop="phone" label="联系方式" width="120" />
        <el-table-column prop="type" label="人员类型" min-width="110" />
        <el-table-column prop="result" label="匹配结果" width="90" />
      </el-table>

      <div class="ps-rule-head">筛选匹配结果</div>
      <div class="ps-filter-bar">
        <el-select v-model="pushFilter.result" placeholder="请选择" clearable class="ps-f-target">
          <el-option label="完全满足" value="完全满足" />
          <el-option label="部分满足" value="部分满足" />
        </el-select>
        <el-select v-model="pushFilter.edu" placeholder="请选择" clearable class="ps-f-target">
          <el-option label="大专" value="大专" />
          <el-option label="本科" value="本科" />
          <el-option label="初级中学" value="初级中学" />
        </el-select>
        <el-select v-model="pushFilter.employ" placeholder="请选择" clearable class="ps-f-target">
          <el-option label="单位就业" value="单位就业" />
          <el-option label="灵活就业" value="灵活就业" />
        </el-select>
        <el-button type="primary" size="small">筛选</el-button>
      </div>
      <el-table v-if="pushedFiltered.length" :data="pushedFiltered" stripe border class="ps-table" max-height="200" size="small">
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="edu" label="学历" width="90" />
        <el-table-column prop="employ" label="就业方式" min-width="120" />
        <el-table-column prop="phone" label="联系方式" width="120" />
        <el-table-column prop="result" label="匹配结果" width="90" />
      </el-table>
      <el-empty v-else description="暂无数据" :image-size="60" />

      <div class="ps-push-actions">
        <el-button size="small" type="primary" plain>推送</el-button>
        <el-button size="small" type="primary" plain @click="aiWrite">AI撰写</el-button>
        <el-button type="primary" @click="doPush">政策推送</el-button>
      </div>
    </el-dialog>

    <!-- 抽屉：批次详情 -->
    <el-drawer v-model="batchDetailVisible" title="批次详情" size="520px">
      <template v-if="batchDetail">
        <div class="ps-detail-row"><label>政策名称</label><span>{{ batchDetail.name }}</span></div>
        <div class="ps-detail-row"><label>批次号</label><span>{{ batchDetail.batchNo }}</span></div>
        <div class="ps-detail-row"><label>对象</label><span>{{ batchDetail.target }}</span></div>
        <div class="ps-detail-row"><label>匹配结果</label><span>{{ batchDetail.matchCount }} 条</span></div>
        <div class="ps-detail-row"><label>匹配进度</label><span>{{ batchDetail.progress }}</span></div>
        <div class="ps-detail-row"><label>匹配时间</label><span>{{ batchDetail.matchTime }}</span></div>
        <div class="ps-detail-title">匹配规则</div>
        <div v-for="(r, i) in batchDetailRules" :key="i" class="ps-detail-rule">{{ i + 1 }}. 【{{ r.type }}】{{ r.desc }}</div>
      </template>
    </el-drawer>

    <!-- 抽屉：推送详情 -->
    <el-drawer v-model="recordDetailVisible" title="推送详情" size="560px">
      <template v-if="recordDetail">
        <div class="ps-detail-row"><label>政策名称</label><span>{{ recordDetail.name }}</span></div>
        <div class="ps-detail-row"><label>对象</label><span>{{ recordDetail.target }}</span></div>
        <div class="ps-detail-row"><label>推送数量</label><span>{{ recordDetail.count }} 条</span></div>
        <div class="ps-detail-row"><label>推送状态</label><span>{{ recordDetail.status }}</span></div>
        <div class="ps-detail-row"><label>推送时间</label><span>{{ recordDetail.time }}</span></div>
        <div class="ps-detail-row"><label>推送文案</label>
          <div class="ps-sms">{{ recordDetail.sms }}</div>
        </div>
        <div class="ps-detail-title">接收明细</div>
        <el-table :data="recordDetail.list" size="small" border max-height="260">
          <el-table-column prop="name" label="姓名" width="90" />
          <el-table-column prop="phone" label="联系方式" width="130" />
          <el-table-column prop="channel" label="渠道" width="80" />
          <el-table-column prop="status" label="发送状态" width="90" />
        </el-table>
      </template>
    </el-drawer>

    <!-- 抽屉：发放记录 -->
    <el-drawer v-model="grantVisible" title="发放记录" size="560px">
      <template v-if="grantDetail">
        <div class="ps-detail-row"><label>政策名称</label><span>{{ grantDetail.name }}</span></div>
        <div class="ps-detail-row"><label>对象</label><span>{{ grantDetail.target }}</span></div>
        <el-table :data="grantList" size="small" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="name" label="姓名" width="110" />
          <el-table-column prop="amount" label="补贴金额" width="120" />
          <el-table-column prop="time" label="发放时间" width="150" />
          <el-table-column prop="status" label="状态" width="90" />
        </el-table>
      </template>
    </el-drawer>

    <!-- 弹窗：标注编辑 -->
    <el-dialog v-model="markEditVisible" :title="markEditForm.id ? '编辑标注' : '新增标注'" width="560px" destroy-on-close>
      <el-form :model="markEditForm" label-width="90px">
        <el-form-item label="字段名称" required>
          <el-input v-model="markEditForm.name" placeholder="请输入字段名称" />
        </el-form-item>
        <el-form-item label="解释" required>
          <el-input v-model="markEditForm.desc" type="textarea" :rows="4" placeholder="请输入字段解释说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="markEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMark">确定</el-button>
      </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, UserFilled, Finished, Collection, Document, HomeFilled, Menu, Delete, Fold } from '@element-plus/icons-vue'

/* ========== Tab ========== */
const innerTabs = ref([
  { key: 'policyLib', label: 'AI政策库', icon: Collection },
  { key: 'parse', label: '政策解析', icon: Document },
  { key: 'person', label: '政策找人', icon: UserFilled },
  { key: 'record', label: '推送记录', icon: Finished },
  { key: 'mark', label: '标注', icon: Collection },
])
const activeTab = ref('policyLib')

/* ========== Tab1 AI政策库 ========== */
const treeCollapsed = ref(false)
const treeSearch = ref('')
const treeRef = ref()
watch(treeSearch, (v) => { treeRef.value?.filter(v) })
const categoryTree = ref([
  { id: '1', label: '一、就业创业补贴', children: [
    { id: '1-1', label: '1.就业见习补贴' },
    { id: '1-2', label: '2.社会保险补贴', children: [
      { id: '1-2-1', label: '(1) 高校毕业生社会保险补贴' },
      { id: '1-2-2', label: '(2) 就业困难人员社会保险补贴' },
    ]},
  ]},
  { id: '2', label: '二、培训服务补贴', children: [
    { id: '2-1', label: '1.外出务工奖励补助' },
  ]},
  { id: '3', label: '三、求职帮扶补贴', children: [
    { id: '3-1', label: '1.一次性求职补贴' },
    { id: '3-2', label: '2.公益性岗位补贴及社会保险补贴' },
  ]},
  { id: '4', label: '四、创业担保贷款' },
  { id: '5', label: '五、纺织服装四项补贴', children: [
    { id: '5-1', label: '1.新招录新疆籍职工补贴' },
    { id: '5-2', label: '2.纺织服装个人社保补贴' },
    { id: '5-3', label: '3.南疆人才引进补贴' },
  ]},
])

const policies = ref([
  { id: 1, name: '高校毕业生灵活就业社保补贴', target: '个人', count: 6, createdAt: '2026-07-07 20:57:58', category: '1-2-1' },
  { id: 2, name: '单位吸纳就业困难人员社会保险补贴', target: '企业', count: 8, createdAt: '2026-07-13 16:35:53', category: '1-2-2' },
  { id: 3, name: '就业困难人员灵活就业社保补贴', target: '个人', count: 7, createdAt: '2026-07-13 14:40:57', category: '1-2-2' },
  { id: 4, name: '小微企业吸纳高校毕业生社保补贴', target: '企业', count: 8, createdAt: '2026-07-07 21:07:04', category: '1-2-1' },
])

const libQuery = ref({ name: '', target: '' })
const selectedCategory = ref<string | null>(null)

const categoryOptions = computed(() => categoryTree.value.map((n: any) => ({ id: n.id, label: n.label })))

function filterTree(val: string, data: any) {
  if (!val) return true
  return data.label.includes(val)
}

const filteredPolicies = computed(() => {
  return policies.value.filter(p => {
    if (libQuery.value.name && !p.name.includes(libQuery.value.name)) return false
    if (libQuery.value.target && p.target !== libQuery.value.target) return false
    if (selectedCategory.value && p.category !== selectedCategory.value) return false
    return true
  })
})

function onTreeClick(node: any) {
  selectedCategory.value = node.id
}
function onLibSearch() {}
function onLibReset() {
  libQuery.value = { name: '', target: '' }
  selectedCategory.value = null
}
function goParse() { activeTab.value = 'parse' }

/* 配置弹窗 */
const configVisible = ref(false)
const configForm = ref({ id: 0, name: '', category: [] as any, condition: '', target: '', file: '' })
const configRules = ref<{ type: string; desc: string }[]>([])
const configFileName = ref('')
const configFileInput = ref<any>(null)

function openConfig(p: any) {
  configForm.value = { id: p.id, name: p.name, category: [], condition: '补贴对象：符合条件人员；补贴条件：实现灵活就业并缴纳社会保险费', target: p.target, file: '' }
  configRules.value = [
    { type: '必须满足', desc: '个人状态生存状态为"生存"' },
    { type: '必须满足', desc: '人员为2024年届和2025年届的高校毕业生' },
  ]
  configFileName.value = ''
  configVisible.value = true
}
function onConfigFile(e: any) {
  const f = e.target.files[0]
  if (f) configFileName.value = f.name
}
function saveConfig() {
  const p = policies.value.find(x => x.id === configForm.value.id)
  if (p) {
    p.name = configForm.value.name
    p.target = configForm.value.target
  }
  configVisible.value = false
  ElMessage.success('规则配置已保存')
}

/* 删除政策 */
function delPolicy(p: any) {
  ElMessageBox.confirm('确认删除该政策？此操作不可恢复', '删除确认', { type: 'warning' })
    .then(() => {
      policies.value = policies.value.filter(x => x.id !== p.id)
      ElMessage.success('删除成功')
    }).catch(() => {})
}

/* 发放记录 */
const grantVisible = ref(false)
const grantDetail = ref<any>(null)
const grantList = ref([
  { name: '李*明', amount: '¥3,200', time: '2026-07-01 10:20:00', status: '已发放' },
  { name: '王*华', amount: '¥1,800', time: '2026-07-03 09:11:22', status: '已发放' },
  { name: '张*强', amount: '¥2,400', time: '2026-07-05 14:30:45', status: '已发放' },
])
function viewGrant(p: any) {
  grantDetail.value = p
  grantVisible.value = true
}

/* ========== Tab2 政策解析 ========== */
const parseSteps = [
  { key: 'upload', label: '政策上传' },
  { key: 'parse', label: '条件解析' },
  { key: 'rule', label: '生成检索规则' },
]
const parseStep = ref(0)
const parseForm = ref({ name: '', target: '', category: [] as any, condition: '', file: '' })
const parseFileName = ref('')
const parseFileInput = ref<any>(null)
const parseConditions = ref<{ text: string }[]>([
  { text: '个人状态生存状态为"生存"' },
  { text: '人员为2024年届和2025年届的高校毕业生' },
  { text: '实现灵活就业并缴纳社会保险费' },
])
const genRules = ref<{ type: string; desc: string }[]>([
  { type: '必须满足', desc: '个人状态生存状态为"生存"' },
  { type: '必须满足', desc: '参训人员须为"五类人员"或符合条件的企业职工' },
])

function onParseFile(e: any) {
  const f = e.target.files[0]
  if (f) parseFileName.value = f.name
}
function goParseStep2() {
  if (!parseForm.value.name || !parseForm.value.target || !parseForm.value.condition) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  parseStep.value = 1
}
function finishParse() {
  parseStep.value = 0
  parseForm.value = { name: '', target: '', category: [], condition: '', file: '' }
  parseFileName.value = ''
  parseConditions.value = []
  activeTab.value = 'policyLib'
  ElMessage.success('政策创建成功')
}

/* ========== Tab3 政策找人 ========== */
const personQuery = ref({ target: '', name: '', progress: '' })
const batches = ref([
  { id: 1, batchNo: 'PM202609092134186413', name: '职业培训补贴（项目制培训）', target: '个人', matchCount: 26755, progress: '已匹配', matchTime: '2026-09-10 00:09:52' },
  { id: 2, batchNo: 'PM202608310913312652', name: '企业社保补贴', target: '企业', matchCount: 245578, progress: '已匹配', matchTime: '2026-08-31 10:50:49' },
  { id: 3, batchNo: 'PM202608291809231245', name: '职工培训补贴', target: '个人', matchCount: 2997, progress: '已匹配', matchTime: '2026-08-29 19:01:57' },
  { id: 4, batchNo: 'PM202608291807250200', name: '一次性求职补贴', target: '个人', matchCount: 58, progress: '已匹配', matchTime: '2026-08-29 18:12:09' },
  { id: 5, batchNo: 'PM202608281910382871', name: '公益性岗位补贴及社会保险补贴', target: '企业', matchCount: 22821, progress: '已匹配', matchTime: '2026-08-28 19:21:08' },
  { id: 6, batchNo: 'PM202608281907577426', name: '个人社保补贴', target: '个人', matchCount: 7004, progress: '已匹配', matchTime: '2026-08-28 19:43:54' },
  { id: 7, batchNo: 'PM202608281904583315', name: '南疆人才引进补贴', target: '个人', matchCount: 31, progress: '已匹配', matchTime: '2026-08-28 19:06:48' },
  { id: 8, batchNo: 'PM202608271424058388', name: '小微企业创业担保贷款', target: '企业', matchCount: 6445, progress: '已匹配', matchTime: '2026-08-27 17:06:08' },
  { id: 9, batchNo: 'PM202608270952090867', name: '一次性新增就业补贴（企业补贴）', target: '企业', matchCount: 42647, progress: '已匹配', matchTime: '2026-08-27 11:17:39' },
  { id: 10, batchNo: 'PM202608261841432726', name: '南疆人才引进补贴', target: '个人', matchCount: 31, progress: '已匹配', matchTime: '2026-08-26 18:43:06' },
  { id: 11, batchNo: 'PM202608261824016324', name: '个人创业担保贷款', target: '个人', matchCount: 163984, progress: '已匹配', matchTime: '2026-08-26 19:03:59' },
])
const selBatches = ref<any[]>([])

const filteredBatches = computed(() => {
  return batches.value.filter(b => {
    if (personQuery.value.target && b.target !== personQuery.value.target) return false
    if (personQuery.value.name && !b.name.includes(personQuery.value.name)) return false
    if (personQuery.value.progress && b.progress !== personQuery.value.progress) return false
    return true
  })
})
function onPersonSearch() {}
function onPersonReset() { personQuery.value = { target: '', name: '', progress: '' } }

/* 新增批次 */
const newBatchVisible = ref(false)
const newBatchForm = ref({ name: '', target: '个人' })
function openNewBatch() { newBatchVisible.value = true }
function createBatch() {
  if (!newBatchForm.value.name) { ElMessage.warning('请输入政策名称'); return }
  const now = Date.now()
  batches.value.unshift({
    id: now,
    batchNo: 'PM' + now,
    name: newBatchForm.value.name,
    target: newBatchForm.value.target,
    matchCount: Math.floor(Math.random() * 5000) + 100,
    progress: '匹配中',
    matchTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').replace(' ', ' ') + '',
  })
  newBatchVisible.value = false
  ElMessage.success('批次已创建，开始匹配')
}

/* 匹配结果弹窗 */
const matchResultVisible = ref(false)
const matchResultTitle = ref('')
const resultFilter = ref('')
const matchPersons = ref([
  { id: '875b9735-4e34-11f1-ac12-286ed489875f', name: '李*明', idCard: '3412*******031', edu: '初级中学', gradTime: '', employ: '居家从事种养殖农牧民', phone: '15099278832', type: '居家从事种养殖农牧民', result: '完全满足', resultHint: '全部满足。七项规则全部满足，符合申请资格。' },
  { id: '9a4b2c11-5f20-4a61-bc35-286ed489875f', name: '王*华', idCard: '5123*******412', edu: '大专', gradTime: '2024-06-30', employ: '单位就业', phone: '13999823321', type: '城镇登记失业人员', result: '完全满足', resultHint: '全部满足。七项规则全部满足，符合申请资格。' },
  { id: 'b1c3d4e5-6f70-4a81-bc92-286ed489875f', name: '张*强', idCard: '4121*******078', edu: '高中', gradTime: '', employ: '灵活就业', phone: '13711809332', type: '就业困难人员', result: '部分满足', resultHint: '部分满足，其中【必须满足】个人状态不符合。（待进一步确认）' },
  { id: 'e2f3g4h5-i6j7-4k81-l9m0-286ed489875f', name: '刘*燕', idCard: '3201*******556', edu: '本科', gradTime: '2025-06-30', employ: '单位就业', phone: '18855237011', type: '毕业年度高校毕业生', result: '完全满足', resultHint: '全部满足。七项规则全部满足，符合申请资格。' },
])

function showReason(row: any) {
  ElMessageBox.alert(
    row.result === '完全满足'
      ? '全部满足。七项规则全部满足，符合申请资格。\n\n判断明细如下：\n一、符合规则：【必须满足】个人状态生存状态为"生存"。\n二、符合规则：【必须满足】企业状态必须在营。\n三、符合规则：【必须满足】参训人员须为"五类人员"。\n四、符合规则：【必须满足】培训须采用"四位一体"模式开展。\n五、符合规则：【必须满足】承办机构须为定点培训机构。\n六、符合规则：【可达条件】已领取过急需紧缺鼓励性政策补贴。\n七、符合规则：【必须满足】参训人员须取得规定证书。'
      : row.resultHint,
    '判断明细', { confirmButtonText: '关闭' }
  )
}
function openMatchResult(row: any) {
  matchResultTitle.value = row.name
  matchResultVisible.value = true
}

/* 政策推送弹窗 */
const pushVisible = ref(false)
const pushFilter = ref({ result: '', edu: '', employ: '' })
const pushPersons = ref([
  { id: 'a1b2c3d4-5e6f-4a78-9b0c-286ed489875f', name: '俞*', idCard: '3301*******223', edu: '大专(高级工)', gradTime: '', employ: '单位就业', phone: '18399565520', type: '民营企业从业', result: '完全满足' },
  { id: 'b2c3d4e5-f6a7-4b89-9c0d-286ed489875f', name: '艾*尔', idCard: '6529*******118', edu: '大专', gradTime: '2017-06-30', employ: '灵活就业', phone: '13912345678', type: '灵活就业人员', result: '完全满足' },
  { id: 'c3d4e5f6-a7b8-4c90-8d0e-286ed489875f', name: '阿*班', idCard: '6531*******336', edu: '小学', gradTime: '', employ: '灵活就业', phone: '13150281361', type: '灵活就业人员', result: '部分满足' },
  { id: 'd4e5f6a7-b8c9-4d01-9e1f-286ed489875f', name: '阿*提', idCard: '6523*******004', edu: '初级中学', gradTime: '', employ: '灵活就业', phone: '13999232406', type: '灵活就业人员', result: '完全满足' },
])

const pushedFiltered = computed(() => {
  return pushPersons.value.filter(p => {
    if (pushFilter.value.result && p.result !== pushFilter.value.result) return false
    if (pushFilter.value.edu && !p.edu.includes(pushFilter.value.edu)) return false
    if (pushFilter.value.employ && p.employ !== pushFilter.value.employ) return false
    return true
  })
})
function openPush(row: any) {
  pushFilter.value = { result: '', edu: '', employ: '' }
  pushVisible.value = true
}
function aiWrite() {
  ElMessage.success('AI 已生成推送文案')
}
function doPush() {
  pushVisible.value = false
  ElMessage.success('政策推送成功，已写入推送记录')
}

/* 导出 */
function exportBatch(row: any) {
  const csv = '\ufeff' + '批次号,政策名称,匹配结果\n' + `${row.batchNo},${row.name},${row.matchCount}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${row.batchNo}-匹配结果.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('导出成功')
}

/* 批次详情 */
const batchDetailVisible = ref(false)
const batchDetail = ref<any>(null)
const batchDetailRules = ref<{ type: string; desc: string }[]>([])
function openBatchDetail(row: any) {
  batchDetail.value = row
  batchDetailRules.value = [
    { type: '必须满足', desc: '个人状态生存状态为"生存"' },
    { type: '必须满足', desc: '参训人员须为"五类人员"或符合条件的企业职工' },
    { type: '必须满足', desc: '培训须采用"四位一体"培训模式开展' },
  ]
  batchDetailVisible.value = true
}

/* ========== Tab4 推送记录 ========== */
const recordQuery = ref({ target: '', name: '' })
const records = ref([
  { id: 1, name: '单位吸纳就业困难人员社会保险补贴', target: '企业', count: 142, status: '成功', time: '2026-07-31 16:55:30', sms: '【人社局】您符合单位吸纳就业困难人员社保补贴申领条件，请于本月内携带相关材料到经办窗口办理，详询12333。', list: [
    { name: '某商贸有限公司', phone: '0991-****', channel: '短信', status: '成功' },
    { name: '某人力资源公司', phone: '0991-****', channel: '短信', status: '成功' },
  ]},
  { id: 2, name: '高校毕业生灵活就业社保补贴', target: '个人', count: 3829, status: '成功', time: '2026-07-31 14:24:58', sms: '【人社局】您已具备高校毕业生灵活就业社保补贴申领资格，详情请登录人社服务大厅查询办理。', list: [
    { name: '李*明', phone: '15099278832', channel: '短信', status: '成功' },
    { name: '王*华', phone: '13999823321', channel: '短信', status: '失败' },
  ]},
])
const filteredRecords = computed(() => {
  return records.value.filter(r => {
    if (recordQuery.value.target && r.target !== recordQuery.value.target) return false
    if (recordQuery.value.name && !r.name.includes(recordQuery.value.name)) return false
    return true
  })
})
function onRecordSearch() {}
function onRecordReset() { recordQuery.value = { target: '', name: '' } }
const recordDetailVisible = ref(false)
const recordDetail = ref<any>(null)
function viewRecordDetail(row: any) {
  recordDetail.value = row
  recordDetailVisible.value = true
}

/* ========== Tab5 标注 ========== */
const markQuery = ref('')
const marks = ref([
  { id: 1, name: '享受补贴对象', desc: '【召回】享受补贴对象类型：1-本人（就业困难人员本人）2-家庭成员 3-用人单位（吸纳就业的企业/单位）4-其他', createdAt: '2026-07-09 17:15:00' },
  { id: 2, name: '人力资源类型', desc: '【召回】判断人员生存状态时，非死亡人员=生存', createdAt: '2026-07-09 17:15:00' },
  { id: 3, name: '企业类型', desc: '【召回】企业类型的判断，包含小微企业等等，从从业人员=期末平均人数；营业收入=主营业务收入；资产总额=资产总计', createdAt: '2026-07-04 17:20:23' },
  { id: 4, name: '参保身份', desc: '【召回】参保身份：1-企业职工基本养老保险（在职）2-机关事业单位养老保险 3-城乡居民养老保险 4-灵活就业人员养老保险 5-未参保 6-已退休（领取养老金）7-其他', createdAt: '2026-07-09 17:15:00' },
  { id: 5, name: '城镇企业职工养老保险', desc: '【召回】参保身份：1-城镇企业职工养老保险（单位在职职工）2-机关事业单位养老保险 3-城乡居民养老保险 4-灵活就业人员养老保险 5-未参加基本养老保险 6-已退休（按月领取养老金）7-其他', createdAt: '2026-07-09 17:15:00' },
  { id: 6, name: '就业方式', desc: '【召回】employment_mode INT：1-单位就业（签订劳动合同）2-灵活就业（无固定单位）3-自主创业（含个体工商户）4-新就业形态（平台就业）', createdAt: '2026-07-04 17:20:23' },
  { id: 7, name: '参保状态', desc: '【召回】参保状态：1-正常参保 2-暂停 3-终止（未参保）', createdAt: '2026-07-09 17:15:00' },
  { id: 8, name: '失业保险金申领状态', desc: '【召回】失业保险金申领状态：1-申领中 2-已发放 3-已停发', createdAt: '2026-07-09 17:15:00' },
  { id: 9, name: '毕业时间', desc: '【召回】毕业时间：YYYY-MM-DD 格式，用于判断毕业年度与离校时间', createdAt: '2026-07-09 17:15:00' },
])
const filteredMarks = computed(() => {
  if (!markQuery.value) return marks.value
  return marks.value.filter(m => m.name.includes(markQuery.value) || m.desc.includes(markQuery.value))
})
function onMarkSearch() {}
function onMarkReset() { markQuery.value = '' }
const markEditVisible = ref(false)
const markEditForm = ref({ id: 0 as number, name: '', desc: '' })
function openMarkEdit(m: any) {
  markEditForm.value = { id: m.id, name: m.name, desc: m.desc }
  markEditVisible.value = true
}
function saveMark() {
  if (!markEditForm.value.name || !markEditForm.value.desc) { ElMessage.warning('请填写完整'); return }
  if (markEditForm.value.id) {
    const m = marks.value.find(x => x.id === markEditForm.value.id)
    if (m) { m.name = markEditForm.value.name; m.desc = markEditForm.value.desc }
    ElMessage.success('标注已更新')
  } else {
    marks.value.unshift({ id: Date.now(), name: markEditForm.value.name, desc: markEditForm.value.desc, createdAt: '2026-09-14 14:30:00' })
    ElMessage.success('标注已新增')
  }
  markEditVisible.value = false
}
function delMark(m: any) {
  ElMessageBox.confirm('确认删除该标注？', '删除确认', { type: 'warning' })
    .then(() => { marks.value = marks.value.filter(x => x.id !== m.id); ElMessage.success('删除成功') })
    .catch(() => {})
}

/* 保留 Fold 引用避免未使用告警 */
void Fold
</script>

<style scoped>
.ps-root {
  background: #f5f6fa;
  min-height: calc(100vh - 120px);
  border-radius: 12px;
}
.ps-layout {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 120px);
}
.ps-main {
  flex: 1;
  min-width: 0;
  padding: 16px 20px;
  overflow: auto;
}
.ps-tabs {
  display: flex;
  gap: 6px;
  background: #fff;
  border-radius: 10px;
  padding: 6px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(15,23,42,.04);
}
.ps-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 7px;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  transition: all .2s;
}
.ps-tab:hover { background: #f5f6fa; }
.ps-tab.active { background: #3370FF; color: #fff; }
.ps-pane { min-height: 200px; }
.ps-pane-body {
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.ps-pane-body.column { flex-direction: column; }

/* 树 */
.ps-tree-panel {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid #eef0f4;
  padding-right: 16px;
}
.ps-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 12px;
}
.ps-fold-btn { cursor: pointer; color: #6b7280; }
.ps-tree-search { margin-bottom: 10px; }
.ps-tree { font-size: 13px; }
.ps-tree-node { font-size: 13px; }

.ps-policy-area { flex: 1; min-width: 0; }
.ps-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.ps-filter-bar.right { justify-content: flex-end; }
.ps-f-name { width: 200px; }
.ps-f-target { width: 130px; }

/* 政策卡片 */
.ps-policy-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.ps-policy-card {
  border: 1px solid #eef0f4;
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow .2s;
}
.ps-policy-card:hover { box-shadow: 0 4px 12px rgba(15,23,42,.08); }
.ps-policy-title { font-weight: 600; font-size: 15px; margin-bottom: 10px; }
.ps-policy-meta { display: flex; gap: 16px; margin-bottom: 8px; font-size: 13px; color: #6b7280; }
.ps-meta-item b { color: #1f2937; }
.ps-policy-time { font-size: 12px; color: #99a1b3; margin-bottom: 12px; }
.ps-policy-actions { display: flex; justify-content: flex-end; gap: 12px; }
.ps-act { font-size: 13px; cursor: pointer; }
.ps-act.green { color: #10b981; }
.ps-act.blue { color: #3370FF; }
.ps-act.red { color: #ef4444; }

/* 底部 */
.ps-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  color: #6b7280;
  font-size: 13px;
}

/* 步骤条 */
.ps-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.ps-step { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.ps-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;
}
.ps-step.active .ps-step-dot { background: #3370FF; color: #fff; }
.ps-step.done .ps-step-dot { background: #3370FF; color: #fff; }
.ps-step.active .ps-step-label { color: #3370FF; font-weight: 600; }
.ps-step-label { font-size: 14px; color: #6b7280; }
.ps-step:not(:last-child)::after {
  content: '———';
  color: #d1d5db;
  margin-left: 8px;
}
.ps-step-panel { background: #fff; border-radius: 12px; padding: 24px; }
.ps-step-tip { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
.ps-form { max-width: 640px; }
.ps-step-actions { display: flex; justify-content: center; gap: 12px; margin-top: 20px; }
.ps-file-name { margin-left: 10px; color: #10b981; font-size: 13px; }

/* 解析与规则 */
.ps-parse-list, .ps-rule-list { display: flex; flex-direction: column; gap: 10px; max-width: 720px; }
.ps-parse-item { display: flex; align-items: center; gap: 10px; }
.ps-rule-card {
  display: flex; align-items: center; gap: 10px;
  border: 1px solid #eef0f4; border-radius: 8px; padding: 10px 12px;
  position: relative;
}
.ps-rule-type { width: 130px; }
.ps-rule-desc { flex: 1; }
.ps-rule-tag { color: #10b981; font-size: 12px; background: #e6f7ef; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
.ps-del { color: #ef4444; cursor: pointer; }
.ps-rule-head {
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 600; font-size: 15px; margin: 16px 0 12px;
}

/* 表格 */
.ps-table { margin-bottom: 4px; }
.ps-reason { color: #3370FF; cursor: pointer; }

/* 推送 */
.ps-push-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }

/* 抽屉 */
.ps-detail-row { display: flex; margin-bottom: 14px; font-size: 14px; }
.ps-detail-row label { width: 90px; color: #6b7280; flex-shrink: 0; }
.ps-detail-row span { color: #1f2937; }
.ps-detail-title { font-weight: 600; margin: 16px 0 12px; font-size: 15px; }
.ps-detail-rule { font-size: 13px; color: #374151; margin-bottom: 8px; line-height: 1.6; }
.ps-sms { background: #f5f6fa; border-radius: 8px; padding: 10px; color: #374151; font-size: 13px; line-height: 1.7; flex: 1; }

/* 标注卡片 */
.ps-mark-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.ps-mark-card {
  border: 1px solid #eef0f4;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ps-mark-name { font-weight: 600; font-size: 15px; }
.ps-mark-desc { font-size: 13px; color: #4b5563; line-height: 1.7; min-height: 60px; }
.ps-mark-time { font-size: 12px; color: #99a1b3; }
</style>