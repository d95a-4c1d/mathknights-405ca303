"""
DeepSeek LLM service — grading, problem generation, OCR parsing.
Uses OpenAI-compatible API.
"""

import os
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    return _client


async def grade_answer(question: str, student_answer: str, reference: str = "") -> dict:
    """
    Grade a student's answer using DeepSeek.
    Returns: { correct: bool, score: float, feedback: str }
    """
    if not DEEPSEEK_API_KEY:
        # Fallback: simple keyword matching
        return {"correct": True, "score": 1.0, "feedback": "回答正确！（本地判断）"}

    system_prompt = """你是一位高等数学老师，负责批改学生的答案。
请根据题目和参考答案，判断学生的回答是否正确。

返回严格的 JSON 格式：
{
  "correct": true/false,
  "score": 0.0-1.0（正确度评分）,
  "feedback": "简短的中文反馈（50字以内）"
}

评分标准：
- 完全正确（思路和结果都对）→ correct=true, score=1.0
- 思路正确但有小错 → correct=false, score=0.6-0.8
- 部分正确 → correct=false, score=0.3-0.5
- 完全错误 → correct=false, score=0.0-0.2

注意：数学答案可能有多种等价写法，不要因为格式不同就判错。"""

    user_msg = f"题目：{question}\n\n学生答案：{student_answer}"
    if reference:
        user_msg += f"\n\n参考答案：{reference}"

    try:
        client = get_client()
        resp = await client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.1,
            max_tokens=500,
        )
        content = resp.choices[0].message.content or "{}"
        # Try to extract JSON from the response
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(content)
        return {
            "correct": bool(result.get("correct", False)),
            "score": float(result.get("score", 0)),
            "feedback": str(result.get("feedback", "")),
        }
    except Exception as e:
        print(f"LLM grading error: {e}")
        return {"correct": False, "score": 0.0, "feedback": "判题服务暂时不可用，请重试。"}


async def generate_problem(topic: str, difficulty: str) -> dict:
    """
    Generate a new problem for a given topic and difficulty.
    Returns: { question: str, reference_answer: str }
    """
    if not DEEPSEEK_API_KEY:
        # Fallback problems
        fallbacks = {
            "区间与集合": "求解不等式 |x-1| + |x+2| > 5。",
            "定义域与值域": "求函数 y = 1/√(x²-4) 的定义域。",
            "函数的四大性质": "判断 f(x) = x·sin(x) 在 (-∞,+∞) 上是否有界。",
        }
        q = fallbacks.get(topic, f"请解答一道关于「{topic}」的高等数学题目。")
        return {"question": q, "reference_answer": "（请自行求解）"}

    diff_desc = "基础难度" if difficulty == "Easy" else "较高难度（需要综合运用多个知识点）"

    system_prompt = f"""你是一位高等数学出题专家。
请根据以下要求生成一道题目：

知识点：{topic}
难度：{diff_desc}

返回严格的 JSON 格式：
{{
  "question": "题目文本（中文，LaTeX 格式可用 $...$ 包裹）",
  "reference_answer": "详细的参考解答步骤"
}}

要求：
1. 题目要清晰、严谨
2. 难度适中，符合大一/大二高数水平
3. 参考解答要包含完整步骤
4. 每次出题尽量不同"""

    try:
        client = get_client()
        resp = await client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"请生成一道关于「{topic}」的{diff_desc}题目。"},
            ],
            temperature=0.8,
            max_tokens=1000,
        )
        content = resp.choices[0].message.content or "{}"
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(content)
        return {
            "question": str(result.get("question", "")),
            "reference_answer": str(result.get("reference_answer", "")),
        }
    except Exception as e:
        print(f"LLM problem generation error: {e}")
        return {
            "question": f"请解答一道关于「{topic}」的题目。",
            "reference_answer": "（生成失败）",
        }


async def evaluate_rewards(question: str, difficulty: str, score: float) -> list[dict]:
    """
    Let LLM determine rewards based on difficulty and performance.
    Returns: list of {type, name, quantity}
    """
    base_rewards = {
        "Easy": [{"type": "basic_exp", "name": "基础经验卡", "quantity": 1}],
        "Hard": [{"type": "advanced_exp", "name": "高级经验卡", "quantity": 1}],
    }

    # Scale rewards by score
    rewards = base_rewards.get(difficulty, base_rewards["Easy"])
    if score >= 0.9:
        # Perfect or near-perfect: bonus
        for r in rewards:
            r["quantity"] += 1
    elif score < 0.5:
        # Poor performance: reduced reward
        for r in rewards:
            r["quantity"] = max(1, r["quantity"] - 1)

    return rewards


async def parse_image_to_problem(image_base64: str) -> dict:
    """
    Use DeepSeek vision to parse a math problem from an image.
    Returns: { question: str, difficulty: str, topic: str }
    """
    if not DEEPSEEK_API_KEY:
        return {
            "question": "请自行输入题目内容",
            "difficulty": "Easy",
            "topic": "自定义题目",
        }

    system_prompt = """你是一位数学题目识别专家。用户会上传一张数学题目的图片，请：
1. 识别图片中的数学题目内容
2. 判断题目所属的知识点类别
3. 评估难度等级

返回严格的 JSON 格式：
{
  "question": "识别出的题目文本（保持数学公式格式）",
  "topic": "知识点类别（如：极限、导数、积分、集合、函数性质等）",
  "difficulty": "Easy 或 Hard"
}"""

    try:
        client = get_client()
        resp = await client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "请识别这张数学题目图片中的内容："},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                    ],
                },
            ],
            temperature=0.1,
            max_tokens=800,
        )
        content = resp.choices[0].message.content or "{}"
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(content)
        return {
            "question": str(result.get("question", "")),
            "topic": str(result.get("topic", "自定义题目")),
            "difficulty": str(result.get("difficulty", "Easy")),
        }
    except Exception as e:
        print(f"OCR parsing error: {e}")
        return {
            "question": "图片识别失败，请手动输入题目",
            "difficulty": "Easy",
            "topic": "自定义题目",
        }
