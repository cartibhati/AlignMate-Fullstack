# AlignMate/posture/exercises/hip_thrust.py
from .utils import angle_between


class HipThrustAnalyzer:
    name = "Hip Thrust"

    # Hip angle at top (full extension) and bottom
    TOP_ANGLE    = 160   # hips fully extended = straight line
    BOTTOM_ANGLE = 90    # hips at bottom = bent

    def __init__(self, target_reps=12):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); r_shoulder = p(12)
        l_hip      = p(23); r_hip      = p(24)
        l_knee     = p(25); r_knee     = p(26)

        # Hip angle = angle at hip between shoulder-hip-knee
        l_angle = angle_between(l_shoulder, l_hip, l_knee)
        r_angle = angle_between(r_shoulder, r_hip, r_knee)
        hip_angle = (l_angle + r_angle) / 2

        # ── Visibility ────────────────────────────────────────────────────
        key_lms = [landmarks[23], landmarks[25], landmarks[11],
                   landmarks[24], landmarks[26], landmarks[12]]
        avg_vis = sum(lm.get("visibility", 1) for lm in key_lms) / len(key_lms)
        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(hip_angle, 1),
                "angle_label": "Hip angle",
                "feedback": ["Lay down with full body visible — side view best"],
                "form_ok": False, "completed": False,
            }

        # ── Phase detection ───────────────────────────────────────────────
        if hip_angle < self.BOTTOM_ANGLE + 20 and self.phase in ["idle", "up"]:
            self.phase = "down"
        elif hip_angle > self.TOP_ANGLE and self.phase == "down":
            self.phase = "up"
            self.rep_count += 1

        # ── Form feedback ─────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        avg_hip_y      = (l_hip[1]      + r_hip[1])      / 2
        avg_knee_y     = (l_knee[1]     + r_knee[1])     / 2

        if self.phase == "idle":
            if hip_angle > 150:
                feedback.append("Lie back with knees bent — begin the thrust")
            else:
                feedback.append("Position: back on bench, feet flat, knees bent")
                form_ok = False

        elif self.phase == "down":
            if hip_angle > self.BOTTOM_ANGLE + 40:
                feedback.append("Lower hips fully before thrusting up")
                form_ok = False
            else:
                feedback.append("Drive hips up — squeeze glutes at the top!")

        elif self.phase == "up":
            if hip_angle < self.TOP_ANGLE - 15:
                feedback.append("Drive higher — full hip extension, squeeze glutes!")
                form_ok = False
            else:
                # Check for hyperextension (lower back arching)
                if avg_hip_y < avg_shoulder_y - 0.05:
                    feedback.append("Don't hyperextend — neutral spine at top")
                    form_ok = False
                else:
                    feedback.append("Perfect lockout! Lower with control")

        return {
            "rep_count":   self.rep_count,
            "target":      self.target_reps,
            "phase":       self.phase,
            "angle":       round(hip_angle, 1),
            "angle_label": "Hip angle",
            "feedback":    feedback,
            "form_ok":     form_ok,
            "completed":   self.rep_count >= self.target_reps,
        }