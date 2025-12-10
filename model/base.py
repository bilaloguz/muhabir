import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# The parent class for all models
Base = declarative_base()

# ------------------------------------------------------------------
# UNIFIED POSTGRES DATABASE
# ------------------------------------------------------------------
dbUrl = os.getenv("DATABASE_URL")
if not dbUrl:
    raise ValueError("DATABASE_URL is not set in .env")

# Postgres Engine
engine = create_engine(dbUrl)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ------------------------------------------------------------------
# BACKWARD COMPATIBILITY ALIASES
# (Mapping everything to the single Postgres DB)
# ------------------------------------------------------------------
configEngine = engine
todayEngine = engine
archiveEngine = engine

ConfigSessionLocal = SessionLocal
TodaySessionLocal = SessionLocal
ArchiveSessionLocal = SessionLocal