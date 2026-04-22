from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import chromadb

SQLALCHEMY_DATABASE_URL = "sqlite:///./productivity.db"
# connect_args={"check_same_thread": False} is needed only for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Chroma DB setup
chroma_client = chromadb.PersistentClient(path="./chroma_db")
knowledge_collection = chroma_client.get_or_create_collection(name="knowledge_base")
