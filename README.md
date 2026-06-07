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

The project is fully **Dockerized** with a multi-container Compose setup and a **GitHub Actions CI pipeline** that validates every push.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📸 **Live Posture Analysis** | Real-time webcam feed with pose classification and voice alerts |
| 🏋️ **Exercise Form Detection** | 12 exercises with rep counting, phase detection, and form feedback |
| 🤖 **AI Coaching** | LLM-powered feedback every 30 seconds during workouts |
| 📅 **Workout Planning** | Personalized AI-generated workout + diet plans |
| 📊 **Progress Dashboard** | Session history, exercise records, streak tracking |
| 🗓️ **Calendar View** | Monthly workout calendar with current and longest streaks |
| 👤 **User Profiles** | Onboarding with age, weight, goals, equipment, diet preferences |
| 🔊 **Voice Alerts** | Mode-aware speech synthesis with mute toggle |
| 🐳 **Docker Support** | One-command startup via Docker Compose |
| ⚙️ **CI/CD Pipeline** | GitHub Actions validates backend + frontend on every push |

---

## 🛠 Tech Stack

### Backend
- **FastAPI** — async REST API + WebSocket server
- **MediaPipe** — 33-keypoint pose landmark detection
- **LangChain + Ollama (Llama 3.2)** — AI feedback & workout planning
- **SQLModel** — ORM for MySQL / SQLite
- **bcrypt** — password hashing

### Frontend
- **React 18 + Vite** — fast SPA
- **Tailwind CSS** — utility-first styling
- **WebSocket API** — real-time pose streaming
- **Web Speech API** — voice alerts

### Database
- **MySQL 8** — primary (users, sessions, exercise history)
- **SQLite** — fallback if MySQL is unavailable

### DevOps
- **Docker + Docker Compose** — containerized multi-service orchestration
- **GitHub Actions** — CI pipeline for build validation on every push

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                                                              │
│   ┌──────────────┐    ┌──────────────┐   ┌──────────────┐   │
│   │  React Pages │    │  WebSocket   │   │ Web Speech   │   │
│   │  (Vite/TW)   │◄──►│  Client     │   │ API (Voice)  │   │
│   └──────┬───────┘    └──────┬───────┘   └──────────────┘   │
└──────────┼────────────────── ┼───────────────────────────────┘
           │ HTTP REST          │ WebSocket (ws://)
           ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                          │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ auth_router │   │  /ws (pose)  │   │ /ws/exercise    │  │
│  │  REST API   │   │  WebSocket   │   │  WebSocket      │  │
│  └──────┬──────┘   └──────┬───────┘   └────────┬────────┘  │
│         │                 │                     │            │
│         ▼                 ▼                     ▼            │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │   models.py │   │  MediaPipe   │   │ Exercise        │  │
│  │  (SQLModel) │   │  Pose Proc.  │   │ Analyzers (12)  │  │
│  └──────┬──────┘   └──────┬───────┘   └────────┬────────┘  │
│         │                 │                     │            │
│         ▼                 ▼                     ▼            │
│  ┌─────────────┐   ┌──────────────────────────────────────┐ │
│  │  MySQL DB   │   │         ai_feedback.py               │ │
│  │  (alignmate)│   │    LangChain + Ollama llama3.2        │ │
│  └─────────────┘   └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
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
│   ├── posture/
│   │   ├── exercises/              # 12 exercise analyzers
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
│   │   │   └── tricep_dip.py
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
│   └── requirements.txt
│
├── alignmate-frontend/             # ⚛️ React + Vite Frontend
│   ├── Dockerfile                  # Frontend container config
│   ├── .dockerignore
│   ├── src/
│   │   ├── config.js               # Centralized API + WS URL config
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── components/
│   │   ├── context/
│   │   └── routes.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
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

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

```bash
# Stop the stack
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View live logs
docker compose logs -f
```

> **Note:** AI coaching features require [Ollama](https://ollama.com/) running locally with `llama3.2` pulled. The app works without it — AI feedback will simply be unavailable.

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

### 4. Start Ollama

```bash
ollama serve
ollama pull llama3.2
```

### 5. Start the Backend

```bash
uvicorn server:app --reload
# Runs on http://localhost:8000
```

### 6. Frontend Setup

```bash
cd alignmate-frontend
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

> **Android device testing:** Replace `localhost` with your machine's LAN IP in `alignmate-frontend/src/config.js`.

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
Exercise Analyzer (e.g. squat.py)
    │  angle/position-based phase detection
    ├── Phase: DOWN / UP / TRANSITION
    ├── Rep counter
    └── Form feedback (knee cave, depth, etc.)
    │
    ▼
Frontend ExercisePage
    ├── Rep counter display
    ├── Rest timer (auto-start after set)
    ├── Voice motivation
    └── Save to MySQL via POST /auth/exercise-history
```

---

## 💪 Exercise Analyzers

All 12 analyzers use **angle + position-based phase detection** — no ML model required for exercise tracking.

| Exercise | Key Angles Tracked |
|---|---|
| Squat | Hip, knee, ankle flexion |
| Push-up | Elbow angle, body alignment |
| Plank | Hip alignment, shoulder stack |
| Deadlift | Hip hinge, back angle |
| Bench Press | Elbow angle, wrist alignment |
| Barbell Row | Elbow pull, torso angle |
| Bicep Curl | Elbow flexion/extension |
| Lateral Raise | Shoulder abduction angle |
| Lunge | Front knee angle, hip drop |
| Hip Thrust | Hip extension angle |
| Shoulder Press | Elbow + shoulder angle |
| Tricep Dip | Elbow flexion depth |

---

## 📡 API Reference

### Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns token |
| GET | `/auth/profile` | Get user profile |
| PUT | `/auth/profile` | Update user profile |
| GET | `/auth/sessions` | Get posture sessions |
| POST | `/auth/exercise-history` | Save exercise record |
| GET | `/auth/exercise-history` | Get exercise history |

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
  "exercise": "squat"
}
```

#### WebSocket Response

```json
{
  "status": "good",
  "score": 87,
  "feedback": "Keep your back straight",
  "reps": 5,
  "phase": "DOWN"
}
```

---

## 🗺 Roadmap

- [x] Live posture analysis (web)
- [x] 12 exercise analyzers
- [x] AI feedback (LangChain + Llama 3.2)
- [x] AI workout + diet plan generation
- [x] User auth + profile + history (MySQL)
- [x] Dashboard + Calendar + Streaks
- [x] Dockerization + Docker Compose
- [x] GitHub Actions CI/CD pipeline
- [x] Gym theme UI overhaul (light/dark modes)
- [ ] Mobile app (Expo React Native) — *in progress*
  - [ ] MoveNet → MediaPipe keypoint mapping
  - [ ] PoseCamera component
  - [ ] Exercise + Dashboard screens
- [ ] Progressive Web App (PWA) support
- [ ] Export workout history as PDF

---

<div align="center">
Made with 💪 by <a href="https://github.com/cartibhati">cartibhati</a>
</div>
