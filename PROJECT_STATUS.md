# MathKnights — 项目交接文档

## 项目概述

MathKnights 是一款基于明日方舟玩法的高等数学学习激励应用，用于学校创新竞赛。
- **前端**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **后端**: Python FastAPI（脚手架已完成，待接入 LLM/OCR）
- **仓库**: https://github.com/d95a-4c1d/mathknights-405ca303

## 核心玩法映射（明日方舟 → 高数学习）

| 方舟概念 | 对应功能 |
|---------|---------|
| 终端 → 做题 | 每个关卡对应一道题目 |
| 主线 | 章节（函数与极限、导数与微分等）→ 关卡形成有向无环图，有普通/突袭两种难度 |
| 自选 | 拍摄/导入题目图片 → OCR识别 → 生成关卡 |
| 任务 | 每日/每周学习 TD-DO List（完成题目、使用养成材料等）|
| 干员 | 学生学习能力展示（六维雷达图：数学抽象、逻辑推理、数学建模、直观想象、数学运算、数据分析）|
| 主页 | 右侧功能入口 + 左侧能力概览 + 背景场景图 |
| 养成（成长）| 升级系统：经验卡 → 升级，精英化 → 晋升 |
| 仓库 | 物品与素材展示 |

## 当前已完成

### 1. 前端页面（全部可用，mock 数据驱动）
- `src/pages/Home.tsx` — 主页：左侧档案卡+雷达图，右侧功能入口
- `src/pages/Study.tsx` — 学习终端：主线章节列表 + 自选题目（OCR上传区）
- `src/pages/ChapterPage.tsx` — 章节详情：关卡列表（线性解锁），展开显示题目
- `src/pages/Challenge.tsx` — 挑战页面：题目展示+答案输入+图片上传
- `src/pages/Result.tsx` — 结算页面：奖励展示+经验+任务进度
- `src/pages/Missions.tsx` — 任务页面：每日/每周任务列表+领取奖励
- `src/pages/Growth.tsx` — 成长页面：经验卡使用+等级规划+晋升
- `src/pages/Inventory.tsx` — 仓库页面：物品列表
- `src/pages/Settings.tsx` — 设置页面

### 2. API 服务层 `src/services/api.ts`
- 完整 TypeScript 类型定义，与后端 Pydantic 模型一一对应
- 所有函数当前为 stub（返回 mock 数据），标注了 `// TODO` 注释说明如何替换为真实 API 调用
- 覆盖：chapters, challenge, missions, user profile/exp/promote, ocr

### 3. FastAPI 后端脚手架 `backend/`
```
backend/
├── app/
│   ├── main.py              # FastAPI 入口 + CORS + 路由挂载
│   ├── models/schemas.py    # Pydantic 模型（对应前端 TS 类型）
│   └── routers/
│       ├── chapters.py      # GET /api/chapters, GET /api/chapters/{id}
│       ├── challenges.py    # POST /api/challenge
│       ├── missions.py      # GET /api/missions, POST /api/missions/{id}/claim
│       ├── user.py          # GET /api/user/profile, POST /api/user/exp, POST /api/user/promote
│       └── ocr.py           # POST /api/ocr/analyze（图片上传）
├── requirements.txt
└── README.md
```
- 所有路由返回 mock 数据，带 TODO 注释说明集成点
- CORS 已配置（localhost:5173, 8080, 3000）

### 4. 开发配置
- Vite proxy：`/api` → `localhost:8000`（前后端联调无需跨域）
- `.gitignore` 已更新（Python 缓存、venv、.env 等）

### 5. 已修复的问题
- Challenge.tsx: 题目区域改为 card-inset 包裹，添加文件上传处理和 isCustom 支持
- 所有有水印的页面内容区加了 `z-10` 防止遮挡
- CSS `@import` 移到 `@tailwind` 前面修复警告

## 数据模型（mockData.ts）

### 章节结构
```
Chapter → Stage → Problem
- Chapter: id, number, title, subtitle, stages[], available
- Stage: id, name, topic, problems[], unlocked, cleared
- Problem: id, difficulty(Easy/Hard), question, rewards[], firstClearBonus[]
```

### 物品系统
- `basic_exp` — 基础经验卡 (+100 EXP)
- `advanced_exp` — 高级经验卡 (+500 EXP)
- `promotion_ticket` — 晋升凭证（精英化用）

### 经验公式
```ts
expForLevel(level) = 0.0426294375 * level³ - 1.77973802 * level² + 66.4218848 * level + 74.0646917
```

### 能力维度（六维雷达图）
数学抽象(72)、逻辑推理(65)、数学建模(48)、直观想象(58)、数学运算(81)、数据分析(55)

## 下一步工作

### 优先级 P0
1. **LLM 判题** — `backend/app/routers/challenges.py` 中接入大模型评估学生答案
2. **OCR 识别** — `backend/app/routers/ocr.py` 中接入图片识别解析数学题目
3. **前端 api.ts 逐个替换 stub** — 把 mock 返回改为 `request<T>(...)` 调用

### 优先级 P1
4. **数据库** — 用 SQLite 起步，持久化用户进度、关卡状态、任务完成情况
5. **用户认证** — 简单的用户名/ID 系统
6. **有向无环图** — 关卡解锁逻辑从线性改为 DAG
7. **突袭难度** — 每个关卡增加 Hard 模式变体
8. **自选题目完整流程** — OCR → 难度评估 → 生成关卡

### 优先级 P2
9. **教学关** — 知识点讲解+例题展示
10. **更长期任务** — 通行证、主线里程碑等
11. **背景场景图** — 替换占位图为教室/图书馆等学习场景

## 启动方式

```bash
# 前端
cd mathknights && npm install && npm run dev
# → http://localhost:8080

# 后端
cd mathknights/backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs（Swagger API 文档）
```

## 参考设计稿

用户提供了 10 张明日方舟 UI 截图作为参考设计，包括：主页、终端（主线页）、章节选择、关卡结算、奖励获取、任务页面、升级页面（滑动升级条/精英化）等。美术风格为"末世工业风+扁平化科技感"，主色调深灰/银白/黑+橙色强调色。
