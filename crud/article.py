from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from model.article import Article
from model.image import Image
from schema.article import ArticleCreate, ArticleUpdate
from schema.image import ImageUpdate, ImageCreate

def getArticle(db: Session, articleId: int):
    return db.query(Article).filter(Article.id == articleId).first()

def getImage(db: Session, imageId: int):
    return db.query(Image).filter(Image.id == imageId).first()

def updateImage(db: Session, imageId: int, imageUpdate: ImageUpdate):
    dbImage = getImage(db, imageId)
    if not dbImage:
        return None
    
    updateData = imageUpdate.model_dump(exclude_unset=True)
    for key, value in updateData.items():
        setattr(dbImage, key, value)
        
    db.add(dbImage)
    db.commit()
    db.refresh(dbImage)
    return dbImage

def createImage(db: Session, image: ImageCreate, articleId: int):
    dbImage = Image(
        articleId=articleId,
        localPath=image.localPath,
        originalUrl=image.originalUrl,
        analysis=image.analysis,
        tags=image.tags,
        isAnalyzed=image.isAnalyzed
    )
    db.add(dbImage)
    db.commit()
    db.refresh(dbImage)
    return dbImage

def getArticleByUrl(db: Session, url: str):
    return db.query(Article).filter(Article.url == url).first()

def getArticles(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    sort_by: str = 'pubDate', 
    sort_order: str = 'desc',
    title_ilike: str = None,
    category_in: list[str] = None,
    source_in: list[str] = None,
    language_in: list[str] = None,
    start_date: datetime = None,
    end_date: datetime = None
):
    query = db.query(Article).outerjoin(Image)
    
    if title_ilike:
        # Generic search across multiple fields
        search_term = f"%{title_ilike}%"
        query = query.filter(
            or_(
                Article.title.ilike(search_term),
                Article.summary.ilike(search_term),
                Article.content.ilike(search_term),
                Image.analysis.ilike(search_term),
                Image.tags.ilike(search_term)
            )
        ).distinct()
    
    if category_in:
        query = query.filter(Article.category.in_(category_in))
        
    if source_in:
        query = query.filter(Article.sourceName.in_(source_in))
        
    if language_in:
        query = query.filter(Article.language.in_(language_in))
        
    if start_date:
        query = query.filter(Article.pubDate >= start_date)
        
    if end_date:
        query = query.filter(Article.pubDate <= end_date)
    
    # Determine sort column
    sort_column = getattr(Article, sort_by, Article.pubDate)
    
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
        
    return query.offset(skip).limit(limit).all()

def createArticle(db: Session, article: ArticleCreate):
    if getArticleByUrl(db, str(article.url)):
        return None    
    dbArticle = Article(
        title=article.title,
        url=str(article.url),
        content=article.content,
        pubDate=article.pubDate,
        sourceName=article.sourceName,
        isSummarized=article.isSummarized,
        summary=article.summary,
        category=article.category,
        language=article.language
    )
    db.add(dbArticle)
    db.commit()
    db.refresh(dbArticle)
    return dbArticle

def updateArticle(db: Session, articleId: int, articleUpdate: ArticleUpdate):
    dbArticle = getArticle(db, articleId)
    if not dbArticle:
        return None
    updateData = articleUpdate.model_dump(exclude_unset=True)
    for key, value in updateData.items():
        setattr(dbArticle, key, value)
    db.add(dbArticle)
    db.commit()
    db.refresh(dbArticle)
    return dbArticle

def deleteArticle(db: Session, articleId: int):
    dbArticle = getArticle(db, articleId)
    if dbArticle:
        db.delete(dbArticle)
        db.commit()
    return dbArticle

def getFilterMetadata(db: Session):
    return {
        "categories": [r[0] for r in db.query(Article.category).distinct().filter(Article.category != None).all()],
        "sources": [r[0] for r in db.query(Article.sourceName).distinct().all()],
        "languages": [r[0] for r in db.query(Article.language).distinct().all()]
    }