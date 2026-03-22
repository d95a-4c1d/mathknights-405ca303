"""
demo_setup.py — 演示环境一键初始化脚本
用法：
    python demo_setup.py 1   # 视频一：主线通关
    python demo_setup.py 2   # 视频二：任务领取
    python demo_setup.py 3   # 视频三：自选题目（定向强化）
    python demo_setup.py 4   # 视频四：能力养成
    python demo_setup.py 0   # 完全重置（清空所有进度）
"""

import asyncio
import sys
import json
from sqlalchemy import delete, update, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite+aiosqlite:///./mathknights.db"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# 所有 stage_id → problem_id 的映射（与 seed_data 一致）
# 每个 stage 有两道题：Easy 和 Hard
STAGE_PROBLEMS = {
    # 第一章：函数与极限
    "s1-1": ["p1-1e", "p1-1h"],
    "s1-2": ["p1-2e", "p1-2h"],
    "s1-3": ["p1-3e", "p1-3h"],
    "s1-4": ["p1-4e", "p1-4h"],
    "s1-5": ["p1-5e", "p1-5h"],
    # 第二章：导数与微分
    "s2-1": ["p2-1e", "p2-1h"],
    "s2-2": ["p2-2e", "p2-2h"],
    "s2-3": ["p2-3e", "p2-3h"],
    "s2-4": ["p2-4e", "p2-4h"],
    # 第三章：导数的应用
    "s3-1": ["p3-1e", "p3-1h"],
    "s3-2": ["p3-2e", "p3-2h"],
    "s3-3": ["p3-3e", "p3-3h"],
    # 第四章：不定积分
    "s4-1": ["p4-1e", "p4-1h"],
    "s4-2": ["p4-2e", "p4-2h"],
    "s4-3": ["p4-3e", "p4-3h"],
    # 第五章：定积分
    "s5-1": ["p5-1e", "p5-1h"],
    "s5-2": ["p5-2e", "p5-2h"],
    "s5-3": ["p5-3e", "p5-3h"],
    # 第六章：微分方程
    "s6-1": ["p6-1e", "p6-1h"],
    "s6-2": ["p6-2e", "p6-2h"],
    "s6-3": ["p6-3e", "p6-3h"],
}


async def reset_all(db: AsyncSession):
    """完全重置：清空所有用户进度和 mission 进度"""
    from app.models.orm_models import UserProgress, UserMission, User as DBUser

    await db.execute(delete(UserProgress))
    await db.execute(delete(UserMission))
    await db.execute(
        update(DBUser)
        .where(DBUser.id == "default")
        .values(
            level=1, exp=0, elite=0,
            basic_exp=0, advanced_exp=0, promotion_ticket=0,
            comp_abstract=50, comp_logic=50, comp_modeling=50,
            comp_imagination=50, comp_computation=50, comp_data=45,
            easy_completed=0, hard_completed=0,
        )
    )
    await db.commit()
    print("✅ 已完全重置所有进度")


async def mark_problems_completed(db: AsyncSession, problem_ids: list[str], score: float = 1.0):
    """将指定题目标记为已完成"""
    from app.models.orm_models import UserProgress

    for pid in problem_ids:
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == "default",
                UserProgress.problem_id == pid,
            )
        )
        prog = result.scalar_one_or_none()
        if not prog:
            prog = UserProgress(user_id="default", problem_id=pid)
            db.add(prog)
        prog.completed = True
        prog.attempts = 1
        prog.best_score = score
    await db.commit()


async def mark_problems_attempted(db: AsyncSession, problem_ids: list[str]):
    """将指定题目标记为尝试过但未完成（用于错题本）"""
    from app.models.orm_models import UserProgress

    for pid in problem_ids:
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == "default",
                UserProgress.problem_id == pid,
            )
        )
        prog = result.scalar_one_or_none()
        if not prog:
            prog = UserProgress(user_id="default", problem_id=pid)
            db.add(prog)
        prog.completed = False
        prog.attempts = 2
        prog.best_score = 0.4
    await db.commit()


async def set_user_stats(db: AsyncSession, **kwargs):
    from app.models.orm_models import User as DBUser
    await db.execute(update(DBUser).where(DBUser.id == "default").values(**kwargs))
    await db.commit()


async def set_mission_progress(db: AsyncSession, mission_id: str, current: int, claimed: bool = False):
    from app.models.orm_models import UserMission
    result = await db.execute(
        select(UserMission).where(
            UserMission.user_id == "default",
            UserMission.mission_id == mission_id,
        )
    )
    m = result.scalar_one_or_none()
    if m:
        m.current = current
        m.claimed = claimed
        await db.commit()


