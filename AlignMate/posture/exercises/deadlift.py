# AlignMate/posture/exercises/deadlift.py
from .utils import angle_between


class DeadliftAnalyzer:
    name = "Deadlift"

    HINGE_ANGLE   = 125   # hip hinge down position
    LOCKOUT_ANGLE = 160   # fully standing/locked out

    def __init__(self, target_reps=8):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"  # idle → down → up

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); r_shoulder = p(12)
        l_hip      = p(23); r_hip      = p(24)
        l_knee     = p(25); r_knee     = p(26)
        l_ankle    = p(27); r_ankle    = p(28)

        # Hip angle = angle at hip between shoulder-hip-knee
        hip_angle = (
            angle_between(l_shoulder, l_hip, l_knee) +
            angle_between(r_shoulder, r_hip, r_knee)
        ) / 2

        # ── Phase detection ───────────────────────────────────────────────
        if hip_angle < self.HINGE_ANGLE and self.phase in ["idle", "up"]:
            self.phase = "down"

        elif hip_angle > self.LOCKOUT_ANGLE and self.phase == "down":
            self.phase = "up"
            self.rep_count += 1

        # ── Form checks ───────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        # Back roundness: shoulders should stay above hips throughout
        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        avg_hip_y      = (l_hip[1]      + r_hip[1])      / 2

        if self.phase == "down":
            # Rounded back = shoulders much lower than expected
            back_angle = angle_between(
                ((l_shoulder[0]+r_shoulder[0])/2, (l_shoulder[1]+r_shoulder[1])/2),
                ((l_hip[0]+r_hip[0])/2,           (l_hip[1]+r_hip[1])/2),
                ((l_knee[0]+r_knee[0])/2,          (l_knee[1]+r_knee[1])/2),
            )
            if back_angle < 100:
                feedback.append("Back rounding — keep chest up, spine neutral")
                form_ok = False
            else:
                feedback.append("Good hinge — drive hips forward to stand")

            # Knees shouldn't collapse inward
            avg_knee_x  = (l_knee[0]  + r_knee[0])  / 2
            avg_ankle_x = (l_ankle[0] + r_ankle[0]) / 2
            knee_spread = abs(l_knee[0] - r_knee[0])
            ankle_spread = abs(l_ankle[0] - r_ankle[0])
            if knee_spread < ankle_spread * 0.7:
                feedback.append("Knees caving — push them out over toes")
                form_ok = False

        elif self.phase == "up":
            # Check full lockout — hips and shoulders in line
            if hip_angle < self.LOCKOUT_ANGLE - 10:
                feedback.append("Don't hyperextend — stand tall and neutral")
                form_ok = False
            else:
                feedback.append("Clean lockout! Lower the weight with control")

        else:
            feedback.append("Hinge at hips, soft knees — begin the pull")

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