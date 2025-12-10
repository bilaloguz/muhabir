from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

# Shared properties
class SourceBase(BaseModel):
    name: str = Field(..., description="Unique name of the source")
    url: str
    category: Optional[str] = None
    language: str = "tr"
    isActive: bool = True
    fetchIntervalMinutes: int = 60

# Properties to receive on item creation
class SourceCreate(SourceBase):
    pass

# Properties to receive on item update
class SourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    isActive: Optional[bool] = None
    fetchIntervalMinutes: Optional[int] = None

# Properties to return to client
class SourceResponse(SourceBase):
    id: int
    lastFetchTime: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    # Config to allow reading from ORM (SQLAlchemy) objects
    model_config = ConfigDict(from_attributes=True)