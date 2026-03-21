"""
Chapter & Stage endpoints — backed by SQLite + seed data.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.orm_models import Chapter as DBChapter, Stage as DBStage, Problem as DBProblem
from app.models.schemas import Chapter, Stage

router = APIRouter()

# ─── Seed data ────────────────────────────────────────────────────────

SEED_CHAPTERS = [
    {
        "id": "ch1", "number": 1, "title": "函数与极限", "subtitle": "微积分基础", "available": True,
        "stages": [
            {"id": "s1-1", "name": "区间与集合", "topic": "集合论基础", "order": 0,
             "problems": [
                 {"id": "p1-1-e", "difficulty": "Easy", "question": "用区间表示法求解 |2x-3| < 5。",
                  "reference_answer": "由 |2x-3| < 5 得 -5 < 2x-3 < 5，即 -2 < 2x < 8，所以 -1 < x < 4。区间表示为 (-1, 4)。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-1-h", "difficulty": "Hard", "question": "已知 A=(-∞,2], B=[-1,4)，求 A∩B 和 A∪B。",
                  "reference_answer": "A∩B = [-1, 2]，A∪B = (-∞, 4)。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s1-2", "name": "定义域与值域", "topic": "函数定义域", "order": 1,
             "problems": [
                 {"id": "p1-2-e", "difficulty": "Easy", "question": "求 y=√(4-x²)+ln(x-1) 的自然定义域。",
                  "reference_answer": "需要 4-x²≥0 且 x-1>0，即 -2≤x≤2 且 x>1，所以定义域为 (1, 2]。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-2-h", "difficulty": "Hard", "question": "已知 f(x)=arcsin x, g(x)=√x，求 f(g(x)) 的定义域。",
                  "reference_answer": "g(x)=√x 的定义域为 x≥0，arcsin 的定义域为 [-1,1]，所以需要 0≤√x≤1，即 0≤x≤1。定义域为 [0,1]。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s1-3", "name": "函数的四大性质", "topic": "函数性质", "order": 2,
             "problems": [
                 {"id": "p1-3-e", "difficulty": "Easy", "question": "判断 f(x)=ln(x+√(1+x²)) 的奇偶性。",
                  "reference_answer": "f(-x)=ln(-x+√(1+x²))=ln(1/(x+√(1+x²)))=-ln(x+√(1+x²))=-f(x)，所以是奇函数。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p1-3-h", "difficulty": "Hard", "question": "判断 f(x)=x/(1+x²) 在其定义域上是否有界，并描述其在 (0,+∞) 上的单调性。",
                  "reference_answer": "由均值不等式 |x/(1+x²)| ≤ 1/2，有界。f'(x)=(1-x²)/(1+x²)²，在 (0,1) 上递增，在 (1,+∞) 上递减。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch2", "number": 2, "title": "导数与微分", "subtitle": "变化率", "available": False,
        "stages": [
            {"id": "s2-1", "name": "导数的定义", "topic": "导数概念", "order": 0,
             "problems": [
                 {"id": "p2-1-e", "difficulty": "Easy",
                  "question": "用导数定义求 f(x)=x² 在 x=1 处的导数。",
                  "reference_answer": "f'(1)=lim_{h→0}[(1+h)²-1²]/h=lim_{h→0}(2h+h²)/h=lim_{h→0}(2+h)=2。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p2-1-h", "difficulty": "Hard",
                  "question": "讨论 f(x)=|x| 在 x=0 处的可导性。",
                  "reference_answer": "右导数 lim_{h→0+} |h|/h=1，左导数 lim_{h→0-} |h|/h=-1，左右导数不相等，所以 f(x)=|x| 在 x=0 处不可导。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
            {"id": "s2-2", "name": "求导法则", "topic": "四则运算与链式法则", "order": 1,
             "problems": [
                 {"id": "p2-2-e", "difficulty": "Easy",
                  "question": "求 y=sin(x²) 的导数。",
                  "reference_answer": "y'=cos(x²)·2x=2x·cos(x²)。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p2-2-h", "difficulty": "Hard",
                  "question": "求 y=x^x (x>0) 的导数。",
                  "reference_answer": "ln y=x ln x，y'/y=ln x+1，所以 y'=x^x(ln x+1)。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch3", "number": 3, "title": "导数的应用", "subtitle": "优化与分析", "available": False,
        "stages": [
            {"id": "s3-1", "name": "极值与最值", "topic": "极值判定", "order": 0,
             "problems": [
                 {"id": "p3-1-e", "difficulty": "Easy",
                  "question": "求 f(x)=x³-3x 的极值。",
                  "reference_answer": "f'(x)=3x²-3=3(x-1)(x+1)，驻点 x=±1。f''(x)=6x，f''(1)=6>0（极小值f(1)=-2），f''(-1)=-6<0（极大值f(-1)=2）。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p3-1-h", "difficulty": "Hard",
                  "question": "证明方程 x⁵+x-1=0 有且仅有一个实根。",
                  "reference_answer": "f(0)=-1<0, f(1)=1>0，由零点定理至少一个根。f'(x)=5x⁴+1>0恒成立，f严格递增，故恰有一个实根。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch4", "number": 4, "title": "不定积分", "subtitle": "原函数", "available": False,
        "stages": [
            {"id": "s4-1", "name": "基本积分公式", "topic": "直接积分", "order": 0,
             "problems": [
                 {"id": "p4-1-e", "difficulty": "Easy",
                  "question": "求 ∫(2x+1)dx。",
                  "reference_answer": "∫(2x+1)dx=x²+x+C。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p4-1-h", "difficulty": "Hard",
                  "question": "求 ∫x·e^x dx。",
                  "reference_answer": "分部积分：∫x·e^x dx = x·e^x - ∫e^x dx = x·e^x - e^x + C = e^x(x-1)+C。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
    {
        "id": "ch5", "number": 5, "title": "定积分", "subtitle": "曲线下面积", "available": False,
        "stages": [
            {"id": "s5-1", "name": "牛顿-莱布尼茨公式", "topic": "定积分计算", "order": 0,
             "problems": [
                 {"id": "p5-1-e", "difficulty": "Easy",
                  "question": "计算 ∫₀¹ x² dx。",
                  "reference_answer": "∫₀¹ x² dx = [x³/3]₀¹ = 1/3。",
                  "rewards": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}]},
                 {"id": "p5-1-h", "difficulty": "Hard",
                  "question": "计算 ∫₀^π sin²x dx。",
                  "reference_answer": "sin²x=(1-cos2x)/2，∫₀^π (1-cos2x)/2 dx = [x/2 - sin2x/4]₀^π = π/2。",
                  "rewards": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
                  "first_clear_bonus": [{"type": "promotion_ticket", "name": "晋升凭证", "quantity": 1}]},
             ]},
        ],
    },
]


async def seed_data(db: AsyncSession):
    """Seed chapters/stages/problems if table is empty."""
    result = await db.execute(select(DBChapter))
    if result.first() is not None:
        return

    for ch_data in SEED_CHAPTERS:
        ch = DBChapter(
            id=ch_data["id"], number=ch_data["number"],
            title=ch_data["title"], subtitle=ch_data["subtitle"],
            available=ch_data["available"],
        )
        db.add(ch)
        for st_data in ch_data.get("stages", []):
            st = DBStage(
                id=st_data["id"], chapter_id=ch_data["id"],
                name=st_data["name"], topic=st_data["topic"],
                order=st_data["order"],
            )
            db.add(st)
            for p_data in st_data.get("problems", []):
                p = DBProblem(
                    id=p_data["id"], stage_id=st_data["id"],
                    difficulty=p_data["difficulty"], question=p_data["question"],
                    reference_answer=p_data.get("reference_answer", ""),
                    rewards=p_data.get("rewards", []),
                    first_clear_bonus=p_data.get("first_clear_bonus"),
                )
                db.add(p)
    await db.commit()


@router.get("/", response_model=list[Chapter])
async def list_chapters(db: AsyncSession = Depends(get_db)):
    await seed_data(db)
    result = await db.execute(
        select(DBChapter).options(selectinload(DBChapter.stages).selectinload(DBStage.problems))
    )
    chapters = result.scalars().all()
    return [_chapter_to_schema(ch) for ch in chapters]


@router.get("/{chapter_id}", response_model=Chapter)
async def get_chapter(chapter_id: str, db: AsyncSession = Depends(get_db)):
    await seed_data(db)
    result = await db.execute(
        select(DBChapter)
        .options(selectinload(DBChapter.stages).selectinload(DBStage.problems))
        .where(DBChapter.id == chapter_id)
    )
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return _chapter_to_schema(ch)


def _chapter_to_schema(ch: DBChapter) -> dict:
    return {
        "id": ch.id,
        "number": ch.number,
        "title": ch.title,
        "subtitle": ch.subtitle,
        "available": ch.available,
        "stages": [
            {
                "id": st.id,
                "name": st.name,
                "topic": st.topic,
                "unlocked": True,  # will be overridden by user progress
                "cleared": False,   # will be overridden by user progress
                "problems": [
                    {
                        "id": p.id,
                        "difficulty": p.difficulty,
                        "question": p.question,
                        "rewards": p.rewards or [],
                        "first_clear_bonus": p.first_clear_bonus,
                    }
                    for p in st.problems
                ],
            }
            for st in ch.stages
        ],
    }
