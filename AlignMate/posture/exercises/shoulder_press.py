# AlignMate/posture/exercises/shoulder_press.py
from .utils import angle_between


class ShoulderPressAnalyzer:
    name = "Shoulder Press"

    DOWN_ANGLE = 80
    UP_ANGLE   = 145

    def __init__(self, target_reps=10):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); l_elbow = p(13); l_wrist = p(15)
        r_shoulder = p(12); r_elbow = p(14); r_wrist = p(16)
        l_hip      = p(23); r_hip   = p(24)

        elbow_angle = (
            angle_between(l_shoulder, l_elbow, l_wrist) +
            angle_between(r_shoulder, r_elbow, r_wrist)
        ) / 2

        # ── Phase detection ───────────────────────────────────────────────
        if elbow_angle < self.DOWN_ANGLE and self.phase in ["idle", "up"]:
            self.phase = "down"
        elif elbow_angle > self.UP_ANGLE and self.phase == "down":
            self.phase = "up"
            self.rep_count += 1

        # ── Form checks ───────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        if self.phase == "up":
            l_wrist_above = l_wrist[1] < l_elbow[1]
            r_wrist_above = r_wrist[1] < r_elbow[1]
            if not (l_wrist_above and r_wrist_above):
                feedback.append("Press fully overhead — lockout arms")
                form_ok = False
            else:
                feedback.append("Great press! Lower with control")

        elif self.phase == "down":
            # ✅ FIXED: much more lenient elbow flare check (2.0x instead of 1.5x)
            shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
            elbow_width    = abs(l_elbow[0]    - r_elbow[0])
            if shoulder_width > 0.05 and elbow_width > shoulder_width * 2.0:
                feedback.append("Elbows flaring wide — bring them in slightly")
                form_ok = False
            else:
                feedback.append("Good position — press it up!")

        else:
            feedback.append("Bring weights to shoulder height to begin")

        # ✅ FIXED: more lenient back lean check
        avg_hip_y      = (l_hip[1]      + r_hip[1])      / 2
        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        if avg_shoulder_y < avg_hip_y - 0.45:   # was 0.35
            feedback.append("Leaning back too much — brace your core")
            form_ok = False

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