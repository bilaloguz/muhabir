from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
import enum
from model.base import Base

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"

class Job(Base):
    __tablename__ = "job"

    id = Column(Integer, primary_key=True, index=True)
    articleUrl = Column(String, index=True)
    status = Column(String, default=JobStatus.PENDING)
    retryCount = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)