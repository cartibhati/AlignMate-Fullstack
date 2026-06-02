# AlignMate/posture/exercises/pushup.py
from .utils import angle_between


class PushupAnalyzer:
    name = "Pushup"

    DOWN_ANGLE     = 95
    UP_ANGLE       = 145
    IDLE_THRESHOLD = 140   # arms too straight = not in pushup position

    def __init__(self, target_reps=10):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); l_elbow = p(13); l_wrist = p(15)
        r_shoulder = p(12); r_elbow = p(14); r_wrist = p(16)
        l_hip      = p(23); r_hip   = p(24)
        l_ankle    = p(27); r_ankle = p(28)

        elbow_angle = (
            angle_between(l_shoulder, l_elbow, l_wrist) +
            angle_between(r_shoulder, r_elbow, r_wrist)
        ) / 2

        # ── Visibility check ──────────────────────────────────────────────
        key_lms = [landmarks[11], landmarks[13], landmarks[15],
                   landmarks[12], landmarks[14], landmarks[16]]
        avg_vis = sum(lm.get("visibility", 1) for lm in key_lms) / len(key_lms)

        if avg_vis < 0.5:
            return {
                "rep_count":   self.rep_count,
                "target":      self.target_reps,
                "phase":       "idle",
                "angle":       round(elbow_angle, 1),
                "angle_label": "Elbow angle",
                "feedback":    ["Can't see your upper body — adjust camera"],
                "form_ok":     False,
                "completed":   False,
            }

        # ── Body alignment check (is user in plank/pushup position?) ──────
        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        avg_hip_y      = (l_hip[1]      + r_hip[1])      / 2
        avg_ankle_y    = (l_ankle[1]    + r_ankle[1])    / 2

        body_range     = abs(avg_ankle_y - avg_shoulder_y)
        in_position    = body_range < 0.30  # horizontal body = small Y range

        # ── Phase detection ───────────────────────────────────────────────
        if in_position:
            if elbow_angle < self.DOWN_ANGLE and self.phase in ["idle", "up"]:
                self.phase = "down"
            elif elbow_angle > self.UP_ANGLE and self.phase == "down":
                self.phase = "up"
                self.rep_count += 1

        # ── Form feedback ─────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        if not in_position:
            feedback.append("Get into pushup position — horizontal body required")
            form_ok = False
            self.phase = "idle"

        elif self.phase == "idle":
            feedback.append("In position — start lowering your chest")

        elif self.phase == "down":
            if elbow_angle > self.DOWN_ANGLE + 20:
                feedback.append("Go lower — chest close to the ground")
                form_ok = False

            # Hip sag check
            if body_range > 0:
                hip_ratio = (avg_hip_y - avg_shoulder_y) / body_range
                if hip_ratio > 0.60:
                    feedback.append("Hips sagging — squeeze core and glutes")
                    form_ok = False
                elif hip_ratio < 0.25:
                    feedback.append("Hips too high — lower them")
                    form_ok = False

            if form_ok:
                feedback.append("Good — push back up explosively!")

        elif self.phase == "up":
            feedback.append("Full lockout! Lower with control")

        return {
            "rep_count":   self.rep_count,
            "target":      self.target_reps,
            "phase":       self.phase,
            "angle":       round(elbow_angle, 1),
            "angle_label": "Elbow angle",
            "feedback":    feedback,
            "form_ok":     form_ok,
            "completed":   self.rep_count >= self.target_reps,
        }