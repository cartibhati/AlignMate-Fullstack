# server.py
import json
import os
import time
import joblib
import mediapipe as mp
from collections import deque
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from posture.geometry import calculate_neck_angle, NeckAngleSmoother
from posture.posture_rules import is_lateral_neck_tilt, is_shoulder_imbalanced
from posture.exercise_verifier import ShoulderRollVerifier
from posture.mode_config import get_config
from posture.exercises import EXERCISE_MAP
from ai_feedback import get_ai_feedback
from workout_planner import generate_plan
from database import create_db_and_tables
from auth_router import router as auth_router

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://arjuns.tech",
    "https://www.arjuns.tech",
    "http://arjuns.tech",
    "http://www.arjuns.tech",
    "https://alignmate.in",
    "https://www.alignmate.in",
    "http://alignmate.in",
    "http://www.alignmate.in",
]

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins += [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("[SUCCESS] Database tables created")

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "posture_model_v3.pkl")
ml_model = joblib.load(MODEL_PATH)

RECOVERY_MSG_DURATION = 3
PL = mp.solutions.pose.PoseLandmark


def get_bad_prob(model, row):
    try:
        probs = model.predict_proba([row])[0]
        classes = list(getattr(model, "classes_", []))
        if "incorrect" in classes:
            idx = classes.index("incorrect")
        elif "bad" in classes:
            idx = classes.index("bad")
        else:
            idx = 1 if len(probs) > 1 else 0
        return float(probs[idx])
    except Exception:
        try:
            return float(probs[1] if len(probs) > 1 else probs[0])
        except Exception:
            return 0.0


# ── AI posture feedback ───────────────────────────────────────────────────────
class FeedbackRequest(BaseModel):
    mode:             str
    score:            int
    bad_duration:     int
    session_duration: int
    issues:           list[str]

@app.post("/ai-feedback")
async def ai_feedback(req: FeedbackRequest):
    feedback = get_ai_feedback(
        mode=req.mode, score=req.score,
        bad_duration=req.bad_duration,
        session_duration=req.session_duration,
        issues=req.issues,
    )
    return {"feedback": feedback}


# ── Workout plan ──────────────────────────────────────────────────────────────
class PlanRequest(BaseModel):
    age:       int
    height_cm: float
    weight_kg: float
    lifestyle: str
    level:     str
    goal:      str
    equipment: str
    diet:      str

@app.post("/generate-plan")
async def generate_workout_plan(req: PlanRequest):
    plan = generate_plan(
        age=req.age, height_cm=req.height_cm, weight_kg=req.weight_kg,
        lifestyle=req.lifestyle, level=req.level, goal=req.goal,
        equipment=req.equipment, diet=req.diet,
    )
    if "error" in plan:
        return {"error": plan["error"]}
    return plan


