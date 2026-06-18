# 潜能星图 · AI 测评小助手

基于 React + TypeScript + Vite 的全栈心理与职业测评平台。用户完成标准化心理问卷后，DeepSeek 大模型综合所有维度进行交叉分析，生成结构化综合报告（HTML + DOCX），经专家审核后发布。报告生成通过并发队列（最多 3 个同时执行）保证系统稳定性，DB 写入互斥锁 + DeepSeek 重试退避机制支撑 50 人并发场景。

支持**两种部署模式**：
- **通用模式**：7 套权威量表，用户自由选择
- **兰大模式**：兰州大学管理学院研究生职业发展测评，3 项固定测验，顺序推进，专属权重与等级评定

---

## 功能特性

### 测评能力

| 问卷 | 题数 | 预计用时 | 评分方式 | 适用模式 |
|------|------|----------|----------|----------|
| 领导风格测评（LASI） | 12 | 3 分钟 | 累加（S1-S4 四维） | 通用 / 兰大 |
| 气质类型测试 | 60 | 10 分钟 | 类别（4 种气质） | 通用 |
| 大五人格测试 | 60 | 10 分钟 | 累加（OCEAN 五维） | 通用 |
| MBTI 性格测试 | 93 | 15 分钟 | 类别（4 组维度） | 通用 |
| 卡氏 16PF | 187 | 30 分钟 | 累加（16 因子 + 8 派生特质） | 通用 |
| 创造力障碍测评 | 37 | 6 分钟 | 累加（多维度） | 通用 |
| 霍兰德职业兴趣 | 90 | 15 分钟 | 累加（RIASEC 六维） | 通用 |
| 16PF 人格测验（精选版） | 15 | 20 分钟 | 累加（3 维） | 兰大 |
| 创造力障碍测试（精选版） | 12 | 15 分钟 | 累加（3 维） | 兰大 |

### 报告与审核

- **AI 交叉分析**：DeepSeek 大模型综合所有问卷结果，生成 JSON 结构化报告，支持 `response_format: json_object`
- **并发队列**：报告生成通过队列控制（最多 3 个并发），防止 SQLite 写锁冲突和 API 限流
- **DeepSeek 重试退避**：自动重试 3 次（指数退避），应对 429 限流和 5xx 服务端错误
- **DB 写入互斥锁**：所有 SQLite 写操作串行化，WAL 模式提升并发读取性能
- **可视化图表**：SVG 仪表盘、雷达图、柱状图、饼图、六边形图（手写 SVG） + Chart.js 雷达图（本地加载）
- **雷达图标签**：显示具体分数（如「5/7」「10/12」）而非百分比
- **专家审核流程**：报告提交后进入待审状态，管理员可审核通过/驳回（附批注），审核后用户方可查看
- **报告导出**：优先 DOCX（Word 文档），降级为 HTML 内嵌 SVG/Chart.js
- **兰大专属报告**：18 个 AI 分析段落、领导力 30% + 人格 40% + 创造力 30% 加权评分、卓越型/进取型/成长型/待发展型四档等级评定、短/中/长期提升计划

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript (strict) |
| 路由 | React Router 6 |
| 状态管理 | Context + useReducer |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 图表 | Chart.js 4（雷达图，本地加载）+ 手写 SVG（仪表盘/柱状图/饼图/六边形图） |
| 测试 | Vitest + fast-check (property-based) |
| 后端框架 | Express.js |
| 数据库 | SQLite (sql.js WASM, WAL 模式) |
| ORM | 无，手写 SQL（MySQL 兼容语法自动转换） |
| 认证 | JWT（用户 + 管理员双密钥） |
| AI | DeepSeek Chat API（response_format: json_object，3 次重试 + 指数退避） |
| 报告 | HTML 模板 + DOCX（docx 库）+ resvg-js（SVG → PNG） |
| 部署 | Docker（多阶段构建，内存限制 1.5G） / 直接运行 |

---

## 项目结构

