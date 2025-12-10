from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from model.base import Base

class Source(Base):

    __tablename__ = "source"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    url = Column(String, unique=True)
    category = Column(String, nullable=True) # e.g. "Technology", "Sports"
    language = Column(String, default="tr")  # e.g. "tr", "en"
    isActive = Column(Boolean, default=True)
    fetchIntervalMinutes = Column(Integer, default=60) # Polling interval
    lastFetchTime = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)