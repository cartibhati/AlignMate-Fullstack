# AlignMate/database.py

from sqlmodel import SQLModel, create_engine, Session

# ── Update these credentials to match your MySQL setup ───────────────────────
DB_USER     = "root"
DB_PASSWORD = "root"   # ← change this
DB_HOST     = "localhost"
DB_PORT     = "3306"
DB_NAME     = "alignmate"

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Start with a fallback default. If MySQL fails, we re-initialize this to SQLite.
engine = None

try:
    engine = create_engine(DATABASE_URL, echo=False)
except Exception:
    # If initial engine creation fails, fallback to SQLite
    engine = create_engine("sqlite:///alignmate.db", connect_args={"check_same_thread": False}, echo=False)

def create_db_and_tables():
    """Call once on startup to create all tables."""
    global engine
    try:
        # Test connection / create tables
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        print(f"[WARNING] MySQL connection failed: {e}. Falling back to SQLite...")
        engine = create_engine("sqlite:///alignmate.db", connect_args={"check_same_thread": False}, echo=False)
        SQLModel.metadata.create_all(engine)
        print("[SUCCESS] Fallback SQLite database and tables created")

def get_session():
    """FastAPI dependency — yields a DB session."""
    with Session(engine) as session:
        yield session