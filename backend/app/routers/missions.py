"""
Mission (daily/weekly task) endpoints — backed by SQLite.
"""

from fastapi import APIRouter, Query, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import Mission, RewardItem
from app.models.orm_models import UserMission, User as DBUser

router = APIRouter()

# ─── Default mission templates ────────────────────────────────────────

DAILY_TEMPLATES = [
    {"id": "d1", "description": "完成5道简单题", "target": 5,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 2}]},
    {"id": "d2", "description": "完成10道简单题", "target": 10,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 5}]},
    {"id": "d3", "description": "完成15道简单题", "target": 15,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}]},
    {"id": "d4", "description": "完成1道困难题", "target": 1,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 3}]},
    {"id": "d5", "description": "完成3道困难题", "target": 3,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}]},
    {"id": "d6", "description": "复习3道错题", "target": 3,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 2}]},
    {"id": "d7", "description": "复习5道错题", "target": 5,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 4}]},
    {"id": "d8", "description": "背诵3个公式", "target": 3,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
    {"id": "d9", "description": "背诵5个公式", "target": 5,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 3}]},
]

WEEKLY_TEMPLATES = [
    {"id": "w1", "description": "完成50道简单题", "target": 50,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 3}]},
    {"id": "w2", "description": "完成100道简单题", "target": 100,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 5}]},
    {"id": "w3", "description": "完成150道简单题", "target": 150,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 8}]},
    {"id": "w4", "description": "完成200道简单题", "target": 200,
     "rewards": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
    {"id": "w5", "description": "完成5道困难题", "target": 5,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 2}]},
    {"id": "w6", "description": "完成10道困难题", "target": 10,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 4}]},
    {"id": "w7", "description": "完成15道困难题", "target": 15,
     "rewards": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
    {"id": "w8", "description": "复习20道错题", "target": 20,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 10}]},
    {"id": "w9", "description": "复习30道错题", "target": 30,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 2}]},
    {"id": "w10", "description": "复习50道错题", "target": 50,
     "rewards": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
    {"id": "w11", "description": "完成1张思维导图", "target": 1,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 3}]},
    {"id": "w12", "description": "背诵20个公式", "target": 20,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 8}]},
    {"id": "w13", "description": "背诵30个公式", "target": 30,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 2}]},
    {"id": "w14", "description": "背诵50个公式", "target": 50,
     "rewards": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
]


async def ensure_missions(db: AsyncSession, user_id: str):
    """Create default missions for user if not exists."""
    result = await db.execute(
        select(UserMission).where(UserMission.user_id == user_id)
    )
    if result.first() is not None:
        return

    for tpl in DAILY_TEMPLATES:
        m = UserMission(
            user_id=user_id, mission_id=tpl["id"], mission_type="daily",
            description=tpl["description"], target=tpl["target"],
            rewards=tpl["rewards"],
        )
        db.add(m)
    for tpl in WEEKLY_TEMPLATES:
        m = UserMission(
            user_id=user_id, mission_id=tpl["id"], mission_type="weekly",
            description=tpl["description"], target=tpl["target"],
            rewards=tpl["rewards"],
        )
        db.add(m)
    await db.commit()


@router.get("/", response_model=list[Mission])
async def list_missions(
    type: str = Query("daily", pattern="^(daily|weekly)$"),
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    await ensure_missions(db, user_id)
    result = await db.execute(
        select(UserMission).where(
            UserMission.user_id == user_id,
            UserMission.mission_type == type,
        )
    )
    missions = result.scalars().all()
    return [
        Mission(
            id=m.mission_id,
            description=m.description,
            target=m.target,
            current=m.current,
            rewards=m.rewards or [],
            claimed=m.claimed,
        )
        for m in missions
    ]


@router.post("/{mission_id}/claim", response_model=list[RewardItem])
async def claim_mission(
    mission_id: str,
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserMission).where(
            UserMission.user_id == user_id,
            UserMission.mission_id == mission_id,
        )
    )
    mission = result.scalar_one_or_none()
    if not mission or mission.claimed or mission.current < mission.target:
        return []

    mission.claimed = True
    rewards = [RewardItem(**r) for r in (mission.rewards or [])]

    # Add rewards to user inventory
    user_result = await db.execute(select(DBUser).where(DBUser.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        for r in rewards:
            if r.type == "basic_exp":
                user.basic_exp += r.quantity
            elif r.type == "advanced_exp":
                user.advanced_exp += r.quantity
            elif r.type == "promotion_ticket":
                user.promotion_ticket += r.quantity

    await db.commit()
    return rewards


@router.post("/formula-practice")
async def formula_practice(
    user_id: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    """Increment formula memorization mission progress by 1."""
    result = await db.execute(
        select(UserMission).where(
            UserMission.user_id == user_id,
            UserMission.claimed == False,
        )
    )
    missions = result.scalars().all()
    for m in missions:
        if "公式" in m.description:
            m.current = min(m.current + 1, m.target)
    await db.commit()
    return {"status": "ok"}
