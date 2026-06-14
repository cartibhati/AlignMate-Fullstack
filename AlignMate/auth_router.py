# AlignMate/auth_router.py

import json
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from database import get_session
from models import User, UserProfile, SessionRecord, ExerciseRecord

router = APIRouter(prefix="/auth", tags=["auth"])

IST = timezone(timedelta(hours=5, minutes=30))

SECRET_KEY = "alignmate_super_secret_jwt_key_2026_fitness"
ALGORITHM = "HS256"
COOKIE_NAME = "access_token"


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

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request, db: Session = Depends(get_session)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token session")
    
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Auth routes ───────────────────────────────────────────────────────────────

@router.post("/register")
def register(response: Response, req: RegisterRequest, db: Session = Depends(get_session)):
    existing = db.exec(select(User).where(User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=req.name, email=req.email, password_hash=hash_password(req.password))
    db.add(user); db.commit(); db.refresh(user)
    
    token = create_access_token(user.id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=604800, # 7 days
        path="/"
    )
    return {"success": True, "token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "profile": None}}


@router.post("/login")
def login(response: Response, req: LoginRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == req.email)).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    
    token = create_access_token(user.id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=604800, # 7 days
        path="/"
    )
    return {
        "success": True,
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "profile": profile.dict() if profile else None},
    }


@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    return {
        "success": True,
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "profile": profile.dict() if profile else None},
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"success": True}


