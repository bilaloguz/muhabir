from sqlalchemy.orm import Session
from model.user import User
from schema.user import UserCreate, UserUpdate
from core.security import getPasswordHash

def getUser(db: Session, userId: int):
    return db.query(User).filter(User.id == userId).first()

def getUserByUsername(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def getUsers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def createUser(db: Session, user: UserCreate):
    hashedPassword = getPasswordHash(user.password)
    dbUser = User(
        username=user.username,
        email=user.email,
        hashedPassword=hashedPassword,
        isActive=user.isActive,
        isSuperuser=user.isSuperuser
    )
    db.add(dbUser)
    db.commit()
    db.refresh(dbUser)
    return dbUser

def updateUser(db: Session, userId: int, userUpdate: UserUpdate):
    dbUser = getUser(db, userId)
    if not dbUser:
        return None    
    updateData = userUpdate.model_dump(exclude_unset=True)
    if "password" in updateData:
        hashedPassword = getPasswordHash(updateData["password"])
        del updateData["password"]
        updateData["hashedPassword"] = hashedPassword
    for key, value in updateData.items():
        setattr(dbUser, key, value)
    db.add(dbUser)
    db.commit()
    db.refresh(dbUser)
    return dbUser
    
def deleteUser(db: Session, userId: int):
    dbUser = getUser(db, userId)
    if dbUser:
        db.delete(dbUser)
        db.commit()
    return dbUser