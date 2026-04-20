AlignMate
Your Real-Time Digital Posture Coach

Prevent “Tech Neck” before it starts — with AI-powered posture awareness.


📌 About The Project

AlignMate is a real-time posture correction web application designed to act as a digital chiropractor.

It leverages your device’s webcam to:

Monitor posture continuously
Detect ergonomic misalignment
Provide instant visual feedback

The goal is simple:

Build healthier posture habits before long-term damage occurs.

This frontend is designed to seamlessly integrate with a Python (FastAPI) computer vision backend for real-time pose detection.

🚀 Key Features
🧩 Core Frontend Capabilities
🔐 Authentication System
Context-based auth (AuthContext)
LocalStorage session persistence
🛡️ Protected Routes
/live route accessible only when authenticated
🎨 Theme System
Light & Dark mode
Custom Lilac / Mauve / White design system
📷 Live Camera Feed (Integration Ready)
Uses react-webcam
Structured to receive real-time posture data
⚡ Real-Time UI Feedback
Posture score
Feedback banners
Status indicators
🎬 Smooth Animations
Powered by Framer Motion
Performance-safe transitions
🛠️ Tech Stack
Frontend
⚛️ React 19 (Vite)
🎨 Tailwind CSS
🧱 shadcn/ui (Radix-based components)
🎬 Framer Motion
🌐 React Router
📷 React Webcam
⚡ Quick Start / Local Setup

Follow these steps to run the frontend locally:

1️⃣ Clone the Repository
git clone <your-repo-url>
cd alignmate-frontend
2️⃣ Install Dependencies
npm install
3️⃣ Start Development Server
npm run dev
4️⃣ Open in Browser
http://localhost:5173
📁 Folder Structure
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, etc.)
│   ├── auth/            # Login / Register forms
│   ├── camera/          # Webcam feed logic
│   ├── posture/         # Posture UI components
│   ├── landing/         # Homepage sections
│   └── common/          # Shared utilities/components
│
├── pages/
│   ├── Home.jsx
│   ├── AboutPage.jsx
│   ├── ResearchPage.jsx
│   └── LivePosturePage.jsx  ⭐ IMPORTANT
│
├── context/
│   ├── AuthContext.jsx
│   └── ThemeProvider.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useTheme.js
│   ├── usePostureAnalysis.js  ⭐ IMPORTANT
│   └── usePostureTimer.js
│
├── assets/
│   └── images/
│
├── routes/
│   └── AppRoutes.jsx
│
└── main.jsx
🔌 Backend Integration Guide (IMPORTANT)

This section is specifically for FastAPI backend integration.

🎯 Integration Entry Point
📍 LivePosturePage.jsx
src/pages/LivePosturePage.jsx

👉 This is the main integration surface

🔄 Data Flow (Frontend Expectation)

The frontend expects posture data in this format:

{
  score: number,
  status: "good" | "bad",
  angles: {
    neck: number,
    shoulder: number
  },
  feedback: string
}
⚙️ Where to Connect Backend
1️⃣ Hook: usePostureAnalysis

📍 Location:

src/hooks/usePostureAnalysis.js

👉 This is where you should:

Connect WebSocket OR API
Send pose data from backend
Receive posture analysis
🔌 WebSocket Integration Example
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setAnalysis(data);
};
🎥 Camera Feed Source

📍 Component:

src/components/camera/CameraFeed.jsx

👉 You will receive:

Raw webcam frames (optional)
OR integrate your own backend frame processing
🧠 Suggested Architecture
Option A (Recommended)
Frontend (React)
   ↓
WebSocket
   ↓
FastAPI
   ↓
MediaPipe / OpenCV
Option B
Frontend → REST API → FastAPI → Response

🚀 Future Scope
Real-time posture tracking via WebSockets
Session analytics dashboard
ML-based posture scoring improvements
User posture history tracking
🤝 Collaboration Notes

If you're integrating backend:

👉 Start here:

LivePosturePage.jsx
usePostureAnalysis.js

👉 Goal:

Replace mock posture logic with real FastAPI outputs

