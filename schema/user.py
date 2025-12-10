from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

# Shared properties
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    isActive: bool = True
    isSuperuser: bool = False

# Properties to receive on item creation
class UserCreate(UserBase):
    password: str

# Properties to receive on item update
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    isActive: Optional[bool] = None

# Properties to return to client
class UserResponse(UserBase):
    id: int
    createdAt: datetime
    updatedAt: datetime
    model_config = ConfigDict(from_attributes=True)