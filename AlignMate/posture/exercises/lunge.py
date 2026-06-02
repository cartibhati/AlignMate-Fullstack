# AlignMate/posture/exercises/lunge.py
from .utils import angle_between


class LungeAnalyzer:
    name = "Lunge"

    DOWN_ANGLE = 105   # front knee at ~90° = good lunge depth
    UP_ANGLE   = 150   # standing = legs straight

    def __init__(self, target_reps=10):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        # Use left side as primary (side view)
        l_hip   = p(23); l_knee = p(25); l_ankle = p(27)
        r_hip   = p(24); r_knee = p(26); r_ankle = p(28)

        # Take the more bent knee (front leg in lunge)
        l_angle = angle_between(l_hip, l_knee, l_ankle)
        r_angle = angle_between(r_hip, r_knee, r_ankle)
        knee_angle = min(l_angle, r_angle)

        # ── Visibility check ──────────────────────────────────────────────
        key_lms = [landmarks[23], landmarks[25], landmarks[27],
                   landmarks[24], landmarks[26], landmarks[28]]
        avg_vis = sum(lm.get("visibility", 1) for lm in key_lms) / len(key_lms)
        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(knee_angle, 1),
                "angle_label": "Knee angle",
                "feedback": ["Make sure full body is visible — side view preferred"],
                "form_ok": False, "completed": False,
            }

        # ── Phase detection ───────────────────────────────────────────────
        if knee_angle < self.DOWN_ANGLE and self.phase in ["idle", "up"]:
            self.phase = "down"
        elif knee_angle > self.UP_ANGLE and self.phase == "down":
            self.phase = "up"
            self.rep_count += 1

        # ── Form feedback ─────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        if self.phase == "idle":
            if knee_angle < 150:
                feedback.append("Wrong position — stand tall to begin")
                form_ok = False
            else:
                feedback.append("Stand tall — step forward into a lunge")

        elif self.phase == "down":
            if knee_angle > self.DOWN_ANGLE + 25:
                feedback.append("Lunge deeper — front knee to 90°")
                form_ok = False

            # Front knee shouldn't go past toes
            front_knee_x  = l_knee[0] if l_angle < r_angle else r_knee[0]
            front_ankle_x = l_ankle[0] if l_angle < r_angle else r_ankle[0]
            if abs(front_knee_x - front_ankle_x) > 0.08:
                feedback.append("Knee past toes — shift weight to heel")
                form_ok = False

            if form_ok:
                feedback.append("Good lunge — push back up through front heel")

        elif self.phase == "up":
            feedback.append("Rep done! Alternate legs each set")

        return {
            "rep_count":   self.rep_count,
            "target":      self.target_reps,
            "phase":       self.phase,
            "angle":       round(knee_angle, 1),
            "angle_label": "Knee angle",
            "feedback":    feedback,
            "form_ok":     form_ok,
            "completed":   self.rep_count >= self.target_reps,
        }