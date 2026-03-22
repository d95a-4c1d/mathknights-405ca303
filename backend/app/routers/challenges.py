"""
Challenge submission endpoint — LLM grading via DeepSeek.
Also provides dynamic problem generation for each challenge attempt.
"""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import ChallengeSubmit, ChallengeResult, RewardItem, GenerateRequest
from app.models.orm_models import Problem as DBProblem, User as DBUser, UserProgress, UserMission, Stage as DBStage
from app.services.deepseek import grade_answer, evaluate_rewards, generate_problem
from app.routers.user import ensure_user

router = APIRouter()

REWARD_TEMPLATES = {
    "Easy": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}],
    "Hard": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
}


@router.post("/generate", response_model=dict)
async def generate_challenge(body: GenerateRequest, db: AsyncSession = Depends(get_db)):
    """
    Dynamically generate a new problem for a stage using LLM.
    Saves the problem to DB so it can be submitted normally.
    """
    await ensure_user(db, body.user_id)

    # Generate via LLM
    generated = await generate_problem(body.topic, body.difficulty)

    # Create a persistent problem record so submitChallenge can find it
    problem_id = f"gen-{uuid.uuid4().hex[:12]}"
    rewards = REWARD_TEMPLATES.get(body.difficulty, REWARD_TEMPLATES["Easy"])

    new_problem = DBProblem(
        id=problem_id,
        stage_id=body.stage_id,
        difficulty=body.difficulty,
        question=generated["question"],
        reference_answer=generated.get("reference_answer", ""),
        rewards=rewards,
        first_clear_bonus=None,
    )
    db.add(new_problem)
    await db.commit()

    return {
        "id": problem_id,
        "difficulty": body.difficulty,
        "question": generated["question"],
        "rewards": rewards,
        "first_clear_bonus": None,
        "completed": False,
        "best_score": 0,
    }


