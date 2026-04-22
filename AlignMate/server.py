# server.py
import asyncio
import json
import time
import joblib
import mediapipe as mp
from collections import deque

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from posture.geometry import calculate_neck_angle, NeckAngleSmoother
from posture.posture_rules import is_lateral_neck_tilt, is_shoulder_imbalanced
from posture.exercise_verifier import ShoulderRollVerifier

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_model = joblib.load("posture_model_v3.pkl")

BAD_POSTURE_THRESHOLD  = 0.6   # threshold to enter bad state
GOOD_POSTURE_THRESHOLD = 0.45  # ← HYSTERESIS: lower threshold to exit bad state
DRIFT_DURATION         = 5
MIN_BAD_DURATION       = 15
PROB_SMOOTH_WINDOW     = 10
TARGET_SHOULDER_REPS   = 5
RECOVERY_MSG_DURATION  = 3

PL = mp.solutions.pose.PoseLandmark


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Frontend connected")

    smoother           = NeckAngleSmoother(window_size=10)
    bad_start_time     = None
    shoulder_verifier  = None
    recovery_done      = False
    recovery_done_time = None
    # ✅ FIX: Once an exercise starts, lock the state so it can't flip to
    # "good" mid-exercise. The user must complete 5 reps (or timeout) first.
    exercise_locked    = False

    # ✅ FIX 1: Use a proper fixed-size deque instead of a plain list.
    # This naturally rolls old values out and is NEVER cleared mid-session,
    # which was the root cause of the glitching oscillation.
    prob_history = deque(maxlen=PROB_SMOOTH_WINDOW)

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            landmarks_raw = msg.get("landmarks")
            if not landmarks_raw or len(landmarks_raw) < 33:
                await websocket.send_text(json.dumps({
                    "status":        "no_pose",
                    "score":         0,
                    "feedback":      "No pose detected — make sure you're visible",
                    "angles":        {"neck": 0, "shoulder": 0},
                    "issues":        [],
                    "shoulder_reps": None,
                    "recovery_done": False,
                    "bad_prob":      0,
                }))
                continue

            def lm(idx):
                p = landmarks_raw[idx]
                return (p["x"], p["y"])

            nose           = lm(PL.NOSE)
            left_shoulder  = lm(PL.LEFT_SHOULDER)
            right_shoulder = lm(PL.RIGHT_SHOULDER)

            # ── rule-based features ──────────────────────────
            angle        = calculate_neck_angle(nose, left_shoulder, right_shoulder)
            smooth_angle = smoother.update(angle)
            shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])

            neck_issue     = is_lateral_neck_tilt(smooth_angle)
            shoulder_issue = is_shoulder_imbalanced(left_shoulder, right_shoulder)

            issues = []
            if neck_issue:     issues.append("Neck tilted")
            if shoulder_issue: issues.append("Shoulders uneven")

            # ── ML prediction ────────────────────────────────
            row = []
            for p in landmarks_raw:
                row += [p["x"], p["y"], p["z"]]

            prob = ml_model.predict_proba([row])[0][1]

            # ✅ FIX 2: Simply append — deque handles the window automatically.
            # The old code did prob_history.clear() here on good posture, which
            # stripped all smoothing and caused instant state flip on the next frame.
            prob_history.append(prob)

            bad_prob = sum(prob_history) / len(prob_history)

            # ── timing ───────────────────────────────────────
            now = time.time()

            # ✅ FIX 3: Hysteresis — use a lower threshold to EXIT the bad state
            # than the one used to ENTER it. This prevents rapid oscillation when
            # the model's confidence hovers around the boundary (e.g. 0.58–0.62).
            if bad_start_time is None:
                # Currently in good/drift state: use the higher entry threshold
                is_bad = bad_prob >= BAD_POSTURE_THRESHOLD
            else:
                # Currently in bad state: require confidence to drop below the
                # lower exit threshold before resetting the timer
                is_bad = bad_prob >= GOOD_POSTURE_THRESHOLD

            if is_bad:
                if bad_start_time is None:
                    bad_start_time = now
                bad_duration = now - bad_start_time
            else:
                bad_start_time = None
                bad_duration   = 0
                # ✅ Removed: prob_history.clear() — this was the main glitch cause.
                # The deque naturally ages out old values over the next N frames,
                # giving a smooth transition instead of a sudden jump.

            # ── state ────────────────────────────────────────
            if bad_duration >= MIN_BAD_DURATION:
                state = "bad"
            elif bad_duration >= DRIFT_DURATION:
                state = "drift"
            else:
                state = "good"

            # ── recovery ─────────────────────────────────────
            shoulder_reps = None

            # Start exercise only when bad + shoulder issue AND not already running
            if state == "bad" and shoulder_issue and shoulder_verifier is None and not recovery_done:
                shoulder_verifier = ShoulderRollVerifier(TARGET_SHOULDER_REPS)
                exercise_locked   = True   # ✅ lock: state cannot go "good" until done
                recovery_done     = False

            # ✅ FIX: Run the verifier on EVERY frame while it's active —
            # regardless of current state. Previously this block only ran when
            # state=="bad", so sitting straight mid-exercise killed the counter.
            if shoulder_verifier and not recovery_done:
                completed = shoulder_verifier.update(left_shoulder, right_shoulder)
                shoulder_reps = {
                    "count":  shoulder_verifier.rep_count,
                    "target": shoulder_verifier.target_reps,
                }
                if completed:
                    recovery_done      = True
                    recovery_done_time = time.time()
                    shoulder_verifier  = None
                    exercise_locked    = False   # unlock after completion

            if recovery_done:
                if time.time() - recovery_done_time > RECOVERY_MSG_DURATION:
                    recovery_done      = False
                    recovery_done_time = None
                    exercise_locked    = False

            # ✅ FIX: While exercise is in progress, override state to "bad"
            # so the frontend keeps showing the exercise UI even if the user
            # corrects their posture mid-exercise. Without this, state flips to
            # "good" the moment posture improves and the exercise disappears.
            if exercise_locked and not recovery_done:
                state = "bad"

            # ── score & feedback ──────────────────────────────
            score = round((1 - bad_prob) * 100)

            if recovery_done:
                feedback = "Recovery complete! Great job."
            elif exercise_locked and shoulder_reps:
                # ✅ FIX: Show exercise progress regardless of posture state.
                # Previously shoulder_reps was only appended in the state=="bad"
                # branch, so it vanished the moment posture improved.
                feedback = (
                    f"Keep rolling! Shoulder rolls: "
                    f"{shoulder_reps['count']}/{shoulder_reps['target']}"
                )
            elif state == "good":
                feedback = "Good posture! Keep it up."
            elif state == "drift":
                feedback = "Posture drifting — sit straight."
            else:
                feedback = f"Bad posture for {int(bad_duration)}s."
                if issues:
                    feedback += " Issues: " + ", ".join(issues) + "."
                if shoulder_reps:
                    feedback += (
                        f" Shoulder rolls: "
                        f"{shoulder_reps['count']}/{shoulder_reps['target']}"
                    )

            await websocket.send_text(json.dumps({
                "status":        state,
                "score":         score,
                "feedback":      feedback,
                "angles": {
                    "neck":     round(smooth_angle, 1),
                    "shoulder": round(shoulder_diff * 100, 1),
                },
                "bad_prob":      round(bad_prob, 2),
                "issues":        issues,
                "shoulder_reps": shoulder_reps,
                "recovery_done": recovery_done,
            }))

    except WebSocketDisconnect:
        print("❌ Frontend disconnected")