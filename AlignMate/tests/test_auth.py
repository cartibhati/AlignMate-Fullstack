import json
import pytest

def test_register_success(client):
    # Test successful user registration
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["name"] == "Test User"
    assert data["user"]["email"] == "test@example.com"
    assert "id" in data["user"]

def test_register_duplicate_email(client):
    # Register first user
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    client.post("/auth/register", json=payload)

    # Register second user with same email
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Register the user
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    client.post("/auth/register", json=payload)

    # Test login
    login_payload = {
        "email": "test@example.com",
        "password": "securepassword123"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"

def test_login_invalid_credentials(client):
    # Register the user
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    client.post("/auth/register", json=payload)

    # Test login with bad password
    login_payload = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"

    # Test login with unregistered email
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "securepassword123"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 401

def test_profile_management(client):
    # Register and login user
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    reg_resp = client.post("/auth/register", json=payload)
    user_id = reg_resp.json()["user"]["id"]

    # Save Profile
    profile_payload = {
        "age": 25,
        "height_cm": 178.5,
        "weight_kg": 72.0,
        "lifestyle": "active",
        "level": "intermediate",
        "goal": "build_muscle",
        "equipment": "gym",
        "diet": "non_veg"
    }
    save_resp = client.post(f"/auth/profile/{user_id}", json=profile_payload)
    assert save_resp.status_code == 200
    assert save_resp.json()["success"] is True

    # Get Profile
    get_resp = client.get(f"/auth/profile/{user_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["age"] == 25
    assert data["height_cm"] == 178.5
    assert data["weight_kg"] == 72.0
    assert data["lifestyle"] == "active"
    assert data["level"] == "intermediate"
    assert data["goal"] == "build_muscle"

def test_profile_not_found(client):
    # Register user to get cookies
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    reg_resp = client.post("/auth/register", json=payload)
    user_id = reg_resp.json()["user"]["id"]

    # Request profile which is not yet created
    response = client.get(f"/auth/profile/{user_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found"

def test_me_and_logout(client):
    # Unauthenticated /me should fail
    response = client.get("/auth/me")
    assert response.status_code == 401
    
    # Register
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    client.post("/auth/register", json=payload)
    
    # Authenticated /me should succeed
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["user"]["email"] == "test@example.com"
    
    # Logout
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # /me after logout should fail
    response = client.get("/auth/me")
    assert response.status_code == 401

def test_sessions_saving_and_retrieval(client):
    # Register user
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    reg_resp = client.post("/auth/register", json=payload)
    user_id = reg_resp.json()["user"]["id"]

    # Save Session
    session_payload = {
        "user_id": user_id,
        "duration": 600,
        "bad_duration": 120,
        "avg_score": 80,
        "mode": "student",
        "feedback": ["Head tilted left", "Slouching detected"],
        "ai_feedback": "Excellent work. Watch your neck tilt."
    }
    save_resp = client.post("/auth/sessions", json=session_payload)
    assert save_resp.status_code == 200
    assert save_resp.json()["success"] is True

    # Retrieve Sessions
    get_resp = client.get(f"/auth/sessions/{user_id}")
    assert get_resp.status_code == 200
    sessions = get_resp.json()
    assert len(sessions) == 1
    assert sessions[0]["duration"] == 600
    assert sessions[0]["badDuration"] == 120
    assert sessions[0]["avgScore"] == 80
    assert sessions[0]["mode"] == "student"
    assert "Head tilted left" in sessions[0]["feedback"]
    assert sessions[0]["aiFeedback"] == "Excellent work. Watch your neck tilt."

def test_exercise_history_saving_and_retrieval(client):
    # Register user
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    reg_resp = client.post("/auth/register", json=payload)
    user_id = reg_resp.json()["user"]["id"]

    # Save Exercise
    ex_payload = {
        "user_id": user_id,
        "exercise_id": "pushups",
        "exercise_name": "Pushups",
        "reps_done": 15,
        "sets_done": 3,
        "form_score": 92
    }
    save_resp = client.post("/auth/exercise-history", json=ex_payload)
    assert save_resp.status_code == 200
    assert save_resp.json()["success"] is True

    # Retrieve Exercise History
    get_resp = client.get(f"/auth/exercise-history/{user_id}")
    assert get_resp.status_code == 200
    history = get_resp.json()
    assert len(history) == 1
    assert history[0]["exerciseId"] == "pushups"
    assert history[0]["exerciseName"] == "Pushups"
    assert history[0]["repsDone"] == 15
    assert history[0]["setsDone"] == 3
    assert history[0]["formScore"] == 92

def test_generate_plan_api(client):
    # Test generation with fallback
    payload = {
        "age": 28,
        "height_cm": 182.0,
        "weight_kg": 80.0,
        "lifestyle": "Active",
        "level": "Intermediate",
        "goal": "Build muscle",
        "equipment": "Gym",
        "diet": "Non-Veg"
    }
    response = client.post("/generate-plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "weekly_plan" in data
    assert "diet_plan" in data
    assert "tips" in data
    assert len(data["weekly_plan"]) == 7

def test_ai_feedback_api(client):
    # Test AI feedback response structure
    payload = {
        "mode": "athlete",
        "score": 88,
        "bad_duration": 45,
        "session_duration": 300,
        "issues": ["Shoulders uneven"]
    }
    response = client.post("/ai-feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "feedback" in data
    assert len(data["feedback"]) > 0


def test_seed_demo_data_success(client):
    # Register a new user
    payload = {
        "name": "Seeding User",
        "email": "seed@example.com",
        "password": "password123"
    }
    reg_resp = client.post("/auth/register", json=payload)
    assert reg_resp.status_code == 200
    user_id = reg_resp.json()["user"]["id"]

    # Seed demo data for this user
    response = client.post(f"/auth/seed-demo-data/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "seeded" in data["message"]

    # Check sessions are created
    sess_resp = client.get(f"/auth/sessions/{user_id}")
    assert sess_resp.status_code == 200
    sessions = sess_resp.json()
    assert len(sessions) == 12
    assert sessions[0]["avgScore"] == 92  # days_ago: 1 configuration

    # Check exercises are created
    ex_resp = client.get(f"/auth/exercise-history/{user_id}")
    assert ex_resp.status_code == 200
    history = ex_resp.json()
    assert len(history) == 18
    assert history[0]["exerciseId"] == "pushup"
    assert history[0]["repsDone"] == 60

