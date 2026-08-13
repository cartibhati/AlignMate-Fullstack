<div align="center">
 
# 🏋️ AlignMate

**Real-time posture detection & athletic performance web app**
 
![Python](https://img.shields.io/badge/Python-3.10-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-orange?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![CI](https://github.com/cartibhati/AlignMate-Fullstack/actions/workflows/ci-cd.yml/badge.svg)
![Pytest](https://img.shields.io/badge/Pytest-13%20Passed-green?style=flat-square&logo=pytest)

*Analyze your posture, track your workouts, and get AI-powered coaching — in real time.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Data Flow](#-data-flow)
- [Exercise Analyzers](#-exercise-analyzers)
- [Quick Start (Docker)](#-quick-start-docker)
- [Local Development Setup](#-local-development-setup)
- [Environment Setup](#-environment-setup)
- [API Reference](#-api-reference)
- [Roadmap](#-roadmap)

---

## 🧠 Overview

AlignMate is a full-stack web application that uses your webcam to analyze posture and exercise form in real time. It leverages **MediaPipe Pose** for 33-keypoint landmark detection, **LangChain + Ollama (Llama 3.2)** for AI feedback, and a **FastAPI + MySQL** backend to track your sessions and progress over time.

The application has been upgraded with:
1. **Secure JWT HTTP-Only Cookie Authentication**: Protecting user sessions against XSS and session hijacks.
2. **Interactive 3D Joint Simulator**: Real-time canvas projection rendering human joints in 3D (with drag-to-rotate controls) to preview movement geometry.
3. **Workout Circuit HUD Mode**: A specialized training interface with preparation countdowns, active rep tracking, and automatic rest intervals.
4. **Comprehensive Test Suite**: Automated Pytest suite validating authentication, session operations, and exercise form state machine logic.
5. **Seeding Engine**: A demo seeding endpoint to populate workout history for realistic dashboard visualization.

The project is fully **Dockerized** with a multi-container Compose setup and a **GitHub Actions CI pipeline** that validates every push.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📸 **Live Posture Analysis** | Real-time webcam feed with pose classification, AI posture classification, and voice alerts |
| 🏋️ **Exercise Form Detection** | 13 exercises (newly added: **Face Pulls**) with rep counting, phase detection, and form feedback |
| 🤖 **AI Coaching** | LLM-powered feedback every 30 seconds during workouts based on posture data |
| 📅 **Workout Planning** | Personalized AI-generated workout + diet plans based on onboarding profile |
| 📊 **Progress Dashboard** | Session history, exercise records, streak tracking, with a built-in demo-seeding utility |
| 🗓️ **Calendar View** | Monthly workout calendar with current and longest streaks |
| 👤 **User Profiles** | Onboarding with age, weight, goals, equipment, and diet preferences |
| 🔊 **Voice Alerts** | Mode-aware speech synthesis with mute toggle |
| 🖥️ **Interactive 3D HUD** | Custom HTML5 Canvas 3D bone projection simulation for joint movement preview |
| ⏱️ **Workout Circuit Mode** | Exercise playback UI supporting prep countdowns, active rep/set tracking, and automated rest intervals |
| 🧪 **Pytest Coverage** | 13 backend integration and unit tests validating auth flow, database actions, and exercise states |
| 🐳 **Docker Support** | One-command startup via Docker Compose mapping client, server, and DB |
| ⚙️ **CI/CD Pipeline** | GitHub Actions validates backend + frontend on every push |

---

## 🛠 Tech Stack

### Backend
- **FastAPI** — async REST API + WebSocket server
- **MediaPipe** — 33-keypoint pose landmark detection
- **LangChain + Ollama (Llama 3.2)** — AI feedback & workout planning
- **SQLModel** — ORM for MySQL / SQLite
- **Pytest** — automated unit & integration testing
- **JWT & HTTP-Only Cookies** — secure session storage
- **bcrypt** — password hashing

### Frontend
- **React 18 + Vite** — fast single-page app
- **Tailwind CSS** — utility-first CSS styling
- **Lucide Icons** — unified icon package
- **Canvas 3D API** — orthographic/perspective 3D projection for skeleton joint simulator
- **WebSocket API** — real-time pose streaming
- **Web Speech API** — voice alerts

### Mobile Frontend
- **React Native (Expo)** — mobile app client supporting MoveNet keypoint mapping, local caching, and custom plans

### Database
- **MySQL 8** — primary database (users, sessions, exercise history)
- **SQLite** — fallback database if MySQL is unavailable

### DevOps
- **Docker + Docker Compose** — containerized multi-service orchestration
- **GitHub Actions** — CI pipeline for build validation on every push

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER (Vite + React)            │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐      ┌────────────────┐  │
│   │  React Pages │    │ 3D Simulator │      │ Circuit HUD    │  │
│   │  (Theme CSS) │    │ (Canvas 3D)  │      │ (Timers/Reps)  │  │
│   └──────┬───────┘    └──────────────┘      └────────────────┘  │
│          │ (Secure HTTP-Only Cookie / Bearer Auth)              │
│          ◄────────────────────────────────────────────┐         │
└──────────┼────────────────────────────────────────────┼─────────┘
           │ HTTP REST / WebSocket                      │ WebSocket (ws://)
           ▼                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND                          │
│                                                                 │
│   ┌─────────────┐     ┌──────────────┐      ┌────────────────┐  │
│   │ auth_router │     │  /ws (pose)  │      │ /ws/exercise   │  │
│   │ REST API &  │     │  WebSocket   │      │ WebSocket      │  │
│   │ Cookie Auth │     │  (Posture)   │      │ (Exercise Form)│  │
│   └──────┬──────┘     └──────┬───────┘      └────────┬───────┘  │
│          │                   │                       │          │
│          ▼                   ▼                       ▼          │
│   ┌─────────────┐     ┌──────────────┐      ┌────────────────┐  │
│   │  models.py  │     │  MediaPipe   │      │ 13 Exercise    │  │
│   │ (SQLModel)  │     │  Pose Proc.  │      │ Analyzers      │  │
│   └──────┬──────┘     └──────┬───────┘      └────────┬───────┘  │
│          │                   │                       │          │
│          ▼                   ▼                       ▼          │
│   ┌─────────────┐     ┌──────────────────────────────────────┐  │
│   │  MySQL DB / │     │            ai_feedback.py            │  │
│   │  SQLite DB  │     │        (LangChain + Llama 3.2)       │  │
│   └─────────────┘     └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
AlignMate_nba/
│
├── .github/workflows/
│   └── ci-cd.yml                   # ⚙️ GitHub Actions CI pipeline
│
├── AlignMate/                      # 🐍 FastAPI Backend
│   ├── Dockerfile                  # Backend container config
│   ├── .dockerignore
│   ├── tests/                      # 🧪 Pytest test suite
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   └── test_exercises.py
│   ├── posture/
│   │   ├── exercises/              # 13 exercise analyzers
│   │   │   ├── squat.py
│   │   │   ├── pushup.py
│   │   │   ├── plank.py
│   │   │   ├── deadlift.py
│   │   │   ├── bench_press.py
│   │   │   ├── barbell_row.py
│   │   │   ├── bicep_curl.py
│   │   │   ├── lateral_raise.py
│   │   │   ├── lunge.py
│   │   │   ├── hip_thrust.py
│   │   │   ├── shoulder_press.py
│   │   │   ├── tricep_dip.py
│   │   │   ├── face_pulls.py       # [NEW] Face Pulls analyzer
│   │   │   └── utils.py
│   │   ├── exercise_mapper.py
│   │   ├── exercise_verifier.py
│   │   ├── geometry.py
│   │   ├── mode_config.py
│   │   └── posture_rules.py
│   ├── utils/
│   │   └── logger.py
│   ├── vision/
│   │   └── camera.py
│   ├── server.py
│   ├── auth_router.py
│   ├── models.py
│   ├── database.py
│   ├── ai_feedback.py
│   ├── workout_planner.py
│   ├── posture_model_v3.pkl        # ML posture classification model
│   └── requirements.txt
│
├── alignmate-frontend/             # ⚛️ React + Vite Frontend
│   ├── Dockerfile                  # Frontend container config
│   ├── .dockerignore
│   ├── src/
│   │   ├── config.js               # Centralized API + WS URL config
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExercisePage.jsx    # Circuit playback HUD mode
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── posture/
│   │   │   │   └── InteractiveJointSimulator.jsx # 3D human skeleton
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── routes.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── AlignMate-Mobile/               # 📱 React Native + Expo Mobile Client
│   ├── src/
│   │   ├── config.js               # Wi-Fi physical LAN IP configuration
│   │   └── screens/
│   │       ├── DashboardScreen.js  # Streaks & progress reports
│   │       └── PlanScreen.js       # Core planning & tracking interface
│   ├── package.json
│   └── app.json
│
├── docker-compose.yml              # 🐳 Multi-container orchestration
└── .gitignore
```

---

## 🐳 Quick Start (Docker)

The fastest way to run AlignMate. No manual dependency setup required.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone https://github.com/cartibhati/AlignMate-Fullstack.git
cd AlignMate-Fullstack
docker compose up -d
```

### Port Mappings & Services

| Service | Host URL | Port Mapping (Host:Container) | Description |
|---|---|---|---|
| **Frontend** | `http://localhost:5173` | `5173:80` | Vite build hosted via Nginx |
| **Backend API** | `http://localhost:8000` | `8000:8000` | FastAPI server |
| **Swagger Docs** | `http://localhost:8000/docs` | — | API docs |
| **Database** | `localhost:3307` | `3307:3306` | MySQL 8 instance |

```bash
# Stop the stack
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View live logs
docker compose logs -f
```

> **Note:** AI coaching features require [Ollama](https://ollama.com/) running locally with the `llama3.2` model pulled. The app operates fine without it (AI feedback text panels will gracefully state they are unavailable).

---

## 💻 Local Development Setup

Prefer running without Docker for faster iteration:

### Prerequisites

- Python 3.10
- Node.js 18+
- MySQL 8.0
- [Ollama](https://ollama.com/) with `llama3.2` model

### 1. Clone the repo

```bash
git clone https://github.com/cartibhati/AlignMate-Fullstack.git
cd AlignMate-Fullstack
```

### 2. Backend Setup

```bash
cd AlignMate
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

### 3. Database Setup

```sql
CREATE DATABASE alignmate;
```

Update `database.py` if your MySQL credentials differ from the defaults (`root`/`root`).

### 4. Run the Test Suite

Before starting, verify the backend integrity with Pytest:
```bash
pytest -v
```

### 5. Start Ollama

```bash
ollama serve
ollama pull llama3.2
```

### 6. Start the Backend

```bash
uvicorn server:app --reload
# Runs on http://localhost:8000
```

### 7. Frontend Setup

```bash
cd ../alignmate-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## ⚙️ Environment Setup

| Service | URL | Notes |
|---|---|---|
| FastAPI Backend | `http://localhost:8000` | uvicorn / Docker port 8000 |
| React Frontend | `http://localhost:5173` | Vite dev server / Docker port 5173 |
| Ollama | `http://localhost:11434` | Must be running for AI features |
| MySQL (local) | `localhost:3306` | DB: `alignmate`, user: `root`, pass: `root` |
| MySQL (Docker) | `localhost:3307` | Avoids conflict with local MySQL instance |

> **Android/iOS Device Testing:** If testing on a physical phone via Expo Go, replace `localhost` with your machine's physical Wi-Fi LAN IP (e.g., `192.168.137.196`) in `AlignMate-Mobile/src/config.js` and `alignmate-frontend/src/config.js` to avoid networking failures (`Network request failed`).

---

## 🔄 Data Flow

### Live Posture Analysis

```
Webcam Feed
    │
    ▼
MediaPipe Pose (browser or backend)
    │  33 keypoints {x, y, z, visibility}
    ▼
WebSocket /ws  ──────────────────────────────────┐
    │                                             │
    ▼                                             ▼
posture_rules.py                         ai_feedback.py
(angle-based classification)         (LangChain + Llama3.2)
    │                                             │
    ▼                                             ▼
 good/bad + score                      AI text feedback
    │                                    (every 30s)
    ▼
Frontend UI
 ├── Pose overlay
 ├── Score badge
 ├── Voice alert (SpeechSynthesis)
 └── AI feedback panel
```

### Exercise Form Detection

```
Webcam Feed → MediaPipe Pose (33 keypoints)
    │
    ▼
WebSocket /ws/exercise
    │
    ├── exercise_mapper.py  →  maps name to analyzer ID
    │
    ▼
Exercise Analyzer (e.g. face_pulls.py or squat.py)
    │  angle/position-based phase detection
    ├── Phase: DOWN / UP / TRANSITION / IDLE
    ├── Rep counter
    └── Form feedback (knee cave, depth, elbow drop, etc.)
    │
    ▼
Frontend ExercisePage (Circuit Training HUD)
    ├── Prepare countdown
    ├── Rep counter display
    ├── Rest timer (auto-start after set)
    ├── Voice motivation
    └── Save to MySQL via POST /auth/exercise-history
```

---

## 💪 Exercise Analyzers

All 13 analyzers use **angle + position-based phase detection** — no ML model required for exercise tracking.

| Exercise | Key Angles / Thresholds Tracked | Form Corrections & Alerts |
|---|---|---|
| **Squat** | Hip, knee, ankle flexion angles | Knee caving, depth check (thighs parallel to floor) |
| **Push-up** | Elbow angle, hip-shoulder alignment | Hip sagging/arching, lack of depth |
| **Plank** | Hip alignment, shoulder-wrist stack | Hip line deviation (sagging or arching too high) |
| **Deadlift** | Hip hinge angle, spine/back angle | Lower back rounding, inadequate hinge depth |
| **Bench Press** | Elbow angle, wrist-elbow vertical alignment | Bar path deviation, asymmetric push |
| **Barbell Row** | Elbow pull depth, torso hinge angle | Dropping chest, short range of motion |
| **Bicep Curl** | Elbow flexion & extension | Elbow flare/migration, incomplete extension |
| **Lateral Raise** | Shoulder abduction angle | Leaning torso, raising hands above shoulders |
| **Lunge** | Front knee angle, hip drop vertical | Front knee exceeding toes, back knee drop range |
| **Hip Thrust** | Hip extension angle | Incomplete lockout, hyperextension |
| **Shoulder Press** | Elbow + shoulder abduction angle | Elbow flare, incomplete lockout |
| **Tricep Dip** | Elbow flexion depth | Dropping too low (shoulder stress), short reps |
| **Face Pulls** | Elbow angle, elbow-shoulder height alignment | Keep elbows high (shoulder level), full extension stretch |

---

## 📡 API Reference

### Auth Endpoints

All auth endpoints utilize secure HTTP-Only JWT cookies on web platforms, with a Bearer Token Authorization fallback for mobile requests.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user, sets HTTP-Only `access_token` cookie |
| POST | `/auth/login` | Authenticate credentials, sets HTTP-Only `access_token` cookie |
| POST | `/auth/logout` | Revoke session, clears the HTTP-Only cookie |
| GET | `/auth/me` | Fetch active session user metadata and profile |
| GET | `/auth/profile/{user_id}` | Get specific user profile info |
| POST | `/auth/profile/{user_id}` | Update/Create onboarding profile data |
| GET | `/auth/sessions/{user_id}` | Get historical posture analysis sessions |
| POST | `/auth/sessions` | Log a completed posture tracking session |
| POST | `/auth/exercise-history` | Log a completed exercise set |
| GET | `/auth/exercise-history/{user_id}` | Retrieve exercise logs and records |
| POST | `/auth/seed-demo-data/{user_id}` | Seed mock posture and exercise history for dashboard evaluation |

### WebSocket Endpoints

| Endpoint | Description |
|---|---|
| `ws://localhost:8000/ws` | Live posture analysis stream |
| `ws://localhost:8000/ws/exercise` | Exercise form detection stream |

#### WebSocket Payload (send)

```json
{
  "landmarks": [ { "x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.99 } ],
  "mode": "posture",
  "exercise": "face_pulls"
}
```

#### WebSocket Response

```json
{
  "status": "good",
  "score": 92,
  "feedback": ["Great pull! Squeeze your upper back and rear delts"],
  "reps": 3,
  "phase": "up",
  "completed": false
}
```

---

## 🗺 Roadmap

- [x] Live posture analysis (web client)
- [x] 13 exercise analyzers (Added Face Pulls!)
- [x] Secure HTTP-Only JWT Cookie authentication (with Bearer Token fallback)
- [x] Interactive 3D Skeleton Joint Simulator (HTML5 Canvas 3D projection)
- [x] Workout Circuit Playback HUD Mode (Timer, Countdown, Rest UI)
- [x] 13 Passed Pytest Unit & Integration tests for Backend
- [x] AI feedback (LangChain + Llama 3.2)
- [x] AI workout + diet plan generation
- [x] User auth + profile + history (MySQL/SQLite)
- [x] Dashboard + Calendar + Streaks visualization
- [x] Dockerization + Docker Compose multi-container setup
- [x] GitHub Actions CI/CD pipeline
- [x] Gym theme UI overhaul (light/dark Neon-Carbon theme)
- [ ] Mobile app (Expo React Native) — *in progress*
  - [x] MoveNet → MediaPipe keypoint mapping
  - [x] PoseCamera component
  - [x] Expanded PlanScreen & DashboardScreen to track 13 exercises
  - [ ] App Store deployment
- [ ] Progressive Web App (PWA) support
- [ ] Export workout history as PDF

---

<div align="center">
Made with 💪 by <a href="https://github.com/cartibhati">cartibhati</a>
</div>
