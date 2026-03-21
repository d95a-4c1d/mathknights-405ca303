"""
User profile & progression endpoints.
"""

from fastapi import APIRouter
from app.models.schemas import UserProfile, Inventory, Competency, ExpCardUse

router = APIRouter()

# TODO: Replace with database-backed user state
MOCK_PROFILE = {
    "level": 26,
    "exp": 4038,
    "elite": 0,
    "inventory": {"basic_exp": 213, "advanced_exp": 1056, "promotion_ticket": 17},
    "competencies": [
        {"name": "抽象", "full_name": "数学抽象", "value": 72},
        {"name": "逻辑", "full_name": "逻辑推理", "value": 65},
        {"name": "建模", "full_name": "数学建模", "value": 48},
        {"name": "直觉", "full_name": "直观想象", "value": 58},
        {"name": "运算", "full_name": "数学运算", "value": 81},
        {"name": "数据", "full_name": "数据分析", "value": 55},
    ],
}


@router.get("/profile", response_model=UserProfile)
async def get_profile():
    return MOCK_PROFILE


@router.post("/exp", response_model=UserProfile)
async def use_exp_cards(body: ExpCardUse):
    """
    TODO: Deduct cards, calculate EXP gain, level up.
    """
    return MOCK_PROFILE


@router.post("/promote", response_model=UserProfile)
async def promote():
    """
    TODO: Check promotion requirements, apply elite upgrade.
    """
    return MOCK_PROFILE
