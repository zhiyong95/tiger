<template>
  <div class="doc-page">
    <!-- 顶部流程引导条 -->
    <div class="flow-guide">
      <div class="flow-steps">
        <div
          v-for="(step, idx) in flowSteps"
          :key="idx"
          :class="['flow-step', { active: activeTab === step.key, done: stepDone[idx] }]"
          @click="switchFlow(step.key, idx)"
        >
          <el-icon><component :is="step.icon" /></el-icon>
          <span>{{ step.label }}</span>
          <div class="step-line" v-if="idx < flowSteps.length - 1"></div>
        </div>
      </div>
    </div>

    <!-- 功能导航标签带计数 -->
    <div class="nav-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['nav-tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <el-icon :size="20"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
        <span class="tab-badge">{{ tab.count }}</span>
      </div>
    </div>

    <!-- =========== Tab 1: 模板库 - 素材调取 =========== -->
    <template v-if="activeTab === 'template'">
      <div class="tab-content-wrap">
        <!-- 定位区 -->
        <div class="module-desc-bar">
          <div class="desc-left">
            <el-icon class="desc-icon"><FolderOpened /></el-icon>
            <div class="desc-text">
              <h4>【定位】公文素材库 | 全类型标准公文模板调取</h4>
              <p>覆盖请示/报告/通知/批复/函件/纪要/通报8大公文类型，支持按业务领域筛选、收藏、高频模板推荐。</p>
            </div>
          </div>
          <div class="quick-commands">
            <span class="cmd-label">短口令：</span>
            <el-button size="small" @click="quickCmd('all-template')">全部模板</el-button>
            <el-button size="small" @click="quickCmd('my-fav')">我收藏的</el-button>
            <el-button size="small" @click="quickCmd('recent-use')">最近使用</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="filter-left">
            <div class="filter-group">
              <span class="filter-label">公文类型</span>
              <div class="filter-tags">
                <span
                  v-for="dt in docTypeOptions"
                  :key="dt.key"
                  :class="['filter-tag', { active: selectedDocType === dt.key }]"
                  @click="selectedDocType = dt.key"
                >{{ dt.label }}<span class="tag-count">({{ dt.count }})</span></span>
              </div>
            </div>
            <div class="filter-group">
              <span class="filter-label">业务领域</span>
              <el-select v-model="selectedField" placeholder="全部领域" size="small" class="field-select">
                <el-option label="全部领域" value="" />
                <el-option label="综合管理" value="综合管理" />
                <el-option label="就业促进" value="就业促进" />
                <el-option label="社会保险" value="社会保险" />
                <el-option label="人才开发" value="人才开发" />
                <el-option label="劳动关系" value="劳动关系" />
              </el-select>
            </div>
            <el-input v-model="searchQuery" placeholder="搜索模板名称、文号..." prefix-icon="Search" size="small" class="search-input" clearable />
          </div>
          <div class="filter-right">
            <el-button type="primary" size="small" @click="showCreateTemplateDialog">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon>上传新模板
            </el-button>
          </div>
        </div>

        <!-- 完整指令口令区 -->
        <div class="ai-command-area">
          <el-input
            v-model="aiCmdTemplate"
            placeholder="完整指令口令示例：生成一份关于2026年就业促进工作的通知，要求符合党政机关公文格式GB/T 9704-2012标准，文号：X人社发〔2026〕15号..."
            size="large"
            class="cmd-input"
          >
            <template #append>
              <el-button type="primary" @click="executeAICmd('template')">调取素材生成初稿</el-button>
            </template>
          </el-input>
        </div>

        <!-- 模板卡片网格 -->
        <div class="template-grid">
          <div class="template-card" v-for="tpl in filteredTemplates" :key="tpl.id" @click="openTemplate(tpl)">
            <div class="card-header">
              <div class="type-icon" :style="{ backgroundColor: tpl.iconBg }">
                <el-icon :color="tpl.iconColor"><component :is="tpl.icon" /></el-icon>
              </div>
              <div class="card-meta">
                <span class="tpl-type-badge" :class="tpl.type">{{ tpl.typeName }}</span>
                <el-icon v-if="tpl.isStar" class="star-icon" color="#f59e0b"><StarFilled /></el-icon>
              </div>
            </div>
            <h5 class="tpl-name">{{ tpl.name }}</h5>
            <p class="tpl-desc">{{ tpl.description }}</p>
            <div class="card-footer">
              <span class="tpl-field">{{ tpl.field }}</span>
              <span class="tpl-count"><el-icon><DocumentCopy /></el-icon> {{ tpl.useCount }}次使用</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- =========== Tab 2: AI生成 - 文稿创作 =========== -->
    <template v-if="activeTab === 'ai-gen'">
      <div class="tab-content-wrap">
        <div class="module-desc-bar">
          <div class="desc-left">
            <el-icon class="desc-icon" color="#2563eb"><MagicStick /></el-icon>
            <div class="desc-text">
              <h4>【定位】AI文稿创作 | 基于人社公文知识库智能生成初稿</h4>
              <p>输入发文背景、核心要素、业务要求，AI自动调取标准模板与政策参考，生成符合政务规范的公文初稿。</p>
            </div>
          </div>
          <div class="quick-commands">
            <span class="cmd-label">短口令：</span>
            <el-button size="small" @click="quickCmd('gen-notice')">生成通知</el-button>
            <el-button size="small" @click="quickCmd('gen-report')">生成报告</el-button>
            <el-button size="small" @click="quickCmd('gen-request')">生成请示</el-button>
            <el-button size="small" @click="quickCmd('gen-summary')">生成纪要</el-button>
          </div>
        </div>

        <div class="ai-gen-layout">
          <!-- 左侧要素填报 -->
          <div class="left-panel">
            <div class="panel-title">
              <el-icon><EditPen /></el-icon>
              <span>发文要素填报</span>
            </div>
            <el-form label-position="top" size="small">
              <el-form-item label="公文类型">
                <el-select v-model="genForm.docType" placeholder="请选择">
                  <el-option label="通知" value="通知" />
                  <el-option label="请示" value="请示" />
                  <el-option label="报告" value="报告" />
                  <el-option label="函件" value="函件" />
                  <el-option label="会议纪要" value="会议纪要" />
                  <el-option label="通报" value="通报" />
                </el-select>
              </el-form-item>
              <el-form-item label="发文机关">
                <el-input v-model="genForm.issuer" placeholder="如：XX市人力资源和社会保障局" />
              </el-form-item>
              <el-form-item label="文号">
                <el-input v-model="genForm.docNumber" placeholder="如：X人社发〔2026〕15号" />
              </el-form-item>
              <el-form-item label="发文标题">
                <el-input v-model="genForm.title" placeholder="请输入公文标题" />
              </el-form-item>
              <el-form-item label="主送机关">
                <el-input v-model="genForm.recipient" placeholder="如：各区县人力资源和社会保障局" />
              </el-form-item>
              <el-form-item label="核心内容描述">
                <el-input v-model="genForm.description" type="textarea" :rows="5" placeholder="简要描述发文背景、涉及事项、工作要求、时间节点..." />
              </el-form-item>
              <el-form-item label="参考政策">
                <el-select v-model="genForm.policyRefs" multiple placeholder="可多选关联政策文件">
                  <el-option v-for="p in policyList" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" style="width: 100%" size="large" @click="generateDoc" :loading="generating">
                  <el-icon style="margin-right: 6px;"><MagicStick /></el-icon>AI 生成初稿
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          <!-- 右侧生成文稿预览 -->
          <div class="right-panel">
            <div class="panel-title">
              <el-icon><Notebook /></el-icon>
              <span>文稿预览区</span>
            </div>
            <div class="doc-preview-editor">
              <div class="editor-header">
                <span class="tip-text">生成状态：{{ generating ? 'AI正在创作中...' : (generatedContent ? '已生成' : '等待生成') }}</span>
              </div>
              <div class="editor-area" v-html="generatedContent || placeholderEditor">
              </div>
            </div>
            <div class="ai-command-area ai-gen-full">
              <el-input
                v-model="aiCmdGen"
                placeholder="完整指令口令示例：生成一份关于开展2026年度全市社保基金专项检查工作的通知，发文机关XX市人社局，文号X人社发〔2026〕12号，要求检查范围覆盖7个区县，检查时间9月至10月..."
                size="large"
                class="cmd-input"
              >
                <template #append>
                  <el-button type="primary" @click="executeAICmd('gen')">下发完整指令</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- =========== Tab 3: 合规审校 - 风险校验 =========== -->
    <template v-if="activeTab === 'audit'">
      <div class="tab-content-wrap">
        <div class="module-desc-bar">
          <div class="desc-left">
            <el-icon class="desc-icon" color="#ef4444"><CircleCheck /></el-icon>
            <div class="desc-text">
              <h4>【定位】合规智能审校 | 政策一致性、格式规范、敏感词三重校验</h4>
              <p>自动比对人社政策知识库、敏感词库、公文格式国标，输出审校报告与修改建议，确保公文零风险。</p>
            </div>
          </div>
          <div class="quick-commands">
            <span class="cmd-label">短口令：</span>
            <el-button size="small" @click="quickCmd('full-check')">全量审校</el-button>
            <el-button size="small" @click="quickCmd('policy-check')">政策核查</el-button>
            <el-button size="small" @click="quickCmd('format-check')">格式校验</el-button>
            <el-button size="small" @click="quickCmd('sensitive-check')">敏感词检测</el-button>
          </div>
        </div>

        <div class="audit-layout">
          <div class="audit-left">
            <div class="panel-title">上传待审公文</div>
            <el-upload drag action="#" :auto-upload="false" :on-change="onFileUpload" class="upload-area">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽 docx/doc/pdf 文件到此处 <em>点击或上传</em></div>
              <template #tip>支持 Word 文档、PDF 文件，最大 20MB</template>
            </el-upload>
            <div class="audit-stats">
              <div class="stat-item success">
                <span class="stat-num">{{ auditStats.passed }}</span>
                <span class="stat-label">合规通过</span>
              </div>
              <div class="stat-item warning">
                <span class="stat-num">{{ auditStats.warning }}</span>
                <span class="stat-label">警告项</span>
              </div>
              <div class="stat-item danger">
                <span class="stat-num">{{ auditStats.error }}</span>
                <span class="stat-label">风险项</span>
              </div>
            </div>
            <el-button type="primary" style="width:100%; margin-top:16px;" @click="runAudit" :loading="auditing">
              <el-icon style="margin-right: 6px;"><View /></el-icon>一键执行合规审校
            </el-button>
          </div>
          <div class="audit-right">
            <div class="panel-title">审校问题详情</div>
            <div class="issue-list">
              <div class="issue-card" v-for="iss in auditIssues" :key="iss.id" :class="iss.level">
                <div class="issue-header">
                  <el-tag :type="levelTagType(iss.level)" size="small">{{ levelText(iss.level) }}</el-tag>
                  <span class="issue-type">{{ iss.type }}</span>
                </div>
                <p class="issue-content">{{ iss.content }}</p>
                <div class="issue-suggest">
                  <el-icon><InfoFilled /></el-icon>
                  <span>修改建议：{{ iss.suggestion }}</span>
                </div>
                <div class="issue-actions">
                  <el-button size="small" @click="acceptSuggestion(iss)">采纳建议</el-button>
                  <el-button size="small" type="primary">一键修正</el-button>
                </div>
              </div>
              <el-empty v-if="!auditing && auditIssues.length === 0" description="暂无审校结果，请上传文件后执行审校" />
              <div v-if="auditing" class="loading-audit">
                <el-icon class="is-loading" size="32"><Loading /></el-icon>
                <span>审校分析中，请稍候...</span>
              </div>
            </div>
            <div class="ai-command-area">
              <el-input
                v-model="aiCmdAudit"
                placeholder="完整指令口令示例：检查这份通知中是否存在与《社会保险法》第 60 条冲突的表述，同时校验文号格式是否符合X人社发〔2026〕XX号规范..."
                size="large"
                class="cmd-input"
              >
                <template #append>
                  <el-button type="primary" @click="executeAICmd('audit')">下发审校指令</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- =========== Tab 4: 排版导出 - 标准化输出 =========== -->
    <template v-if="activeTab === 'layout'">
      <div class="tab-content-wrap">
        <div class="module-desc-bar">
          <div class="desc-left">
            <el-icon class="desc-icon" color="#10b981"><Printer /></el-icon>
            <div class="desc-text">
              <h4>【定位】公文标准化排版 | 党政机关公文格式 GB/T 9704-2012 一键套红</h4>
              <p>内置正式版标准红头模板，自定义页边距、行距、字体字号，导出PDF正式版和Word可编辑版。</p>
            </div>
          </div>
          <div class="quick-commands">
            <span class="cmd-label">短口令：</span>
            <el-button size="small" @click="quickCmd('gb-standard')">国标排版</el-button>
            <el-button size="small" @click="quickCmd('hongtou')">红头套红</el-button>
            <el-button size="small" @click="quickCmd('export-pdf')">导出PDF</el-button>
            <el-button size="small" @click="quickCmd('export-word')">导出Word</el-button>
          </div>
        </div>

        <div class="layout-config-area">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="config-card">
                <h5><el-icon><Setting /></el-icon>排版参数</h5>
                <el-form label-position="top" size="small">
                  <el-form-item label="公文版式">
                    <el-radio-group v-model="layoutCfg.format">
                      <el-radio label="gb">GB/T 9704 标准 A4</el-radio>
                      <el-radio label="hongtou">红头文件</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="页边距">
                    <el-select v-model="layoutCfg.margin">
                      <el-option label="标准上下2.54cm 左右3.17cm" value="std" />
                      <el-option label="政务公文 上3.7 下3.5 左右2.8" value="gov" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="正文字体字号">
                    <el-select v-model="layoutCfg.font">
                      <el-option label="三号仿宋_GB2312" value="fangsong" />
                      <el-option label="三号楷体" value="kaiti" />
                      <el-option label="四号宋体" value="song" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="行间距">
                    <el-select v-model="layoutCfg.lineHeight">
                      <el-option label="28磅" value="28" />
                      <el-option label="固定29磅" value="29" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" style="width:100%" @click="applyLayout">
                      一键应用标准排版
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-col>
            <el-col :span="18">
              <div class="preview-canvas">
                <div class="page-preview">
                  <div class="preview-inner">
                    <div class="hongtou-bar" v-if="layoutCfg.format === 'hongtou'">
                      <h1>XX市人力资源和社会保障局</h1>
                      <div class="red-line"></div>
                    </div>
                    <div class="preview-content" v-html="layoutPreview || layoutPlaceholder">
                  </div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="export-actions">
          <el-button type="success" size="large" @click="exportDoc('pdf')">
            <el-icon style="margin-right: 6px;"><Download /></el-icon> 导出 PDF 正式文件
          </el-button>
          <el-button type="primary" size="large" @click="exportDoc('word')">
            <el-icon style="margin-right: 6px;"><Document /></el-icon> 导出 Word 可编辑版
          </el-button>
        </div>
        <div class="ai-command-area">
          <el-input
            v-model="aiCmdLayout"
            placeholder="完整指令口令示例：按照党政机关公文格式GB/T 9704-2012 红头模板排版，正文使用三号仿宋GB2312，每页22行每行28字，页边距政务标准..."
            size="large"
            class="cmd-input"
          >
            <template #append>
              <el-button type="primary" @click="executeAICmd('layout')">下发排版指令</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </template>

    <!-- =========== Tab 5: 检索归档 - 资料留存 =========== -->
    <template v-if="activeTab === 'archive'">
      <div class="tab-content-wrap">
        <div class="module-desc-bar">
          <div class="desc-left">
            <el-icon class="desc-icon" color="#6366f1"><FolderOpened /></el-icon>
            <div class="desc-text">
              <h4>【定位】公文检索归档 | 全文检索 + 元数据标签化归档留存</h4>
              <p>建立公文电子档案库，支持全文语义检索、多字段组合筛选、分类打标，自动生成归档目录和档案号。</p>
            </div>
          </div>
          <div class="quick-commands">
            <span class="cmd-label">短口令：</span>
            <el-button size="small" @click="quickCmd('archive-this')">归档当前</el-button>
            <el-button size="small" @click="quickCmd('search-full')">全文检索</el-button>
            <el-button size="small" @click="quickCmd('my-archive')">我的归档</el-button>
            <el-button size="small" @click="quickCmd('batch-archive')">批量归档</el-button>
          </div>
        </div>
        <el-table :data="archiveList" stripe size="small">
          <el-table-column prop="archiveNo" label="档案号" width="180" />
          <el-table-column prop="docName" label="公文名称" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="archiveDate" label="归档日期" width="120" />
          <el-table-column prop="operator" label="归档人" width="100" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link size="small">查看</el-button>
              <el-button link size="small">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="ai-command-area">
          <el-input
            v-model="aiCmdArchive"
            placeholder="完整指令口令示例：请在归档库中检索2025年以来所有关于就业促进补贴的通知类公文，按文号排序，生成检索结果清单..."
            size="large"
            class="cmd-input"
          >
            <template #append>
              <el-button type="primary" @click="executeAICmd('archive')">下发检索归档指令</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </template>

    <!-- =========== Tab 6: 流转督办 - 协同流转 =========== -->
    <template v-if="activeTab === 'flow'">
      <div class="tab-content-wrap">
        <div class="module-desc-bar">
          <div class="desc-left">
            <el-icon class="desc-icon" color="#f59e0b"><Bell /></el-icon>
            <div class="desc-text">
              <h4>【定位】公文流转督办 | 多部门协同审批与进度跟踪</h4>
              <p>发起公文审批流程，实时查看各环节审批状态，超时自动督办提醒，催办转办全程留痕审计。</p>
            </div>
          </div>
          <div class="quick-commands">
            <span class="cmd-label">短口令：</span>
            <el-button size="small" @click="quickCmd('start-flow')">发起流转</el-button>
            <el-button size="small" @click="quickCmd('my-pending')">待我处理</el-button>
            <el-button size="small" @click="quickCmd('my-apply')">我的发起</el-button>
            <el-button size="small" @click="quickCmd('supervise')">超时督办</el-button>
          </div>
        </div>
        <el-table :data="flowTaskList" stripe size="small">
          <el-table-column prop="docName" label="公文名称" />
          <el-table-column prop="status" label="当前状态" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.statusType">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="currentNode" label="当前节点" width="130" />
          <el-table-column prop="handler" label="当前处理人" width="110" />
          <el-table-column prop="deadline" label="截止时间" width="130" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link size="small">查看进度</el-button>
              <el-button link size="small">催办</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="ai-command-area">
          <el-input
            v-model="aiCmdFlow"
            placeholder="完整指令口令示例：将这份《2026年全市社保基金检查通知》公文提交审批，流转路径：办公室核稿→分管领导审核→主要领导签发→发文..."
            size="large"
            class="cmd-input"
          >
            <template #append>
              <el-button type="primary" @click="executeAICmd('flow')">下发流转指令</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  Document, FolderOpened, MagicStick, CircleCheck, Printer,
  Bell, Search, Plus, StarFilled, DocumentCopy,
  EditPen, Notebook, UploadFilled, View, InfoFilled,
  Loading, Setting, Download, DocumentCopy as DocumentIcon, Clock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('template')
