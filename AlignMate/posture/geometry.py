import math
from collections import deque

def calculate_neck_angle(nose, left_shoulder, right_shoulder):
    # Shoulder midpoint
    mid_x = (left_shoulder[0] + right_shoulder[0]) / 2
    mid_y = (left_shoulder[1] + right_shoulder[1]) / 2

    # Vector from shoulders to nose
    vx = nose[0] - mid_x
    vy = nose[1] - mid_y

    # Magnitude of vector
    magnitude = math.sqrt(vx**2 + vy**2)
    if magnitude == 0:
        return 0.0

    # Dot product with vertical unit vector (0, -1)
    dot = -vy

    # Numerical safety
    cos_theta = dot / magnitude
    cos_theta = max(-1.0, min(1.0, cos_theta))

    angle_rad = math.acos(cos_theta)
    angle_deg = math.degrees(angle_rad)

    return angle_deg


def is_forward_head(angle, threshold=15):
    return angle > threshold


class NeckAngleSmoother:
    def __init__(self, window_size=10):
        self.window = deque(maxlen=window_size)

    def update(self, angle):
        self.window.append(angle)
        return sum(self.window) / len(self.window)