@router.post("/", response_model=ChallengeResult)
async def submit_challenge(body: ChallengeSubmit, db: AsyncSession = Depends(get_db)):
    """
    Grade student answer using DeepSeek LLM.
    """
    # 1. Ensure user exists
    await ensure_user(db, body.user_id)

    # 2. Look up the problem
    result = await db.execute(select(DBProblem).where(DBProblem.id == body.problem_id))
    problem = result.scalar_one_or_none()

    if not problem:
        return ChallengeResult(
            correct=False,
            rewards=[],
            feedback="未找到该题目，请重试。",
        )

    # 3. Grade with LLM
    grade = await grade_answer(
        question=problem.question,
        student_answer=body.answer,
        reference=problem.reference_answer or "",
    )

    # 4. Determine rewards
    rewards_raw = await evaluate_rewards(
        question=problem.question,
        difficulty=problem.difficulty,
        score=grade["score"],
    )
    rewards = [RewardItem(**r) for r in rewards_raw]

    # 5. First clear bonus
    if grade["correct"] and problem.first_clear_bonus and body.user_id:
        progress_result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == body.user_id,
                UserProgress.problem_id == body.problem_id,
                UserProgress.completed == True,
            )
        )
        already_cleared = progress_result.first() is not None
        if not already_cleared:
            for bonus in problem.first_clear_bonus:
                rewards.append(RewardItem(**bonus))

    # 6. Update user progress
    if body.user_id:
        progress_result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == body.user_id,
                UserProgress.problem_id == body.problem_id,
            )
        )
        user_progress = progress_result.scalar_one_or_none()
        if not user_progress:
            user_progress = UserProgress(
                user_id=body.user_id,
                problem_id=body.problem_id,
            )
            db.add(user_progress)

        was_completed = user_progress.completed
        user_progress.attempts = (user_progress.attempts or 0) + 1
        if grade["score"] > (user_progress.best_score or 0):
            user_progress.best_score = grade["score"]
        if grade["correct"]:
            user_progress.completed = True

            # Update user inventory + counters
            user_result = await db.execute(select(DBUser).where(DBUser.id == body.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                for r in rewards:
                    if r.type == "basic_exp":
                        user.basic_exp += r.quantity
                    elif r.type == "advanced_exp":
                        user.advanced_exp += r.quantity
                    elif r.type == "promotion_ticket":
                        user.promotion_ticket += r.quantity

                # Only increment counters on first completion
                if not was_completed:
                    if problem.difficulty == "Easy":
                        user.easy_completed += 1
                    else:
                        user.hard_completed += 1

                    # Update competencies based on problem topic
                    stage_result = await db.execute(select(DBStage).where(DBStage.id == problem.stage_id))
                    stage = stage_result.scalar_one_or_none()
                    if stage:
                        _update_competencies(user, stage.topic, problem.difficulty)

                    # Update mission progress
                    await _update_missions(db, body.user_id, problem.difficulty)
                    if body.is_retry:
                        await _update_retry_missions(db, body.user_id)

        await db.commit()

    return ChallengeResult(
        correct=grade["correct"],
        rewards=rewards,
        feedback=grade["feedback"],
    )


def _update_competencies(user: DBUser, topic: str, difficulty: str):
    """Increment relevant competency based on topic and difficulty."""
    gain = 1 if difficulty == "Easy" else 2

    topic_lower = topic.lower()
    if any(k in topic_lower for k in ["集合", "区间", "定义域", "函数性质", "奇偶", "单调"]):
        user.comp_abstract = min(100, user.comp_abstract + gain)
    elif any(k in topic_lower for k in ["极限", "连续", "无穷小", "洛必达"]):
        user.comp_logic = min(100, user.comp_logic + gain)
    elif any(k in topic_lower for k in ["导数", "微分", "链式", "隐函数"]):
        user.comp_computation = min(100, user.comp_computation + gain)
    elif any(k in topic_lower for k in ["积分", "换元", "分部"]):
        user.comp_computation = min(100, user.comp_computation + gain)
        user.comp_abstract = min(100, user.comp_abstract + 1)
    elif any(k in topic_lower for k in ["极值", "最值", "凹凸", "图形", "单调性"]):
        user.comp_logic = min(100, user.comp_logic + gain)
        user.comp_imagination = min(100, user.comp_imagination + 1)
    elif any(k in topic_lower for k in ["微分方程", "可分离", "线性方程", "特征"]):
        user.comp_modeling = min(100, user.comp_modeling + gain)
    elif any(k in topic_lower for k in ["面积", "体积", "弧长", "应用"]):
        user.comp_modeling = min(100, user.comp_modeling + gain)
        user.comp_imagination = min(100, user.comp_imagination + 1)
    else:
        user.comp_computation = min(100, user.comp_computation + 1)


async def _update_retry_missions(db: AsyncSession, user_id: str):
    """Increment '复习错题' mission progress when user retries a wrong answer."""
    result = await db.execute(
        select(UserMission).where(
            UserMission.user_id == user_id,
            UserMission.claimed == False,
        )
    )
    missions = result.scalars().all()
    for m in missions:
        if "错题" in m.description:
            m.current = min(m.current + 1, m.target)


async def _update_missions(db: AsyncSession, user_id: str, difficulty: str):
    """Update mission progress after completing a challenge."""
    result = await db.execute(
        select(UserMission).where(
            UserMission.user_id == user_id,
            UserMission.claimed == False,
        )
    )
    missions = result.scalars().all()

    for m in missions:
        desc = m.description
        is_easy = difficulty == "Easy"

        if is_easy and "简单题" in desc:
            m.current = min(m.current + 1, m.target)
        elif not is_easy and "困难题" in desc:
            m.current = min(m.current + 1, m.target)
        elif "完成" in desc and "简单" not in desc and "困难" not in desc and "错题" not in desc and "公式" not in desc and "思维导图" not in desc:
            m.current = min(m.current + 1, m.target)
