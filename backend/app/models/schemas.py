"""
Pydantic models matching the frontend TypeScript interfaces.
These are the shared data contracts between FastAPI and React.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


# ─── Rewards ──────────────────────────────────────────────────────────

class RewardItem(BaseModel):
    type: str  # 'basic_exp' | 'advanced_exp' | 'promotion_ticket'
    name: str
    quantity: int


# ─── Problems / Stages / Chapters ─────────────────────────────────────

class Problem(BaseModel):
    id: str
    difficulty: str  # 'Easy' | 'Hard'
    question: str
    rewards: list[RewardItem]
    first_clear_bonus: Optional[list[RewardItem]] = None
    completed: Optional[bool] = None
    best_score: Optional[float] = None


class Stage(BaseModel):
    id: str
    name: str
    topic: str
    problems: list[Problem]
    unlocked: bool
    cleared: bool


class Chapter(BaseModel):
    id: str
    number: int
    title: str
    subtitle: str
    stages: list[Stage]
    available: bool


# ─── Missions ─────────────────────────────────────────────────────────

class Mission(BaseModel):
    id: str
    description: str
    target: int
    current: int
    rewards: list[RewardItem]
    claimed: bool


# ─── User / Profile ───────────────────────────────────────────────────

class Inventory(BaseModel):
    basic_exp: int
    advanced_exp: int
    promotion_ticket: int


class Competency(BaseModel):
    name: str
    full_name: str
    value: int


class UserProfile(BaseModel):
    level: int
    exp: int
    elite: int
    inventory: Inventory
    competencies: list[Competency]


# ─── Request / Response ───────────────────────────────────────────────

class ChallengeSubmit(BaseModel):
    problem_id: str
    answer: str
    user_id: Optional[str] = "default"


class ChallengeResult(BaseModel):
    correct: bool
    rewards: list[RewardItem]
    feedback: str


class ExpCardUse(BaseModel):
    type: str  # 'basic_exp' | 'advanced_exp'
    count: int