const generating = ref(false)
const auditing = ref(false)
const searchQuery = ref('')
const selectedDocType = ref('all')
const selectedField = ref('')
const aiCmdTemplate = ref('')
const aiCmdGen = ref('')
const aiCmdAudit = ref('')
const aiCmdLayout = ref('')
const aiCmdArchive = ref('')
const aiCmdFlow = ref('')

// 流程步骤引导
const flowSteps = [
  { key: 'template', label: '素材调取', icon: FolderOpened },
  { key: 'ai-gen', label: '文稿创作', icon: MagicStick },
  { key: 'audit', label: '风险校验', icon: CircleCheck },
  { key: 'layout', label: '标准输出', icon: Printer },
  { key: 'archive', label: '资料留存', icon: FolderOpened },
  { key: 'flow', label: '协同流转', icon: Bell },
]
const stepDone = ref([false, false, false, false, false, false])

const tabs = [
  { key: 'template', label: '模板库', icon: Document, count: '128' },
  { key: 'ai-gen', label: 'AI生成', icon: MagicStick, count: '' },
  { key: 'audit', label: '合规审校', icon: CircleCheck, count: '3' },
  { key: 'layout', label: '排版导出', icon: Printer, count: '' },
  { key: 'archive', label: '检索归档', icon: 'FolderOpened', count: '12.4K' },
  { key: 'flow', label: '流转督办', icon: Bell, count: '24' },
]

