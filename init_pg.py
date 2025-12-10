from model.base import Base, engine
# Import all models so they are registered with Base metadata
from model.source import Source
from model.user import User
from model.job import Job
from model.article import Article
from model.image import Image  # <--- Added this

def init_db():
    print("Initializing PostgreSQL Database...")
    
    # Create all tables in the unified database
    Base.metadata.create_all(bind=engine)
    
    # Also create the article_images directory if it doesn't exist
    import os
    os.makedirs("images", exist_ok=True)
    
    print("Database initialization complete.")
    print("Tables created: Source, User, Job, Article, Image")
    
if __name__ == "__main__":
    init_db()