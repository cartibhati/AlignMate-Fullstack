# AlignMate/posture/exercises/bench_press.py
from .utils import angle_between


class BenchPressAnalyzer:
    name = "Bench Press"

    DOWN_ANGLE = 85    # elbows bent, bar at chest
    UP_ANGLE   = 145   # arms extended

    def __init__(self, target_reps=10):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); l_elbow = p(13); l_wrist = p(15)
        r_shoulder = p(12); r_elbow = p(14); r_wrist = p(16)
        l_hip      = p(23); r_hip   = p(24)

        # Select side with higher average visibility (left vs right)
        l_vis = (landmarks[11].get("visibility", 1) + landmarks[13].get("visibility", 1) + landmarks[15].get("visibility", 1)) / 3
        r_vis = (landmarks[12].get("visibility", 1) + landmarks[14].get("visibility", 1) + landmarks[16].get("visibility", 1)) / 3

        if l_vis > r_vis:
            elbow_angle = angle_between(l_shoulder, l_elbow, l_wrist)
            avg_vis = l_vis
        else:
            elbow_angle = angle_between(r_shoulder, r_elbow, r_wrist)
            avg_vis = r_vis

        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(elbow_angle, 1),
                "angle_label": "Elbow angle",
                "feedback": ["Adjust camera — upper body needs to be visible"],
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
            feedback.append("Lie flat — bar above chest — begin the press")

        elif self.phase == "down":
            if elbow_angle > self.DOWN_ANGLE + 25:
                feedback.append("Lower the bar to chest — full range of motion")
                form_ok = False

            # Elbow flare: elbows should be ~45-75° from torso, not fully flared
            shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
            elbow_width    = abs(l_elbow[0]    - r_elbow[0])
            if shoulder_width > 0.05 and elbow_width > shoulder_width * 1.8:
                feedback.append("Elbows flaring — tuck them slightly (45° angle)")
                form_ok = False

            if form_ok:
                feedback.append("Good — drive the bar up explosively!")

        elif self.phase == "up":
            feedback.append("Full lockout! Lower with control — 2 seconds down")

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