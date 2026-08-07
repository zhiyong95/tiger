<template>
  <div class="document-page">
    <!-- 顶部统计卡片区 -->
    <div class="stats-row">
      <el-card class="stat-card shadow-sm">
        <div class="stat-content">
          <div class="stat-icon bg-blue">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-text">
            <div class="stat-value">387</div>
            <div class="stat-label">本月已生成</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-content">
          <div class="stat-icon bg-green">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-text">
            <div class="stat-value">98.6%</div>
            <div class="stat-label">合规通过率</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-content">
          <div class="stat-icon bg-orange">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-text">
            <div class="stat-value">156h</div>
            <div class="stat-label">AI节省工时</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-content">
          <div class="stat-icon bg-purple">
            <el-icon><Share /></el-icon>
          </div>
          <div class="stat-text">
            <div class="stat-value">24</div>
            <div class="stat-label">流转处理中</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card shadow-sm">
        <div class="stat-content">
          <div class="stat-icon bg-gray">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div class="stat-text">
            <div class="stat-value">12438</div>
            <div class="stat-label">已归档</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 政务公文全流程步骤条 -->
    <el-steps v-model="currentStep" finish-status="success" align-center class="process-steps">
      <el-step title="素材调取" description="模板库"></el-step>
      <el-step title="文稿创作" description="AI生成"></el-step>
      <el-step title="风险校验" description="合规审校"></el-step>
      <el-step title="标准化输出" description="排版导出"></el-step>
      <el-step title="资料留存" description="检索归档"></el-step>
      <el-step title="协同流转" description="流转督办"></el-step>
    </el-steps>

    <!-- 模块Tab导航 -->
    <el-tabs v-model="activeTab" class="document-tabs" type="card">
      <el-tab-pane label="模板库" name="library">
        <template #label>
          <span class="tab-label"><el-icon><FolderOpened /></el-icon> 模板库 <el-tag size="small" type="info" effect="plain">128</el-tag></span>
        </template>
        <div class="library-section">
          <div class="filter-bar">
            <el-radio-group v-model="selectedDocType" size="default">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="notice">通知</el-radio-button>
              <el-radio-button value="report">报告</el-radio-button>
              <el-radio-button value="request">请示</el-radio-button>
              <el-radio-button value="reply">批复</el-radio-button>
              <el-radio-button value="letter">函件</el-radio-button>
              <el-radio-button value="minutes">纪要</el-radio-button>
              <el-radio-button value="briefing">通报</el-radio-button>
            </el-radio-group>
            <div class="filter-right">
              <el-select v-model="selectedBizArea" placeholder="业务领域" clearable style="width: 160px; margin-right: 12px;">
                <el-option label="就业" value="employment"></el-option>
                <el-option label="社保" value="social"></el-option>
                <el-option label="劳动关系" value="labor"></el-option>
                <el-option label="人才" value="talent"></el-option>
                <el-option label="人事" value="hr"></el-option>
                <el-option label="综合" value="general"></el-option>
              </el-select>
              <el-input v-model="searchKeyword" placeholder="搜索模板名称..." clearable style="width: 260px;">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </div>
          </div>

          <div class="sub-section-title">
            <el-icon color="#2563eb"><Star /></el-icon> 我收藏的模板
          </div>
          <div class="template-grid">
            <el-card class="template-card" v-for="tpl in starredTemplates" :key="tpl.id" shadow="hover" @click="useTemplate(tpl)">
              <div class="tpl-icon" :style="{background: tpl.bgColor}">
                <el-icon><component :is="tpl.icon" /></el-icon>
              </div>
              <div class="tpl-name">{{ tpl.name }}</div>
              <div class="tpl-meta">
                <el-tag size="small" type="info">{{ tpl.type }}</el-tag>
                <span class="tpl-hit">{{ tpl.usageCount }} 次使用</span>
              </div>
              <div class="tpl-actions">
                <el-button size="small" text type="primary" @click.stop="toggleStar(tpl)">
                  <el-icon :color="'#f59e0b'"><StarFilled /></el-icon>
                </el-button>
                <el-button size="small" text type="primary" @click.stop="previewTemplate(tpl)">预览</el-button>
                <el-button size="small" text type="primary" @click.stop="useTemplate(tpl)">使用</el-button>
              </div>
            </el-card>
          </div>

          <div class="sub-section-title">
            <el-icon color="#ff7c00"><TrendCharts /></el-icon> 部门热门模板
          </div>
          <div class="template-grid">
            <el-card class="template-card" v-for="tpl in hotTemplates" :key="tpl.id" shadow="hover" @click="useTemplate(tpl)">
              <div class="tpl-icon" :style="{background: tpl.bgColor}">
                <el-icon><component :is="tpl.icon" /></el-icon>
              </div>
              <div class="tpl-name">{{ tpl.name }}</div>
              <div class="tpl-meta">
                <el-tag size="small" type="success">{{ tpl.bizArea }}</el-tag>
                <span class="tpl-hit">{{ tpl.usageCount }} 次使用</span>
              </div>
              <div class="tpl-actions">
                <el-button size="small" text type="warning" @click.stop="toggleStar(tpl)">
                  <el-icon><Star /></el-icon>
                </el-button>
                <el-button size="small" text type="primary" @click.stop="previewTemplate(tpl)">预览</el-button>
                <el-button size="small" text type="primary" @click.stop="useTemplate(tpl)">使用</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="AI生成" name="generate">
        <template #label>
          <span class="tab-label"><el-icon><MagicStick /></el-icon> AI生成</span>
        </template>
        <div class="generate-three-col">
          <!-- 左侧：生成参数区 -->
          <div class="generate-col-left">
            <div class="col-header">生成参数</div>
            <el-form label-position="top" label-width="90px">
              <el-form-item label="公文类型">
                <el-select v-model="genParam.docType" placeholder="请选择公文类型">
                  <el-option label="通知" value="notice" />
                  <el-option label="报告" value="report" />
                  <el-option label="请示" value="request" />
                  <el-option label="批复" value="reply" />
                  <el-option label="函件" value="letter" />
                  <el-option label="纪要" value="minutes" />
                  <el-option label="通报" value="briefing" />
                  <el-option label="议案" value="proposal" />
                </el-select>
              </el-form-item>
              <el-form-item label="业务领域">
                <el-select v-model="genParam.bizArea" placeholder="请选择业务领域">
                  <el-option label="就业" value="employment" />
                  <el-option label="社保" value="social" />
                  <el-option label="劳动关系" value="labor" />
                  <el-option label="人才" value="talent" />
                  <el-option label="人事" value="hr" />
                  <el-option label="综合" value="general" />
                </el-select>
              </el-form-item>
              <el-form-item label="套用模板">
                <el-select v-model="genParam.templateId" clearable placeholder="可选：指定模板">
                  <el-option label="《关于开展就业补贴发放工作的通知》" value="tpl001" />
                  <el-option label="《关于报送人社工作进展的报告》" value="tpl002" />
                  <el-option label="《关于申请专项经费的请示》" value="tpl003" />
                </el-select>
              </el-form-item>
              <el-form-item label="主送机关">
                <el-input v-model="genParam.recipient" placeholder="如：局各科室、各县区人社局..."></el-input>
              </el-form-item>
              <el-form-item label="文风偏好">
                <el-radio-group v-model="genParam.style">
                  <el-radio-button value="formal">正式严谨</el-radio-button>
                  <el-radio-button value="concise">简洁明快</el-radio-button>
                  <el-radio-button value="detailed">详实全面</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="目标字数">
                <el-slider v-model="genParam.wordCount" :min="500" :max="8000" :step="100" show-input></el-slider>
              </el-form-item>
              <el-form-item label="引用政策">
                <el-select v-model="genParam.refPolicy" multiple placeholder="选择关联政策文件" style="width:100%;">
                  <el-option label="人社部令第45号" value="p001" />
                  <el-option label="粤人社规〔2025〕5号" value="p002" />
                  <el-option label="关于做好稳就业工作的通知" value="p003" />
                </el-select>
              </el-form-item>
              <el-form-item label="数据支撑">
                <el-switch v-model="genParam.enableDataRef" />
              </el-form-item>
              <el-divider></el-divider>
              <el-form-item>
                <el-button type="primary" class="w-full" :loading="generatingOutline" @click="startGenerateOutline">
                  <el-icon><MagicStick /></el-icon> 生成公文大纲
                </el-button>
              </el-form-item>
              <el-form-item>
                <el-button @click="showQuickCommands = !showQuickCommands">
                  <el-icon><Promotion /></el-icon> 查看短口令列表
                </el-button>
              </el-form-item>
              <el-collapse-transition>
                <div v-if="showQuickCommands" class="quick-cmd-list">
                  <el-tag v-for="cmd in quickCommands" :key="cmd" class="quick-cmd-tag" @click="applyQuickCmd(cmd)">{{ cmd }}</el-tag>
                </div>
              </el-collapse-transition>
            </el-form>
          </div>

          <!-- 中间：大纲/正文创作区 -->
          <div class="generate-col-center">
            <div class="col-header">
              <el-tag type="info" v-if="genStep === 'outline'">第一步：大纲确认</el-tag>
              <el-tag type="success" v-if="genStep === 'content'">第二步：正文生成</el-tag>
              <div class="header-actions">
                <el-button size="small" text @click="switchModel">切换政务模型</el-button>
                <el-button size="small" text @click="ideaGuide">思路引导</el-button>
                <el-button size="small" text @click="regenerateAll">重新生成</el-button>
              </div>
            </div>
            <div class="editor-area">
              <div v-if="genStep === 'outline'">
                <div class="outline-container">
                  <h4>📋 AI 已为您生成公文大纲</h4>
                  <div class="outline-content">
                    <el-input v-model="documentOutline" type="textarea" :rows="18" placeholder="公文大纲将在此生成..."></el-input>
                  </div>
                  <div class="outline-actions">
                    <el-button type="primary" @click="acceptOutline">✅ 采用此大纲</el-button>
                    <el-button @click="editOutline">✏️ 编辑大纲</el-button>
                    <el-button @click="regenerateOutline">🔄 换一版大纲</el-button>
                  </div>
                </div>
              </div>
              <div v-if="genStep === 'content'">
                <div class="content-container">
                  <h4>📝 基于大纲生成公文正文</h4>
                  <el-input v-model="documentContent" type="textarea" :rows="22" placeholder="正式公文正文..."></el-input>
                  <div class="version-actions">
                    <el-button size="small" @click="showVersionHistory = !showVersionHistory">版本历史</el-button>
                    <el-button size="small" type="primary">保存当前版本</el-button>
                  </div>
                  <el-collapse-transition>
                    <div v-if="showVersionHistory" class="version-list">
                      <el-timeline>
                        <el-timeline-item v-for="v in versions" :key="v.id" :timestamp="v.time" placement="top">
                          <el-card shadow="never" class="version-item">
                            <div class="version-name">版本 {{v.id}}</div>
                            <el-button size="small" text @click="restoreVersion(v)">恢复此版本</el-button>
                          </el-card>
                        </el-timeline-item>
                      </el-timeline>
                    </div>
                  </el-collapse-transition>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：实时预览 + 优化建议 -->
          <div class="generate-col-right">
            <div class="col-header">实时版式预览</div>
            <div class="preview-pane">
              <div class="preview-content">
                <div class="gb-paper-preview" v-if="documentContent">
                  <h3 class="preview-title">{{ genParam.docType === 'notice' ? '通知' : genParam.docType === 'report' ? '工作报告' : '公文标题' }}</h3>
                  <p class="preview-note" style="color:#999;font-size:12px;">实时预览...<br />(排版导出后将严格遵循 GB/T 9704-2012)</p>
                  <div style="margin-top:16px;color:#1f2937;white-space:pre-wrap;font-family:'SimSun',serif;font-size:14px;line-height:2;">{{ documentContent.slice(0, 800) }}...</div>
                </div>
                <el-empty v-else description="暂无文稿内容，生成后可在此预览版式"></el-empty>
              </div>
            </div>
            <div class="suggest-pane">
              <div class="col-header">AI 优化思路建议</div>
              <div class="suggest-list">
                <div class="suggest-item" v-for="s in suggestList" :key="s.id">
                  <el-icon><InfoFilled /></el-icon> {{ s.text }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="合规审校" name="audit">
        <template #label>
          <span class="tab-label"><el-icon><CircleCheck /></el-icon> 合规审校 <el-tag size="small" type="success" effect="plain">3</el-tag></span>
        </template>
        <div class="audit-full-container">
          <div class="audit-top-bar">
            <el-button type="primary" :loading="auditing" @click="startAudit">
              <el-icon><Check /></el-icon> 启动全量审校
            </el-button>
            <el-space>
              <el-button @click="filterAudit('policy')">政策核查</el-button>
              <el-button @click="filterAudit('format')">格式校验</el-button>
              <el-button @click="filterAudit('sensitive')">敏感词检测</el-button>
            </el-space>
            <el-button type="danger" @click="fixAllIssues">🚀 一键批量修复全部问题</el-button>
          </div>
          <div class="audit-main-row">
            <div class="audit-left-result">
              <div class="audit-score-card">
                <div class="score-value">{{ auditScore }}</div>
                <div class="score-label">综合合规得分</div>
                <el-tag :type="auditLevel === '优秀' ? 'success' : auditLevel === '合格' ? 'warning' : 'danger'">{{ auditLevel }}</el-tag>
              </div>
              <el-empty v-if="!audited" description="点击「启动全量审校」开始五级校验"></el-empty>
              <div v-if="audited" style="width: 100%; height: 280px;">
                <div ref="auditChartRef" style="width:100%;height:100%"></div>
              </div>
            </div>
            <div class="audit-right-list">
              <div class="risk-title">风险清单 ({{ filteredRisks.length }})</div>
              <el-card class="risk-item-card" v-for="risk in filteredRisks" :key="risk.id" shadow="never">
                <div class="risk-header">
                  <el-tag :type="risk.level === '高风险' ? 'danger' : 'warning'" size="small">{{ risk.level }}</el-tag>
                  <span class="risk-type">{{ risk.type }}</span>
                </div>
                <p class="risk-desc">问题描述：{{ risk.desc }}</p>
                <p class="risk-pos">位置：第{{ risk.lineNo }}行</p>
                <p class="risk-ref">政策依据：{{ risk.ruleRef }}</p>
                <p class="risk-suggest">修改建议：{{ risk.suggest }}</p>
                <div class="risk-actions">
                  <el-button size="small" text type="primary" @click="locateRisk(risk)">定位到正文</el-button>
                  <el-button size="small" type="success" @click="acceptFix(risk)">采纳修改</el-button>
                </div>
              </el-card>
            </div>
          </div>
          <el-input v-model="auditedDocumentContent" type="textarea" :rows="8" style="margin-top:16px;" placeholder="审校后文稿展示区域..."></el-input>
        </div>
      </el-tab-pane>

      <el-tab-pane label="排版导出" name="export">
        <template #label>
          <span class="tab-label"><el-icon><DocumentCopy /></el-icon> 排版导出</span>
        </template>
        <div class="export-three-col">
          <!-- 左侧：排版方案调整 -->
          <div class="export-col-left">
            <div class="col-header">排版格式调整</div>
            <el-form label-position="top">
              <el-form-item label="排版标准">
                <el-radio-group v-model="exportParam.standard">
                  <el-radio-button value="gb2012">GB/T 9704-2012 国标</el-radio-button>
                  <el-radio-button value="custom">自定义排版</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="页面设置">
                <el-select v-model="exportParam.paperSize">
                  <el-option label="A4 纸" value="A4" />
                  <el-option label="16开" value="16k" />
                </el-select>
              </el-form-item>
              <el-form-item label="页边距(mm)">
                <el-row :gutter="8">
                  <el-col :span="6"><el-input v-model.number="exportParam.marginTop" placeholder="上"></el-input></el-col>
                  <el-col :span="6"><el-input v-model.number="exportParam.marginBottom" placeholder="下"></el-input></el-col>
                  <el-col :span="6"><el-input v-model.number="exportParam.marginLeft" placeholder="左"></el-input></el-col>
                  <el-col :span="6"><el-input v-model.number="exportParam.marginRight" placeholder="右"></el-input></el-col>
                </el-row>
              </el-form-item>
              <el-form-item label="字体字号">
                <el-select v-model="exportParam.fontFamily">
                  <el-option label="宋体（SimSun）" value="SimSun" />
                  <el-option label="仿宋_GB2312" value="FangSong" />
                </el-select>
              </el-form-item>
              <el-form-item label="红头套红">
                <el-switch v-model="exportParam.enableRedHeader" />
              </el-form-item>
              <el-form-item label="电子签章">
                <el-switch v-model="exportParam.enableStamp" />
              </el-form-item>
              <el-form-item label="印章位置">
                <el-radio-group v-model="exportParam.stampPosition">
                  <el-radio-button value="bottom-right">文尾右下</el-radio-button>
                  <el-radio-button value="overlap">落款骑缝</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" class="w-full" @click="applyLayout">应用国标排版</el-button>
              </el-form-item>
            </el-form>
          </div>
          <!-- 中间：实时预览 -->
          <div class="export-col-center">
            <div class="col-header">
              实时版式预览
              <div class="preview-zoom-actions">
                <el-button-group>
                  <el-button size="small" @click="zoomOut"> - </el-button>
                  <el-button size="small">{{ previewZoom }}%</el-button>
                  <el-button size="small" @click="zoomIn"> + </el-button>
                </el-button-group>
                <el-button-group style="margin-left:8px;">
                  <el-button size="small" @click="prevPage">上一页</el-button>
                  <el-button size="small" @click="nextPage">下一页</el-button>
                </el-button-group>
              </div>
            </div>
            <div class="paper-preview-container">
              <div class="a4-paper" :style="{ transform: `scale(${previewZoom/100})` }">
                <div class="paper-red-header" v-if="exportParam.enableRedHeader">
                  <div class="red-title">XX市人力资源和社会保障局</div>
                  <div class="red-line"></div>
                </div>
                <div class="paper-content">
                  <p style="text-align:center;font-size:22px;font-weight:bold;margin-top:30px;">关于开展年度考核工作的通知</p>
                  <p style="text-align:center;color:#666;">XX人社发〔2025〕12号</p>
                  <div style="margin-top:40px;line-height:2;font-family:SimSun;">
                    <p>各区县人社局、局各科室、直属单位：</p>
                    <p style="text-indent: 2em;">为做好2025年度全市人社系统考核工作，...（文稿内容）</p>
                    <p style="text-indent: 2em;">特此通知。</p>
                    <p style="text-align:right;margin-top:80px;">XX市人力资源和社会保障局</p>
                    <p style="text-align:right;">2025年8月7日</p>
                  </div>
                  <div class="paper-seal" v-if="exportParam.enableStamp">
                    <el-icon :size="72" color="#c41e3a"><Stamp /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 右侧：导出配置 -->
          <div class="export-col-right">
            <div class="col-header">导出配置</div>
            <el-space direction="vertical" class="export-actions" fill>
              <el-button size="large" type="primary" @click="exportPDF">
                <el-icon><Document /></el-icon> 导出 PDF
              </el-button>
              <el-button size="large" @click="exportWord">
                <el-icon><Document /></el-icon> 导出 Word (docx)
              </el-button>
              <el-button size="large" @click="printDoc">
                <el-icon><Printer /></el-icon> 直接打印
              </el-button>
              <el-button size="large" @click="sendToArchive">
                <el-icon><FolderOpened /></el-icon> 发送至归档
              </el-button>
            </el-space>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="检索归档" name="archive">
        <template #label>
          <span class="tab-label"><el-icon><FolderOpened /></el-icon> 检索归档 <el-tag size="small" type="info" effect="plain">12.4K</el-tag></span>
        </template>
        <div class="archive-double-col">
          <!-- 左侧：归档分类目录 -->
          <div class="archive-col-left">
            <div class="col-header">归档分类目录</div>
            <div class="archive-category-list">
              <div class="archive-cat-item" :class="{active:activeArchiveCat === cat.name}" v-for="cat in archiveCategories" :key="cat.name" @click="onSelectArchiveCat(cat.name)">
                <span class="cat-name">{{ cat.name }}</span>
                <el-tag size="small">{{ cat.count }}</el-tag>
              </div>
            </div>
            <el-divider></el-divider>
            <div class="hot-tags-section">
              <div class="cat-name">热门标签</div>
              <el-tag class="hot-tag" v-for="tag in hotTags" :key="tag" @click="onClickHotTag(tag)">#{{ tag }}</el-tag>
            </div>
          </div>
          <!-- 右侧：检索结果区 -->
          <div class="archive-col-main">
            <div class="search-bar">
              <el-input v-model="searchText" placeholder="关键词检索公文档案..." clearable style="flex:1;">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-button type="primary" @click="doSearch">检索</el-button>
              <el-checkbox v-model="enableSemanticSearch" style="margin-left:12px;">AI语义检索</el-checkbox>
              <el-button @click="showAdvancedFilter = !showAdvancedFilter" style="margin-left:8px;">高级筛选</el-button>
            </div>
            <el-collapse-transition>
              <div v-if="showAdvancedFilter" class="advanced-filter-panel">
                <el-row :gutter="16">
                  <el-col :span="5"><el-select v-model="advFilter.docType" clearable placeholder="公文类型" style="width:100%;"><el-option label="通知" value="notice"/></el-select></el-col>
                  <el-col :span="5"><el-select v-model="advFilter.dept" clearable placeholder="发文单位" style="width:100%;"></el-select></el-col>
                  <el-col :span="5"><el-select v-model="advFilter.bizArea" clearable placeholder="业务领域" style="width:100%;"></el-select></el-col>
                  <el-col :span="5"><el-date-picker v-model="advFilter.dateRange" type="daterange" range-separator="至" start-placeholder="发文开始" end-placeholder="发文截止" style="width:100%;"></el-date-picker></el-col>
                  <el-col :span="4"><el-select v-model="advFilter.secretLevel" clearable placeholder="密级" style="width:100%;"></el-select></el-col>
                </el-row>
              </div>
            </el-collapse-transition>
            <div class="rag-summary-card" v-if="searchPerformed">
              <el-result icon="success" title="AI 检索摘要生成完成" sub-title="基于 RAG 增强检索">
                <template #extra>
                  <el-statistic title="命中公文总数" :value="searchResultTotal" style="margin-right:32px;"></el-statistic>
                  <el-statistic title="本机关发文" :value="187"></el-statistic>
                  <el-statistic title="上级发文" :value="56" style="margin-left:32px;"></el-statistic>
                  <p style="margin-top:12px;color:#2563eb;">核心要点：本次检索覆盖就业领域相关政策共X篇，提炼...变化提示。</p>
                </template>
              </el-result>
            </div>
            <div class="archive-actions-bar">
              <el-space>
                <el-button size="small" @click="batchArchive">批量归档当前文稿</el-button>
                <el-button size="small" @click="sortByTime">按发文时间排序</el-button>
                <el-button size="small" @click="toggleView">切换视图模式</el-button>
              </el-space>
            </div>
            <el-table :data="archiveDocuments" stripe style="width:100%;" @row-click="onArchiveRowClick">
              <el-table-column type="selection" width="55"></el-table-column>
              <el-table-column prop="title" label="公文标题"></el-table-column>
              <el-table-column prop="docNo" label="文号" width="160"></el-table-column>
              <el-table-column prop="dept" label="发文单位" width="140"></el-table-column>
              <el-table-column prop="type" label="类型" width="90">
                <template #default="{ row }">
                  <el-tag size="small" type="info">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="publishDate" label="发文时间" width="120"></el-table-column>
              <el-table-column prop="secretLevel" label="密级" width="80"></el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" text type="primary" @click="viewArchiveDoc(row)">查看</el-button>
                  <el-button size="small" text type="primary" @click="downloadArchiveDoc(row)">下载</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="流转督办" name="flow">
        <template #label>
          <span class="tab-label"><el-icon><Share /></el-icon> 流转督办 <el-tag size="small" type="warning" effect="plain">24</el-tag></span>
        </template>
        <div class="flow-main-container">
          <div class="stats-row flow-stats-top">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon bg-purple">
                  <el-icon><Loading /></el-icon>
                </div>
                <div class="stat-text">
                  <div class="stat-value">24</div>
                  <div class="stat-label">流转中</div>
                </div>
              </div>
            </el-card>
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon bg-red">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="stat-text">
                  <div class="stat-value">3</div>
                  <div class="stat-label">超时未处理</div>
                </div>
              </div>
            </el-card>
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon bg-green">
                  <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-text">
                  <div class="stat-value">76</div>
                  <div class="stat-label">本月已闭环</div>
                </div>
              </div>
            </el-card>
          </div>
          <div class="flow-content-row">
            <div class="flow-list-area">
              <div class="flow-filter-bar">
                <el-radio-group v-model="flowFilter" size="default">
                  <el-radio-button value="all">全部</el-radio-button>
                  <el-radio-button value="pending">待我处理</el-radio-button>
                  <el-radio-button value="my">我发起的</el-radio-button>
                  <el-radio-button value="timeout">超时</el-radio-button>
                </el-radio-group>
                <el-button type="primary" @click="showFlowDialog = true">
                  <el-icon><Plus /></el-icon> 发起流转
                </el-button>
              </div>
              <div class="flow-card-list">
                <el-card class="flow-item-card" v-for="item in filteredFlowItems" :key="item.id" shadow="hover">
                  <div class="flow-item-header">
                    <div class="flow-title">{{ item.title }}</div>
                    <el-tag size="small" :type="item.urgent ? 'danger' : 'info'">{{ item.urgent ? '紧急' : '普通' }}</el-tag>
                  </div>
                  <div class="flow-meta-line">
                    <span class="meta-item">文号：{{ item.docNo }}</span>
                    <span class="meta-item">发起人：{{ item.sponsor }}</span>
                    <span class="meta-item">截止：{{ item.deadline }}</span>
                    <el-tag v-if="item.isTimeout" type="danger" size="small">⚠️ 已超时 {{ item.timeoutHours }} 小时</el-tag>
                  </div>
                  <el-steps :active="item.activeStep" finish-status="success" direction="horizontal" simple class="flow-progress-line">
                    <el-step v-for="(node, idx) in item.nodes" :key="idx" :title="node" />
                  </el-steps>
                  <div class="flow-actions">
                    <el-button size="small" @click="remindFlow(item)">催办</el-button>
                    <el-button size="small" @click="transferFlow(item)">转办</el-button>
                    <el-button size="small" type="primary" @click="viewFlowDetail(item)">查看详情</el-button>
                  </div>
                </el-card>
              </div>
            </div>
            <div class="flow-chart-area">
              <div class="col-header">流转数据看板</div>
              <div class="flow-chart" ref="flowPieRef"></div>
              <div class="flow-chart" ref="flowBarRef"></div>
            </div>
          </div>
        </div>

        <!-- 发起流转对话框 -->
        <el-dialog v-model="showFlowDialog" title="发起公文流转" width="550px">
          <el-form label-width="100px">
            <el-form-item label="选择公文">
              <el-select v-model="newFlow.docId" placeholder="请选择要发起流转的文稿">
                <el-option label="关于开展就业督查工作的通知" value="d001"></el-option>
                <el-option label="2025年上半年就业工作进展报告" value="d002"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="流转路径">
              <el-select v-model="newFlow.path" placeholder="选择预设审批流程">
                <el-option label="常规发文审批路径（科室→分管领导→局长→办公室印发）" value="normal"></el-option>
                <el-option label="紧急事项加急流转" value="urgent"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="紧急程度">
              <el-radio-group v-model="newFlow.urgent">
                <el-radio-button :value="false">普通</el-radio-button>
                <el-radio-button :value="true">紧急</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showFlowDialog=false">取消</el-button>
            <el-button type="primary" @click="confirmCreateFlow">确认发起</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { Document, CircleCheck, Clock, Share, FolderOpened, Search, MagicStick, Promotion, Star, StarFilled, TrendCharts, Check, DocumentCopy, Stamp, Loading, Warning, Plus, InfoFilled } from '@element-plus/icons-vue'

const activeTab = ref('library')
const currentStep = ref(0)
const selectedDocType = ref('all')
const selectedBizArea = ref('')
const searchKeyword = ref('')

const genParam = ref({
  docType: '',
  bizArea: '',
  templateId: '',
  recipient: '',
  style: 'formal' as 'formal' | 'concise' | 'detailed',
  wordCount: 2000,
  refPolicy: [] as string[],
  enableDataRef: false
})
const genStep = ref<'outline' | 'content'>('outline')
const generatingOutline = ref(false)
const documentOutline = ref('')
const documentContent = ref('')
const suggestList = ref([
  { id: 1, text: '建议将核心政策依据放在第一段位置，强化权威性' },
  { id: 2, text: '第3段表述可进一步精简，突出办事时限要求' }
])
const quickCommands = ref(['全部模板', '我收藏的', '最近使用', '生成通知', '生成报告', '生成请示', '生成纪要'])
const showQuickCommands = ref(false)
const showVersionHistory = ref(false)
const versions = ref([{ id: 3, time: '2025-08-07 11:30' }, { id: 2, time: '2025-08-07 10:15' }, { id: 1, time: '2025-08-07 09:45' }])

const auditing = ref(false)
const audited = ref(false)
const auditScore = ref(92)
const auditLevel = ref('优秀')
const auditedDocumentContent = ref('')
const auditChartRef = ref()
const currentRiskFilter = ref('all')
const auditRisks = ref([
  { id: 1, level: '高风险' as const, type: '涉政表述', desc: '文中表述与上级最新文件不完全一致', lineNo: 12, ruleRef: '粤人社规〔2025〕5号第3条', suggest: '调整表述口径为最新标准' },
  { id: 2, level: '中风险' as const, type: '格式不规范', desc: '发文机关署名格式不符合国标要求', lineNo: 28, ruleRef: 'GB/T 9704-2012 第6章', suggest: '补全文号和印发日期' },
  { id: 3, level: '中风险' as const, type: '数字规范', desc: '统计数字前后精度不一致', lineNo: 18, ruleRef: '出版物数字用法规范', suggest: '统一保留两位小数' }
])
const filteredRisks = computed(() => {
  if (currentRiskFilter.value === 'all') return auditRisks.value
  return auditRisks.value.filter(r => r.type.includes(currentRiskFilter.value) || r.type.toLowerCase().includes(currentRiskFilter.value))
})

const exportParam = ref({
  standard: 'gb2012',
  paperSize: 'A4',
  marginTop: 37,
  marginBottom: 35,
  marginLeft: 28,
  marginRight: 26,
  fontFamily: 'SimSun',
  enableRedHeader: true,
  enableStamp: true,
  stampPosition: 'bottom-right'
})
const previewZoom = ref(100)

const activeArchiveCat = ref('全部公文')
const archiveCategories = ref([
  { name: '全部公文', count: 12438 },
  { name: '本机关发文', count: 4826 },
  { name: '上级来文', count: 2371 },
  { name: '下级上报', count: 3214 },
  { name: '政策文件', count: 1542 },
  { name: '档案移交', count: 485 }
])
const hotTags = ref(['稳就业', '养老保险', '劳动关系', '人才引育', '技能培训', '考核表彰'])
const searchText = ref('')
const enableSemanticSearch = ref(true)
const showAdvancedFilter = ref(false)
const advFilter = ref({ docType: '', dept: '', bizArea: '', dateRange: [] as any[], secretLevel: '' })
const searchPerformed = ref(false)
const searchResultTotal = ref(243)
const archiveDocuments = ref([
  { id: 'a001', title: '关于做好2025年稳就业工作的通知', docNo: 'XX人社发〔2025〕8号', dept: '就业科', type: '通知', publishDate: '2025-08-01', secretLevel: '内部' },
  { id: 'a002', title: '关于报送半年度社保基金运行情况的报告', docNo: 'XX人社发〔2025〕21号', dept: '社保中心', type: '报告', publishDate: '2025-07-28', secretLevel: '秘密' },
  { id: 'a003', title: '关于申请就业服务专项资金的请示', docNo: 'XX人社发〔2025〕17号', dept: '财务科', type: '请示', publishDate: '2025-07-22', secretLevel: '内部' }
])

const flowFilter = ref('all')
const showFlowDialog = ref(false)
const newFlow = ref({ docId: '', path: 'normal', urgent: false })
const flowPieRef = ref()
const flowBarRef = ref()
const flowItems = ref([
  { id: 'f001', title: '关于开展就业补贴发放专项检查的通知', docNo: 'XX人社发〔2025〕25号', urgent: true, sponsor: 'zhangqiang', deadline: '2025-08-08 18:00', isTimeout: true, timeoutHours: 3, activeStep: 2, nodes: ['发起', '科室负责人审', '分管领导审', '局长签发', '印发'] },
  { id: 'f002', title: '2025年度人事考核工作方案', docNo: 'XX人社发〔2025〕27号', urgent: false, sponsor: 'lihua', deadline: '2025-08-12', isTimeout: false, timeoutHours: 0, activeStep: 1, nodes: ['发起', '科室负责人审', '分管领导审', '局长签发', '印发'] },
  { id: 'f003', title: '人才引进政策修订征求意见稿', docNo: 'XX人社发〔2025〕31号', urgent: false, sponsor: 'wangfang', deadline: '2025-08-15', isTimeout: false, timeoutHours: 0, activeStep: 3, nodes: ['发起', '科室负责人审', '分管领导审', '局长签发', '印发'] }
])
const filteredFlowItems = computed(() => {
  if (flowFilter.value === 'all') return flowItems.value
  if (flowFilter.value === 'pending') return flowItems.value.slice(0, 2)
  if (flowFilter.value === 'my') return flowItems.value.filter(i => i.sponsor === 'zhangqiang')
  if (flowFilter.value === 'timeout') return flowItems.value.filter(i => i.isTimeout)
  return flowItems.value
})

const starredTemplates = ref([
  { id: 'tpl001', name: '通知 - 关于开展...工作的通知', type: '通知', bgColor: '#e8f0fe', icon: 'Bell', usageCount: 128 },
  { id: 'tpl002', name: '报告 - 上半年人社工作进展', type: '报告', bgColor: '#ecfdf3', icon: 'Document', usageCount: 87 }
])
const hotTemplates = ref([
  { id: 'tpl003', name: '请示 - 关于申请专项经费', type: '请示', bgColor: '#fff7ed', icon: 'Tickets', bizArea: '就业', usageCount: 245 },
  { id: 'tpl004', name: '纪要 - 局办公会议纪要', type: '纪要', bgColor: '#f5f3ff', icon: 'Notebook', bizArea: '综合', usageCount: 176 },
  { id: 'tpl005', name: '通报 - 月度工作情况通报', type: '通报', bgColor: '#eff6ff', icon: 'DataLine', bizArea: '人事', usageCount: 132 }
])

// 交互函数
const useTemplate = (tpl: any) => { ElMessage.success(`已套用模板：${tpl.name}，自动跳转至AI生成页`); activeTab.value = 'generate' }
const previewTemplate = (tpl: any) => { ElMessage.info(`预览模板：${tpl.name}`) }
const toggleStar = (tpl: any) => { ElMessage.success(tpl.icon === 'Star' ? '已收藏该模板' : '已取消收藏') }

const applyQuickCmd = (cmd: string) => { ElMessage.success(`执行短口令：${cmd}`) }
const startGenerateOutline = async () => {
  generatingOutline.value = true
  setTimeout(() => {
    documentOutline.value = `一、文件背景与目的\n二、工作安排与时间节点\n三、职责分工与保障措施\n四、工作要求`
    generatingOutline.value = false
    ElMessage.success('公文大纲生成完成，请确认')
  }, 1500)
}
const acceptOutline = () => { genStep.value = 'content'; currentStep.value = 1; ElMessage.success('大纲已确认，开始生成正文') }
const editOutline = () => { ElMessage.info('您可直接编辑大纲输入框') }
const regenerateOutline = () => { generatingOutline.value = true; setTimeout(()=>{ documentOutline.value += '\n（补充新调整内容...）'; generatingOutline.value = false; ElMessage.success('已换一版大纲') }, 1500) }
const switchModel = () => ElMessage.info('已切换至「政务-增强版」大模型')
const ideaGuide = () => ElMessage.info('AI正在提供思路引导建议...')
const regenerateAll = () => ElMessage.info('重新生成全部内容')
const restoreVersion = (v: any) => ElMessage.success(`已恢复到 版本${v.id}`)

const startAudit = async () => {
  auditing.value = true
  setTimeout(() => {
    audited.value = true
    auditing.value = false
    auditedDocumentContent.value = documentContent.value || '（审校后文稿已修正完毕...）'
    ElMessage.success('五级合规审校完成！')
    renderAuditChart()
  }, 1800)
}
const renderAuditChart = () => {
  const myChart = echarts.init(auditChartRef.value)
  myChart.setOption({
    tooltip: {},
    radar: { indicator: [{ name: '基础文字', max: 100 }, { name: '涉政表述', max:100 }, { name: '公文格式', max: 100 }, { name: '数字规范', max: 100 }, { name: '政策引用', max: 100 }] },
    series: [{ type: 'radar', data: [{ value: [95,88,90,92,91], name: '当前得分' }], areaStyle: { color: 'rgba(37,99,235,0.2)' }, lineStyle: { color: '#2563eb' }, itemStyle: { color: '#2563eb' } }]
  })
}
const filterAudit = (t: string) => { currentRiskFilter.value = t; ElMessage.info(`已筛选${t === 'policy' ? '政策核查' : t === 'format' ? '格式校验' : '敏感词检测'}`) }
const locateRisk = (r: any) => ElMessage.success(`已定位到第 ${r.lineNo} 行`)
const acceptFix = (r: any) => { auditScore.value += 2; ElMessage.success(`已采纳修改建议：${r.desc}`) }
const fixAllIssues = () => { ElMessageBox.confirm('确认一键修复全部风险？', '提示').then(() => { auditRisks.value = []; auditScore.value = 98; auditLevel.value = '优秀'; ElMessage.success('全部问题已批量修复完成') }) }

const applyLayout = () => ElMessage.success('国标排版已应用，版式实时更新')
const zoomIn = () => previewZoom.value = Math.min(previewZoom.value + 20, 200)
const zoomOut = () => previewZoom.value = Math.max(previewZoom.value - 20, 50)
const prevPage = () => ElMessage.info('切换上一页')
const nextPage = () => ElMessage.info('切换下一页')
const exportPDF = () => ElMessage.success('正在生成并导出 PDF 文件...')
const exportWord = () => ElMessage.success('正在生成并导出 Word (docx) 文件...')
const printDoc = () => ElMessage.info('正在调起打印...')
const sendToArchive = () => ElMessage.success('文稿已发送至检索归档模块')

const onSelectArchiveCat = (cat: string) => { activeArchiveCat.value = cat; ElMessage.success(`已切换至分类：${cat}`) }
const onClickHotTag = (tag: string) => { searchText.value = `#${tag}`; doSearch() }
const doSearch = () => { searchPerformed.value = true; ElMessage.success(`${enableSemanticSearch.value ? 'AI语义检索' : '关键词检索'}执行完毕，命中 ${searchResultTotal.value} 篇公文`) }
const batchArchive = () => ElMessage.success('已批量归档选中的文稿')
const sortByTime = () => ElMessage.success('已按发文时间降序重排')
const toggleView = () => ElMessage.info('已切换视图模式')
const onArchiveRowClick = (row: any) => ElMessage.info(`选中公文：${row.title}`)
const viewArchiveDoc = (row: any) => ElMessage.success(`查看文档：${row.title}`)
const downloadArchiveDoc = (row: any) => ElMessage.success(`下载文件：${row.title}.docx`)

const remindFlow = (item: any) => ElMessage.success(`已对「${item.title}」执行催办操作，系统通知已发送`)
const transferFlow = (item: any) => ElMessage.info(`转办流程：${item.title}`)
const viewFlowDetail = (item: any) => ElMessage.info(`查看流转详情：${item.title}`)
const confirmCreateFlow = () => { showFlowDialog.value = false; ElMessage.success('公文流转已成功发起！') }
const renderFlowCharts = () => {
  const pieChart = echarts.init(flowPieRef.value)
  pieChart.setOption({
    title: { text: '流转状态分布', left: 'center', textStyle: { fontSize:14 } },
    series: [{ type: 'pie', radius: '60%', data: [{ value:76, name:'已闭环' }, {value:24, name:'流转中' }, {value:3, name:'超时'}] }]
  })
  const barChart = echarts.init(flowBarRef.value)
  barChart.setOption({
    title: { text: '各部门平均处理时效', left: 'center', textStyle: { fontSize:14 } },
    xAxis: { type: 'category', data: ['就业科','社保科','劳动关系科','人才科','办公室'] },
    yAxis: { type: 'value', name:'小时' },
    series: [{ data: [4.2,5.8,6.1,7.3,3.5], type: 'bar', color: '#2563eb' }]
  })
}

watch(() => activeTab.value, (newTab) => {
  const idx: Record<string, number> = { library: 0, generate:1, audit:2, export:3, archive:4, flow:5 }
  currentStep.value = idx[newTab] ?? 0
  if(newTab === 'audit') setTimeout(() => renderAuditChart(), 100)
  if(newTab === 'flow') setTimeout(() => renderFlowCharts(), 100)
})

onMounted(() => {})
</script>

<style scoped>
.document-page { padding: 20px 0; }
.stats-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:16px; }
.stat-card { border-radius:12px; }
.stat-content { display:flex; align-items:center; gap:14px; }
.stat-icon { width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:22px; }
.stat-icon.bg-blue { background: #2563eb; }
.stat-icon.bg-green { background: #10b981; }
.stat-icon.bg-orange { background: #ff7c00; }
.stat-icon.bg-purple { background: #7c3aed; }
.stat-icon.bg-red { background: #ef4444; }
.stat-icon.bg-gray { background: #6b7280; }
.stat-text .stat-value { font-size:22px; font-weight:bold; color:#1f2937; line-height:1.3; }
.stat-text .stat-label { font-size:12px; color:#6b7280; }
.process-steps { background:white; padding: 20px; border-radius:12px; margin-bottom:16px; }
.document-tabs { background:white; border-radius:12px; }
.tab-label { display:flex; align-items:center; gap:6px; }
.filter-bar { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; padding:12px 0; }
.filter-right { display:flex; align-items:center; }
.sub-section-title { font-size:15px; font-weight:600; color:#1f2937; margin:20px 0 12px 0; display:flex; align-items:center; gap:6px; }
.template-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px; }
.template-card { cursor:pointer; transition:all 0.25s; }
.template-card:hover { transform: translateY(-3px); }
.tpl-icon { width:48px; height:48px; border-radius: 10px; display:flex; align-items:center; justify-content:center; color:white; font-size:24px; margin-bottom:10px; }
.tpl-name { font-weight:600; font-size:15px; margin-bottom:6px; }
.tpl-meta { display:flex; justify-content:space-between; align-items:center; }
.tpl-hit { color:#6b7280; font-size:13px; }
.tpl-actions { margin-top:10px; display:flex; gap:8px; justify-content:flex-end; }

.generate-three-col { display:grid; grid-template-columns: 260px 1fr 280px; gap:16px; min-height:500px; }
.generate-col-left, .generate-col-center, .generate-col-right { background:white; border-radius:12px; padding:16px; overflow-y:auto; max-height:650px; }
.col-header { font-weight:600; font-size:15px; padding-bottom:10px; border-bottom:1px solid #e5e7eb; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; }
.header-actions { display:flex; gap:6px; }
.quick-cmd-list { padding: 10px; background:#f8fafc; border-radius:8px; display:flex; flex-wrap:wrap; gap:8px; }
.quick-cmd-tag { cursor:pointer; user-select:none; }
.quick-cmd-tag:hover { transform:scale(1.05); }
.outline-content, .content-container { margin-top:12px; }
.outline-actions, .version-actions { display:flex; gap:10px; margin-top:12px; }
.outline-actions { justify-content:center; }
.suggest-item { padding:10px 12px; background:#e8f0fe; border-radius:8px; margin-bottom:8px; display:flex; gap:8px; font-size:14px; color:#1e40af; }

.audit-full-container { background:white; border-radius:12px; padding:20px; }
.audit-top-bar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
.audit-main-row { display:grid; grid-template-columns: 40% 1fr; gap:20px; }
.audit-score-card { background: linear-gradient(135deg,#2563eb,#1d4ed8); border-radius:12px; padding:20px; text-align:center; color:white; }
.score-value { font-size:48px; font-weight:bold; }
.score-label { font-size:14px; opacity:0.9; }
.risk-item-card { margin-bottom:10px; }
.risk-title { font-weight:600; font-size:15px; margin-bottom:10px; }
.risk-header { display:flex; gap:8px; align-items:center; margin-bottom:6px; }
.risk-desc, .risk-pos, .risk-ref, .risk-suggest { font-size:14px; margin:4px 0; }
.risk-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; }

.export-three-col { display:grid; grid-template-columns: 240px 1fr 220px; gap:16px; }
.export-col-left, .export-col-right { background:white; border-radius:12px; padding:16px; }
.export-col-center { background:white; border-radius:12px; padding:16px; overflow:auto; }
.paper-preview-container { min-height:500px; display:flex; justify-content:center; background:#f0f0f0; padding:30px; }
.a4-paper { width: 595px; height: 842px; background:white; box-shadow: 0 2px 12px rgba(0,0,0,0.1); position:relative; padding:50px 50px; }
.paper-red-header { text-align:center; }
.red-title { font-size:30px; font-weight:bold; color:#c41e3a; letter-spacing:6px; }
.red-line { height:3px; background:#c41e3a; margin-top:8px; }
.paper-seal { position:absolute; bottom:100px; right:60px; opacity:0.8; }
.preview-zoom-actions { display:flex; align-items:center; }
.export-actions { margin-top:30px; }

.archive-double-col { display:grid; grid-template-columns: 220px 1fr; gap:16px; }
.archive-col-left, .archive-col-main { background:white; border-radius:12px; padding:16px; }
.archive-cat-item { display:flex; justify-content:space-between; align-items:center; padding: 10px 12px; border-radius: 8px; cursor:pointer; transition:all 0.2s; margin-bottom:4px; }
.archive-cat-item:hover { background:#f0f4ff; }
.archive-cat-item.active { background:#e8f0fe; font-weight:600; }
.hot-tags-section { margin-top:8px; }
.hot-tag { cursor:pointer; margin:4px; }
.search-bar { display:flex; align-items:center; margin-bottom:12px; }
.advanced-filter-panel { background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:12px; }
.rag-summary-card { margin-bottom:12px; }

.flow-stats-top { margin-bottom: 16px; }
.flow-content-row { display:grid; grid-template-columns: 1fr 320px; gap:16px; }
.flow-list-area, .flow-chart-area { background:white; border-radius:12px; padding:16px; }
.flow-filter-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.flow-item-card { margin-bottom: 12px; }
.flow-item-header { display:flex; justify-content:space-between; align-items:center; }
.flow-meta-line { margin:8px 0; display:flex; gap:12px; flex-wrap:wrap; font-size:13px; color:#6b7280; }
.flow-progress-line { margin: 12px 0; }
.flow-actions { display:flex; justify-content:flex-end; gap:8px; }
.flow-chart { min-height:240px; margin-top:20px; }
.w-full { width: 100%; }
</style>
