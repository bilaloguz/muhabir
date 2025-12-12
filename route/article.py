from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from model.base import TodaySessionLocal
from model.base import TodaySessionLocal
from schema.article import ArticleUpdate, ArticleResponse, ArticleCreate
from schema.image import ImageUpdate, ImageResponse, ImageCreate
from crud.article import getArticle, getArticles, createArticle, updateArticle, deleteArticle, getFilterMetadata, updateImage, getImage, createImage

router = APIRouter(prefix="/article", tags=["article"])

def get_today_db():
    db = TodaySessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/filters")
def get_filters(db: Session = Depends(get_today_db)):
    return getFilterMetadata(db)

@router.get("/", response_model=List[ArticleResponse])
def list_articles(
    skip: int = 0, 
    limit: int = 100, 
    sort_by: str = 'pubDate',
    sort_order: str = 'desc',
    title: str = None,
    category: List[str] = Query(None),
    source: List[str] = Query(None),
    language: List[str] = Query(None),
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_today_db)
):
    return getArticles(
        db, 
        skip=skip, 
        limit=limit, 
        sort_by=sort_by, 
        sort_order=sort_order,
        title_ilike=title,
        category_in=category,
        source_in=source,
        language_in=language,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/{article_id}", response_model=ArticleResponse)
def get_article_details(article_id: int, db: Session = Depends(get_today_db)):
    db_article = getArticle(db, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    return db_article

@router.post("/", response_model=ArticleResponse)
def manual_create_article(article: ArticleCreate, db: Session = Depends(get_today_db)):
    # Manual creation
    db_article = createArticle(db, article)
    if not db_article:
         raise HTTPException(status_code=400, detail="Article already exists or URL invalid")
    return db_article

@router.put("/{article_id}", response_model=ArticleResponse)
def update_article_details(article_id: int, article_update: ArticleUpdate, db: Session = Depends(get_today_db)):
    db_article = updateArticle(db, article_id, article_update)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    return db_article

@router.put("/image/{image_id}", response_model=ImageResponse)
def update_image_details(image_id: int, image_update: ImageUpdate, db: Session = Depends(get_today_db)):
    db_image = updateImage(db, image_id, image_update)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    return db_image

@router.put("/image/{image_id}/content", response_model=ImageResponse)
async def update_image_content(image_id: int, file: UploadFile = File(...), db: Session = Depends(get_today_db)):
    db_image = getImage(db, image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Path resolution:
    # DB stores 'images/filename.jpg'. 
    # The file system root has 'images/' folder.
    # web/app.py mounts '/static/images' -> './images'.
    
    path = db_image.localPath
    # Clean path if it has leading / or static/
    if path.startswith("/"): path = path[1:]
    if path.startswith("static/"): path = path.replace("static/", "", 1)
    
    file_location = path
    
    # Ensure directory exists
    import os
    os.makedirs(os.path.dirname(file_location), exist_ok=True)
    
    content = await file.read()
    with open(file_location, "wb+") as file_object:
        file_object.write(content)
        
    # Update timestamp
    db_image.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_image)
    
    return db_image

@router.post("/{article_id}/image", response_model=ImageResponse)
async def upload_article_image(article_id: int, file: UploadFile = File(...), db: Session = Depends(get_today_db)):
    db_article = getArticle(db, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    import uuid
    import os
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    
    # Define relative and absolute paths
    # We follow the convention: 'images/filename' stored in DB
    relative_path = f"images/{filename}"
    
    # Note: 'images/' folder at root is mounted to /static/images
    file_location = relative_path
    
    # Ensure directory
    os.makedirs(os.path.dirname(file_location), exist_ok=True)
    
    content = await file.read()
    with open(file_location, "wb+") as file_object:
        file_object.write(content)
        
    # Create DB record
    image_data = ImageCreate(
        localPath=relative_path,
        originalUrl="", # Maybe we should store something indicating source?
        isAnalyzed=False
    )
    
    return createImage(db, image_data, article_id)

@router.post("/image/{image_id}/process")
def process_image_endpoint(
    image_id: int, 
    action: str = Query(..., regex="^(remove_bg|smart_expand|enhance)$"), 
    db: Session = Depends(get_today_db)
):
    db_image = getImage(db, image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    path = db_image.localPath
    if path.startswith("/"): path = path[1:]
    if path.startswith("static/"): path = path.replace("static/", "", 1)
    
    full_path = path

    import os
    import tempfile
    from fastapi.responses import FileResponse, StreamingResponse
    import io

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    try:
        from vision.editor import process_remove_bg, process_smart_expand, process_enhance
        
        # Create a temp file for output
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            target_path = tmp.name
        
        # Process to temp file
        if action == "remove_bg":
            process_remove_bg(full_path, target_path)
        elif action == "smart_expand":
            process_smart_expand(full_path, target_path)
        elif action == "enhance":
            process_enhance(full_path, target_path)
            
        # Instead of saving to DB, we return the file content directly
        # Read the file into memory to delete the temp file safely (or use FileResponse with background task)
        # For simplicity with smallish images, read to memory.
        
        with open(target_path, "rb") as f:
            content = f.read()
            
        os.unlink(target_path) # Clean up
        
        return StreamingResponse(io.BytesIO(content), media_type="image/jpeg")
        
    except Exception as e:
        print(f"Processing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{article_id}", response_model=ArticleResponse)
def delete_article_entry(article_id: int, db: Session = Depends(get_today_db)):
    db_article = deleteArticle(db, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    return db_article