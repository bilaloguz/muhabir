import os
from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from model.base import TodaySessionLocal
from model.article import Article

router = APIRouter()

# Setup Templates (Pointing relative to project root)
# We assume the code runs from the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "web", "templates"))

def get_db():
    db = TodaySessionLocal()
    try:
        yield db
    finally:
        db.close()

from typing import List
from schema.article import ArticleResponse
from sqlalchemy.orm import joinedload

@router.get("/", response_model=List[ArticleResponse])
def home(request: Request, db: Session = Depends(get_db)):
    # Fetch latest 50 articles, order by Date Descending, Eager load images
    articles = db.query(Article).options(joinedload(Article.images))\
        .order_by(Article.pubDate.desc()).limit(50).all()
    return articles