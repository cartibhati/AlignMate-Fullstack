# AlignMate/posture/exercise_mapper.py
"""
Maps AI-generated exercise names (e.g. "Barbell Bench Press")
to our internal exercise IDs (e.g. "bench_press").
Uses keyword matching — no external libraries needed.
"""

# ── Keyword → exercise ID mapping ────────────────────────────────────────────
KEYWORD_MAP = {
    # Bench / Chest press variations
    "bench":           "bench_press",
    "chest press":     "bench_press",
    "incline press":   "bench_press",
    "decline press":   "bench_press",
    "dumbbell press":  "bench_press",
    "db press":        "bench_press",

    # Squat variations
    "squat":           "squat",
    "goblet":          "squat",
    "front squat":     "squat",
    "back squat":      "squat",
    "leg press":       "squat",
    "box squat":       "squat",

    # Deadlift variations
    "deadlift":        "deadlift",
    "romanian":        "deadlift",
    "rdl":             "deadlift",
    "stiff leg":       "deadlift",
    "sumo":            "deadlift",

    # Row variations
    "row":             "barbell_row",
    "bent over":       "barbell_row",
    "cable row":       "barbell_row",
    "dumbbell row":    "barbell_row",
    "t-bar":           "barbell_row",

    # Shoulder press variations
    "overhead press":  "shoulder_press",
    "shoulder press":  "shoulder_press",
    "military press":  "shoulder_press",
    "ohp":             "shoulder_press",
    "arnold":          "shoulder_press",

    # Pushup variations
    "push-up":         "pushup",
    "push up":         "pushup",
    "pushup":          "pushup",
    "chest fly":       "pushup",

    # Lunge variations
    "lunge":           "lunge",
    "split squat":     "lunge",
    "bulgarian":       "lunge",
    "step up":         "lunge",

    # Plank / core
    "plank":           "plank",
    "hollow hold":     "plank",
    "dead bug":        "plank",
    "core":            "plank",

    # Bicep variations
    "curl":            "bicep_curl",
    "bicep":           "bicep_curl",
    "hammer curl":     "bicep_curl",
    "preacher":        "bicep_curl",
    "concentration":   "bicep_curl",

    # Lateral raise variations
    "lateral":         "lateral_raise",
    "side raise":      "lateral_raise",
    "cable lateral":   "lateral_raise",

    # Tricep variations
    "dip":             "tricep_dip",
    "tricep":          "tricep_dip",
    "skull crusher":   "tricep_dip",
    "triceps":         "tricep_dip",
    "pushdown":        "tricep_dip",
    "extension":       "tricep_dip",

    # Hip thrust variations
    "hip thrust":      "hip_thrust",
    "glute bridge":    "hip_thrust",
    "hip bridge":      "hip_thrust",
    "barbell hip":     "hip_thrust",
}


def map_exercise_name(name: str) -> str | None:
    """
    Given an AI-generated exercise name, returns the internal exercise ID.
    Returns None if no match found.

    Example:
        map_exercise_name("Barbell Bench Press") → "bench_press"
        map_exercise_name("Romanian Deadlift")   → "deadlift"
        map_exercise_name("Zottman Curl")         → "bicep_curl"
    """
    lower = name.lower().strip()

    # Direct keyword scan — longest match wins
    best_match = None
    best_len   = 0

    for keyword, exercise_id in KEYWORD_MAP.items():
        if keyword in lower and len(keyword) > best_len:
            best_match = exercise_id
            best_len   = len(keyword)

    return best_match