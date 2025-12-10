from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from model.base import Base

class User(Base):

    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True) # Optional?
    hashedPassword = Column(String, nullable=False)
    isActive = Column(Boolean, default=True)
    isSuperuser = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)