```
kiroo/
├── index.html                         # SPA 入口
├── vite.config.ts                     # Vite 配置（/api → localhost:3001 代理）
├── tsconfig.json                      # TypeScript 项目引用
├── tsconfig.app.json                  # 前端 TS 配置 (strict, ES2020, React JSX)
├── tailwind.config.js                 # Tailwind 配置
├── postcss.config.js                  # PostCSS 配置
├── .env                               # 前端环境变量（VITE_LZU_MODE）
├── Dockerfile                         # 多阶段构建（Node 18 Alpine，国内镜像加速）
├── docker-compose.yml                 # App + SQLite 数据卷编排（内存限制 1.5G）
│
├── src/                               # 前端 React SPA
│   ├── main.tsx                       # 入口
│   ├── App.tsx                        # 路由 + Context Provider + 问卷加载
│   ├── index.css                      # Tailwind 指令 + 安全区适配
│   ├── vite-env.d.ts                  # 环境变量类型声明
│   │
│   ├── types/
│   │   └── index.ts                   # 全部类型定义、问卷优先级配置、IS_LZU_MODE 开关
│   │
│   ├── context/
│   │   ├── AuthContext.tsx            # 登录/登出/JWT持久化/Token验证
│   │   └── AssessmentContext.tsx      # 测评状态机（12 种 Action）
│   │
│   ├── services/
│   │   ├── authService.ts             # 注册、密码登录、短信登录、个人信息修改
│   │   ├── sessionService.ts          # 会话创建/查询/存档/提交
│   │   ├── assessmentService.ts       # 单问卷记录保存/历史/详情
│   │   ├── reportService.ts           # 综合报告列表/详情
│   │   ├── deepSeekService.ts         # 单问卷 AI prompt 构建
│   │   └── comprehensiveReportService.ts  # 综合报告 prompt、兰大计分引擎
│   │
│   ├── lib/
│   │   ├── questionnaireLoader.ts     # 通过 import.meta.glob 加载全部 JSON 问卷
│   │   ├── questionnaireValidator.ts  # 问卷结构校验（类别白名单、字段必填检查）
│   │   └── scoringEngine.ts           # 累加计分 / 类别频次计分
│   │
│   ├── components/
│   │   ├── Navbar.tsx                 # 桌面顶部导航
│   │   ├── BottomNav.tsx              # 移动端底部导航（探索/报告/我的）
│   │   ├── ProtectedRoute.tsx         # 认证守卫
│   │   ├── LoadingSpinner.tsx         # 加载动画
│   │   ├── QuestionCard.tsx           # 单题选项卡片
│   │   ├── QuestionnaireCard.tsx      # 问卷预览卡片
│   │   └── charts/
│   │       ├── GaugeChart.tsx         # SVG 半圆仪表盘（65-85 区间）
│   │       ├── RadarChart.tsx         # Chart.js 雷达图（大五人格，显示具体分数）
│   │       ├── BarChart.tsx           # SVG 柱状图（16PF 因子）
│   │       ├── PieChart.tsx           # SVG 环形/饼图（领导风格占比）
│   │       ├── HexagonChart.tsx       # SVG 六边形图（霍兰德 RIASEC）
│   │       └── index.ts               # 统一导出
│   │
│   ├── pages/
│   │   ├── HelloPage.tsx              # 首页（兰大/通用两套 UI）
│   │   ├── LoginPage.tsx              # 登录（密码 + 短信验证码双 Tab）
│   │   ├── RegisterPage.tsx           # 注册（手机号 + 密码 + 姓名）
│   │   ├── SelectQuestionnairePage.tsx # 问卷选择 / 兰大 auto-start
│   │   ├── QuizPage.tsx               # 答题页（单题推进 + 进度条）
│   │   ├── TransitionPage.tsx         # 问卷间过渡页（恭喜 + 进度 + 下一项）
│   │   ├── SubmittedPage.tsx          # 提交完成页（提交→AI生成→等待审核）
│   │   ├── ReportPage.tsx             # 综合报告展示（图表 + 分区 + 状态轮询）
│   │   ├── HistoryPage.tsx            # 报告历史列表
│   │   ├── ProfilePage.tsx            # 个人中心（姓名/密码修改）
│   │   ├── NotFoundPage.tsx           # 404
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx     # 管理员登录
│   │       └── AdminDashboard.tsx     # 管理后台（统计/报告审核/CRUD/JSON编辑器/iframe嵌入）
│   │
│   └── data/questionnaires/           # 10 套 JSON 问卷定义
│       ├── leadership.json            # 领导风格测评
│       ├── temperament.json           # 气质类型测试
│       ├── big5.json                  # 大五人格测试
│       ├── mbti.json                  # MBTI 性格测试
│       ├── 16pf.json                  # 卡氏 16PF（完整版）
│       ├── creativity.json            # 创造力障碍测评
│       ├── holland.json               # 霍兰德职业兴趣测试
│       ├── lzu-leadership.json        # [兰大] LASI 领导风格问卷
│       ├── lzu-personality.json       # [兰大] 16PF 精选版
│       └── lzu-creativity.json        # [兰大] 创造力障碍测试
│
├── server/                            # Express.js 后端
│   ├── server.js                      # 入口（路由挂载 / 静态文件 / SPA fallback / AI 代理 / 健康检查）
│   ├── db.js                          # SQLite 数据库层（sql.js WASM，写互斥锁，WAL 模式，MySQL 语法兼容）
│   ├── schema.sql                     # 7 张表 + 默认管理员 + 迁移兼容
│   ├── package.json                   # 后端依赖
│   ├── .env.example                   # 环境变量模板
│   ├── reset-admin.js                 # 管理员密码重置脚本
│   ├── seed.js                        # 测试数据种子脚本
│   │
│   ├── middleware/
│   │   ├── auth.js                    # JWT 用户认证中间件
│   │   └── adminAuth.js               # JWT 管理员认证中间件
│   │
│   ├── routes/
│   │   ├── auth.js                    # 注册 / 密码登录 / 短信登录 / 个人信息 / 修改密码
│   │   ├── assessment.js              # 单问卷记录保存 / 历史 / 详情
│   │   ├── session.js                 # 会话管理 / 答题存档 / 提交触发 AI 报告（含并发队列）
│   │   ├── report.js                  # 综合报告列表/详情 / HTML/DOCX 下载
│   │   └── admin.js                   # 管理员统计 / 报告审核(通过/驳回) / JSON编辑器 / 用户管理
│   │
│   ├── services/
│   │   ├── deepseekClient.js          # DeepSeek API 调用（3 次重试 + 指数退避 + 超时保护）
│   │   ├── queueService.js            # 报告生成并发队列（最多 3 个同时执行）
│   │   ├── lzuScoringService.js       # 兰大加权评分引擎（领导力30%+人格40%+创造力30%）
│   │   ├── lzuReportTemplate.js       # 兰大报告 HTML 模板（固定布局 + 动态数据）
│   │   ├── lzuReportGenerator.js      # 兰大 AI prompt 构建 + 18 段落解析 + 降级文本
│   │   ├── lzuChartService.js         # 兰大图表渲染（resvg-js: SVG→PNG 嵌入 DOCX）
│   │   ├── lzuDocxBuilder.js          # Word 文档生成（docx 库，18 个模块）
│   │   ├── pdfService.js              # HTML 报告模板 + SVG 图表内嵌（降级方案）
│   │   └── smsService.js              # 腾讯云短信集成（dev 模式返回 123456）
│   │
│   └── utils/
│       └── timeUtils.js               # 北京时间格式化工具（toChinaISO / toChinaShort）
│
└── start.cjs                          # 生产启动脚本（构建前端 → 启动后端）
```

