# 🧠 AlignMate – AI-Powered Real-Time Posture Coach

Prevent “Tech Neck” before it starts — with intelligent, real-time posture analysis powered by computer vision and machine learning.

---

## 📌 About The Project

AlignMate is a **fullstack posture correction system** that acts like a digital chiropractor.

It uses:
- 📷 Webcam input  
- 🧠 Machine Learning  
- ⚡ Real-time feedback  

To:
- Monitor posture continuously  
- Detect misalignment  
- Provide instant corrective feedback  
- Guide users through recovery exercises  

---

## 🏗️ Project Architecture

Frontend (React)  
↓  
WebSocket (Real-time)  
↓  
FastAPI Backend  
↓  
ML Model (Random Forest)  
↓  
MediaPipe Pose Detection  

---

## ✨ Key Features

### 🧠 AI-Powered Posture Detection
- Real-time classification of posture
- Confidence-based scoring system

### ⚡ Live Feedback System
- Posture score (0–100)
- Drift detection
- Bad posture duration tracking

### 🧍 Rule-Based + ML Hybrid System
- Neck tilt detection
- Shoulder imbalance detection
- ML probability smoothing

### 🏋️ Recovery System
- Shoulder roll exercise tracking
- Rep counting using motion verification

### 🔐 Frontend Features
- Authentication system
- Protected routes
- Theme switching (Light/Dark)
- Smooth UI animations (Framer Motion)

---

## 🛠️ Tech Stack

### 🔹 Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion
- React Router
- React Webcam

### 🔹 Backend
- FastAPI
- WebSockets
- MediaPipe
- OpenCV

### 🔹 Machine Learning
- Scikit-learn (Random Forest)
- NumPy / Pandas
- Joblib

---

## 📊 Machine Learning Pipeline

### 📷 Feature Extraction
- 33 pose landmarks from MediaPipe
- Each landmark → (x, y, z)

Total Features:  
33 × 3 = 99 features

---

### 🏷️ Labels
- correct → good posture  
- incorrect → bad posture  

---

### 🧪 Model Training

Run:
python train_model.py

- Train/test split (80/20)
- RandomForestClassifier (100 trees)
- Accuracy evaluation

Model saved as:
posture_model_v3.pkl

---

### 🔄 Data Collection

Run:
python collect_data.py

Controls:
- c → correct posture  
- i → incorrect posture  
- q → quit  

---

### 🤖 Inference

- Landmarks → 99 features  
- Model → predict_proba()  
- Output → posture probability  

---

## ⚙️ Backend Setup

pip install -r requirements.txt  
uvicorn server:app --reload  

Runs at: http://localhost:8000  
WebSocket: ws://localhost:8000/ws  

---

## 🌐 Frontend Setup

cd alignmate-frontend  
npm install  
npm run dev  

Runs at: http://localhost:5173  

---

## 🔌 Backend Integration

Frontend connects using:

const ws = new WebSocket("ws://localhost:8000/ws");

Expected data format:

{
  "score": number,
  "status": "good" | "drift" | "bad",
  "angles": {
    "neck": number,
    "shoulder": number
  },
  "feedback": string
}

---


## 🚀 Future Scope

- Real-time analytics dashboard  
- Posture history tracking  
- Deep learning models (LSTM / CNN)  
- Personalized posture correction  
- Mobile app integration  

---

## 🤝 Contribution

Contributions are welcome!

- Fork the repo  
- Create a feature branch  
- Submit a pull request  

---

## 🎯 Goal

To help users build healthy posture habits and prevent long-term spinal issues using AI.
