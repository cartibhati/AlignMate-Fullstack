# 🧠 AlignMate — AI-Powered Real-Time Posture Coach

A fullstack posture correction system that uses your **webcam + machine learning** to monitor your posture in real time, detect misalignment, and guide you through recovery exercises — all running locally on your machine.

---

## ✨ Features

- **Real-time posture detection** — classifies posture every frame using a trained Random Forest model
- **Live scoring** — posture score (0–100) with drift detection and bad posture duration tracking
- **Rule-based + ML hybrid** — neck tilt, shoulder imbalance, and probability smoothing work together
- **Recovery exercises** — shoulder roll tracking with rep counting via motion verification
- **WebSocket streaming** — zero-latency feedback from backend to frontend
- **Auth + themes** — protected routes, login system, and light/dark mode

---

## 🏗️ Architecture

```
┌─────────────────────┐        WebSocket (ws://localhost:8000/ws)       ┌──────────────────────────┐
│  React Frontend     │  ──────────────────────────────────────────►    │  FastAPI Backend          │
│  (Vite + Tailwind)  │                                                  │  server.py                │
│  React Webcam       │ ◄──────────────────────────────────────────      │                          │
└─────────────────────┘        JSON (score, status, feedback)            └────────────┬─────────────┘
                                                                                      │
                                                                         ┌────────────▼─────────────┐
                                                                         │  ML Pipeline              │
                                                                         │  MediaPipe (landmarks)    │
                                                                         │  Random Forest (sklearn)  │
                                                                         │  posture_model_v3.pkl     │
                                                                         └──────────────────────────┘
```

**Flow:**
1. Frontend captures webcam frames and streams them over WebSocket
2. Backend runs MediaPipe to extract 33 pose landmarks (99 features: x, y, z per landmark)
3. Random Forest model predicts posture class + confidence probability
4. Rule-based checks (neck tilt, shoulder imbalance) layer on top of ML output
5. JSON response streams back — score, status, angles, and corrective feedback

---

## 📁 Project Structure

```
AlignMate_NBA/
│
├── AlignMate/                          # Python backend
│   ├── posture/                        # Core posture analysis logic
│   │   ├── exercise_verifier.py        # Rep counting + motion verification for exercises
│   │   ├── exercises.py                # Exercise definitions (shoulder rolls, etc.)
│   │   ├── geometry.py                 # Angle calculations from landmarks
│   │   └── posture_rules.py            # Rule-based checks (neck tilt, shoulder imbalance)
│   ├── utils/                          # Shared utilities
│   ├── vision/                         # MediaPipe integration + landmark extraction
│   ├── collect_data.py                 # Data collection script for training
│   ├── train_model.py                  # Model training script
│   ├── main.py                         # Entry point
│   ├── server.py                       # FastAPI + WebSocket server
│   ├── posture_model_v3.pkl            # Trained Random Forest model
│   ├── data.csv                        # Collected training data
│   └── requirements.txt
│
└── alignmate-frontend/                 # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── auth/                   # Login, signup, protected routes
    │   │   ├── camera/                 # Webcam capture + live overlay
    │   │   └── common/                 # Navbar, ConnectionStatus, shared UI
    │   ├── assets/
    │   └── public/
    └── package.json
```

### Backend (`AlignMate/`)

| File/Folder | What it does |
|-------------|-------------|
| `server.py` | FastAPI app with a WebSocket endpoint `/ws` — receives frames, runs the full pipeline, streams JSON back |
| `vision/` | Wraps MediaPipe Pose — extracts 33 landmarks and converts them to a flat 99-feature vector |
| `posture/posture_rules.py` | Rule-based detector — checks neck angle, shoulder tilt, and flags specific misalignments |
| `posture/geometry.py` | Pure math — calculates angles between joints from (x, y, z) coordinates |
| `posture/exercises.py` | Defines recovery exercises with movement targets |
| `posture/exercise_verifier.py` | Tracks reps by verifying full motion arcs (not just position) |
| `train_model.py` | Loads `data.csv`, trains a RandomForestClassifier (100 trees, 80/20 split), saves as `.pkl` |
| `collect_data.py` | Webcam-based data collection — press `c` (correct), `i` (incorrect), `q` (quit) |

### Frontend (`alignmate-frontend/`)

| File/Folder | What it does |
|-------------|-------------|
| `components/camera/` | Captures webcam feed, opens WebSocket connection, renders live posture overlay and score |
| `components/auth/` | Login/signup forms, JWT handling, protected route wrappers |
| `components/common/` | Navbar, ConnectionStatus indicator, reusable UI components |

---

## 🤖 Machine Learning Pipeline

### Data Collection
```bash
python collect_data.py
```
Controls: `c` → correct posture &nbsp;|&nbsp; `i` → incorrect posture &nbsp;|&nbsp; `q` → quit

Saves labeled rows to `data.csv`. Collect at least 200–300 samples per class for reliable results.

### Feature Extraction
MediaPipe detects **33 body landmarks**, each with (x, y, z) coordinates:
```
33 landmarks × 3 values = 99 features per frame
```

### Model Training
```bash
python train_model.py
```
- RandomForestClassifier — 100 estimators
- 80/20 train/test split
- Outputs accuracy report + saves `posture_model_v3.pkl`

### Inference
```
Webcam frame → MediaPipe → 99 features → predict_proba() → posture score + class
                                                          ↓
                                              Rule-based checks (neck/shoulder)
                                                          ↓
                                              Final feedback JSON over WebSocket
```

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Webcam

### 1. Backend Setup

```bash
cd AlignMate
pip install -r requirements.txt
uvicorn server:app --reload
```

Runs at: `http://localhost:8000`  
WebSocket: `ws://localhost:8000/ws`

### 2. Frontend Setup

```bash
cd alignmate-frontend
npm install
npm run dev
```

Runs at: `http://localhost:5173`

---

## 🔌 WebSocket Data Format

The backend streams this JSON to the frontend on every frame:

```json
{
  "score": 87,
  "status": "good",
  "angles": {
    "neck": 12.4,
    "shoulder": 3.1
  },
  "feedback": "Great posture! Keep it up."
}
```

| Field | Values |
|-------|--------|
| `status` | `"good"` / `"drift"` / `"bad"` |
| `score` | 0–100 |
| `angles.neck` | degrees of forward tilt |
| `angles.shoulder` | degrees of imbalance |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, Framer Motion |
| Webcam | React Webcam |
| Routing & Auth | React Router, protected routes |
| Backend | FastAPI, WebSockets |
| Pose Detection | MediaPipe |
| Image Processing | OpenCV |
| ML Model | Scikit-learn (Random Forest) |
| Data | NumPy, Pandas, Joblib |

---

## ⚠️ Known Limitations

- Requires good lighting for accurate MediaPipe landmark detection
- Model accuracy depends on training data quality — more diverse samples = better results
- Currently classifies only two posture states (correct / incorrect); no nuanced multi-class support yet
- No posture history persistence — data resets on server restart

---

## 🔮 Possible Future Improvements

- [ ] Posture history dashboard with session analytics
- [ ] LSTM/CNN model for temporal posture patterns
- [ ] Personalized baselines per user (calibration mode)
- [ ] Mobile app with on-device ML (MediaPipe + TFLite)
- [ ] Email/notification alerts after prolonged bad posture

---

## 📄 License

MIT — do whatever you want with it.