# ─────────────────────────────────────────────────────────────────────
# 视频一：主线通关功能
# 场景：已完成第一章前两关，正要挑战第三关（s1-3）
# 效果：打开应用 → 进入第一章 → s1-3 可点击，其他后续关卡锁定
# ─────────────────────────────────────────────────────────────────────
async def setup_demo1(db: AsyncSession):
    await reset_all(db)

    # 完成 s1-1 和 s1-2 的 Easy 题，解锁到 s1-3
    await mark_problems_completed(db, ["p1-1e", "p1-2e"])

    # 给一点基础经验，让等级看起来不是完全空白
    await set_user_stats(db,
        level=3, exp=180,
        basic_exp=3, advanced_exp=1,
        easy_completed=2,
        comp_abstract=53, comp_logic=51, comp_computation=51,
    )

    print("""
✅ 视频一「主线通关」环境已就绪

【当前状态】
  · 第一章前两关（集合与区间、定义域与值域）已完成
  · 第三关「函数性质」(s1-3) 已解锁，等待挑战
  · 后续关卡仍锁定

【录制步骤】
  1. 打开 http://localhost:8080
  2. 点击「学习」→ 进入「第一章：函数与极限」
  3. 点击第三个节点「函数的基本性质」，选 Easy 或 Hard 题
  4. 点击「随机挑战」→ 展示「AI 出题中…」动效
  5. 进入挑战页，输入答案，提交
  6. 展示结果页奖励动效
  7. 返回章节地图，展示 s1-4 已解锁
""")


# ─────────────────────────────────────────────────────────────────────
# 视频二：任务领取功能
# 场景：已完成 4 道简单题（d1「完成5道」差一题满），1道困难题（d4 已满）
# 效果：做一道简单题 → d1 满了 → 点击「领取」→ 获得经验卡
# ─────────────────────────────────────────────────────────────────────
async def setup_demo2(db: AsyncSession):
    await reset_all(db)

    # 重新创建任务行（reset_all 删除了它们）
    from app.routers.missions import ensure_missions
    await ensure_missions(db, "default")

    # 已完成 s1-1 和 s1-2 的两道 Easy 题 + s1-3 Easy + s2-1 Easy
    await mark_problems_completed(db, ["p1-1e", "p1-2e", "p1-3e", "p1-4e"])
    # 完成一道 Hard 题（d4「完成1道困难题」满足）
    await mark_problems_completed(db, ["p1-1h"])

    await set_user_stats(db,
        level=4, exp=240,
        basic_exp=5, advanced_exp=1,
        easy_completed=4, hard_completed=1,
    )

    # 设置任务进度：「完成5道简单题」差1题、「完成1道困难题」已满待领取
    await set_mission_progress(db, "d1", current=4)   # 差1题 → 录制中完成最后1题
    await set_mission_progress(db, "d2", current=4)
    await set_mission_progress(db, "d3", current=4)
    await set_mission_progress(db, "d4", current=1)   # 已满，可以直接领取
    await set_mission_progress(db, "d8", current=2)   # 背诵公式差1个

    print("""
✅ 视频二「任务领取」环境已就绪

【当前状态】
  · 「完成5道简单题」进度 4/5，差最后1题
  · 「完成1道困难题」进度 1/1，可以直接领取 ✓
  · 「背诵3个公式」进度 2/3

【录制步骤】
  1. 打开「任务」页面，展示任务列表和进度条
  2. 演示「完成1道困难题」可领取 → 点击「领取」→ 展示获得经验卡
  3. 切到学习页面，再做1道简单题
  4. 回到任务页，展示「完成5道简单题」已满，点击「领取」
  5. 切到「公式」标签，展开一个公式，点「记住了」→ 进度+1
""")