const docTypeOptions = [
  { key: 'all', label: '全部', count: 128 },
  { key: 'notice', label: '通知', count: 42 },
  { key: 'report', label: '报告', count: 18 },
  { key: 'request', label: '请示', count: 15 },
  { key: 'reply', label: '批复', count: 11 },
  { key: 'letter', label: '函件', count: 9 },
  { key: 'summary', label: '纪要', count: 22 },
  { key: 'warn', label: '通报', count: 11 },
]

const genForm = ref({
  docType: '',
  issuer: 'XX市人力资源和社会保障局',
  docNumber: '',
  title: '',
  recipient: '',
  description: '',
  policyRefs: [] as number[]
})

const policyList = ref([
  { id: 1, name: '社会保险法（2018修正）' },
  { id: 2, name: '就业促进法' },
  { id: 3, name: '事业单位人事管理条例' },
  { id: 4, name: '劳动合同法' }
])

const generatedContent = ref('')
const placeholderEditor = ref(`<div style="padding:40px;text-align:center;color:#9ca3af;">
  <p>请在左侧填写发文要素，点击「AI生成初稿」</p>
  <p>系统将基于人社知识库生成符合规范的公文文稿</p>
</div>`)

const layoutCfg = ref({
  format: 'gb',
  margin: 'gov',
  font: 'fangsong',
  lineHeight: '28'
})
const layoutPreview = ref('')
const layoutPlaceholder = ref(`<div class="preview-placeholder" style="text-align:center;color:#9ca3af;padding:120px 0;">
 公文预览区 —— 导入已审校通过的文稿后，将在此处展示国标排版后效果...
</div>`)

