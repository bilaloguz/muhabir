import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Set

from model.base import ConfigSessionLocal
from crud.source import getActiveSources, updateSource, getSource
from schema.source import SourceUpdate
# from etl.fetcher import processSource  <-- Imported inside wrapper

class FetcherManager:
    def __init__(self, max_workers: int = 10):
        self._stop_event = threading.Event()
        self._thread = None
        self._pool = ThreadPoolExecutor(max_workers=max_workers)
        self._running_tasks: Set[int] = set()
        self._lock = threading.Lock()

    def start(self):
        """Starts the main orchestration loop."""
        if self._thread is None:
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()
            print("FetcherManager started.")

    def stop(self):
        """Stops the main orchestration loop."""
        if self._thread:
            print("Stopping FetcherManager...")
            self._stop_event.set()
            self._thread.join()
            self._pool.shutdown(wait=True)
            print("FetcherManager stopped.")
            
    def start_source(self, source_id: int):
        """Enable a source and schedule it immediately."""
        db = ConfigSessionLocal()
        try:
            updateSource(db, source_id, SourceUpdate(isActive=True))
            print(f"Source {source_id} enabled.")
            # Trigger immediate fetch
            self._schedule_task(source_id) 
        finally:
            db.close()

    def stop_source(self, source_id: int):
        """Disable a source."""
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
            except Exception as e:
                print(f"Error in Check Loop: {e}")
            
            # Check every 10 seconds (responsive enough)
            for _ in range(10): 
                if self._stop_event.is_set():
                    break
                time.sleep(1)

    def _check_and_schedule_all(self):
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
                    self._schedule_task(source.id, source.url, source.name)
        finally:
            db.close()
            
    def _schedule_task(self, source_id: int, source_url: str = None, source_name: str = None):
        """Thread-safe scheduling."""
        # If url/name not provided (e.g. manual start), fetch it
        if not source_url or not source_name:
            db = ConfigSessionLocal()
            src = getSource(db, source_id)
            db.close()
            if src:
                source_url = src.url
                source_name = src.name
            else:
                return

        with self._lock:
            if source_id in self._running_tasks:
                return
            self._running_tasks.add(source_id)
            
        self._pool.submit(self._task_wrapper, source_id, source_url, source_name)

    def _task_wrapper(self, sourceId: int, sourceUrl: str, sourceName: str):
        try:
            # Import here to avoid circular imports at module level
            from etl.fetcher import processSource 
            
            print(f"Fetching source {sourceId} ({sourceName})...")
            processSource(sourceId, sourceUrl, sourceName)
            
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