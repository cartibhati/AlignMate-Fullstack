# AlignMate/posture/exercises/tricep_dip.py
from .utils import angle_between


class TricepDipAnalyzer:
    name = "Tricep Dip"

    DOWN_ANGLE = 85    # elbows bent ~90° = bottom of dip
    UP_ANGLE   = 145   # arms extended = top

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

        # ── Visibility ────────────────────────────────────────────────────
        key_lms = [landmarks[11], landmarks[13], landmarks[15],
                   landmarks[12], landmarks[14], landmarks[16]]
        avg_vis = sum(lm.get("visibility", 1) for lm in key_lms) / len(key_lms)
        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(elbow_angle, 1),
                "angle_label": "Elbow angle",
                "feedback": ["Side view — make sure upper body is visible"],
                "form_ok": False, "completed": False,
            }

        # ── Phase detection ───────────────────────────────────────────────
        if elbow_angle < self.DOWN_ANGLE and self.phase in ["idle", "up"]:
            self.phase = "down"
        elif elbow_angle > self.UP_ANGLE and self.phase == "down":
            self.phase = "up"
            self.rep_count += 1

        # ── Form checks ───────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        avg_hip_y      = (l_hip[1]      + r_hip[1])      / 2

        if self.phase == "idle":
            feedback.append("Hands on bars, arms extended — begin the dip")

        elif self.phase == "down":
            # Body leaning too far forward
            if avg_shoulder_y < avg_hip_y - 0.15:
                feedback.append("Leaning too far forward — stay more upright")
                form_ok = False

            if elbow_angle > self.DOWN_ANGLE + 20:
                feedback.append("Dip lower — elbows to 90°")
                form_ok = False

            # Elbows flaring out
            shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
            elbow_width    = abs(l_elbow[0]    - r_elbow[0])
            if shoulder_width > 0.05 and elbow_width > shoulder_width * 1.6:
                feedback.append("Elbows flaring — keep them pointing back")
                form_ok = False

            if form_ok:
                feedback.append("Good depth — push back up!")

        elif self.phase == "up":
            feedback.append("Full extension! Lower with control")

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