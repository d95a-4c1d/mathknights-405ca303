# MathKnights — 项目交接文档

> 最后更新：2026-03-22 01:35

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
| 主页 | `src/pages/Home.tsx` | ✅ | 左侧档案卡+雷达图（数据来自后端），右侧功能入口 |
| 学习终端 | `src/pages/Study.tsx` | ✅ 已接入 | 主线章节列表 + 自选题目（OCR上传→DeepSeek识别） |
| 章节详情 | `src/pages/ChapterPage.tsx` | ✅ 已修复 | 修复硬编码标题，动态显示章节名+序号；DAG关卡解锁 |
| 挑战页面 | `src/pages/Challenge.tsx` | ✅ 已接入 | 题目展示+答案输入，接入 LLM 判题 |
| 结算页面 | `src/pages/Result.tsx` | ✅ 已增强 | 显示 AI 评语、支持失败状态 |
| 任务页面 | `src/pages/Missions.tsx` | ✅ 已接入 | 每日/每周任务列表+领取奖励（数据来自后端） |
| 成长页面 | `src/pages/Growth.tsx` | ✅ 已接入 | 经验卡使用+等级规划+晋升（数据来自后端） |
| 仓库页面 | `src/pages/Inventory.tsx` | ✅ | 物品列表 |
| 设置页面 | `src/pages/Settings.tsx` | ✅ | 系统配置 |

### 2. API 服务层 `src/services/api.ts` — ✅ 已全部接入真实后端

- 所有函数调用真实 FastAPI 后端（通过 Vite proxy `/api` → `localhost:8000`）
- 自动 `snake_case → camelCase` 转换
- 章节接口携带 `user_id` 参数，返回带用户进度的数据
- 覆盖：chapters, challenge, missions, user profile/exp/promote, ocr

### 3. FastAPI 后端 — ✅ 完整可用

