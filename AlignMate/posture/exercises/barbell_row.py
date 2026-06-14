# AlignMate/posture/exercises/barbell_row.py
from .utils import angle_between


class BarbellRowAnalyzer:
    name = "Barbell Row"

    PULL_ANGLE    = 80    # elbows pulled back = row position
    EXTEND_ANGLE  = 140   # arms extended = starting position
    HINGE_ANGLE   = 130   # hip angle — should stay hinged throughout

    def __init__(self, target_reps=10):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); l_elbow = p(13); l_wrist = p(15)
        r_shoulder = p(12); r_elbow = p(14); r_wrist = p(16)
        l_hip      = p(23); r_hip   = p(24)
        l_knee     = p(25); r_knee  = p(26)

        # Select side with higher average visibility (left vs right)
        l_vis = (landmarks[11].get("visibility", 1) + landmarks[13].get("visibility", 1) + landmarks[23].get("visibility", 1) + landmarks[25].get("visibility", 1)) / 4
        r_vis = (landmarks[12].get("visibility", 1) + landmarks[14].get("visibility", 1) + landmarks[24].get("visibility", 1) + landmarks[26].get("visibility", 1)) / 4

        if l_vis > r_vis:
            elbow_angle = angle_between(l_shoulder, l_elbow, l_wrist)
            hip_angle = angle_between(l_shoulder, l_hip, l_knee)
            avg_vis = l_vis
        else:
            elbow_angle = angle_between(r_shoulder, r_elbow, r_wrist)
            hip_angle = angle_between(r_shoulder, r_hip, r_knee)
            avg_vis = r_vis

        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(elbow_angle, 1),
                "angle_label": "Elbow angle",
                "feedback": ["Side view needed — full body must be visible"],
                "form_ok": False, "completed": False,
            }

        # ── Phase detection ───────────────────────────────────────────────
        if elbow_angle < self.PULL_ANGLE and self.phase in ["idle", "down"]:
            self.phase = "up"
            self.rep_count += 1
        elif elbow_angle > self.EXTEND_ANGLE and self.phase == "up":
            self.phase = "down"

        # ── Form checks ───────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        # Hip hinge — must stay bent throughout
        if hip_angle > self.HINGE_ANGLE + 20 and self.phase != "idle":
            feedback.append("Don't stand up — hinge at hips, keep back flat")
            form_ok = False

        if self.phase == "idle":
            feedback.append("Hinge at hips 45°, soft knees — arms hanging down")

        elif self.phase == "down":
            if elbow_angle < self.EXTEND_ANGLE - 20:
                feedback.append("Extend arms fully — full stretch at bottom")
                form_ok = False
            elif form_ok:
                feedback.append("Good stretch — pull elbows back past torso")

        elif self.phase == "up":
            if elbow_angle > self.PULL_ANGLE + 20:
                feedback.append("Pull higher — elbows behind your back")
                form_ok = False
            elif form_ok:
                feedback.append("Strong pull! Squeeze shoulder blades together")

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