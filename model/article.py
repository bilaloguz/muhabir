from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from datetime import datetime
from model.base import Base
from sqlalchemy.orm import relationship

class Article(Base):

    __tablename__ = "article"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    content = Column(Text)
    pubDate = Column(DateTime)
    category = Column(String, index=True, nullable=True)
    language = Column(String, default="tr")
    sourceName = Column(String, index=True, nullable=False)
    isSummarized = Column(Boolean, default=False)
    summary = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Establish relationship
    images = relationship("Image", back_populates="article")