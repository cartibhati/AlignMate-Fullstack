import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session

# Add the parent directory to sys.path so we can import server
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import app
from database import get_session
from models import User, UserProfile, SessionRecord, ExerciseRecord
print("Registered tables in metadata:", SQLModel.metadata.tables.keys())

from sqlalchemy.pool import StaticPool

# In-memory SQLite for testing isolation with StaticPool to share connection state
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

def override_get_session():
    with Session(engine) as session:
        yield session

# Override the database dependency in FastAPI
app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(name="session")
def session_fixture():
    # Setup: Create tables in the test database
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    # Teardown: Drop all tables to clean up
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session):
    with TestClient(app) as client:
        yield client
