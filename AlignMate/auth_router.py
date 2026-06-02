# AlignMate/auth_router.py

import json
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from database import get_session
from models import User, UserProfile, SessionRecord, ExerciseRecord

router = APIRouter(prefix="/auth", tags=["auth"])

IST = timezone(timedelta(hours=5, minutes=30))


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class ProfileRequest(BaseModel):
    age:       Optional[int]   = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    lifestyle: Optional[str]   = None
    level:     Optional[str]   = None
    goal:      Optional[str]   = None
    equipment: Optional[str]   = None
    diet:      Optional[str]   = None

class SaveSessionRequest(BaseModel):
    user_id:      int
    duration:     int
    bad_duration: int
    avg_score:    int
    mode:         Optional[str]  = None
    feedback:     Optional[list] = None
    ai_feedback:  Optional[str]  = None

# ✅ NEW
class SaveExerciseRequest(BaseModel):
    user_id:       int
    exercise_id:   str
    exercise_name: str
    reps_done:     int
    sets_done:     int  = 1
    form_score:    int  = 0


# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── Auth routes ───────────────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_session)):
    existing = db.exec(select(User).where(User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=req.name, email=req.email, password_hash=hash_password(req.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"success": True, "user": {"id": user.id, "name": user.name, "email": user.email}}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == req.email)).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    return {
        "success": True,
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "profile": profile.dict() if profile else None},
    }


@router.post("/profile/{user_id}")
def save_profile(user_id: int, req: ProfileRequest, db: Session = Depends(get_session)):
    existing = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if existing:
        for k, v in req.dict(exclude_unset=True).items(): setattr(existing, k, v)
        db.add(existing)
    else:
        db.add(UserProfile(user_id=user_id, **req.dict()))
    db.commit()
    return {"success": True}


@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_session)):
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if not profile: raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/sessions")
def save_session(req: SaveSessionRequest, db: Session = Depends(get_session)):
    now = datetime.now(IST)
    db.add(SessionRecord(
        user_id=req.user_id, date=now.strftime("%d %b %Y"), time=now.strftime("%I:%M %p"),
        duration=req.duration, bad_duration=req.bad_duration, avg_score=req.avg_score,
        mode=req.mode, feedback=json.dumps(req.feedback), ai_feedback=req.ai_feedback,
    ))
    db.commit()
    return {"success": True}


@router.get("/sessions/{user_id}")
def get_sessions(user_id: int, db: Session = Depends(get_session)):
    records = db.exec(
        select(SessionRecord).where(SessionRecord.user_id == user_id)
        .order_by(SessionRecord.created_at.desc())
    ).all()
    return [{
        "id": r.id, "date": r.date, "time": r.time,
        "duration": r.duration, "badDuration": r.bad_duration,
        "avgScore": r.avg_score, "mode": r.mode,
        "feedback": json.loads(r.feedback) if r.feedback else [],
        "aiFeedback": r.ai_feedback,
    } for r in records]


# ── Exercise history routes ✅ ─────────────────────────────────────────────────

@router.post("/exercise-history")
def save_exercise(req: SaveExerciseRequest, db: Session = Depends(get_session)):
    now = datetime.now(IST)
    db.add(ExerciseRecord(
        user_id       = req.user_id,
        exercise_id   = req.exercise_id,
        exercise_name = req.exercise_name,
        reps_done     = req.reps_done,
        sets_done     = req.sets_done,
        form_score    = req.form_score,
        date          = now.strftime("%d %b %Y"),
        time          = now.strftime("%I:%M %p"),
    ))
    db.commit()
    return {"success": True}


@router.get("/exercise-history/{user_id}")
def get_exercise_history(user_id: int, db: Session = Depends(get_session)):
    records = db.exec(
        select(ExerciseRecord).where(ExerciseRecord.user_id == user_id)
        .order_by(ExerciseRecord.created_at.desc())
    ).all()
    return [{
        "id":           r.id,
        "exerciseId":   r.exercise_id,
        "exerciseName": r.exercise_name,
        "repsDone":     r.reps_done,
        "setsDone":     r.sets_done,
        "formScore":    r.form_score,
        "date":         r.date,
        "time":         r.time,
    } for r in records]