```
backend/
├── app/
│   ├── main.py              # FastAPI 入口 + lifespan（启动时自动种子+创建用户）
│   ├── database.py          # SQLite 异步引擎 (aiosqlite + SQLAlchemy)
│   ├── models/
│   │   ├── schemas.py       # Pydantic 请求/响应模型（含 completed/best_score）
│   │   └── orm_models.py    # SQLAlchemy ORM 模型（6 张表）
│   ├── routers/
│   │   ├── chapters.py      # 章节 CRUD + 种子数据（5章12+关卡）+ 用户进度关联
│   │   ├── challenges.py    # 答题 + LLM 判题 + 进度记录 + 任务同步
│   │   ├── missions.py      # 任务查询 + 领取奖励（9每日+14每周）
│   │   ├── user.py          # 用户档案 + 经验升级 + 精英化
│   │   └── ocr.py           # 图片上传 → DeepSeek Vision OCR
│   └── services/
│       └── deepseek.py      # DeepSeek LLM 集成（判题/出题/OCR）
├── .env                     # 环境变量（DEEPSEEK_API_KEY）
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

### 5. DeepSeek LLM 集成 — ✅ 已验证可用

| 功能 | 函数 | 状态 |
|------|------|------|
| 判题 | `grade_answer(question, answer, reference)` | ✅ 返回 correct/score/feedback |
| 出题 | `generate_problem(topic, difficulty)` | ✅ 返回 question/reference_answer |
| OCR | `parse_image_to_problem(base64)` | ✅ 返回 question/topic/difficulty |
| 奖励 | `evaluate_rewards(question, difficulty, score)` | ✅ 根据难度和得分计算奖励 |

### 6. 种子数据 — 5 个完整章节（全部可用）

| 章节 | 主题 | 关卡数 | 状态 |
|------|------|--------|------|
| CH-01 函数与极限 | 集合、定义域、函数性质 | 3 | ✅ |
| CH-02 导数与微分 | 导数定义、求导法则 | 2 | ✅ |
| CH-03 导数的应用 | 极值与最值 | 1 | ✅ |
| CH-04 不定积分 | 基本积分、分部积分 | 1 | ✅ |
| CH-05 定积分 | 牛顿-莱布尼茨公式 | 1 | ✅ |

每关有 Easy（普通）+ Hard（困难）两道题，含 reference_answer 供 LLM 判题对照。

### 7. GameContext — ✅ 已改为从后端加载

- `useEffect` 启动时调用 `fetchUserProfile` / `fetchChapters` / `fetchMissions`
- 能力六维图数据来自后端用户档案
- 经验卡使用、晋升操作走后端 API
- 完成本地操作后同步刷新后端数据

## 本次修复的问题

### 后端修复
1. **`.env` 文件缺失** → 创建 `backend/.env`，配置 DeepSeek API Key
2. **章节 API 不关联用户进度** → `_chapter_to_schema` 改为查询 `user_progress` 表，返回 `unlocked`/`cleared`/`completed`/`best_score`
3. **关卡解锁逻辑跨章节泄露** → 每章独立计算 DAG 解锁（首关始终解锁，后续关卡需前一关通关）
4. **判题后任务不同步** → `challenges.py` 新增 `_update_missions()` 函数，完成关卡自动更新任务进度
5. **种子数据只在访问 chapters 时初始化** → 改为 `lifespan` 启动时自动种子化 + 创建默认用户/任务
6. **所有章节 available=False** → 改为全部可用

### 前端修复
7. **ChapterPage 标题硬编码** → 改为动态读取 `chapter.title` / `chapter.subtitle` / `chapter.number`
8. **GameContext 使用纯 mockData** → 重写为从后端 API 加载数据，保留本地 fallback
9. **mockData Problem 类型缺字段** → 添加 `completed`/`bestScore` 可选字段
10. **章节 API 缺 user_id** → `fetchChapters`/`fetchChapter` 调用时传入 `user_id`
11. **能力雷达图使用硬编码数据** → Home/Growth 改为使用 `game.competencies`（来自后端）

### 已验证的完整流程
```
获取章节（含进度）→ 选择关卡 → 进入挑战 → 提交答案 → DeepSeek LLM 判题
→ 返回结果+评语 → 更新用户进度 → 更新任务进度 → 更新背包 → 结算页面展示
```

## 启动方式

```bash
# 后端
cd backend
pip install -r requirements.txt
# .env 文件已包含 DEEPSEEK_API_KEY
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
1. **普通/突袭难度** — 突袭难度规则更严格（如限时、步骤要求等），不只是题更难
2. **教学关** — 每个知识点首关为教学关：知识点讲解 + 固定例题
3. **关卡重新生成** — 非教学关每次挑战用 LLM 重新出题

### 优先级 P1（体验优化）
4. **自选题目完整流程** — OCR → LLM 评估难度 → 生成关卡 → 进入挑战（流程已基本打通）
5. **登录/多用户** — 当前 user_id 默认 "default"，需支持多用户
6. **章节解锁联动** — 完成前一章所有关卡后自动解锁下一章

### 优先级 P2（锦上添花）
7. **更长期任务** — 通行证、主线里程碑等
8. **背景场景图** — 替换占位图为教室/图书馆等学习场景
9. **错题本** — 记录做错的题目，支持复习
10. **公式背诵** — 任务系统中的"背诵公式"功能

## Git 提交记录

```
5cc7932 feat: 接入 FastAPI 后端 + DeepSeek LLM + SQLite 数据库（上一版）
[待提交] fix: 修复 API 对接、DAG 解锁、任务同步、前端后端数据打通（本次）
```

## 参考设计稿

用户提供了 10 张明日方舟 UI 截图作为参考设计，包括：主页、终端（主线页）、章节选择、关卡结算、奖励获取、任务页面、升级页面（滑动升级条/精英化）等。美术风格为"末世工业风+扁平化科技感"，主色调深灰/银白/黑+橙色强调色。
