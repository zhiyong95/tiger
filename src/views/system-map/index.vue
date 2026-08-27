<template>
  <div class="system-map">
    <div class="map-header">
      <h1>
        <el-icon :size="28"><Monitor /></el-icon>
        政途 · AI政务办公工作台
      </h1>
      <p class="map-subtitle">系统功能架构脑图</p>
    </div>

    <div class="mind-map">
      <!-- 中心节点 -->
      <div class="root-node">
        <div class="root-icon">
          <el-icon :size="32"><Platform /></el-icon>
        </div>
        <span class="root-text">政途 · AI政务办公工作台</span>
      </div>

      <!-- 连接线 -->
      <div class="connector-line"></div>

      <!-- 两大分支 -->
      <div class="branches">
        <!-- A类 - 核心数据类 -->
        <div class="branch branch-a">
          <div class="branch-header branch-header-a">
            <el-icon :size="20"><DataAnalysis /></el-icon>
            <span>A类 - 核心数据类</span>
            <el-tag size="small" type="danger" effect="dark">强依赖业务数据</el-tag>
          </div>
          <div class="branch-subtitle">需接入就业登记库、社保参保库等业务系统</div>

          <div class="card-list">
            <div
              v-for="(item, idx) in categoryA"
              :key="idx"
              class="feature-card card-a"
              :style="{ animationDelay: `${idx * 0.1}s` }"
            >
              <div class="card-top">
                <el-icon :size="22" class="card-icon"><component :is="item.icon" /></el-icon>
                <span class="card-name">{{ item.name }}</span>
              </div>
              <p class="card-desc">{{ item.desc }}</p>
              <div class="card-tags">
                <el-tag
                  v-for="(ds, di) in item.dataSources"
                  :key="di"
                  size="small"
                  class="ds-tag"
                >
                  {{ ds }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 分支连接线 -->
        <div class="branch-connector">
          <div class="v-line"></div>
          <div class="h-line"></div>
        </div>

        <!-- B类 - 知识服务类 -->
        <div class="branch branch-b">
          <div class="branch-header branch-header-b">
            <el-icon :size="20"><Reading /></el-icon>
            <span>B类 - 知识服务类</span>
            <el-tag size="small" type="success" effect="dark">依赖政策库，非敏感</el-tag>
          </div>
          <div class="branch-subtitle">基于公开政策法规与内置知识库提供服务</div>

          <div class="card-list">
            <div
              v-for="(item, idx) in categoryB"
              :key="idx"
              class="feature-card card-b"
              :style="{ animationDelay: `${idx * 0.1}s` }"
            >
              <div class="card-top">
                <el-icon :size="22" class="card-icon"><component :is="item.icon" /></el-icon>
                <span class="card-name">{{ item.name }}</span>
              </div>
              <p class="card-desc">{{ item.desc }}</p>
              <div class="card-tags">
                <el-tag
                  v-for="(ds, di) in item.dataSources"
                  :key="di"
                  size="small"
                  class="ds-tag"
                >
                  {{ ds }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="map-footer">
      <el-divider />
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">{{ categoryA.length + categoryB.length }}</span>
          <span class="stat-label">功能模块总数</span>
        </div>
        <div class="stat-item">
          <span class="stat-num" style="color: #ef4444">{{ categoryA.length }}</span>
          <span class="stat-label">A类 核心数据类</span>
        </div>
        <div class="stat-item">
          <span class="stat-num" style="color: #10b981">{{ categoryB.length }}</span>
          <span class="stat-label">B类 知识服务类</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Platform, DataAnalysis, Reading, Monitor, Aim, TrendCharts, Document, ChatLineSquare, EditPen, Files } from '@element-plus/icons-vue'

interface FeatureItem {
  name: string
  icon: string
  desc: string
  dataSources: string[]
}

const categoryA: (FeatureItem & { icon: string })[] = [
  {
    name: '工作台首页',
    icon: 'Monitor',
    desc: 'AI辅助办公工作台驾驶舱，含效益看板、AI功能快捷入口、图表统计、使用记录',
    dataSources: ['就业登记库', '社保参保库', '失业登记库', '补贴发放库']
  },
  {
    name: '智能问数',
    icon: 'TrendCharts',
    desc: 'AI对话式数据查询，支持图表可视化，多维度分析',
    dataSources: ['就业登记库', '社保参保库', '失业登记库', '劳动力资源库', '统计报表']
  },
  {
    name: '智能分析报告',
    icon: 'Document',
    desc: '根据业务数据自动生成分析报告，支持台账上传',
    dataSources: ['就业登记库', '社保参保库', '劳动力库', '统计报表', '（可选）上传台账']
  },
  {
    name: '业务智能审核',
    icon: 'Aim',
    desc: 'AI批量/单人审核，资格预核查，CoT思维链+SHAP可解释性',
    dataSources: ['业务申请数据', '人员信息库', '历史审核记录', '政策规则库']
  }
]

const categoryB: (FeatureItem & { icon: string })[] = [
  {
    name: '人社知识智能问答',
    icon: 'ChatLineSquare',
    desc: 'AI政策问答，支持多轮对话，引用政策原文溯源',
    dataSources: ['政策法规库（公开数据）', '知识库（人工维护）']
  },
  {
    name: '政策快研',
    icon: 'EditPen',
    desc: '政策文件上传研判，自动提取要点，政策问答互动',
    dataSources: ['政策文件库', '政策标签体系']
  },
  {
    name: 'AI公文助手',
    icon: 'Files',
    desc: 'AI公文写作，模板库、合规审校、排版导出、检索归档',
    dataSources: ['公文模板库（内置）', '政策法规库（公开数据）']
  }
]
</script>

<style scoped>
.system-map {
  padding: 24px 32px;
  min-height: calc(100vh - 56px - 40px);
  background: #f8f9fa;
}

.map-header {
  text-align: center;
  margin-bottom: 32px;
}

.map-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: #0a1e5c;
  margin: 0;
}

