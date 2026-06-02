# AlignMate/posture/exercises/lateral_raise.py


class LateralRaiseAnalyzer:
    name = "Lateral Raise"

    # Wrist Y relative to shoulder Y
    # In MediaPipe, Y increases downward
    # Raised = wrist Y < shoulder Y (wrist above shoulder)
    RAISED_THRESH  = -0.05   # wrist 5% above shoulder = raised
    LOWERED_THRESH =  0.08   # wrist below shoulder = lowered

    def __init__(self, target_reps=12):
        self.target_reps = target_reps
        self.rep_count   = 0
        self.phase       = "idle"

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); l_elbow = p(13); l_wrist = p(15)
        r_shoulder = p(12); r_elbow = p(14); r_wrist = p(16)

        # Wrist height relative to shoulder (negative = above shoulder)
        l_diff = l_wrist[1] - l_shoulder[1]
        r_diff = r_wrist[1] - r_shoulder[1]
        avg_diff = (l_diff + r_diff) / 2

        # ── Visibility ────────────────────────────────────────────────────
        key_lms = [landmarks[11], landmarks[13], landmarks[15],
                   landmarks[12], landmarks[14], landmarks[16]]
        avg_vis = sum(lm.get("visibility", 1) for lm in key_lms) / len(key_lms)
        if avg_vis < 0.5:
            return {
                "rep_count": self.rep_count, "target": self.target_reps,
                "phase": "idle", "angle": round(avg_diff * 100, 1),
                "angle_label": "Wrist height",
                "feedback": ["Face the camera — arms need to be visible"],
                "form_ok": False, "completed": False,
            }

        # ── Phase detection ───────────────────────────────────────────────
        if avg_diff < self.RAISED_THRESH and self.phase in ["idle", "down"]:
            self.phase = "up"
            self.rep_count += 1
        elif avg_diff > self.LOWERED_THRESH and self.phase == "up":
            self.phase = "down"

        # ── Form feedback ─────────────────────────────────────────────────
        feedback = []
        form_ok  = True

        # Elbow should be slightly bent (not fully locked)
        # Check: elbow Y should be between shoulder Y and wrist Y
        l_elbow_between = min(l_shoulder[1], l_wrist[1]) < l_elbow[1] < max(l_shoulder[1], l_wrist[1])
        r_elbow_between = min(r_shoulder[1], r_wrist[1]) < r_elbow[1] < max(r_shoulder[1], r_wrist[1])

        if self.phase == "idle":
            if avg_diff < 0:
                feedback.append("Lower arms fully to begin")
                form_ok = False
            else:
                feedback.append("Arms at sides — raise to shoulder height")

        elif self.phase == "up":
            # Wrists should not go too far above shoulders
            if avg_diff < -0.15:
                feedback.append("Too high — stop at shoulder level")
                form_ok = False
            elif not (l_elbow_between or r_elbow_between):
                feedback.append("Keep a slight bend in elbows — don't lock out")
                form_ok = False
            elif form_ok:
                feedback.append("Good height! Lower with control")

        elif self.phase == "down":
            if avg_diff > self.LOWERED_THRESH + 0.05:
                feedback.append("Lower fully before the next rep")
                form_ok = False
            elif form_ok:
                feedback.append("Full range — raise again!")

        return {
            "rep_count":   self.rep_count,
            "target":      self.target_reps,
            "phase":       self.phase,
            "angle":       round(avg_diff * 100, 1),
            "angle_label": "Wrist vs Shoulder (cm)",
            "feedback":    feedback,
            "form_ok":     form_ok,
            "completed":   self.rep_count >= self.target_reps,
        }