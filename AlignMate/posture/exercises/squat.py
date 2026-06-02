# AlignMate/posture/exercises/squat.py
from .utils import angle_between


class SquatAnalyzer:
    name = "Squat"

    STANDING_ANGLE  = 150   # fully standing (more forgiving lockout)
    PARALLEL_ANGLE  = 100   # good squat depth
    TOO_SHALLOW     = 130   # not deep enough
    IDLE_THRESHOLD  = 145   # below this = not standing properly

    def __init__(self, target_reps=10):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_hip   = p(23); l_knee = p(25); l_ankle = p(27)
        r_hip   = p(24); r_knee = p(26); r_ankle = p(28)

        knee_angle = (
            angle_between(l_hip, l_knee, l_ankle) +
            angle_between(r_hip, r_knee, r_ankle)
        ) / 2

        # ── Visibility check ──────────────────────────────────────────────
        # If key landmarks not visible, warn user
        key_lms = [landmarks[23], landmarks[25], landmarks[27],
                   landmarks[24], landmarks[26], landmarks[28]]
        avg_vis = sum(lm.get("visibility", 1) for lm in key_lms) / len(key_lms)

        if avg_vis < 0.5:
            return {
                "rep_count":   self.rep_count,
                "target":      self.target_reps,
                "phase":       "idle",
                "angle":       round(knee_angle, 1),
                "angle_label": "Knee angle",
                "feedback":    ["Step back — make sure full body is visible"],
                "form_ok":     False,
                "completed":   False,
            }

        # ── Phase detection ───────────────────────────────────────────────
        if knee_angle < self.PARALLEL_ANGLE and self.phase in ["idle", "up"]:
            self.phase = "down"
        elif knee_angle > self.STANDING_ANGLE and self.phase == "down":
            self.phase = "up"
            self.rep_count += 1
        elif knee_angle > self.STANDING_ANGLE and self.phase == "up":
            self.phase = "idle"

        # ── Form feedback ─────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        if self.phase == "idle":
            # User is just sitting or not in position
            if knee_angle < self.IDLE_THRESHOLD:
                feedback.append("Wrong position — stand up straight to begin")
                form_ok = False
            else:
                feedback.append("Stand tall — lower into a squat to begin")

        elif self.phase == "down":
            if knee_angle > self.TOO_SHALLOW:
                feedback.append("Go deeper — break parallel for a full squat")
                form_ok = False

            # Knee cave check
            l_cave = l_knee[0] < l_ankle[0] - 0.05
            r_cave = r_knee[0] > r_ankle[0] + 0.05
            if l_cave or r_cave:
                feedback.append("Knees caving in — push them out over toes")
                form_ok = False

            if form_ok:
                feedback.append("Good depth — drive through heels to stand")

        elif self.phase == "up":
            feedback.append("Rep done! Reset and go again")

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