"""
User profile & progression endpoints — backed by SQLite.
"""

import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import UserProfile, Inventory, Competency, ExpCardUse, WrongAnswerItem
from app.models.orm_models import User as DBUser, UserProgress, Problem as DBProblem, Stage as DBStage, Chapter as DBChapter

router = APIRouter()


def exp_for_level(level: int) -> int:
    return round(
        0.0426294375 * level**3
        - 1.77973802 * level**2
        + 66.4218848 * level
        + 74.0646917
    )


async def ensure_user(db: AsyncSession, user_id: str) -> DBUser:
    result = await db.execute(select(DBUser).where(DBUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = DBUser(
            id=user_id, username=user_id,
            level=1, exp=0, elite=0,
            basic_exp=5, advanced_exp=2, promotion_ticket=0,
            comp_abstract=50, comp_logic=50, comp_modeling=45,
            comp_imagination=50, comp_computation=55, comp_data=45,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


def user_to_profile(user: DBUser) -> dict:
    return {
        "level": user.level,
        "exp": user.exp,
        "elite": user.elite,
        "inventory": {
            "basic_exp": user.basic_exp,
            "advanced_exp": user.advanced_exp,
            "promotion_ticket": user.promotion_ticket,
        },
        "competencies": [
            {"name": "抽象", "full_name": "数学抽象", "value": user.comp_abstract},
            {"name": "逻辑", "full_name": "逻辑推理", "value": user.comp_logic},
            {"name": "建模", "full_name": "数学建模", "value": user.comp_modeling},
            {"name": "直觉", "full_name": "直观想象", "value": user.comp_imagination},
            {"name": "运算", "full_name": "数学运算", "value": user.comp_computation},
            {"name": "数据", "full_name": "数据分析", "value": user.comp_data},
        ],
        "easy_completed": user.easy_completed or 0,
        "hard_completed": user.hard_completed or 0,
    }


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    user = await ensure_user(db, user_id)
    return user_to_profile(user)


@router.post("/exp", response_model=UserProfile)
async def use_exp_cards(
    body: ExpCardUse,
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    user = await ensure_user(db, user_id)

    if body.type == "basic_exp":
        use = min(body.count, user.basic_exp)
        exp_gain = use * 100
        user.basic_exp -= use
    elif body.type == "advanced_exp":
        use = min(body.count, user.advanced_exp)
        exp_gain = use * 500
        user.advanced_exp -= use
    else:
        return user_to_profile(user)

    # Level up logic
    max_level = 50 if user.elite == 0 else 70
    user.exp += exp_gain
    while user.level < max_level and user.exp >= exp_for_level(user.level):
        user.exp -= exp_for_level(user.level)
        user.level += 1
    if user.level >= max_level:
        user.level = max_level
        # Cap excess EXP
        needed = exp_for_level(max_level)
        if user.exp >= needed:
            user.exp = needed - 1

    await db.commit()
    await db.refresh(user)
    return user_to_profile(user)


@router.post("/promote", response_model=UserProfile)
async def promote(
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    user = await ensure_user(db, user_id)

    if user.elite >= 1:
        pass  # already max
    elif user.level >= 50 and user.promotion_ticket >= 20:
        user.elite = 1
        user.level = 50
        user.exp = 0
        user.promotion_ticket -= 20

    await db.commit()
    await db.refresh(user)
    return user_to_profile(user)


@router.get("/wrong-answers", response_model=list[WrongAnswerItem])
async def get_wrong_answers(
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    """Return problems the user attempted but has not yet completed."""
    await ensure_user(db, user_id)

    prog_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.attempts > 0,
            UserProgress.completed == False,
        )
    )
    wrong_progresses = prog_result.scalars().all()
    if not wrong_progresses:
        return []

    problem_ids = [p.problem_id for p in wrong_progresses]
    progress_by_id = {p.problem_id: p for p in wrong_progresses}

    prob_result = await db.execute(
        select(DBProblem).where(DBProblem.id.in_(problem_ids))
    )
    problems = {p.id: p for p in prob_result.scalars().all()}

    stage_ids = list({p.stage_id for p in problems.values()})
    stage_result = await db.execute(
        select(DBStage).where(DBStage.id.in_(stage_ids))
    )
    stages = {s.id: s for s in stage_result.scalars().all()}

    chapter_ids = list({s.chapter_id for s in stages.values()})
    chapter_result = await db.execute(
        select(DBChapter).where(DBChapter.id.in_(chapter_ids))
    )
    chapters = {c.id: c for c in chapter_result.scalars().all()}

    items = []
    for pid in problem_ids:
        prob = problems.get(pid)
        if not prob:
            continue
        stage = stages.get(prob.stage_id)
        chapter = chapters.get(stage.chapter_id) if stage else None
        prog = progress_by_id[pid]
        items.append(WrongAnswerItem(
            problem_id=pid,
            question=prob.question,
            difficulty=prob.difficulty,
            stage_name=stage.name if stage else "未知关卡",
            chapter_title=chapter.title if chapter else "未知章节",
            attempts=prog.attempts or 0,
            best_score=float(prog.best_score or 0),
            rewards=prob.rewards or [],
        ))

    items.sort(key=lambda x: (x.chapter_title, x.stage_name))
    return items
