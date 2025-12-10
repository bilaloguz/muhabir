import uvicorn
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from web.app import app
from etl.fetcher_manager import fetcherManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting System...")
    fetcherManager.start()
    
    # Optional: Start Summarizer in a thread for all-in-one convenience
    # summarizer_thread = threading.Thread(target=run_worker, daemon=True)
    # summarizer_thread.start()
    
    yield
    # Shutdown
    print("Shutting down System...")
    fetcherManager.stop()

# Assign lifespan to the app
app.router.lifespan_context = lifespan

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)