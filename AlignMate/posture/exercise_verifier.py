"""
Exercise verification logic
Phase 6.4 – Shoulder Roll Verification (calibrated)
"""

class ShoulderRollVerifier:
    def __init__(self, target_reps=5):
        self.target_reps = target_reps
        self.rep_count = 0

        self.prev_avg_y = None
        self.phase = "idle"  # idle → up → down

    def update(self, left_shoulder, right_shoulder):
        """
        Called every frame.
        Returns True when target reps are completed.
        """

        # Dono shoulders ka average Y (noise kam karne ke liye)
        avg_y = (left_shoulder[1] + right_shoulder[1]) / 2

        # First frame initialization
        if self.prev_avg_y is None:
            self.prev_avg_y = avg_y
            return False

        # Movement detection
        movement = avg_y - self.prev_avg_y

        # 🔥 CALIBRATED THRESHOLDS (important)
        UP_THRESHOLD = -0.015    # shoulders going up
        DOWN_THRESHOLD = 0.015   # shoulders going down

        # Phase: shoulders moving UP
        if movement < UP_THRESHOLD and self.phase in ["idle", "down"]:
            self.phase = "up"

        # Phase: shoulders moving DOWN → count rep
        elif movement > DOWN_THRESHOLD and self.phase == "up":
            self.phase = "down"
            self.rep_count += 1

        self.prev_avg_y = avg_y

        # Completion check
        return self.rep_count >= self.target_reps
