from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from model.base import ConfigSessionLocal
from schema.user import UserCreate, UserUpdate, UserResponse
from crud.user import getUser, getUsers, createUser, updateUser, deleteUser, getUserByUsername

router = APIRouter(prefix="/user", tags=["user"])

def get_config_db():
    db = ConfigSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_config_db)):
    return getUsers(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_config_db)):
    db_user = getUser(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/", response_model=UserResponse)
def create_new_user(user: UserCreate, db: Session = Depends(get_config_db)):
    db_user = getUserByUsername(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return createUser(db, user)

@router.put("/{user_id}", response_model=UserResponse)
def update_existing_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_config_db)):
    db_user = updateUser(db, user_id, user_update)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=UserResponse)
def delete_existing_user(user_id: int, db: Session = Depends(get_config_db)):
    db_user = deleteUser(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user