import { useEffect, useRef, useReducer, useCallback } from "react";

const initialState = {
  duration: 0,
  isBadPosture: false,
};

function timerReducer(state, action) {
  switch (action.type) {
    case "TICK":
      return {
        duration: action.elapsed,
        isBadPosture: action.elapsed >= 3,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export default function usePostureTimer(status) {
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const [state, dispatch] = useReducer(timerReducer, initialState);

  useEffect(() => {
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status === "Needs Correction") {
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;

        dispatch({ type: "TICK", elapsed });
      }, 100);
    } else {
      startTimeRef.current = null;
      dispatch({ type: "RESET" }); // 🔥 important fix
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

 
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  return {
    duration: state.duration,
    isBadPosture: state.isBadPosture,
    reset, 
  };
}