"""
Challenge submission endpoint — LLM grading via DeepSeek.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import ChallengeSubmit, ChallengeResult, RewardItem
from app.models.orm_models import Problem as DBProblem, User as DBUser, UserProgress, UserMission
from app.services.deepseek import grade_answer, evaluate_rewards
from app.routers.user import ensure_user

router = APIRouter()


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

                    # Update mission progress
                    await _update_missions(db, body.user_id, problem.difficulty)

        await db.commit()

    return ChallengeResult(
        correct=grade["correct"],
        rewards=rewards,
        feedback=grade["feedback"],
    )


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

        # Match mission descriptions
        if is_easy and "简单题" in desc:
            m.current = min(m.current + 1, m.target)
        elif not is_easy and "困难题" in desc:
            m.current = min(m.current + 1, m.target)
        elif "完成" in desc and "简单" not in desc and "困难" not in desc and "错题" not in desc and "公式" not in desc and "思维导图" not in desc:
            # Generic completion missions (without specific type keywords)
            m.current = min(m.current + 1, m.target)
