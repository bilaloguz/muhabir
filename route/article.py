from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from model.base import TodaySessionLocal
from schema.article import ArticleUpdate, ArticleResponse, ArticleCreate
from crud.article import getArticle, getArticles, createArticle, updateArticle, deleteArticle, getFilterMetadata

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

@router.delete("/{article_id}", response_model=ArticleResponse)
def delete_article_entry(article_id: int, db: Session = Depends(get_today_db)):
    db_article = deleteArticle(db, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    return db_article