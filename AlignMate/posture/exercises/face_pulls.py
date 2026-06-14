# AlignMate/posture/exercises/face_pulls.py
from .utils import angle_between

class FacePullsAnalyzer:
    name = "Face Pulls"

    PULL_ANGLE    = 100   # Elbows bent, rope pulled to face
    EXTEND_ANGLE  = 145   # Arms extended straight towards pulley

    def __init__(self, target_reps=12):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); l_elbow = p(13); l_wrist = p(15)
        r_shoulder = p(12); r_elbow = p(14); r_wrist = p(16)

        # Select side with higher average visibility (left vs right)
        l_vis = (landmarks[11].get("visibility", 1) + landmarks[13].get("visibility", 1) + landmarks[15].get("visibility", 1)) / 3
        r_vis = (landmarks[12].get("visibility", 1) + landmarks[14].get("visibility", 1) + landmarks[16].get("visibility", 1)) / 3

        if l_vis > r_vis:
            elbow_angle = angle_between(l_shoulder, l_elbow, l_wrist)
            active_elbow = l_elbow
            active_shoulder = l_shoulder
            avg_vis = l_vis
        else:
            elbow_angle = angle_between(r_shoulder, r_elbow, r_wrist)
            active_elbow = r_elbow
            active_shoulder = r_shoulder
            avg_vis = r_vis

        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(elbow_angle, 1),
                "angle_label": "Elbow angle",
                "feedback": ["Face the camera — upper body must be visible"],
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

        # Check if elbows are high (Y coordinate of elbow should be close to or higher than shoulder coordinate)
        # Note: in MediaPipe, smaller Y is higher on the screen.
        # If elbow Y is significantly larger than shoulder Y (i.e. elbow is lower), the user is dropping their elbows.
        if active_elbow[1] > active_shoulder[1] + 0.08:
            feedback.append("Keep your elbows high — level with shoulders")
            form_ok = False

        if self.phase == "idle":
            if elbow_angle < self.EXTEND_ANGLE:
                feedback.append("Extend your arms straight to start")
                form_ok = False
            else:
                feedback.append("Ready — pull the rope towards your face!")
        elif self.phase == "down":
            if elbow_angle < self.EXTEND_ANGLE - 15:
                feedback.append("Extend fully for maximum rear delt stretch")
                form_ok = False
            elif form_ok:
                feedback.append("Good extension — pull back again")
        elif self.phase == "up":
            if elbow_angle > self.PULL_ANGLE + 15:
                feedback.append("Pull further back towards your ears")
                form_ok = False
            elif form_ok:
                feedback.append("Great pull! Squeeze your upper back and rear delts")

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