# ─────────────────────────────────────────────────────────────────────
# 视频三：自选题目（定向强化 — 积分章节）
# 场景：已完成前三章，第四章「不定积分」已解锁，模拟"复习积分"
# 效果：进入第四章 → 选 Hard 题 → AI 出题 → 提交
# ─────────────────────────────────────────────────────────────────────
async def setup_demo3(db: AsyncSession):
    await reset_all(db)

    # 完成前三章所有题目（Easy 即可），解锁到第四章
    ch1_easy = ["p1-1e", "p1-2e", "p1-3e", "p1-4e", "p1-5e"]
    ch2_easy = ["p2-1e", "p2-2e", "p2-3e", "p2-4e"]
    ch3_easy = ["p3-1e", "p3-2e", "p3-3e"]
    await mark_problems_completed(db, ch1_easy + ch2_easy + ch3_easy)

    # 额外完成一些 Hard 题，让能力值更好看
    await mark_problems_completed(db, ["p1-1h", "p1-3h", "p2-1h", "p3-1h"])

    await set_user_stats(db,
        level=12, exp=650,
        basic_exp=8, advanced_exp=3, promotion_ticket=0,
        easy_completed=12, hard_completed=4,
        comp_abstract=62, comp_logic=64, comp_computation=66,
        comp_modeling=54, comp_imagination=53, comp_data=45,
    )

    print("""
✅ 视频三「自选题目（定向强化）」环境已就绪

【当前状态】
  · 前三章全部完成，第四章「不定积分」已解锁
  · 用户等级 12，体现一定学习积累

【录制步骤】
  1. 打开「学习」→ 章节地图
  2. 滑动到「第四章：不定积分」，进入
  3. 点击第一关「不定积分的概念」→ 选择 Hard 难度
  4. 点击「随机挑战」→ 展示 AI 正在生成专属题目
  5. 进入挑战页，朗读/展示题目（停顿3秒）
  6. 输入答案，提交，展示 AI 批改结果

  【旁白建议】
  "期中考试前，发现不定积分薄弱，
   直接进入对应章节，系统即时生成专属训练题"
""")


# ─────────────────────────────────────────────────────────────────────
# 视频四：能力养成功能
# 场景：展示雷达图从"均衡平庸"经过做题后能力提升的过程
# 演示方式：对比展示做题前后雷达图（需在录制中完成2~3道题）
# ─────────────────────────────────────────────────────────────────────
async def setup_demo4(db: AsyncSession):
    await reset_all(db)

    # 完成少量题目，能力值略有参差，展示差异化
    await mark_problems_completed(db, ["p1-1e", "p1-2e", "p1-1h"])

    # 有一些经验卡在仓库，可以演示使用经验卡升级
    await set_user_stats(db,
        level=8, exp=420,
        basic_exp=12, advanced_exp=5, promotion_ticket=0,
        easy_completed=2, hard_completed=1,
        # 能力值有明显高低对比，视觉效果好
        comp_abstract=58, comp_logic=50, comp_computation=60,
        comp_modeling=50, comp_imagination=50, comp_data=45,
    )

    print("""
✅ 视频四「能力养成」环境已就绪

【当前状态】
  · 等级 8，有 12张基础经验卡 + 5张高级经验卡
  · 运算能力(60)和抽象能力(58)略高，其他维度偏低 → 雷达图有明显形状
  · 可在录制中完成导数题使「运算」和「逻辑」维度提升

【录制步骤】
  ① 展示雷达图（主页或成长页）— 记录当前形状
  ② 点击「成长」→ 展示升级面板、经验卡数量
  ③ 输入目标等级 15，展示自动计算所需经验卡数
  ④ 点击「应用」→ 展示等级从 8 升到更高，经验条变化
  ⑤ 切到学习，做1道第二章「导数」Hard 题（完成后 comp_computation +2）
  ⑥ 返回主页 → 展示雷达图「运算」维度肉眼可见增长

  【旁白建议】
  "随着主线通关，雷达图各项能力持续提升，
   将抽象的知识积累转化为可量化的面板成长"
""")


# ─────────────────────────────────────────────────────────────────────
# 主入口
# ─────────────────────────────────────────────────────────────────────
async def main():
    scenario = int(sys.argv[1]) if len(sys.argv) > 1 else 0

    # 确保数据库存在（先启动一次后端让 init_db 跑完）
    async with AsyncSessionLocal() as db:
        # 确保 default 用户存在
        from app.models.orm_models import User as DBUser
        result = await db.execute(select(DBUser).where(DBUser.id == "default"))
        user = result.scalar_one_or_none()
        if not user:
            print("❌ 未找到 default 用户，请先启动一次后端（uvicorn）再运行此脚本")
            return

        if scenario == 0:
            await reset_all(db)
        elif scenario == 1:
            await setup_demo1(db)
        elif scenario == 2:
            await setup_demo2(db)
        elif scenario == 3:
            await setup_demo3(db)
        elif scenario == 4:
            await setup_demo4(db)
        else:
            print("用法: python demo_setup.py [0|1|2|3|4]")

        # 同步 mission 进度到实际 easy/hard_completed（视频二需要）
        if scenario == 2:
            from app.routers.missions import ensure_missions
            await ensure_missions(db, "default")


if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # 加载 .env
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(main())
