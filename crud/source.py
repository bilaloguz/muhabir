from sqlalchemy.orm import Session
from model.source import Source
from schema.source import SourceCreate, SourceUpdate

def getSource(db: Session, sourceId: int):
    return db.query(Source).filter(Source.id == sourceId).first()

def getSources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Source).offset(skip).limit(limit).all()

def getActiveSources(db: Session):
    return db.query(Source).filter(Source.isActive == True).all()

def createSource(db: Session, source: SourceCreate):
    dbSource = Source(
        name=source.name,
        url=str(source.url),
        fetchIntervalMinutes=source.fetchIntervalMinutes,
        isActive=source.isActive,
        category=source.category,
        language=source.language
    )
    db.add(dbSource)
    db.commit()
    db.refresh(dbSource)
    return dbSource

def updateSource(db: Session, sourceId: int, sourceUpdate: SourceUpdate):
    dbSource = getSource(db, sourceId)
    if not dbSource:
        return None
    
    updateData = sourceUpdate.model_dump(exclude_unset=True)
    for key, value in updateData.items():
        setattr(dbSource, key, value)
        
    db.add(dbSource)
    db.commit()
    db.refresh(dbSource)
    return dbSource

def deleteSource(db: Session, sourceId: int):
    dbSource = getSource(db, sourceId)
    if dbSource:
        db.delete(dbSource)
        db.commit()
    return dbSource