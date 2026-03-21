# MathKnights — 项目交接文档

> 最后更新：2026-03-22 00:46

## 项目概述

MathKnights 是一款基于明日方舟玩法的高等数学学习激励应用，用于学校创新竞赛。
- **前端**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **后端**: Python FastAPI + SQLite (SQLAlchemy) + DeepSeek LLM
- **仓库**: https://github.com/d95a-4c1d/mathknights-405ca303

## 核心玩法映射（明日方舟 → 高数学习）

| 方舟概念 | 对应功能 |
|---------|---------|
| 终端 → 做题 | 每个关卡对应一道题目 |
| 主线 | 章节（函数与极限、导数与微分等）→ 关卡列表，普通/困难两种难度 |
| 自选 | 拍摄/导入题目图片 → OCR识别 → 生成关卡 |
| 任务 | 每日/每周学习 TD-DO List（完成题目、使用养成材料等）|
| 干员 | 学生学习能力展示（六维雷达图）|
| 主页 | 右侧功能入口 + 左侧能力概览 + 背景场景图 |
| 养成（成长）| 升级系统：经验卡 → 升级，精英化 → 晋升 |
| 仓库 | 物品与素材展示 |

## 当前已完成

### 1. 前端页面（全部可用，已接入后端 API）

| 页面 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 主页 | `src/pages/Home.tsx` | ✅ | 左侧档案卡+雷达图，右侧功能入口 |
| 学习终端 | `src/pages/Study.tsx` | ✅ 已接入 | 主线章节列表 + 自选题目（OCR上传→DeepSeek识别） |
| 章节详情 | `src/pages/ChapterPage.tsx` | ✅ 已修复 | 修复了硬编码 `ch1` bug，现在读 URL 参数 |
| 挑战页面 | `src/pages/Challenge.tsx` | ✅ 已接入 | 题目展示+答案输入，接入 LLM 判题 |
| 结算页面 | `src/pages/Result.tsx` | ✅ 已增强 | 显示 AI 评语、支持失败状态 |
| 任务页面 | `src/pages/Missions.tsx` | ✅ | 每日/每周任务列表+领取奖励 |
| 成长页面 | `src/pages/Growth.tsx` | ✅ | 经验卡使用+等级规划+晋升 |
| 仓库页面 | `src/pages/Inventory.tsx` | ✅ | 物品列表 |
| 设置页面 | `src/pages/Settings.tsx` | ✅ | 系统配置 |

### 2. API 服务层 `src/services/api.ts` — ✅ 已全部替换为真实调用

- 所有函数改为 `request<T>(...)` 调用真实 FastAPI 后端
- 自动 `snake_case → camelCase` 转换
- Vite proxy `/api` → `localhost:8000`，前后端联调无需跨域
- 覆盖：chapters, challenge, missions, user profile/exp/promote, ocr

### 3. FastAPI 后端 — ✅ 已完整实现（非脚手架）

```
backend/
├── app/
│   ├── main.py              # FastAPI 入口 + lifespan + CORS
│   ├── database.py          # SQLite 异步引擎 (aiosqlite + SQLAlchemy)
│   ├── models/
│   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   └── orm_models.py    # SQLAlchemy ORM 模型（6 张表）
│   ├── routers/
│   │   ├── chapters.py      # 章节 CRUD + 种子数据（5章12+关卡）
│   │   ├── challenges.py    # 答题 + LLM 判题 + 进度记录
│   │   ├── missions.py      # 任务查询 + 领取奖励（9每日+14每周）
│   │   ├── user.py          # 用户档案 + 经验升级 + 精英化
│   │   └── ocr.py           # 图片上传 → DeepSeek Vision OCR
│   └── services/
│       └── deepseek.py      # DeepSeek LLM 集成（判题/出题/OCR）
├── .env                     # 环境变量（DEEPSEEK_API_KEY）
├── .env.example             # 环境变量模板
└── requirements.txt         # fastapi, uvicorn, sqlalchemy, aiosqlite, openai, python-dotenv
```

