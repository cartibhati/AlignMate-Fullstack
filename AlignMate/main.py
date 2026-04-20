from vision.camera import camera_stream
from posture.geometry import calculate_neck_angle, NeckAngleSmoother
from posture.posture_rules import is_lateral_neck_tilt, is_shoulder_imbalanced
from posture.exercise_verifier import ShoulderRollVerifier

import mediapipe as mp
import cv2
import joblib
import time
import pyttsx3
import threading

# ======================
# VOICE ENGINE (NON-BLOCKING)
# ======================
engine = pyttsx3.init()
last_alert_time = 0
ALERT_COOLDOWN = 5  # seconds

def speak(text):
    def run():
        engine.say(text)
        engine.runAndWait()
    threading.Thread(target=run, daemon=True).start()

# ======================
# CONFIG
# ======================
BAD_POSTURE_THRESHOLD = 0.6
DRIFT_DURATION = 5
MIN_BAD_DURATION = 15
PROB_SMOOTH_WINDOW = 10

TARGET_SHOULDER_REPS = 5
RECOVERY_MESSAGE_DURATION = 3  # seconds

# ======================
# LOAD MODEL
# ======================
ml_model = joblib.load("posture_model_v3.pkl")

# ======================
# GLOBAL STATE
# ======================
smoother = NeckAngleSmoother(window_size=10)

bad_start_time = None
shoulder_verifier = None
recovery_done = False
recovery_done_time = None

prob_history = []

# ======================
# FRAME PROCESSOR
# ======================
def process_frame(frame, landmarks):
    global bad_start_time
    global shoulder_verifier, recovery_done, recovery_done_time
    global last_alert_time

    def get_point(idx):
        lm = landmarks.landmark[idx]
        return (lm.x, lm.y)

    # ---- landmarks ----
    nose = get_point(mp.solutions.pose.PoseLandmark.NOSE)
    left_shoulder = get_point(mp.solutions.pose.PoseLandmark.LEFT_SHOULDER)
    right_shoulder = get_point(mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER)

    # ---- rule-based features ----
    angle = calculate_neck_angle(nose, left_shoulder, right_shoulder)
    smooth_angle = smoother.update(angle)
    shoulder_diff = abs(left_shoulder[1] - right_shoulder[1])

    # ---- posture issues ----
    neck_issue = is_lateral_neck_tilt(smooth_angle)
    shoulder_issue = is_shoulder_imbalanced(left_shoulder, right_shoulder)

    issues = []
    if neck_issue:
        issues.append("Neck tilted")
    if shoulder_issue:
        issues.append("Shoulders slouching")

    issue_text = " | ".join(issues) if issues else "Posture looks fine"

    # ======================
    # ML PREDICTION (99 FEATURES)
    # ======================
    row = []
    for lm in landmarks.landmark:
        row += [lm.x, lm.y, lm.z]

    prediction = ml_model.predict([row])[0]
    prob = ml_model.predict_proba([row])[0][1]

    # ---- smoothing ----
    prob_history.append(prob)
    if len(prob_history) > PROB_SMOOTH_WINDOW:
        prob_history.pop(0)

    bad_prob = sum(prob_history) / len(prob_history)

    # ======================
    # TIMING LOGIC
    # ======================
    now = time.time()

    if bad_prob >= BAD_POSTURE_THRESHOLD:
        if bad_start_time is None:
            bad_start_time = now
        bad_duration = now - bad_start_time
    else:
        bad_start_time = None
        bad_duration = 0

    # ---- posture state ----
    state = "good"
    if bad_duration >= MIN_BAD_DURATION:
        state = "bad"
    elif bad_duration >= DRIFT_DURATION:
        state = "drift"

    # ======================
    # 🔊 VOICE ALERT (FIXED)
    # ======================
    if state == "bad":
        if now - last_alert_time > ALERT_COOLDOWN:
            print("🔊 VOICE TRIGGERED")  # debug
            speak("Sit straight")
            last_alert_time = now

    # ======================
    # RECOVERY LOGIC
    # ======================
    if state == "bad" and shoulder_issue:
        if shoulder_verifier is None:
            shoulder_verifier = ShoulderRollVerifier(
                target_reps=TARGET_SHOULDER_REPS
            )
            recovery_done = False

    if shoulder_verifier and not recovery_done:
        completed = shoulder_verifier.update(left_shoulder, right_shoulder)
        if completed:
            recovery_done = True
            recovery_done_time = time.time()
            shoulder_verifier = None

    # ======================
    # UI
    # ======================
    if state == "good":
        posture_text = "Good posture"
        color = (0, 255, 0)
    elif state == "drift":
        posture_text = "Posture drifting"
        color = (0, 255, 255)
    else:
        posture_text = f"Bad posture ({int(bad_duration)}s)"
        color = (0, 0, 255)

    cv2.putText(frame, posture_text, (30, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    cv2.putText(frame, f"P(bad): {bad_prob:.2f}", (30, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.putText(frame, issue_text, (30, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    cv2.putText(frame, f"ML: {prediction}", (30, 200),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # ---- reps ----
    if shoulder_verifier:
        rep_text = (
            f"Shoulder Rolls: "
            f"{shoulder_verifier.rep_count} / "
            f"{shoulder_verifier.target_reps}"
        )
        cv2.putText(frame, rep_text, (30, 160),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    # ---- recovery message ----
    if recovery_done:
        elapsed = time.time() - recovery_done_time
        if elapsed <= RECOVERY_MESSAGE_DURATION:
            cv2.putText(frame, "Recovery completed ✅", (30, 160),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        else:
            recovery_done = False
            recovery_done_time = None


# ======================
# RUN
# ======================
if __name__ == "__main__":
    camera_stream(process_frame)