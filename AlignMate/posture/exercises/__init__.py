# AlignMate/posture/exercises/__init__.py
from .squat          import SquatAnalyzer
from .pushup         import PushupAnalyzer
from .plank          import PlankAnalyzer
from .shoulder_press import ShoulderPressAnalyzer
from .deadlift       import DeadliftAnalyzer
from .lunge          import LungeAnalyzer
from .bicep_curl     import BicepCurlAnalyzer
from .lateral_raise  import LateralRaiseAnalyzer
from .hip_thrust     import HipThrustAnalyzer
from .bench_press    import BenchPressAnalyzer
from .barbell_row    import BarbellRowAnalyzer
from .tricep_dip     import TricepDipAnalyzer
from .face_pulls      import FacePullsAnalyzer

EXERCISE_MAP = {
    "squat":          SquatAnalyzer,
    "pushup":         PushupAnalyzer,
    "plank":          PlankAnalyzer,
    "shoulder_press": ShoulderPressAnalyzer,
    "deadlift":       DeadliftAnalyzer,
    "lunge":          LungeAnalyzer,
    "bicep_curl":     BicepCurlAnalyzer,
    "lateral_raise":  LateralRaiseAnalyzer,
    "hip_thrust":     HipThrustAnalyzer,
    "bench_press":    BenchPressAnalyzer,
    "barbell_row":    BarbellRowAnalyzer,
    "tricep_dip":     TricepDipAnalyzer,
    "face_pulls":     FacePullsAnalyzer,
}