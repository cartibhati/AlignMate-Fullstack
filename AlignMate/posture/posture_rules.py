def is_lateral_neck_tilt(angle, threshold=15):
    return angle > threshold

# def is_body_rotated(left_shoulder, right_shoulder, tolerance=0.08):
#     """
#     Returns True if body is rotated too much relative to camera.
#     Uses x-coordinate symmetry of shoulders.
#     """
#     return abs(left_shoulder[0] - right_shoulder[0]) > tolerance

def can_detect_forward_head(view="front"):
    return view == "side"


def is_shoulder_imbalanced(left_shoulder, right_shoulder, threshold=0.03):
    """
    Detects shoulder slouching / imbalance using vertical difference.
    Returns True if shoulders are not level.
    """
    y_left = left_shoulder[1]
    y_right = right_shoulder[1]

    shoulder_diff = abs(y_left - y_right)

    return shoulder_diff > threshold
