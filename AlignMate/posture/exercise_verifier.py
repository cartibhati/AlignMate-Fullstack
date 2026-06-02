"""
Exercise verification logic
Phase 6.4 – Shoulder Roll Verification (calibrated)
"""

class ShoulderRollVerifier:
    def __init__(self, target_reps=5):
        self.target_reps = target_reps
        self.rep_count = 0

        self.start_y = None
        self.phase = "down"  # Start in down phase, waiting for shoulders to go up

    def update(self, left_shoulder, right_shoulder):
        """
        Called every frame.
        Returns True when target reps are completed.
        """
        # Average Y of both shoulders to reduce noise
        avg_y = (left_shoulder[1] + right_shoulder[1]) / 2

        # First frame initialization
        if self.start_y is None:
            self.start_y = avg_y
            return False

        # In MediaPipe, Y is 0 at top, 1 at bottom.
        # So "shoulders UP" means avg_y decreases (smaller value).
        # We calculate the upward movement height relative to the initial/rest position.
        upward_movement = self.start_y - avg_y

        # Stable, robust calibrated thresholds (fraction of screen height)
        UP_THRESHOLD = 0.035     # shoulders lifted by 3.5% of frame height
        DOWN_THRESHOLD = 0.015   # shoulders returned to near rest position

        if self.phase == "down":
            if upward_movement > UP_THRESHOLD:
                self.phase = "up"
        elif self.phase == "up":
            if upward_movement < DOWN_THRESHOLD:
                self.phase = "down"
                self.rep_count += 1

        # Return True when target reps are met
        return self.rep_count >= self.target_reps