.map-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin-top: 6px;
}

/* ===== 脑图布局 ===== */
.mind-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* 中心节点 */
.root-node {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #0a1e5c, #1a3a8a);
  color: #fff;
  padding: 16px 36px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(10, 30, 92, 0.3);
  position: relative;
  z-index: 2;
}

.root-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
}

.root-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* 连接线 */
.connector-line {
  width: 2px;
  height: 32px;
  background: linear-gradient(to bottom, #3b82f6, #93c5fd);
  position: relative;
  z-index: 1;
}

.connector-line::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #93c5fd;
}

/* 分支容器 */
.branches {
  display: flex;
  gap: 40px;
  margin-top: 8px;
  width: 100%;
  max-width: 1100px;
  justify-content: center;
}

/* 分支连接线 */
.branch-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 100px;
  width: 40px;
  flex-shrink: 0;
}

.branch-connector .v-line {
  width: 2px;
  height: 60px;
  background: #93c5fd;
}

.branch-connector .h-line {
  width: 40px;
  height: 2px;
  background: #93c5fd;
  margin-top: -1px;
}

/* 分支 */
.branch {
  flex: 1;
  max-width: 480px;
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.branch-header-a {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.branch-header-b {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.branch-subtitle {
  font-size: 12px;
  color: #9ca3af;
  padding: 0 4px 12px;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 卡片 */
.feature-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  animation: cardFadeIn 0.5s ease both;
  cursor: default;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card-a:hover {
  border-color: #fca5a5;
}

.card-b:hover {
  border-color: #86efac;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-icon {
  color: #6b7280;
}

.card-a .card-icon {
  color: #ef4444;
}

.card-b .card-icon {
  color: #10b981;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 10px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ds-tag {
  font-size: 11px !important;
}

/* 动画 */
@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 底部统计 */
.map-footer {
  margin-top: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 16px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #0a1e5c;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

/* 响应式 */
@media (max-width: 800px) {
  .branches {
    flex-direction: column;
    align-items: center;
  }
  .branch-connector {
    display: none;
  }
  .branch {
    max-width: 100%;
  }
}
</style>