# ── Posture WebSocket ─────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Posture WS connected")

    smoother           = NeckAngleSmoother(window_size=10)
    bad_start_time     = None
    shoulder_verifier  = None
    recovery_done      = False
    recovery_done_time = None
    exercise_locked    = False
    current_mode       = None
    cfg                = get_config("student")
    prob_history       = deque(maxlen=10)

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            incoming_mode = msg.get("mode", "student")
            if incoming_mode != current_mode:
                current_mode = incoming_mode
                cfg          = get_config(current_mode)
                prob_history = deque(maxlen=10)

            BAD_POSTURE_THRESHOLD  = cfg["bad_posture_threshold"]
            GOOD_POSTURE_THRESHOLD = cfg["good_posture_threshold"]
            DRIFT_DURATION         = cfg["drift_duration"]
            MIN_BAD_DURATION       = cfg["min_bad_duration"]
            TARGET_SHOULDER_REPS   = cfg["target_shoulder_reps"]
            ALERT_MESSAGE          = cfg["alert_message"]

            landmarks_raw = msg.get("landmarks")
            if not landmarks_raw or len(landmarks_raw) < 33:
                await websocket.send_text(json.dumps({
                    "status": "no_pose", "score": 0,
                    "feedback": "No pose detected",
                    "angles": {"neck": 0, "shoulder": 0},
                    "issues": [], "shoulder_reps": None,
                    "recovery_done": False, "bad_prob": 0,
                    "mode": current_mode,
                }))
                continue

            def lm(idx):
                p = landmarks_raw[idx]
                return (p["x"], p["y"])

            nose           = lm(PL.NOSE)
            left_shoulder  = lm(PL.LEFT_SHOULDER)
            right_shoulder = lm(PL.RIGHT_SHOULDER)

            angle         = calculate_neck_angle(nose, left_shoulder, right_shoulder)
            smooth_angle  = smoother.update(angle)
            shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])

            neck_issue     = is_lateral_neck_tilt(smooth_angle)
            shoulder_issue = is_shoulder_imbalanced(left_shoulder, right_shoulder)

            issues = []
            if neck_issue:     issues.append("Neck tilted")
            if shoulder_issue: issues.append("Shoulders uneven")

            row = []
            for p in landmarks_raw:
                row += [p["x"], p["y"], p["z"]]

            bad_prob = get_bad_prob(ml_model, row)
            prob_history.append(bad_prob)

            now = time.time()
            if bad_start_time is None:
                is_bad = bad_prob >= BAD_POSTURE_THRESHOLD
            else:
                is_bad = bad_prob >= GOOD_POSTURE_THRESHOLD

            if is_bad:
                if bad_start_time is None:
                    bad_start_time = now
                bad_duration = now - bad_start_time
            else:
                bad_start_time = None
                bad_duration   = 0

            if bad_duration >= MIN_BAD_DURATION:   state = "bad"
            elif bad_duration >= DRIFT_DURATION:   state = "drift"
            else:                                  state = "good"

            shoulder_reps = None
            if state == "bad" and shoulder_issue and shoulder_verifier is None and not recovery_done:
                shoulder_verifier = ShoulderRollVerifier(TARGET_SHOULDER_REPS)
                exercise_locked   = True

            if shoulder_verifier and not recovery_done:
                completed = shoulder_verifier.update(left_shoulder, right_shoulder)
                shoulder_reps = {"count": shoulder_verifier.rep_count, "target": shoulder_verifier.target_reps}
                if completed:
                    recovery_done      = True
                    recovery_done_time = time.time()
                    shoulder_verifier  = None
                    exercise_locked    = False

            if recovery_done and time.time() - recovery_done_time > RECOVERY_MSG_DURATION:
                recovery_done = False; recovery_done_time = None; exercise_locked = False

            if exercise_locked and not recovery_done:
                state = "bad"

            score = round((1 - bad_prob) * 100)

            if recovery_done:                       feedback = "Recovery complete! Great job."
            elif exercise_locked and shoulder_reps: feedback = f"Shoulder rolls: {shoulder_reps['count']}/{shoulder_reps['target']}"
            elif state == "good":                   feedback = "Good posture! Keep it up."
            elif state == "drift":                  feedback = "Posture drifting — sit straight."
            else:
                feedback = f"{ALERT_MESSAGE} ({int(bad_duration)}s)"
                if issues: feedback += " Issues: " + ", ".join(issues) + "."

            await websocket.send_text(json.dumps({
                "status": state, "score": score, "feedback": feedback,
                "angles": {"neck": round(smooth_angle, 1), "shoulder": round(shoulder_diff * 100, 1)},
                "bad_prob": round(bad_prob, 2), "issues": issues,
                "shoulder_reps": shoulder_reps, "recovery_done": recovery_done,
                "mode": current_mode,
            }))

    except WebSocketDisconnect:
        print("[WS] Posture WS disconnected")
    except Exception as exc:
        print("[WS] Posture WS error:", exc)
        await websocket.close()


# ── Exercise WebSocket ────────────────────────────────────────────────────────
@app.websocket("/ws/exercise")
async def exercise_websocket(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Exercise WS connected")

    analyzer     = None
    exercise_key = None

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            # ── Switch exercise if changed ────────────────────────────────
            incoming_ex = msg.get("exercise")
            if incoming_ex and incoming_ex != exercise_key:
                mapped_ex = incoming_ex
                if mapped_ex not in EXERCISE_MAP:
                    from posture.exercise_mapper import map_exercise_name
                    mapped_ex = map_exercise_name(incoming_ex) or incoming_ex

                if mapped_ex in EXERCISE_MAP:
                    exercise_key = mapped_ex
                    target_reps  = msg.get("target_reps", 10)
                    analyzer     = EXERCISE_MAP[exercise_key](target_reps=target_reps)
                    print(f"[EXERCISE] Exercise: {exercise_key}")
                else:
                    await websocket.send_text(json.dumps({"error": f"Unknown exercise: {incoming_ex}"}))
                    continue

            landmarks_raw = msg.get("landmarks")
            if not landmarks_raw or len(landmarks_raw) < 33:
                await websocket.send_text(json.dumps({
                    "status":    "no_pose",
                    "feedback":  ["Make sure your full body is visible"],
                    "rep_count": 0,
                    "target":    0,
                    "phase":     "idle",
                    "form_ok":   True,
                    "completed": False,
                    "angle":     0,
                    "angle_label": "",
                }))
                continue

            if analyzer is None:
                await websocket.send_text(json.dumps({
                    "status":    "waiting",
                    "feedback":  ["Select an exercise to begin"],
                    "rep_count": 0,
                    "target":    0,
                    "phase":     "idle",
                    "form_ok":   True,
                    "completed": False,
                    "angle":     0,
                    "angle_label": "",
                }))
                continue

            # ── Run analyzer ──────────────────────────────────────────────
            result = analyzer.update(landmarks_raw)

            await websocket.send_text(json.dumps({
                "status":      "active",
                "exercise":    exercise_key,
                "rep_count":   result["rep_count"],
                "target":      result["target"],
                "phase":       result["phase"],
                "feedback":    result["feedback"],
                "form_ok":     result["form_ok"],
                "completed":   result["completed"],
                "angle":       result["angle"],
                "angle_label": result["angle_label"],
            }))

    except WebSocketDisconnect:
        print("[WS] Exercise WS disconnected")
    except Exception as exc:
        print("[WS] Exercise WS error:", exc)
        await websocket.close()