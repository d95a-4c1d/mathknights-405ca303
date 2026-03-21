"""
Chapter & Stage endpoints.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import Chapter, Stage

router = APIRouter()

# TODO: Replace with database / service layer
MOCK_CHAPTERS: list[dict] = [
    {
        "id": "ch1",
        "number": 1,
        "title": "函数与极限",
        "subtitle": "微积分基础",
        "available": True,
        "stages": [
            {
                "id": "s1-1",
                "name": "区间与集合",
                "topic": "集合论基础",
                "unlocked": True,
                "cleared": False,
                "problems": [
                    {
                        "id": "p1-1-e",
                        "difficulty": "Easy",
                        "question": "用区间表示法求解 |2x-3| < 5。",
                        "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}],
                    },
                    {
                        "id": "p1-1-h",
                        "difficulty": "Hard",
                        "question": "已知 A=(-∞,2], B=[-1,4)，求 A∩B 和 A∪B。",
                        "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                        "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}],
                    },
                ],
            },
        ],
    },
]


@router.get("/", response_model=list[Chapter])
async def list_chapters():
    return MOCK_CHAPTERS


@router.get("/{chapter_id}", response_model=Chapter)
async def get_chapter(chapter_id: str):
    for ch in MOCK_CHAPTERS:
        if ch["id"] == chapter_id:
            return ch
    raise HTTPException(status_code=404, detail="Chapter not found")
