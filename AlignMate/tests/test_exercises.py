# AlignMate/tests/test_exercises.py
import pytest
from posture.exercises.face_pulls import FacePullsAnalyzer

def test_face_pulls_analyzer_flow():
    # Target 3 reps
    analyzer = FacePullsAnalyzer(target_reps=3)
    assert analyzer.name == "Face Pulls"
    assert analyzer.rep_count == 0
    assert analyzer.phase == "idle"

    # Helper to create mock landmarks
    # landmarks indices: 11 is L Shoulder, 13 is L Elbow, 15 is L Wrist
    # 12 is R Shoulder, 14 is R Elbow, 16 is R Wrist
    def make_landmarks(l_sh_x, l_sh_y, l_el_x, l_el_y, l_wr_x, l_wr_y):
        lms = [
            {"x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.9} for _ in range(33)
        ]
        # Left side
        lms[11] = {"x": l_sh_x, "y": l_sh_y, "z": 0.0, "visibility": 0.9}
        lms[13] = {"x": l_el_x, "y": l_el_y, "z": 0.0, "visibility": 0.9}
        lms[15] = {"x": l_wr_x, "y": l_wr_y, "z": 0.0, "visibility": 0.9}
        # Right side with low visibility to ensure left is chosen
        lms[12] = {"x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.1}
        lms[14] = {"x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.1}
        lms[16] = {"x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.1}
        return lms

    # 1. Starting position: Arms extended straight forward towards pulley
    # Shoulder = (0.5, 0.4), Elbow = (0.4, 0.4), Wrist = (0.2, 0.4)
    # The angle at Elbow (Shoulder-Elbow-Wrist) is 180 degrees.
    lms_start = make_landmarks(0.5, 0.4, 0.4, 0.4, 0.2, 0.4)
    res = analyzer.update(lms_start)
    assert res["rep_count"] == 0
    assert res["phase"] in ["idle", "down"]

    # 2. Pulling position: Elbows bent, rope pulled back to face
    # Shoulder = (0.5, 0.4), Elbow = (0.4, 0.35), Wrist = (0.45, 0.45)
    # This forms a smaller angle. Let's form an ~90 degree angle.
    # Shoulder = (0.5, 0.4), Elbow = (0.4, 0.4), Wrist = (0.4, 0.5) => 90 deg
    lms_pull = make_landmarks(0.5, 0.4, 0.4, 0.4, 0.4, 0.5)
    res = analyzer.update(lms_pull)
    assert res["rep_count"] == 1
    assert res["phase"] == "up"
    assert res["form_ok"] is True

    # 3. Extend again
    lms_extend = make_landmarks(0.5, 0.4, 0.4, 0.4, 0.2, 0.4)
    res = analyzer.update(lms_extend)
    assert res["rep_count"] == 1
    assert res["phase"] == "down"

    # 4. Pull again, but with sagging elbows
    # Elbow Y is significantly larger than shoulder Y (i.e. elbow is lower)
    # Active Shoulder = (0.5, 0.4), Active Elbow = (0.4, 0.6) -> elbow Y is 0.6, which is > 0.4 + 0.08
    lms_sag = make_landmarks(0.5, 0.4, 0.4, 0.6, 0.4, 0.7)
    res = analyzer.update(lms_sag)
    assert res["form_ok"] is False
    assert any("elbows high" in f.lower() for f in res["feedback"])
