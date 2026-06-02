# AlignMate/posture/mode_config.py

MODE_CONFIG = {
    "student": {
        "bad_posture_threshold":  0.6,
        "good_posture_threshold": 0.45,
        "drift_duration":         5,    # seconds before "drifting" warning
        "min_bad_duration":       15,   # seconds before "bad" alert
        "target_shoulder_reps":   5,
        "exercises": ["shoulder_rolls"],
        "alert_message":          "Sit straight! Your back will thank you.",
        "description":            "Optimized for desk/study sessions",
    },

    "athlete": {
        "bad_posture_threshold":  0.55,  # stricter — athletes need precision
        "good_posture_threshold": 0.40,
        "drift_duration":         3,     # faster warning
        "min_bad_duration":       10,    # faster bad alert
        "target_shoulder_reps":   8,     # more reps
        "exercises": ["shoulder_rolls", "squat", "deadlift"],
        "alert_message":          "Fix your form! Posture affects performance.",
        "description":            "Optimized for training & performance",
    },

    "both": {
        # Uses athlete thresholds (stricter) but student-friendly messaging
        "bad_posture_threshold":  0.55,
        "good_posture_threshold": 0.40,
        "drift_duration":         4,
        "min_bad_duration":       12,
        "target_shoulder_reps":   6,
        "exercises": ["shoulder_rolls", "squat", "deadlift"],
        "alert_message":          "Posture check — straighten up!",
        "description":            "Full access: study + athletic modes",
    },
}


def get_config(mode: str) -> dict:
    """Returns config for the given mode. Defaults to 'student'."""
    return MODE_CONFIG.get(mode, MODE_CONFIG["student"])