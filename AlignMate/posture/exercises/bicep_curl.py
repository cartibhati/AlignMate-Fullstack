# AlignMate/posture/exercises/bicep_curl.py
from .utils import angle_between

class BicepCurlAnalyzer:
    name = "Bicep Curl"

    UP_ANGLE       = 45
    DOWN_ANGLE     = 145

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
            avg_angle = angle_between(l_shoulder, l_elbow, l_wrist)
            avg_vis = l_vis
        else:
            avg_angle = angle_between(r_shoulder, r_elbow, r_wrist)
            avg_vis = r_vis

        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(avg_angle, 1),
                "angle_label": "Elbow angle",
                "feedback": ["Face the camera — arms must be visible"],
                "form_ok": False, "completed": False,
            }

        # Phase detection
        if avg_angle < self.UP_ANGLE and self.phase in ["idle", "down"]:
            self.phase = "up"
            self.rep_count += 1
        elif avg_angle > self.DOWN_ANGLE and self.phase == "up":
            self.phase = "down"

        feedback = []
        form_ok  = True

        if self.phase == "idle":
            if avg_angle < self.DOWN_ANGLE:
                feedback.append("Extend your arms fully to begin")
                form_ok = False
            else:
                feedback.append("Ready — curl the weight up!")
        elif self.phase == "up":
            if avg_angle > self.UP_ANGLE + 15:
                feedback.append("Squeeze your biceps — bring the weight higher")
                form_ok = False
            else:
                feedback.append("Nice squeeze! Lower slowly")
        elif self.phase == "down":
            if avg_angle < self.DOWN_ANGLE - 15:
                feedback.append("Extend fully for maximum range of motion")
                form_ok = False
            else:
                feedback.append("Full extension. Curl again!")

        return {
            "rep_count":   self.rep_count,
            "target":      self.target_reps,
            "phase":       self.phase,
            "angle":       round(avg_angle, 1),
            "angle_label": "Elbow angle",
            "feedback":    feedback,
            "form_ok":     form_ok,
            "completed":   self.rep_count >= self.target_reps,
        }
