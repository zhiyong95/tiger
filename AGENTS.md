# AGENTS.md

## 项目概览
**政途 · AI政务办公工作台** — 面向人社内部工作人员的 AI 政务办公与经办辅助系统。

### 技术栈
- **前端框架**：Vue 3.5 + TypeScript 5.7
- **构建工具**：Vite 6
- **UI 组件库**：Element Plus 2.14
- **状态管理**：Pinia 3
- **路由**：Vue Router 4
- **图表**：ECharts 5
- **包管理器**：pnpm（禁止使用 npm/yarn）

### 目录结构
```
src/
├── api/mock.ts          # Mock API 服务（模拟后端数据）
├── assets/styles/       # 全局样式
── components/          # 可复用组件
── router/index.ts      # 路由配置
── stores/app.ts        # 应用状态（Pinia）
├── types/index.ts       # TypeScript 类型定义
├── utils/reportExport.ts # 报告导出工具（PDF：jspdf+html2canvas；Word：.doc HTML）
├── views/
│   ├── dashboard/       # 首页工作台
│   ├── qa/              # 人社知识智能问答
│   ├── document/        # AI公文助手
│   ├── data/            # 智能问数
│   ├── report/          # 智能分析报告
│   ├── policy/          # 政策快研
│   ├── audit/           # 业务智能审核
│   ├── task/            # 风险预警与任务待办
│   └── admin/           # 后台管理端
│       ├── users.vue    # 用户权限管理
│       ├── knowledge.vue # 知识库管理
│       ├── templates.vue # 公文模板管理
│       ├── metrics.vue  # 指标口径管理
│       ├── rules.vue    # 审核规则管理
│       ├── datasource.vue # 数据源管理
│       ── logs.vue     # 日志审计
├── App.vue              # 根组件（含布局）
└── main.ts              # 入口文件
```

## 构建与运行命令
```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器（端口 5000）
pnpm build      # 构建生产版本
pnpm preview    # 预览生产构建
```

## 代码风格
- 使用 TypeScript strict 模式
- 组件使用 `<script setup lang="ts">` 语法
- 优先使用 Composition API
- 禁止隐式 any
- 所有函数参数需标注类型

## 后端说明
- 当前使用 Mock API（`src/api/mock.ts`）模拟后端数据
- 后端后续使用 Java + SpringBoot 开发
- API 接口设计需与 Mock 保持一致

## 核心业务模块
1. **PC工作台**：首页、知识问答、公文助手、智能问数、分析报告、政策快研、业务审核、任务待办
2. **后台管理端**：用户权限、知识库、公文模板、指标口径、审核规则、数据源、日志审计
