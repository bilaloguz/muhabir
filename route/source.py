from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from model.base import ConfigSessionLocal
from schema.source import SourceCreate, SourceUpdate, SourceResponse
from crud.source import getSource, getSources, createSource, updateSource, deleteSource
from etl.fetcher_manager import fetcherManager

router = APIRouter(prefix="/source", tags=["source"])

def get_config_db():
    db = ConfigSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[SourceResponse])
def list_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_config_db)):
    return getSources(db, skip=skip, limit=limit)

@router.get("/{source_id}", response_model=SourceResponse)
def get_source(source_id: int, db: Session = Depends(get_config_db)):
    db_source = getSource(db, source_id)
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    return db_source

@router.post("/", response_model=SourceResponse)
def create_new_source(source: SourceCreate, db: Session = Depends(get_config_db)):
    return createSource(db, source)

@router.put("/{source_id}", response_model=SourceResponse)
def update_existing_source(source_id: int, source_update: SourceUpdate, db: Session = Depends(get_config_db)):
    db_source = updateSource(db, source_id, source_update)
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    # If fetchInterval changed or isActive changed, we might want to notify Manager?
    # For now, Manager polls DB regularly so it picks up changes automatically.
    # But if specifically Toggled Active:
    if source_update.isActive is True:
        fetcherManager.start_source(source_id)
    elif source_update.isActive is False:
        fetcherManager.stop_source(source_id)
        
    return db_source

@router.delete("/{source_id}", response_model=SourceResponse)
def delete_existing_source(source_id: int, db: Session = Depends(get_config_db)):
    db_source = deleteSource(db, source_id)
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    fetcherManager.stop_source(source_id) # Ensure stopped
    return db_source

@router.post("/{source_id}/start")
def start_source_fetcher(source_id: int):
    fetcherManager.start_source(source_id)
    return {"message": f"Source {source_id} started"}

@router.post("/{source_id}/stop")
def stop_source_fetcher(source_id: int):
    fetcherManager.stop_source(source_id)
    return {"message": f"Source {source_id} stopped"}