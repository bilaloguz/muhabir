import sys
import os

sys.path.append(os.getcwd())
from model.base import SessionLocal, engine
from sqlalchemy import text

def drop_tables():
    session = SessionLocal()
    try:
        print("Dropping tables...")
        # Use CASCADE to handle dependencies automatically, or delete in order
        # Postgres TRUNCATE is faster than DELETE
        session.execute(text("DROP TABLE image, article, source, \"user\", job"))
        session.commit()
        print("All tables dropped successfully.")
    except Exception as e:
        print(f"Error dropping tables: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    confirm = input("This will DELETE ALL DATA. Type 'yes' to confirm: ")
    if confirm == "yes":
        drop_tables()
    else:
        print("Aborted.")