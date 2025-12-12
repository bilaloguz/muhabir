from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ImageBase(BaseModel):
    localPath: str
    originalUrl: str
    isAnalyzed: bool = False
    analysis: Optional[str] = None
    tags: Optional[str] = None

class ImageCreate(ImageBase):
    pass

class ImageUpdate(BaseModel):
    analysis: Optional[str] = None
    tags: Optional[str] = None

class ImageResponse(ImageBase):
    id: int
    createdAt: datetime
    model_config = ConfigDict(from_attributes=True)
