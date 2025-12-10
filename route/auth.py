from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from model.base import ConfigSessionLocal
from core.security import verifyPassword
from core.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from crud.user import getUserByUsername, createUser
from schema.user import UserCreate, UserResponse, UserBase

router = APIRouter(prefix="/auth", tags=["auth"])

def get_config_db():
    db = ConfigSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_config_db)):
    db_user = getUserByUsername(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return createUser(db, user)

@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_config_db)):
    user = getUserByUsername(db, username=form_data.username)
    if not user or not verifyPassword(form_data.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.isActive:
         raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}