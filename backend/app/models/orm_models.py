"""
SQLAlchemy ORM models — persistent game state.
"""

from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # simple username-based ID
    username = Column(String, unique=True, nullable=False)
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    elite = Column(Integer, default=0)
    basic_exp = Column(Integer, default=0)
    advanced_exp = Column(Integer, default=0)
    promotion_ticket = Column(Integer, default=0)

    # competencies (0-100)
    comp_abstract = Column(Integer, default=50)
    comp_logic = Column(Integer, default=50)
    comp_modeling = Column(Integer, default=50)
    comp_imagination = Column(Integer, default=50)
    comp_computation = Column(Integer, default=50)
    comp_data = Column(Integer, default=50)

    # counters
    easy_completed = Column(Integer, default=0)
    hard_completed = Column(Integer, default=0)

    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    missions = relationship("UserMission", back_populates="user", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String, primary_key=True)
    number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    subtitle = Column(String, default="")
    available = Column(Boolean, default=False)

    stages = relationship("Stage", back_populates="chapter", cascade="all, delete-orphan",
                          order_by="Stage.order")


class Stage(Base):
    __tablename__ = "stages"

    id = Column(String, primary_key=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    name = Column(String, nullable=False)
    topic = Column(String, default="")
    order = Column(Integer, default=0)

    chapter = relationship("Chapter", back_populates="stages")
    problems = relationship("Problem", back_populates="stage", cascade="all, delete-orphan",
                            order_by="Problem.difficulty")


class Problem(Base):
    __tablename__ = "problems"

    id = Column(String, primary_key=True)
    stage_id = Column(String, ForeignKey("stages.id"), nullable=False)
    difficulty = Column(String, nullable=False)  # 'Easy' | 'Hard'
    question = Column(Text, nullable=False)
    reference_answer = Column(Text, default="")  # for LLM grading reference
    rewards = Column(JSON, default=list)  # [{type, name, quantity}]
    first_clear_bonus = Column(JSON, default=None)

    stage = relationship("Stage", back_populates="problems")


class UserProgress(Base):
    """Per-user per-problem completion tracking."""
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)
    completed = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    best_score = Column(Float, default=0.0)  # 0-1

    user = relationship("User", back_populates="progress")


class UserMission(Base):
    """Per-user mission tracking."""
    __tablename__ = "user_missions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mission_id = Column(String, nullable=False)
    mission_type = Column(String, nullable=False)  # 'daily' | 'weekly'
    description = Column(String, nullable=False)
    target = Column(Integer, nullable=False)
    current = Column(Integer, default=0)
    rewards = Column(JSON, default=list)
    claimed = Column(Boolean, default=False)

    user = relationship("User", back_populates="missions")
