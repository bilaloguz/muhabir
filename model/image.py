from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean  # <-- Add Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from model.base import Base

class Image(Base):
    __tablename__ = "image"

    id = Column(Integer, primary_key=True, index=True)
    articleId = Column(Integer, ForeignKey("article.id"), nullable=False)
    
    localPath = Column(String, unique=True, nullable=False)
    originalUrl = Column(String, nullable=True)
    
    # --- NEW VISION COLUMNS ---
    analysis = Column(Text, nullable=True)     # The description (e.g. "A red car...")
    tags = Column(Text, nullable=True)         # JSON list (e.g. ["car", "accident"])
    isAnalyzed = Column(Boolean, default=False, index=True)
    # --------------------------

    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    article = relationship("Article", back_populates="images")