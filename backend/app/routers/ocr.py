"""
OCR endpoint — image upload → DeepSeek vision → structured problem.
"""

import base64
from fastapi import APIRouter, UploadFile, File
from app.models.schemas import Problem, RewardItem
from app.services.deepseek import parse_image_to_problem, generate_problem

router = APIRouter()


@router.post("/analyze", response_model=Problem)
async def analyze_image(image: UploadFile = File(...)):
    """
    1. Read uploaded image
    2. Send to DeepSeek vision for OCR + problem structuring
    3. Return a structured Problem
    """
    image_bytes = await image.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    parsed = await parse_image_to_problem(image_b64)

    # Generate a more complete problem with reference answer
    generated = await generate_problem(
        topic=parsed.get("topic", "自定义题目"),
        difficulty=parsed.get("difficulty", "Easy"),
    )

    difficulty = parsed.get("difficulty", "Easy")
    reward_qty = 1 if difficulty == "Easy" else 1
    reward_type = "basic_exp" if difficulty == "Easy" else "advanced_exp"
    reward_name = "基础经验卡" if difficulty == "Easy" else "高级经验卡"

    return Problem(
        id=f"ocr-{hash(parsed.get('question', '')) % 100000}",
        difficulty=difficulty,
        question=parsed.get("question", generated.get("question", "识别失败")),
        rewards=[RewardItem(type=reward_type, name=reward_name, quantity=reward_qty)],
        first_clear_bonus=[RewardItem(type="promotion_ticket", name="晋升凭证", quantity=1)] if difficulty == "Hard" else None,
    )
