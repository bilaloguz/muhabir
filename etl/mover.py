import threading
import time
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Set

from model.base import ConfigSessionLocal
from crud.source import getActiveSources, updateSource, getSource
from schema.source import SourceUpdate
from etl.mover import moveArticles

class FetcherManager:
    def __init__(self, max_workers: int = 10):
        self._stop_event = threading.Event()
        self._thread = None
        self._pool = ThreadPoolExecutor(max_workers=max_workers)
        self._running_tasks: Set[int] = set()
        self._lock = threading.Lock()
        
        # Mover Config
        self._move_time_str = os.getenv("MOVE_TIME", "00:00")
        self._last_move_run = None 

    def start(self):
        if self._thread is None:
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()
            print("FetcherManager started.")

    def stop(self):
        if self._thread:
            print("Stopping FetcherManager...")
            self._stop_event.set()
            self._thread.join()
            self._pool.shutdown(wait=True)
            print("FetcherManager stopped.")
            
    def start_source(self, source_id: int):
        db = ConfigSessionLocal()
        try:
            updateSource(db, source_id, SourceUpdate(isActive=True))
            print(f"Source {source_id} enabled.")
            self._schedule_task(source_id) 
        finally:
            db.close()

    def stop_source(self, source_id: int):
        db = ConfigSessionLocal()
        try:
            updateSource(db, source_id, SourceUpdate(isActive=False))
            print(f"Source {source_id} disabled.")
        finally:
            db.close()

    def _run_loop(self):
        while not self._stop_event.is_set():
            try:
                self._check_and_schedule_all()
                self._check_and_run_mover()
            except Exception as e:
                print(f"Error in Loop: {e}")
            
            for _ in range(10): 
                if self._stop_event.is_set():
                    break
                time.sleep(1)

    def _check_and_run_mover(self):
        # Parse Schedule
        try:
            hour, minute = map(int, self._move_time_str.split(":"))
        except ValueError:
            hour, minute = 0, 0
            
        now = datetime.now()
        scheduled_today = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        # Logic: If now > scheduled_time AND we haven't run it today
        if now >= scheduled_today:
            # Check if execution needed
            today_str = now.date().isoformat()
            if self._last_move_run != today_str:
                # Add drift protection: don't run if we are too far past? 
                # For restart resistance without DB, we might skip if it's startup?
                # For now, simple logic:
                print(f"Triggering Scheduled Move at {now}")
                try:
                    moveArticles()
                    self._last_move_run = today_str
                except Exception as e:
                    print(f"Mover failed: {e}")

    def _check_and_schedule_all(self):
        # ... (Same as before) ...
        db = ConfigSessionLocal()
        try:
            sources = getActiveSources(db)
            now = datetime.utcnow()
            
            for source in sources:
                shouldFetch = False
                if not source.lastFetchTime:
                    shouldFetch = True
                else:
                    nextFetch = source.lastFetchTime + timedelta(minutes=source.fetchIntervalMinutes)
                    if now >= nextFetch:
                        shouldFetch = True
                
                if shouldFetch:
                    self._schedule_task(source.id, source.url)
        finally:
            db.close()

    def _schedule_task(self, source_id: int, source_url: str = None):
        # ... (Same as before) ...
        if not source_url:
            db = ConfigSessionLocal()
            src = getSource(db, source_id)
            db.close()
            if src:
                source_url = src.url
            else:
                return

        with self._lock:
            if source_id in self._running_tasks:
                return
            self._running_tasks.add(source_id)
            
        self._pool.submit(self._task_wrapper, source_id, source_url)

    def _task_wrapper(self, sourceId: int, sourceUrl: str):
        try:
            from etl.fetcher import processSource 
            
            # print(f"Fetching source {sourceId}...") # verbose off
            processSource(sourceId, sourceUrl)
            
            self._update_last_fetch_time(sourceId)
        except Exception as e:
            print(f"Error fetching source {sourceId}: {e}")
        finally:
            with self._lock:
                self._running_tasks.discard(sourceId)

    def _update_last_fetch_time(self, sourceId: int):
        db = ConfigSessionLocal()
        try:
            updateSource(db, sourceId, SourceUpdate(lastFetchTime=datetime.utcnow()))
        finally:
            db.close()

fetcherManager = FetcherManager()