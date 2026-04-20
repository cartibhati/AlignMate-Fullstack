"""
Exercise recommendation module for AlignMate
Phase 6.1 – Corrective mapping
"""

def get_corrective_exercise(neck_issue: bool, shoulder_issue: bool):
    """
    Decide which corrective exercise to suggest
    based on detected posture issues.
    """

    # Jab neck aur shoulder dono issue ho
    if neck_issue and shoulder_issue:
        return {
            "name": "Posture Reset",
            "instruction": "Stand up straight, roll shoulders back, align head",
            "duration": 20
        }

    # Sirf neck ka issue
    if neck_issue:
        return {
            "name": "Neck Side Stretch",
            "instruction": "Tilt head to each side, hold 15s",
            "duration": 30
        }

    # Sirf shoulder ka issue
    if shoulder_issue:
        return {
            "name": "Shoulder Rolls",
            "instruction": "Roll shoulders back slowly 10 times",
            "duration": 20
        }

    # Agar koi issue nahi
    return None
