from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from schema.image import ImageResponse

class ArticleBase(BaseModel):
    title: str
    url: str
    content: str
    pubDate: datetime
    sourceName: str
    isSummarized: bool = False
    summary: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = "tr"

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    isSummarized: Optional[bool] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = "tr"

class ArticleResponse(ArticleBase):
    id: int
    createdAt: datetime
    updatedAt: datetime
    images: List[ImageResponse] = []
    
    model_config = ConfigDict(from_attributes=True)