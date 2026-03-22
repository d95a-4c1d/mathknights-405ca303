# MathKnights — 高数学习激励应用

基于明日方舟玩法的高等数学学习辅助激励应用，用于学校创新竞赛。

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **后端**: Python FastAPI + SQLite + SQLAlchemy
- **AI**: DeepSeek LLM（判题 + 出题 + OCR）

## 快速启动

### 1. 后端

```bash
cd backend
# 配置环境变量（已内置 .env，含 DeepSeek API Key）
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
# API 文档: http://localhost:8000/docs
```

### 2. 前端

```bash
# 在项目根目录
npm install
npm run dev
# 访问: http://localhost:8080
```

前端通过 Vite proxy 自动将 `/api` 请求转发到后端 `localhost:8000`。

## 核心功能

| 功能 | 说明 |
|------|------|
| **主线** | 5个章节（函数与极限→定积分），每章多关卡，有普通/困难两种难度 |
| **自选** | 上传题目图片 → DeepSeek OCR识别 → 生成关卡 |
| **任务** | 每日/每周任务系统（完成题目、复习错题等）|
| **成长** | 经验卡升级系统 + 精英化晋升 |
| **仓库** | 物品管理（基础/高级经验卡、晋升凭证）|
| **干员** | 六维能力雷达图（数学抽象、逻辑推理等）|

## AI 功能

- **LLM 判题**: DeepSeek 根据题目和参考答案自动批改，给出分数和反馈
- **自动出题**: 根据知识点和难度用 DeepSeek 生成新题目（每次不同）
- **OCR 识别**: DeepSeek Vision 识别图片中的数学题目

## 项目结构

```
mathknights/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── database.py          # SQLite 异步数据库
│   │   ├── models/
│   │   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   │   └── orm_models.py    # SQLAlchemy ORM 模型
│   │   ├── routers/
│   │   │   ├── chapters.py      # 章节 & 关卡
│   │   │   ├── challenges.py    # 答题 & LLM 判题
│   │   │   ├── missions.py      # 任务系统
│   │   │   ├── user.py          # 用户档案 & 升级
│   │   │   └── ocr.py           # 图片识别
│   │   └── services/
│   │       └── deepseek.py      # DeepSeek LLM 集成
│   ├── .env                     # 环境变量（DeepSeek API Key）
│   └── requirements.txt
├── src/
│   ├── pages/                   # 各页面组件
│   ├── services/api.ts          # 前端 API 服务层（已对接后端）
│   ├── context/GameContext.tsx   # 全局游戏状态
│   └── data/mockData.ts         # 类型定义 & 本地数据
└── ...
```
