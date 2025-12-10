import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

# Import Routers
from route import home, source, user, auth, article

app = FastAPI(title="Muhabir", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Templates
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Our 'web' folder is one level down, so root is one level up from BASE_DIR? 
# Actually app.py is in 'web/', so BASE_DIR is '.../web'.
# 'images' folder is in ROOT '.../muhabir/images'.
ROOT_DIR = os.path.dirname(BASE_DIR) 

templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Mount Static Files (css/js)
static_dir = os.path.join(BASE_DIR, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount Article Images
# Maps http://localhost:8000/static/images/... to /home/bilal/.../muhabir/images/...
images_dir = os.path.join(ROOT_DIR, "images")
if os.path.exists(images_dir):
    app.mount("/static/images", StaticFiles(directory=images_dir), name="images")

# Include Routers
app.include_router(home.router)
app.include_router(source.router)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(article.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}