const stats = ref({
  monthlyGenerated: 387,
  approvalRate: 98.6,
  aiSavedHours: 156,
  inProgress: 24,
  totalArchived: 12438
})

const templates = ref([
  { id: 1, name: '关于开展年度就业补助资金专项检查的通知', description: '适用于就业资金专项检查部署发文，含检查范围、时间节点、材料清单', icon: Document, iconBg: '#dbeafe', iconColor: '#2563eb', type: 'notice', typeName: '通知', field: '就业促进', useCount: 423, isStar: true },
  { id: 2, name: '关于申请增加就业服务中心人员编制的请示', description: '向上级编制部门申请人员编制，说明机构情况、缺编原因、编制需求', icon: Document, iconBg: '#dcfce7', iconColor: '#16a34a', type: 'request', typeName: '请示', field: '综合管理', useCount: 187, isStar: false },
  { id: 3, name: '关于2025年度社会保险基金运行情况的报告', description: '向市政府或人大汇报年度社保基金收支运行、基金监管情况', icon: Document, iconBg: '#fef3c7', iconColor: '#d97706', type: 'report', typeName: '报告', field: '社会保险', useCount: 312, isStar: true },
  { id: 4, name: '关于同意开展人社政务服务延时服务的批复', description: '对下级局关于延时服务事项的请示作出正式批复，明确实施时间和范围', icon: Document, iconBg: '#fef2f2', iconColor: '#dc2626', type: 'reply', typeName: '批复', field: '综合管理', useCount: 96, isStar: false },
])
const filteredTemplates = computed(() => {
  let arr = templates.value
  if (selectedDocType.value !== 'all') {
    arr = arr.filter(t => t.type === selectedDocType.value)
  }
  if (selectedField.value) {
    arr = arr.filter(t => t.field === selectedField.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    arr = arr.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }
  return arr
})

const auditStats = ref({ passed: 12, warning: 2, error: 1 })
const auditIssues = ref<any[]>([])
const archiveList = ref([
  { archiveNo: 'RSDA-2026-0001', docName: '关于做好2026年春节期间农民工返乡服务工作的通知', type: '通知', archiveDate: '2026-01-18', operator: '张明' },
  { archiveNo: 'RSDA-2026-0002', docName: '2025年度全市人社工作总结及2026年工作要点报告', type: '报告', archiveDate: '2026-01-12', operator: '李华' },
  { archiveNo: 'RSDA-2026-0003', docName: '关于调整社保缴费基数上下限的通知', type: '通知', archiveDate: '2026-01-08', operator: '王芳' },
])
const flowTaskList = ref([
  { docName: '关于开展社保基金专项检查的通知', status: '审批中', statusType: 'warning', currentNode: '分管领导审核', handler: '陈局长', deadline: '今日18:00前' },
  { docName: '2026年就业补助资金分配方案报告', status: '已签发', statusType: 'success', currentNode: '已完成', handler: '-', deadline: '已办结' },
  { docName: '关于调整政务服务窗口作息时间的通知', status: '待我签', statusType: 'danger', currentNode: '主要领导签发', handler: '张局', deadline: '剩余2小时' },
])

function switchFlow(key: string, idx: number) {
  activeTab.value = key
  stepDone.value.fill(true, 0, idx)
  ElMessage.success(`进入第${idx+1}环节：${flowSteps[idx].label}`)
}

function quickCmd(cmd: string) {
  ElMessage.success(`执行短口令：${cmd}`)
}

function executeAICmd(area: string) {
  const map: Record<string, string> = {
    template: '已下发AI素材调取指令',
    gen: '已下发AI文稿创作指令',
    audit: '已下发AI合规审校指令',
    layout: '已下发AI排版指令',
    archive: '已下发AI检索归档指令',
    flow: '已下发AI流转督办指令'
  }
  ElMessage.success(map[area] || '指令已下发')
}

function generateDoc() {
  if (!genForm.value.docType || !genForm.value.title) {
    ElMessage.warning('请先填写公文类型和标题')
    return
  }
  generating.value = true
  setTimeout(() => {
    generating.value = false
    stepDone.value[1] = true
    generatedContent.value = `<div style="padding:24px; font-family:SimSun, serif;">
      <h2 style="text-align:center; font-size: 22px; font-weight:bold; margin-bottom:20px;">${genForm.value.title}</h2>
      <p style="text-indent:2em; line-height:29px;">${genForm.value.recipient}：</p>
      <p style="text-indent:2em; line-height:29px;">根据工作安排，现将有关事项通知如下...</p>
      <p style="text-align:right; margin-top:60px;">${genForm.value.issuer}</p>
      <p style="text-align:right;">2026年X月X日</p>
    </div>`
    ElMessage.success('AI公文初稿生成完成！')
  }, 2000)
}

function runAudit() {
  auditing.value = true
  setTimeout(() => {
    auditing.value = false
    stepDone.value[2] = true
    auditIssues.value = [
      { id: 1, level: 'error', type: '政策一致性', content: '文中第3段表述“失业金发放标准不低于当地最低工资80%”，与《社会保险法》第47条规定“不低于城市居民最低生活保障标准”不一致', suggestion: '建议调整为符合社会保险法的正式表述' },
      { id: 2, level: 'warning', type: '文号格式', content: '文号“X人社发〔2026〕15”缺少后文字“号”', suggestion: '补充完整为 X人社发〔2026〕15号' },
    ]
    auditStats.value = { ...auditStats.value, passed: 9, warning: 2, error: 1 }
    ElMessage.success('审校完成，共发现3项需关注问题')
  }, 1800)
}

function applyLayout() {
  stepDone.value[3] = true
  ElMessage.success(`已应用 ${layoutCfg.value.format === 'hongtou' ? '红头套红' : 'GB/T 9704-2012 标准'} 排版`)
}

function exportDoc(type: string) {
  ElMessage.success(`正在导出${type === 'pdf' ? 'PDF正式文件' : 'Word可编辑版'}...`)
}

function openTemplate(tpl: any) {
  ElMessage.info(`打开模板：${tpl.name}`)
}

function showCreateTemplateDialog() {
  ElMessage.info('打开上传新模板对话框')
}

function onFileUpload(file: any) {
  ElMessage.info(`已选择文件：${file.name}`)
}

function levelText(lv: string) {
  const m: Record<string, string> = { error: '风险', warning: '警告', success: '合规' }
  return m[lv] || ''
}
function levelTagType(lv: string) {
  const m: Record<string, any> = { error: 'danger', warning: 'warning', success: 'success' }
  return m[lv] || 'info'
}
function acceptSuggestion(iss: any) {
  ElMessage.success('已采纳修改建议')
}

onMounted(() => {
  // 默认选中第一个Tab
})
</script>

<style scoped>
.doc-page {
  min-height: calc(100vh - 56px);
  background: var(--bg-main, #f8f9fa);
}

.flow-guide {
  background: white;
  padding: 16px 24px 0;
}
.flow-steps {
  display: flex;
  align-items: center;
  gap: 0;
}
.flow-step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  position: relative;
}
.flow-step.active {
  color: #2563eb;
  background: #eff6ff;
  font-weight: 600;
}
.flow-step.done {
  color: #10b981;
}
.flow-step .step-line {
  position: absolute;
  right: -10px;
  top: 50%;
  width: 20px;
  height: 2px;
  border-bottom: 2px dashed #d1d5db;
}
.flow-step.done .step-line,
.flow-step.active .step-line {
  border-bottom-color: #2563eb;
}

.nav-tabs {
  display: flex;
  align-items: center;
  background: white;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
}
.nav-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  cursor: pointer;
  color: #6b7280;
  position: relative;
  transition: color 0.2s;
}
.nav-tab-item.active {
  color: #2563eb;
  font-weight: 600;
}
.nav-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #2563eb;
  border-radius: 2px 2px 0 0;
}
.tab-badge {
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.module-desc-bar {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.desc-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.desc-icon {
  font-size: 32px;
  margin-top: 2px;
}
.desc-text h4 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #1f2937;
}
.desc-text p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
.quick-commands {
  white-space: nowrap;
}
.cmd-label {
  color: #6b7280;
  font-size: 13px;
  margin-right: 8px;
}

.filter-bar {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-label {
  font-size: 14px;
  color: #374151;
}
.filter-tags {
  display: flex;
  gap: 8px;
}
.filter-tag {
  padding: 6px 14px;
  border-radius: 8px;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
}
.filter-tag.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}
.search-input { min-width: 220px; }

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.template-card {
  background: white;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
}
.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.type-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tpl-type-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
}
.tpl-type-badge.notice { background: #dbeafe; color: #2563eb; }
.tpl-type-badge.request { background: #dcfce7; color: #16a34a; }
.tpl-type-badge.report { background: #fef3c7; color: #d97706; }
.tpl-type-badge.reply { background: #fef2f2; color: #dc2626; }
.tpl-name {
  margin: 0 0 6px;
  font-size: 15px;
  color: #1f2937;
}
.tpl-desc {
  margin: 0 0 10px;
  font-size: 13px;
  color: #6b7280;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
}

.ai-command-area {
  margin-top: 16px;
  margin-bottom: 20px;
}
.cmd-input {
  border-radius: 8px;
}

.tab-content-wrap {
  padding: 20px 24px;
}
.ai-gen-layout, .audit-layout {
  display: flex;
  gap: 20px;
}
.left-panel, .right-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 18px;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}
.doc-preview-editor {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-height: 420px;
}
.editor-header {
  padding: 10px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
}
.editor-area {
  min-height: 380px;
}
.upload-area {
  margin-bottom: 16px;
}
.audit-stats {
  display: flex;
  gap: 12px;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  background: #f9fafb;
}
.stat-item.success .stat-num { color: #10b981; font-size: 28px; font-weight: bold; }
.stat-item.warning .stat-num { color: #f59e0b; font-size: 28px; font-weight: bold; }
.stat-item.danger .stat-num { color: #ef4444; font-size: 28px; font-weight: bold; }
.issue-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}
.issue-card.danger { border-left: 4px solid #ef4444; background: #fef2f2; }
.issue-card.warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
.issue-card.success { border-left: 4px solid #10b981; background: #f0fdf4; }
.issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.issue-suggest { display: flex; align-items: flex-start; gap: 6px; margin-top: 10px; padding: 10px; background: #fffbeb; border-radius: 8px; font-size: 13px; color: #d97706; }
.issue-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.loading-audit { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 0; color: #6b7280; }

.config-card {
  background: white;
  border-radius: 12px;
  padding: 18px;
}
.config-card h5 {
  margin: 0 0 16px;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-preview {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.preview-inner {
  padding: 50px 40px;
  min-height: 700px;
}
.hongtou-bar {
  text-align: center;
}
.hongtou-bar h1 {
  color: #c41e3a;
  font-size: 28px;
  font-weight: bold;
  font-family: SimSun, serif;
  margin: 0 0 8px;
}
.red-line {
  height: 3px;
  background: #c41e3a;
  margin-top: 6px;
}
.preview-placeholder {
  text-align: center;
  color: #9ca3af;
  padding: 120px 0;
}
.export-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin: 20px 0;
}
</style>
