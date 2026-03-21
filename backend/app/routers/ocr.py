"""
OCR endpoint — accepts an image, returns a parsed math problem.
"""

from fastapi import APIRouter, UploadFile, File
from app.models.schemas import Problem, RewardItem

router = APIRouter()


@router.post("/analyze", response_model=Problem)
async def analyze_image(image: UploadFile = File(...)):
    """
    TODO: Integrate OCR + LLM to parse the uploaded math problem image.
    Steps:
      1. Run OCR on the image (e.g., PaddleOCR, Tesseract, or a vision LLM)
      2. Send extracted text to LLM for problem structuring
      3. Evaluate difficulty and generate rewards
    """
    return Problem(
        id="ocr-1",
        difficulty="Easy",
        question="判断 f(x)=ln(x+√(1+x²)) 的奇偶性。",
        rewards=[RewardItem(type="basic_exp", name="基础经验卡", quantity=1)],
    )
