# AlignMate/posture/exercises/utils.py
import math

def angle_between(a, b, c):
    """
    Calculate angle at point B formed by A-B-C.
    Points are (x, y) tuples.
    Returns angle in degrees.
    """
    ax, ay = a[0] - b[0], a[1] - b[1]
    cx, cy = c[0] - b[0], c[1] - b[1]

    dot     = ax * cx + ay * cy
    mag_a   = math.sqrt(ax**2 + ay**2)
    mag_c   = math.sqrt(cx**2 + cy**2)

    if mag_a * mag_c == 0:
        return 0.0

    cos_val = max(-1.0, min(1.0, dot / (mag_a * mag_c)))
    return math.degrees(math.acos(cos_val))