---

## 环境变量

### 前端 — 根目录 `.env`

| 变量 | 说明 | 可选值 |
|------|------|--------|
| `VITE_LZU_MODE` | 是否启用兰大模式 | `true` / `false` |

> 前端变量**必须以 `VITE_` 开头**才能被 Vite 注入。类型声明见 `src/vite-env.d.ts`。

### 后端 — `server/.env`

| 变量 | 说明 | 必填 | 示例 |
|------|------|------|------|
| `JWT_SECRET` | 用户 JWT 签名密钥 | ✅ | 随机长字符串 |
| `ADMIN_JWT_SECRET` | 管理员 JWT 签名密钥 | ✅ | 随机长字符串 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | ✅ | `sk-xxx` |
| `LZU_MODE` | 兰大模式（影响 AI prompt、计分权重、报告格式） | 否 | `true` |
| `PORT` | 服务端口 | 否 | `3000` |
| `DB_PATH` | SQLite 数据库文件路径 | 否 | `server/data/kiroo.db` |
| `NODE_OPTIONS` | Node.js 内存限制 | 否 | `--max-old-space-size=1024` |
| `SMS_ENABLED` | 是否启用腾讯云短信 | 否 | `false` |
| `SMS_SECRET_ID` | 腾讯云 SecretId | 否 | — |
| `SMS_SECRET_KEY` | 腾讯云 SecretKey | 否 | — |
| `SMS_SDK_APP_ID` | 短信应用 ID | 否 | — |
| `SMS_SIGN_NAME` | 短信签名 | 否 | — |
| `SMS_TEMPLATE_ID` | 验证码模板 ID | 否 | — |

---

## 快速开始

### 本地开发

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd server && npm install && cd ..

# 3. 配置后端环境变量
cp server/.env.example server/.env
# 编辑 server/.env，至少填入 DEEPSEEK_API_KEY