@router.post("/profile/{user_id}")
def save_profile(user_id: int, req: ProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    existing = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if existing:
        for k, v in req.dict(exclude_unset=True).items(): setattr(existing, k, v)
        db.add(existing)
    else:
        db.add(UserProfile(user_id=user_id, **req.dict()))
    db.commit()
    return {"success": True}


@router.get("/profile/{user_id}")
def get_profile(user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if not profile: raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/sessions")
def save_session(req: SaveSessionRequest, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != req.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    now = datetime.now(IST)
    db.add(SessionRecord(
        user_id=req.user_id, date=now.strftime("%d %b %Y"), time=now.strftime("%I:%M %p"),
        duration=req.duration, bad_duration=req.bad_duration, avg_score=req.avg_score,
        mode=req.mode, feedback=json.dumps(req.feedback), ai_feedback=req.ai_feedback,
    ))
    db.commit()
    return {"success": True}


@router.get("/sessions/{user_id}")
def get_sessions(user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
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


# ── Exercise history routes ───────────────────────────────────────────────────

@router.post("/exercise-history")
def save_exercise(req: SaveExerciseRequest, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != req.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
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
def get_exercise_history(user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
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


@router.post("/seed-demo-data/{user_id}")
def seed_demo_data(user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Clear existing session and exercise history records for this user
    old_sessions = db.exec(select(SessionRecord).where(SessionRecord.user_id == user_id)).all()
    for s in old_sessions:
        db.delete(s)
    old_exercises = db.exec(select(ExerciseRecord).where(ExerciseRecord.user_id == user_id)).all()
    for e in old_exercises:
        db.delete(e)
    db.commit()

    # Generate posture sessions (12 sessions spread across the last 15 days)
    sessions_to_add = []
    exercise_history_to_add = []
    
    mock_posture_configs = [
        {"days_ago": 14, "mode": "student", "duration": 2700, "bad_duration": 480, "avg_score": 82, "feedback": ["Slouching detected", "Neck tilted forward"], "ai": "Decent desk posture today, but watch out for slouching during the second half of your study session."},
        {"days_ago": 13, "mode": "student", "duration": 3600, "bad_duration": 540, "avg_score": 85, "feedback": ["Forward head tilt"], "ai": "Great focus session! Your neck angle was mostly kept upright. Slight forward head tilt towards the end."},
        {"days_ago": 11, "mode": "athlete", "duration": 1800, "bad_duration": 180, "avg_score": 90, "feedback": ["Shoulder imbalance"], "ai": "Excellent alignment! Your shoulder balance was nearly perfect, only brief deviations recorded."},
        {"days_ago": 10, "mode": "student", "duration": 4200, "bad_duration": 720, "avg_score": 83, "feedback": ["Slouching detected", "Shoulder imbalance"], "ai": "Good desk compliance. Make sure you stretch your lower back after every 30 minutes of sitting."},
        {"days_ago": 9, "mode": "athlete", "duration": 2400, "bad_duration": 360, "avg_score": 85, "feedback": ["Lateral neck tilt"], "ai": "Stable form. Ensure your head does not tilt left when holding heavy squats."},
        {"days_ago": 7, "mode": "student", "duration": 3000, "bad_duration": 300, "avg_score": 90, "feedback": ["Slouching detected"], "ai": "Impressive! You maintained proper upright back alignment for over 90% of this study block."},
        {"days_ago": 6, "mode": "student", "duration": 4800, "bad_duration": 600, "avg_score": 87, "feedback": ["Forward head tilt", "Slouching detected"], "ai": "Very consistent sitting posture. Your habits are visibly improving compared to week 1."},
        {"days_ago": 5, "mode": "athlete", "duration": 2100, "bad_duration": 150, "avg_score": 93, "feedback": ["Shoulders uneven"], "ai": "Outstanding body alignment! Almost no slouching. Active spinal loading remains in ideal zones."},
        {"days_ago": 4, "mode": "student", "duration": 3600, "bad_duration": 360, "avg_score": 90, "feedback": ["Forward head tilt"], "ai": "Perfect desk ergonomics. Keep up this habit to eliminate lower back fatigue."},
        {"days_ago": 3, "mode": "athlete", "duration": 2400, "bad_duration": 200, "avg_score": 91, "feedback": ["Shoulder imbalance"], "ai": "Incredible balance. You are maintaining excellent posture control even during high fatigue sets."},
        {"days_ago": 2, "mode": "student", "duration": 5400, "bad_duration": 500, "avg_score": 91, "feedback": ["Slouching detected"], "ai": "Fantastic! A 90-minute session with 91% average alignment. Your core posture muscles are strengthening."},
        {"days_ago": 1, "mode": "athlete", "duration": 3000, "bad_duration": 240, "avg_score": 92, "feedback": ["Shoulders uneven"], "ai": "Awesome session. Keep monitoring shoulder symmetry during overhead movements."}
    ]
    
    now = datetime.now(IST)
    for c in mock_posture_configs:
        sess_date = now - timedelta(days=c["days_ago"])
        created_at_val = datetime(sess_date.year, sess_date.month, sess_date.day, 10, 30, tzinfo=IST)
        
        r = SessionRecord(
            user_id=user_id,
            date=sess_date.strftime("%d %b %Y"),
            time="10:30 AM",
            duration=c["duration"],
            bad_duration=c["bad_duration"],
            avg_score=c["avg_score"],
            mode=c["mode"],
            feedback=json.dumps(c["feedback"]),
            ai_feedback=c["ai"],
            created_at=created_at_val
        )
        sessions_to_add.append(r)
        
    mock_exercises = [
        {"days_ago": 14, "id": "squat", "name": "Barbell Squat", "reps": 30, "sets": 3, "score": 82},
        {"days_ago": 14, "id": "bicep_curl", "name": "Bicep Curl", "reps": 24, "sets": 2, "score": 88},
        {"days_ago": 13, "id": "bench_press", "name": "Bench Press", "reps": 40, "sets": 4, "score": 80},
        {"days_ago": 13, "id": "pushup", "name": "Pushup", "reps": 30, "sets": 3, "score": 85},
        {"days_ago": 11, "id": "lat_pulldown", "name": "Lat Pulldown", "reps": 36, "sets": 3, "score": 90},
        {"days_ago": 11, "id": "face_pulls", "name": "Face Pulls", "reps": 45, "sets": 3, "score": 92},
        {"days_ago": 10, "id": "deadlift", "name": "Barbell Deadlift", "reps": 15, "sets": 3, "score": 78},
        {"days_ago": 10, "id": "squat", "name": "Barbell Squat", "reps": 40, "sets": 4, "score": 86},
        {"days_ago": 7, "id": "bench_press", "name": "Bench Press", "reps": 30, "sets": 3, "score": 88},
        {"days_ago": 7, "id": "bicep_curl", "name": "Bicep Curl", "reps": 36, "sets": 3, "score": 91},
        {"days_ago": 6, "id": "pushup", "name": "Pushup", "reps": 45, "sets": 3, "score": 90},
        {"days_ago": 6, "id": "face_pulls", "name": "Face Pulls", "reps": 40, "sets": 3, "score": 95},
        {"days_ago": 4, "id": "deadlift", "name": "Barbell Deadlift", "reps": 20, "sets": 4, "score": 84},
        {"days_ago": 4, "id": "lat_pulldown", "name": "Lat Pulldown", "reps": 36, "sets": 3, "score": 92},
        {"days_ago": 2, "id": "squat", "name": "Barbell Squat", "reps": 45, "sets": 3, "score": 94},
        {"days_ago": 2, "id": "bench_press", "name": "Bench Press", "reps": 36, "sets": 3, "score": 90},
        {"days_ago": 1, "id": "pushup", "name": "Pushup", "reps": 60, "sets": 4, "score": 93},
        {"days_ago": 1, "id": "bicep_curl", "name": "Bicep Curl", "reps": 36, "sets": 3, "score": 95}
    ]
    
    for e in mock_exercises:
        ex_date = now - timedelta(days=e["days_ago"])
        created_at_val = datetime(ex_date.year, ex_date.month, ex_date.day, 16, 15, tzinfo=IST)
        
        r = ExerciseRecord(
            user_id=user_id,
            exercise_id=e["id"],
            exercise_name=e["name"],
            reps_done=e["reps"],
            sets_done=e["sets"],
            form_score=e["score"],
            date=ex_date.strftime("%d %b %Y"),
            time="04:15 PM",
            created_at=created_at_val
        )
        exercise_history_to_add.append(r)
        
    for s in sessions_to_add:
        db.add(s)
    for e in exercise_history_to_add:
        db.add(e)
        
    db.commit()
    return {"success": True, "message": "Demo data successfully seeded for this user"}