### 4. 数据库模型（SQLite via SQLAlchemy）

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户档案 | level, exp, elite, 六维能力值, 物品库存, 完成计数 |
| `chapters` | 章节 | number, title, subtitle, available |
| `stages` | 关卡 | chapter_id, name, topic, order |
| `problems` | 题目 | stage_id, difficulty, question, reference_answer, rewards, first_clear_bonus |
| `user_progress` | 做题记录 | user_id, problem_id, completed, attempts, best_score |
| `user_missions` | 任务进度 | user_id, mission_id, mission_type, current, target, claimed |

### 5. DeepSeek LLM 集成 — `backend/app/services/deepseek.py`

| 功能 | 函数 | 说明 |
|------|------|------|
| 判题 | `grade_answer(question, answer, reference)` | 返回 `{correct, score, feedback}` |
| 出题 | `generate_problem(topic, difficulty)` | 返回 `{question, reference_answer}` |
| OCR | `parse_image_to_problem(base64)` | 返回 `{question, topic, difficulty}` |
| 奖励 | `evaluate_rewards(question, difficulty, score)` | 根据难度和得分计算奖励 |

所有函数在无 API Key 时有 fallback 行为（本地简单判断/预设题目）。

### 6. 种子数据 — 5 个完整章节

| 章节 | 主题 | 关卡数 | 难度 |
|------|------|--------|------|
| CH-01 函数与极限 | 集合、定义域、函数性质 | 3 | Easy + Hard |
| CH-02 导数与微分 | 导数定义、求导法则 | 2 | Easy + Hard |
| CH-03 导数的应用 | 极值与最值 | 1 | Easy + Hard |
| CH-04 不定积分 | 基本积分、分部积分 | 1 | Easy + Hard |
| CH-05 定积分 | 牛顿-莱布尼茨公式 | 1 | Easy + Hard |

每道题都有 `reference_answer`（参考解答），供 LLM 判题时对照。

### 7. 已修复的问题

- **ChapterPage.tsx**: `find(c => c.id === 'ch1')` → `find(c => c.id === id)`（读 URL 参数）
- **GameContext.tsx**: 任务匹配从英文 `includes('easy')` 改为中文 `includes('简单题')`/`includes('困难题')`
- **missions.py**: FastAPI deprecation `regex` → `pattern`
- **challenges.py**: `user_progress.attempts` 处理 None 默认值
- **deepseek.py**: 添加 `dotenv` 加载 .env，解决 API Key 不生效问题

### 8. Git 提交记录

```
5cc7932 feat: 接入 FastAPI 后端 + DeepSeek LLM + SQLite 数据库
```

## 启动方式

```bash
# 后端
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs（Swagger API 文档）

# 前端（另一个终端）
cd mathknights
npm install
npm run dev
# → http://localhost:8080
```

前端 Vite proxy 自动将 `/api` 转发到 `localhost:8000`，无需额外配置。

## 下一步工作

### 优先级 P0（核心功能完善）
1. **DAG 关卡解锁** — 当前线性解锁，改为有向无环图（前置关卡完成才能解锁后续）
2. **普通/突袭难度** — 突袭难度规则更严格（如限时、步骤要求等），不只是题更难
3. **任务进度同步** — 完成关卡后同步更新后端任务 current 字段（目前前端 GameContext 本地更新，后端 missions 未联动）

### 优先级 P1（体验优化）
4. **教学关** — 每个知识点首关为教学关：知识点讲解 + 固定例题
5. **自选题目完整流程** — OCR → LLM 评估难度 → 生成关卡 → 进入挑战（流程已基本打通）
6. **关卡重新生成** — 非教学关每次挑战用 LLM 重新出题
7. **登录/多用户** — 当前 user_id 默认 "default"，需支持多用户

### 优先级 P2（锦上添花）
8. **更长期任务** — 通行证、主线里程碑等
9. **背景场景图** — 替换占位图为教室/图书馆等学习场景
10. **错题本** — 记录做错的题目，支持复习
11. **公式背诵** — 任务系统中的"背诵公式"功能

## 参考设计稿

用户提供了 10 张明日方舟 UI 截图作为参考设计，包括：主页、终端（主线页）、章节选择、关卡结算、奖励获取、任务页面、升级页面（滑动升级条/精英化）等。美术风格为"末世工业风+扁平化科技感"，主色调深灰/银白/黑+橙色强调色。
