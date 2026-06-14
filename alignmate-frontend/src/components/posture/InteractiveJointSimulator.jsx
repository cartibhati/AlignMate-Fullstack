import { useEffect, useRef, useState } from "react";
import { Rotate3d, Play, Pause, Compass } from "lucide-react";

// Rotation matrices helper
function rotateX(y, z, angle) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [y * cos - z * sin, y * sin + z * cos];
}

function rotateY(x, z, angle) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [x * cos + z * sin, -x * sin + z * cos];
}

function rotateZ(x, y, angle) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [x * cos - y * sin, x * sin + y * cos];
}

export default function InteractiveJointSimulator({ exerciseId = "squat" }) {
  const canvasRef = useRef(null);
  
  // 3D angles
  const [yaw, setYaw] = useState(45);   // horizontal
  const [pitch, setPitch] = useState(15); // vertical
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Dragging state
  const dragStartRef = useRef(null);
  const anglesRef = useRef({ yaw: 45, pitch: 15 });

  useEffect(() => {
    anglesRef.current = { yaw, pitch };
  }, [yaw, pitch]);

  // Handle Dragging
  const handleMouseDown = (e) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, yaw: anglesRef.current.yaw, pitch: anglesRef.current.pitch };
  };

  const handleMouseMove = (e) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setYaw((dragStartRef.current.yaw - dx * 0.7) % 360);
    setPitch(Math.max(-75, Math.min(75, dragStartRef.current.pitch + dy * 0.7)));
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  useEffect(() => {
    console.log("Simulator useEffect run:", { exerciseId, isPlaying });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let animId = null;
    let time = 0;
    let frameCount = 0;

    // Define 3D Base Human Joint Positions
    // Coordinates: X (left/right, -50 to 50), Y (up/down, -70 to 70), Z (depth, -50 to 50)
    const baseJoints = {
      head:      [0, -60, 0],
      neck:      [0, -48, 0],
      spineMid:  [0, -10, 0],
      pelvis:    [0, 15, 0],
      
      lShoulder: [-18, -45, 0],
      rShoulder: [18, -45, 0],
      lElbow:    [-25, -20, 0],
      rElbow:    [25, -20, 0],
      lWrist:    [-28, 5, 0],
      rWrist:    [28, 5, 0],
      
      lHip:      [-12, 18, 0],
      rHip:      [12, 18, 0],
      lKnee:     [-14, 45, 0],
      rKnee:     [14, 45, 0],
      lAnkle:    [-15, 75, 0],
      rAnkle:    [15, 75, 0],
    };

    const runLoop = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update animation phase (0 to 1 back and forth)
      if (isPlaying) {
        time += 0.035;
      }
      const phase = (Math.sin(time) + 1) / 2; // 0 (start) to 1 (full extension/contraction)
      

      // Calculate dynamic joint transformations based on exercise type
      const joints = JSON.parse(JSON.stringify(baseJoints));
      let highlightAngleJoint = null;
      let angleText = "";

      // Clean base exercise key to match animations
      const key = exerciseId;
      
      if (key === "squat") {
        // Squat: hips lower, knees bend, torso leans slightly forward
        const bend = phase * 32;
        // Pelvis lowers
        joints.pelvis[1] += bend;
        joints.lHip[1]   += bend;
        joints.rHip[1]   += bend;
        
        // Spine/Shoulders lower and lean slightly forward (Z offset)
        joints.spineMid[1] += bend * 0.7;
        joints.spineMid[2] -= bend * 0.2;
        joints.neck[1]     += bend * 0.5;
        joints.neck[2]     -= bend * 0.4;
        joints.head[1]     += bend * 0.45;
        joints.head[2]     -= bend * 0.45;
        joints.lShoulder[1] += bend * 0.5;
        joints.lShoulder[2] -= bend * 0.4;
        joints.rShoulder[1] += bend * 0.5;
        joints.rShoulder[2] -= bend * 0.4;
        
        // Knees go slightly forward
        joints.lKnee[1] += bend * 0.4;
        joints.lKnee[2] += bend * 0.6;
        joints.rKnee[1] += bend * 0.4;
        joints.rKnee[2] += bend * 0.6;
        
        // Arms extend forward for balance
        joints.lElbow[1] -= bend * 0.2;
        joints.lElbow[2] += bend * 0.7;
        joints.lWrist[1] -= bend * 0.25;
        joints.lWrist[2] += bend * 1.2;
        
        joints.rElbow[1] += bend * 0.2;
        joints.rElbow[2] += bend * 0.7;
        joints.rWrist[1] += bend * 0.25;
        joints.rWrist[2] += bend * 1.2;

        highlightAngleJoint = "lKnee";
        angleText = `Knee angle: ${Math.round(180 - phase * 90)}°`;
      } 
      else if (key === "pushup" || key === "plank") {
        // Horizontal orientation: rotate body 80 degrees forward
        const isPlank = key === "plank";
        const bodyBend = isPlank ? 0 : phase * 18;
        
        // Tilt whole body to be horizontal
        Object.keys(joints).forEach(j => {
          const [x, y, z] = joints[j];
          // Rotate body 80 degrees about X axis to lie flat
          const rad = (80 * Math.PI) / 180;
          joints[j][1] = y * Math.cos(rad) - z * Math.sin(rad);
          joints[j][2] = y * Math.sin(rad) + z * Math.cos(rad);
        });

        if (!isPlank) {
          // Pushup movement: upper body rises and falls relative to wrists and ankles
          // Lower shoulders, neck, head, spine, pelvis
          const depth = bodyBend;
          joints.head[1]      += depth * 0.8;
          joints.neck[1]      += depth * 0.8;
          joints.lShoulder[1] += depth * 0.7;
          joints.rShoulder[1] += depth * 0.7;
          joints.spineMid[1]  += depth * 0.45;
          joints.pelvis[1]    += depth * 0.25;
          joints.lHip[1]      += depth * 0.25;
          joints.rHip[1]      += depth * 0.25;
          joints.lElbow[2]    += depth * 0.5; // elbows flare out
          joints.rElbow[2]    -= depth * 0.5;
          
          highlightAngleJoint = "lElbow";
          angleText = `Elbow angle: ${Math.round(160 - phase * 95)}°`;
        } else {
          highlightAngleJoint = "spineMid";
          angleText = "Spine Alignment: 180°";
        }
      }
      else if (key === "bicep_curl" || key === "biceps") {
        // Bicep Curl: Elbows fixed at sides, forearms rotate up
        const bendRad = phase * 125 * Math.PI / 180;
        
        // Left arm curl
        const lShoulderToElbowY = joints.lElbow[1] - joints.lShoulder[1];
        joints.lWrist[1] = joints.lElbow[1] + lShoulderToElbowY * Math.sin(bendRad) * 0.5;
        joints.lWrist[2] = joints.lElbow[2] + lShoulderToElbowY * (1 - Math.cos(bendRad));
        joints.lWrist[1] -= 5 * phase; // pull closer to shoulder
        joints.lWrist[1] = joints.lElbow[1] + (joints.lWrist[1] - joints.lElbow[1]) * Math.cos(bendRad * 0.1);
        
        // Right arm curl
        const rShoulderToElbowY = joints.rElbow[1] - joints.rShoulder[1];
        joints.rWrist[1] = joints.rElbow[1] - rShoulderToElbowY * Math.sin(bendRad) * 0.5;
        joints.rWrist[2] = joints.rElbow[2] + rShoulderToElbowY * (1 - Math.cos(bendRad));
        joints.rWrist[1] += 5 * phase;

        highlightAngleJoint = "lElbow";
        angleText = `Elbow flexion: ${Math.round(170 - phase * 130)}°`;
      }
      else if (key === "shoulder_press" || key === "arnold") {
        // Press: arms push overhead from shoulder height
        const pressDist = phase * 50;
        
        // Starting arm position (shoulders level)
        // Set joints to initial folded press state
        joints.lElbow[0] = joints.lShoulder[0] - 5;
        joints.lElbow[1] = joints.lShoulder[1] + 10;
        joints.rElbow[0] = joints.rShoulder[0] + 5;
        joints.rElbow[1] = joints.rShoulder[1] + 10;
        
        joints.lWrist[0] = joints.lShoulder[0] - 5;
        joints.lWrist[1] = joints.lShoulder[1] - 8;
        joints.rWrist[0] = joints.rShoulder[0] + 5;
        joints.rWrist[1] = joints.rShoulder[1] - 8;
        
        // Apply upward extension
        joints.lElbow[1] -= pressDist * 0.6;
        joints.lElbow[0] -= pressDist * 0.15;
        joints.lWrist[1] -= pressDist * 1.1;
        joints.lWrist[0] += pressDist * 0.1;
        
        joints.rElbow[1] -= pressDist * 0.6;
        joints.rElbow[0] += pressDist * 0.15;
        joints.rWrist[1] -= pressDist * 1.1;
        joints.rWrist[0] -= pressDist * 0.1;

        highlightAngleJoint = "lShoulder";
        angleText = `Extension: ${Math.round(45 + phase * 135)}°`;
      }
      else if (key === "lateral_raise") {
        // Raise arms out to the side
        const angle = phase * 85 * Math.PI / 180;
        
        joints.lElbow[0] = joints.lShoulder[0] - 30 * Math.cos(angle);
        joints.lElbow[1] = joints.lShoulder[1] - 30 * Math.sin(angle);
        joints.lWrist[0] = joints.lShoulder[0] - 60 * Math.cos(angle);
        joints.lWrist[1] = joints.lShoulder[1] - 60 * Math.sin(angle);
        
        joints.rElbow[0] = joints.rShoulder[0] + 30 * Math.cos(angle);
        joints.rElbow[1] = joints.rShoulder[1] - 30 * Math.sin(angle);
        joints.rWrist[0] = joints.rShoulder[0] + 60 * Math.cos(angle);
        joints.rWrist[1] = joints.rShoulder[1] - 60 * Math.sin(angle);

        highlightAngleJoint = "lShoulder";
        angleText = `Abduction: ${Math.round(10 + phase * 85)}°`;
      }
      else if (key === "deadlift") {
        // Hinge at hips, bend knees slightly, lower back straight
        const hinge = phase * 40;
        
        // Pelvis pushes backward
        joints.pelvis[2] -= hinge * 0.5;
        joints.lHip[2]   -= hinge * 0.5;
        joints.rHip[2]   -= hinge * 0.5;
        
        // Knees bend slightly
        joints.lKnee[1] -= hinge * 0.15;
        joints.lKnee[2] -= hinge * 0.1;
        joints.rKnee[1] -= hinge * 0.15;
        joints.rKnee[2] -= hinge * 0.1;
        
        // Torso hinges forward
        joints.spineMid[1] += hinge * 0.4;
        joints.spineMid[2] += hinge * 0.4;
        joints.neck[1]     += hinge * 0.8;
        joints.neck[2]     += hinge * 0.8;
        joints.head[1]     += hinge * 0.95;
        joints.head[2]     += hinge * 0.95;
        
        joints.lShoulder[1] += hinge * 0.8;
        joints.lShoulder[2] += hinge * 0.8;
        joints.rShoulder[1] += hinge * 0.8;
        joints.rShoulder[2] += hinge * 0.8;
        
        // Arms hang straight down
        joints.lElbow[1] += hinge * 0.8;
        joints.lElbow[2] += hinge * 0.8;
        joints.lWrist[1] += hinge * 0.8;
        joints.lWrist[2] += hinge * 0.8;
        
        joints.rElbow[1] += hinge * 0.8;
        joints.rElbow[2] += hinge * 0.8;
        joints.rWrist[1] += hinge * 0.8;
        joints.rWrist[2] += hinge * 0.8;

        highlightAngleJoint = "lHip";
        angleText = `Hip Hinge: ${Math.round(180 - phase * 85)}°`;
      }
      else if (key === "lunge") {
        // Front knee bends 90 deg, back knee drops towards floor
        const drop = phase * 40;
        
        // Pelvis lowers
        joints.pelvis[1] += drop;
        joints.lHip[1]   += drop;
        joints.rHip[1]   += drop;
        
        joints.spineMid[1] += drop;
        joints.neck[1]     += drop;
        joints.head[1]     += drop;
        joints.lShoulder[1] += drop;
        joints.rShoulder[1] += drop;
        joints.lElbow[1]    += drop;
        joints.rElbow[1]    += drop;
        joints.lWrist[1]    += drop;
        joints.rWrist[1]    += drop;
        
        // Left leg (front): hip and knee move forward and bend
        joints.lHip[2]  += drop * 0.5;
        joints.lKnee[0] -= 5;
        joints.lKnee[1] += drop * 0.2;
        joints.lKnee[2] += drop * 0.8;
        
        // Right leg (back): hip and knee extend backward and drop
        joints.rKnee[2] -= drop * 0.8;
        joints.rKnee[1] += drop * 0.4;
        joints.rAnkle[2] -= drop * 0.6;
        joints.rAnkle[1] -= drop * 0.1;

        highlightAngleJoint = "lKnee";
        angleText = `Front Knee: ${Math.round(175 - phase * 85)}°`;
      }
      else if (key === "bench_press") {
        // Bench press: Laying down (rotate body 90 deg back)
        // Arms press up and down
        Object.keys(joints).forEach(j => {
          const [x, y, z] = joints[j];
          const rad = (-90 * Math.PI) / 180;
          joints[j][1] = y * Math.cos(rad) - z * Math.sin(rad);
          joints[j][2] = y * Math.sin(rad) + z * Math.cos(rad);
        });
        
        const press = phase * 32;
        // Move wrists and elbows vertically (now along Z/Y projected plane)
        joints.lElbow[2] -= press * 0.4;
        joints.lElbow[0] -= press * 0.25;
        joints.lWrist[2] -= press * 0.95;
        
        joints.rElbow[2] -= press * 0.4;
        joints.rElbow[0] += press * 0.25;
        joints.rWrist[2] -= press * 0.95;

        highlightAngleJoint = "lElbow";
        angleText = `Elbow extension: ${Math.round(85 + phase * 90)}°`;
      }
      else if (key === "barbell_row") {
        // Row: torso bent forward 45 deg, arms pull weight to stomach
        const bendRad = 45 * Math.PI / 180;
        Object.keys(joints).forEach(j => {
          // Skip hips and ankles to keep feet planted
          if (j.includes("Ankle") || j.includes("Knee")) return;
          const [x, y, z] = joints[j];
          joints[j][1] = y * Math.cos(bendRad) - z * Math.sin(bendRad) + 10;
          joints[j][2] = y * Math.sin(bendRad) + z * Math.cos(bendRad) - 10;
        });
        
        // Pull barbell to stomach
        const pull = phase * 25;
        joints.lElbow[1] -= pull * 0.7;
        joints.lElbow[2] -= pull * 0.5;
        joints.lWrist[1] -= pull * 0.95;
        
        joints.rElbow[1] -= pull * 0.7;
        joints.rElbow[2] -= pull * 0.5;
        joints.rWrist[1] -= pull * 0.95;

        highlightAngleJoint = "lElbow";
        angleText = `Elbow flexion: ${Math.round(170 - phase * 95)}°`;
      }
      else if (key === "hip_thrust") {
        // Laying with back on bench, hips drive up to align with shoulders
        const lift = phase * 30;
        
        // Hips start low, rise to parallel
        joints.pelvis[1] -= lift;
        joints.lHip[1]   -= lift;
        joints.rHip[1]   -= lift;
        
        // Back stays elevated (bench pivot)
        joints.lShoulder[1] -= lift * 0.15;
        joints.rShoulder[1] -= lift * 0.15;
        joints.neck[1]      -= lift * 0.1;
        joints.head[1]      -= lift * 0.05;
        
        highlightAngleJoint = "lHip";
        angleText = `Hip extension: ${Math.round(100 + phase * 75)}°`;
      }
      else if (key === "tricep_dip") {
        // Tricep Dip: elbows bend backwards, body drops
        const bend = phase * 30;
        
        // Body drops
        Object.keys(joints).forEach(j => {
          if (j.includes("Wrist")) return; // Hands fixed on bars
          joints[j][1] += bend * 0.8;
        });
        
        // Elbows bend backwards (Z depth increase)
        joints.lElbow[2] -= bend * 0.6;
        joints.rElbow[2] -= bend * 0.6;
        
        highlightAngleJoint = "lElbow";
        angleText = `Elbow flexion: ${Math.round(180 - phase * 95)}°`;
      }
      else if (key === "face_pulls" || key === "face_pull") {
        // Face Pull: stand tall, pull rope to face, elbows high and wide
        const pull = phase; // 0 to 1
        
        // Extended position (phase = 0): arms straight out in front
        // Contracted position (phase = 1): elbows high and wide, wrists back next to ears
        
        // Left arm
        joints.lElbow[0] = -22 - (10 * pull);             // flare outward
        joints.lElbow[1] = -35 - (5 * pull);              // elbow height level with shoulders
        joints.lElbow[2] = 22 - (34 * pull);              // pull back (from forward to behind shoulders)
        
        joints.lWrist[0] = -16 - (6 * pull);              // hands start close, pull wider to ears
        joints.lWrist[1] = -35 - (5 * pull);              // wrists pull to face level
        joints.lWrist[2] = 42 - (47 * pull);              // pull back next to head
        
        // Right arm
        joints.rElbow[0] = 22 + (10 * pull);
        joints.rElbow[1] = -35 - (5 * pull);
        joints.rElbow[2] = 22 - (34 * pull);
        
        joints.rWrist[0] = 16 + (6 * pull);
        joints.rWrist[1] = -35 - (5 * pull);
        joints.rWrist[2] = 42 - (47 * pull);
        
        highlightAngleJoint = "lElbow";
        angleText = `Elbow angle: ${Math.round(170 - phase * 80)}°`;
      }

      if (frameCount % 60 === 0) {
        console.log("runLoop frame:", frameCount, "time:", time, "phase:", phase, "pelvisY:", joints.pelvis[1]);
      }

      // Projection mapping parameters
      const currentYaw = anglesRef.current.yaw;
      const currentPitch = anglesRef.current.pitch;
      
      const W = canvas.width;
      const H = canvas.height;
      const scale = 2.1;
      const cx = W / 2;
      const cy = H / 2 + 10;
      
      const projected = {};

      // Project all joints
      Object.keys(joints).forEach(j => {
        let [x, y, z] = joints[j];
        
        // Apply YAW (rotation around Y-axis)
        let [x1, z1] = rotateY(x, z, currentYaw);
        
        // Apply PITCH (rotation around X-axis)
        let [y2, z2] = rotateX(y, z1, currentPitch);
        
        // Simple perspective or orthographic scale
        projected[j] = {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          origX: x1,
          origY: y2
        };
      });

      // ── DRAWING ───────────────────────────────────────────────────────────
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw Grid Floor (cyber gym sports feel)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1.2;
      for (let i = -4; i <= 4; i++) {
        // Line perpendicular to X
        const start = [-100, 75, i * 20];
        const end = [100, 75, i * 20];
        
        const p1 = rotateY(start[0], start[2], currentYaw);
        const p1_proj = rotateX(start[1], p1[1], currentPitch);
        
        const p2 = rotateY(end[0], end[2], currentYaw);
        const p2_proj = rotateX(end[1], p2[1], currentPitch);
        
        ctx.beginPath();
        ctx.moveTo(cx + p1[0] * scale, cy + p1_proj[0] * scale);
        ctx.lineTo(cx + p2[0] * scale, cy + p2_proj[0] * scale);
        ctx.stroke();
      }

      // Draw Bone Connections
      const bones = [
        ["head", "neck"],
        ["neck", "spineMid"],
        ["spineMid", "pelvis"],
        
        // Shoulders & Spine
        ["neck", "lShoulder"],
        ["neck", "rShoulder"],
        ["lShoulder", "lElbow"],
        ["rShoulder", "rElbow"],
        ["lElbow", "lWrist"],
        ["rElbow", "rWrist"],
        
        // Hips & Legs
        ["pelvis", "lHip"],
        ["pelvis", "rHip"],
        ["lHip", "lKnee"],
        ["rHip", "rKnee"],
        ["lKnee", "lAnkle"],
        ["rKnee", "rAnkle"],
      ];

      ctx.lineWidth = 4.5;
      bones.forEach(([j1, j2]) => {
        const p1 = projected[j1];
        const p2 = projected[j2];
        
        if (!p1 || !p2) return;
        
        // Highlight active bone or limb
        const isHighlight = 
          (highlightAngleJoint === "lKnee" && (j2 === "lKnee" || j1 === "lKnee")) ||
          (highlightAngleJoint === "lElbow" && (j2 === "lElbow" || j1 === "lElbow")) ||
          (highlightAngleJoint === "lShoulder" && (j2 === "lShoulder" || j1 === "lShoulder")) ||
          (highlightAngleJoint === "lHip" && (j2 === "lHip" || j1 === "lHip"));
          
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        if (isHighlight) {
          ctx.strokeStyle = "hsl(var(--primary))";
          ctx.shadowColor = "hsl(var(--primary))";
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.shadowBlur = 0;
        }
        
        ctx.stroke();
      });
      ctx.shadowBlur = 0; // reset shadow

      // Draw Joint Nodes
      Object.keys(projected).forEach(j => {
        const p = projected[j];
        ctx.beginPath();
        ctx.arc(p.x, p.y, j === "head" ? 11 : 4.5, 0, 2 * Math.PI);
        
        if (j === highlightAngleJoint) {
          ctx.fillStyle = "hsl(var(--primary))";
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = j === "head" ? "rgba(255,255,255,0.8)" : "hsl(var(--muted-foreground))";
          ctx.fill();
        }
      });

      // Render Angle text in a technical telemetry HUD design
      if (angleText) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(10, 10, 160, 32);
        ctx.strokeStyle = "hsl(var(--primary))";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(10, 10, 160, 32);
        
        ctx.fillStyle = "hsl(var(--primary))";
        ctx.font = "bold 10px monospace";
        ctx.textBaseline = "middle";
        ctx.fillText("📡 " + angleText.toUpperCase(), 18, 26);
      }

      // Draw interactive instructions
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("🖱️ CLICK & DRAG TO SPIN SKELETON 3D", W / 2, H - 15);
      ctx.textAlign = "left"; // reset

      animId = requestAnimationFrame(runLoop);
    };

    runLoop();
    return () => {
      console.log("Simulator useEffect cleanup run");
      cancelAnimationFrame(animId);
    };
  }, [exerciseId, isPlaying]);

  const setView = (y, p) => {
    setYaw(y);
    setPitch(p);
  };

  return (
    <div className="bg-[#12141c] border border-white/5 rounded-3xl p-5 shadow-2xl relative select-none">
      
      {/* 3D Model Canvas */}
      <div className="relative overflow-hidden rounded-2xl bg-[#08080a] border border-white/[0.03]">
        <canvas
          ref={canvasRef}
          width={300}
          height={320}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-auto cursor-grab active:cursor-grabbing block"
        />

        {/* Floating Presets HUD */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={() => setView(0, 0)}
            className="text-[9px] bg-black/80 hover:bg-[#1b1e2a] border border-white/5 text-gray-400 font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg"
          >
            Front
          </button>
          <button
            onClick={() => setView(90, 0)}
            className="text-[9px] bg-black/80 hover:bg-[#1b1e2a] border border-white/5 text-gray-400 font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg"
          >
            Side
          </button>
          <button
            onClick={() => setView(45, 15)}
            className="text-[9px] bg-black/80 hover:bg-[#1b1e2a] border border-white/5 text-gray-400 font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg"
          >
            3D Iso
          </button>
        </div>

        {/* Floating Animation Control */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-3 left-3 bg-black/80 border border-white/5 text-primary p-2 rounded-xl hover:bg-[#1b1e2a] transition duration-200"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

    </div>
  );
}
