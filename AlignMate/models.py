# AlignMate/models.py

from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id:            Optional[int] = Field(default=None, primary_key=True)
    name:          str
    email:         str           = Field(unique=True, index=True)
    password_hash: str
    created_at:    datetime      = Field(default_factory=datetime.utcnow)


class UserProfile(SQLModel, table=True):
    id:         Optional[int] = Field(default=None, primary_key=True)
    user_id:    int           = Field(foreign_key="user.id", unique=True, index=True)
    age:        Optional[int]   = None
    height_cm:  Optional[float] = None
    weight_kg:  Optional[float] = None
    lifestyle:  Optional[str]   = None
    level:      Optional[str]   = None
    goal:       Optional[str]   = None
    equipment:  Optional[str]   = None
    diet:       Optional[str]   = None


class SessionRecord(SQLModel, table=True):
    __tablename__ = "sessions"

    id:           Optional[int] = Field(default=None, primary_key=True)
    user_id:      int           = Field(foreign_key="user.id", index=True)
    date:         str
    time:         str
    duration:     int           = 0
    bad_duration: int           = 0
    avg_score:    int           = 0
    mode:         Optional[str] = None
    feedback:     Optional[str] = None
    ai_feedback:  Optional[str] = None
    created_at:   datetime      = Field(default_factory=datetime.utcnow)


# ✅ NEW — Exercise history
class ExerciseRecord(SQLModel, table=True):
    __tablename__ = "exercise_history"

    id:            Optional[int] = Field(default=None, primary_key=True)
    user_id:       int           = Field(foreign_key="user.id", index=True)
    exercise_id:   str                        # e.g. "bench_press"
    exercise_name: str                        # e.g. "Barbell Bench Press"
    reps_done:     int           = 0
    sets_done:     int           = 1
    form_score:    int           = 0          # 0-100 avg form quality
    date:          str
    time:          str
    created_at:    datetime      = Field(default_factory=datetime.utcnow)