# 4. 如果需要兰大模式，创建根目录 .env
echo "VITE_LZU_MODE=true" > .env

# 5. 终端 1：启动前端 dev server
npm run dev

# 6. 终端 2：启动后端
cd server && node server.js
```

前端 dev server（`localhost:5173`）自动代理 `/api` 请求到后端（`localhost:3001`）。

### 生产部署

```bash
# 方式一：直接运行
cd server
cp .env.example .env       # 编辑填入必要变量
npm install
npm start                  # 启动后端，监听 0.0.0.0:3000

# 方式二：从项目根目录启动（自动构建前端 + 启动后端）
node start.cjs

# 方式三：Docker
docker compose up -d
```

Docker 部署要点：
- **单容器**：仅运行 Node.js 应用，SQLite 数据通过 Volume `app_data` 持久化
- **内存限制**：Docker 限制 1.5G，Node.js 限制 `--max-old-space-size=1024`（1G）
- **国内镜像**：Dockerfile 使用 npmmirror（npm）和阿里云镜像（apk）加速构建
- **Chart.js 本地**：构建时复制到 dist 目录，避免 CDN 被墙

---

## 兰大模式

同时开启前端和后端的 LZU 开关：

```bash
# 根目录 .env
VITE_LZU_MODE=true

# server/.env
LZU_MODE=true
```

### 兰大用户流程

```
HelloPage（兰大定制首页：「兰州大学管理学院 · 研究生职业发展测评」）
  │
  ▼
LoginPage / RegisterPage（手机号 + 姓名登录/注册）
  │
  ▼
自动创建 Session → 直接进入第 1 项问卷（无选择页）
  │
  ▼
QuizPage → 领导风格问卷（LASI）· 12 题
  │
  ▼
TransitionPage → 🎉 恭喜完成第一项测评！
  │                   继续第二项测评 →
  ▼
QuizPage → 16PF 人格测验（精选版）· 15 题
  │
  ▼
TransitionPage → 🎉 恭喜完成第二项测评！
  │                   继续第三项测评 →
  ▼
QuizPage → 创造力障碍测试 · 12 题
  │
  ▼
TransitionPage → 🏆 恭喜完成全部测评！
  │                   提交审核 →
  ▼
SubmittedPage → 进入生成队列 → AI 生成报告 → ⏳ 等待专家审核
  │
  ▼
管理员审核通过 → ReportPage → 查看完整报告（仪表盘 + 等级 + 图表 + 职业建议 + 提升计划）
```

### 通用模式用户流程

```
HelloPage → 登录/注册 → 选择问卷（多选勾选）→ 依次答题 → 全部完成 → 进入队列 → AI 生成报告 → 查看结果
```

---

## 用户认证

- **密码登录**：手机号 + 密码，密码 bcrypt 加密存储
- **短信验证码登录**：手机号 + 6 位验证码，dev 环境固定 `123456`
- **注册**：手机号 + 密码 + 姓名（必填），自动注册对应认证方式
- **JWT 令牌**：用户 7 天有效，管理员 24 小时有效
- **`user_auth_methods` 表**支持一个用户多种认证方式

## 数据库

项目使用 **SQLite (sql.js WASM)** 作为数据库。所有数据存储在单个 `.db` 文件中（默认 `server/data/kiroo.db`）。

**特性：**
- **WAL 模式**：允许并发读取，减少写锁冲突
- **写入互斥锁**：所有写操作通过互斥锁串行化，防止并发写入导致 `SQLITE_BUSY`
- **MySQL 语法兼容**：自动转换 `NOW()` → `datetime('now')`、`ON DUPLICATE KEY UPDATE` → `ON CONFLICT` 等
- **事务支持**：`getConnection()` 返回带 `beginTransaction/commit/rollback` 的连接对象

**核心表：**
- `users` — 用户信息
- `admins` — 管理员（默认：用户名 `admin`，密码 `admin123`）
- `user_auth_methods` — 用户认证方式
- `sms_codes` — 短信验证码
- `assessment_sessions` — 测评会话（关联多个问卷，跟踪进度）
- `assessment_records` — 单个问卷的答题记录与得分
- `comprehensive_reports` — AI 综合报告（含 `report_html`、`docx_path`、审核状态）

---

## API 端点

### 用户认证 `/api/auth`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 用户注册 |
| POST | `/login/password` | 密码登录 |
| POST | `/login/phone` | 短信验证码登录 |
| POST | `/send-code` | 发送短信验证码 |
| GET | `/profile` | 获取个人信息 |
| POST | `/update-password` | 修改密码 |
| POST | `/update-nickname` | 修改姓名 |

### 测评会话 `/api/sessions`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 创建会话 |
| GET | `/current` | 获取进行中的会话 |
| GET | `/:id` | 获取会话详情 |
| POST | `/:id/answers` | 保存问卷答案（自动推进进度） |
| POST | `/:id/submit` | 提交全部问卷，触发 AI 报告生成 |

### 测评记录 `/api/assessments`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/save` | 保存单个问卷记录 |
| GET | `/history` | 获取历史记录 |
| GET | `/:id` | 获取记录详情 |

