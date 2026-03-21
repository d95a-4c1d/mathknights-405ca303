"""
Challenge submission endpoint.
Receives a problem ID + answer, evaluates it, returns result + rewards.
"""

from fastapi import APIRouter
from app.models.schemas import ChallengeSubmit, ChallengeResult, RewardItem

router = APIRouter()


@router.post("/", response_model=ChallengeResult)
async def submit_challenge(body: ChallengeSubmit):
    """
    TODO: Integrate with LLM for real answer evaluation.
    For now, always returns correct with a mock reward.
    """
    # 1. Look up the problem by body.problem_id
    # 2. Send body.answer to LLM for evaluation
    # 3. Determine rewards based on difficulty + correctness
    return ChallengeResult(
        correct=True,
        rewards=[RewardItem(type="basic_exp", name="基础经验卡", quantity=1)],
        feedback="回答正确！",
    )
