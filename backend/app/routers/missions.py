"""
Mission (daily/weekly task) endpoints.
"""

from fastapi import APIRouter, Query
from app.models.schemas import Mission, RewardItem

router = APIRouter()

# TODO: Replace with database
DAILY_MISSIONS: list[dict] = [
    {"id": "d1", "description": "完成5道简单题", "target": 5, "current": 0,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 2}], "claimed": False},
    {"id": "d2", "description": "完成10道简单题", "target": 10, "current": 0,
     "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 5}], "claimed": False},
]

WEEKLY_MISSIONS: list[dict] = [
    {"id": "w1", "description": "完成50道简单题", "target": 50, "current": 0,
     "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 3}], "claimed": False},
]


@router.get("/", response_model=list[Mission])
async def list_missions(type: str = Query("daily", regex="^(daily|weekly)$")):
    return DAILY_MISSIONS if type == "daily" else WEEKLY_MISSIONS


@router.post("/{mission_id}/claim", response_model=list[RewardItem])
async def claim_mission(mission_id: str):
    """
    TODO: Validate mission completion, mark claimed, return rewards.
    """
    return [RewardItem(type="basic_exp", name="基础经验卡", quantity=2)]