### 综合报告 `/api/reports`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取用户的综合报告列表 |
| GET | `/:id` | 获取报告详情（含 HTML/DOCX 路径） |
| GET | `/:id/pdf` | 下载报告（优先 DOCX，降级 HTML） |

### 管理后台 `/api/admin`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/login` | 管理员登录 |
| GET | `/stats` | 后台统计数据 |
| GET | `/users` | 用户列表（分页 + 搜索） |
| GET | `/reports` | 报告列表（筛选 + 分页） |
| GET | `/reports/:id` | 报告详情（含测评记录） |
| PUT | `/reports/:id` | 编辑报告内容 |
| POST | `/reports/:id/approve` | 审核通过 |
| POST | `/reports/:id/reject` | 审核驳回 |

### 系统 `/api`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查（含报告生成队列状态） |
| POST | `/generate-report` | DeepSeek 单问卷 AI 分析（兼容旧版） |
| POST | `/generate-comprehensive-report` | DeepSeek 综合报告生成（JSON mode） |
| POST | `/reports/save` | 保存综合报告（AI 生成后调用） |

报告生成队列在 `/api/health` 返回 `{ queue: { running, waiting, maxConcurrent: 3 } }`，前端可通过轮询获知排队状态。

---

## 添加新问卷

在 `src/data/questionnaires/` 下创建 JSON 文件，格式如下：

```json
{
  "id": "my-test",
  "name": "测评名称",
  "category": "personality",
  "description": "简短描述（≤100字符）",
  "enabled": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "questions": [
    {
      "id": "q1",
      "sequence": 1,
      "text": "题目文字",
      "options": [
        { "id": "q1-a", "text": "选项A", "scores": { "dim1": 5 } }
      ]
    }
  ],
  "scoring_rule": {
    "type": "additive",
    "dimensions": [
      { "key": "dim1", "name": "维度名", "min": 0, "max": 20, "description": "维度描述" }
    ]
  }
}
```

如果是类别计分：

```json
{
  "scoring_rule": {
    "type": "categorical",
    "categories": [
      { "key": "type-a", "name": "类型A", "description": "描述" }
    ]
  }
}
```

选项中使用 `"category": "type-a"` 代替 `"scores"` 字段。

> ⚠️ **必须**在 `src/lib/questionnaireValidator.ts` 的 `VALID_CATEGORIES` 中添加新的 category 值，否则问卷会被校验过滤。同时在 `src/types/index.ts` 的 `QUESTIONNAIRE_PRIORITY`（通用）或 `LZU_QUESTIONNAIRE_PRIORITY`（兰大）中添加条目以控制显示顺序。

---

## 系统稳定性架构

针对 50 人并发测评场景的三层防护：

### 1. 报告生成队列（`queueService.js`）
```
用户提交 → enqueue(任务) → 最多3个并发 → 完成
                ↓ (超出排队)
              等待中…
```
- 最多 **3 个**报告同时生成，防止 DeepSeek API 限流和服务器内存峰值
- 单个任务最长 **3 分钟**超时
- `/api/health` 返回队列状态供前端轮询

### 2. DeepSeek 重试退避（`deepseekClient.js`）
- 最多 **3 次**重试
- **指数退避**：2s → 4s → 8s（429 限流），线性退避（5xx 错误）
- **AbortController 超时**：单次请求可配置超时（综合报告 120s，单问卷 60s）

### 3. SQLite 写入互斥锁（`db.js`）
- 所有写操作通过 Promise 链串行化
- **WAL 模式**：写入不阻塞读取，支持并发查询
- **busy_timeout=5000ms**：写锁等待超时
- 事务内写操作同样走互斥锁

---

## 运行测试

```bash
npm test
```

测试覆盖评分引擎、问卷校验、API 服务和组件渲染（含 Vitest + fast-check property-based testing + Playwright E2E）。

---

## 许可证

内部项目
