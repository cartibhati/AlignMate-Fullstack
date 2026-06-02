# AlignMate/posture/exercises/plank.py
import time


class PlankAnalyzer:
    name       = "Plank"
    SET_SECS   = 30    # seconds per set
    TOTAL_SETS = 3

    def __init__(self, target_reps=3):
        # target_reps = number of sets
        self.total_sets   = target_reps
        self.sets_done    = 0
        self.hold_start   = None
        self.elapsed      = 0
        self.phase        = "idle"   # idle → holding → rest

    def update(self, landmarks: list) -> dict:
        def p(idx): return (landmarks[idx]["x"], landmarks[idx]["y"])

        l_shoulder = p(11); r_shoulder = p(12)
        l_hip      = p(23); r_hip      = p(24)
        l_ankle    = p(27); r_ankle    = p(28)

        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        avg_hip_y      = (l_hip[1]      + r_hip[1])      / 2
        avg_ankle_y    = (l_ankle[1]    + r_ankle[1])    / 2

        body_range  = abs(avg_ankle_y - avg_shoulder_y)
        in_position = body_range < 0.25

        feedback = []
        form_ok  = True
        now      = time.time()

        # ── State machine ─────────────────────────────────────────────────
        if self.phase == "idle":
            if in_position:
                self.phase      = "holding"
                self.hold_start = now
                self.elapsed    = 0
            else:
                feedback.append("Get into plank position to begin")

        elif self.phase == "holding":
            self.elapsed = now - self.hold_start

            # Form checks
            if body_range > 0:
                hip_ratio = (avg_hip_y - avg_shoulder_y) / body_range
                if hip_ratio > 0.55:
                    feedback.append("Hips dropping — squeeze your core!")
                    form_ok = False
                elif hip_ratio < 0.30:
                    feedback.append("Hips too high — lower them")
                    form_ok = False

            # Left position
            if not in_position:
                feedback.append("You broke position — get back in plank!")
                form_ok = False
                self.phase      = "idle"
                self.hold_start = None
            elif self.elapsed >= self.SET_SECS:
                # Set complete
                self.sets_done += 1
                self.phase      = "rest" if self.sets_done < self.total_sets else "done"
                self.hold_start = None
                self.elapsed    = self.SET_SECS
                feedback.append(f"Set {self.sets_done} done! Rest 10 seconds.")
            else:
                remaining = self.SET_SECS - self.elapsed
                if not feedback:
                    feedback.append(f"Hold it! {int(remaining)}s remaining")

        elif self.phase == "rest":
            feedback.append(f"Set {self.sets_done}/{self.total_sets} done. Rest, then get back in position.")
            if in_position:
                self.phase      = "holding"
                self.hold_start = now
                self.elapsed    = 0

        elif self.phase == "done":
            feedback.append("All sets complete! Great work!")

        return {
            "rep_count":    self.sets_done,
            "target":       self.total_sets,
            "phase":        self.phase,
            "angle":        round(self.elapsed, 1),
            "angle_label":  "Hold time (s)",
            "elapsed":      round(self.elapsed, 1),
            "set_target":   self.SET_SECS,
            "feedback":     feedback,
            "form_ok":      form_ok,
            "completed":    self.sets_done >= self.total_sets,
        }