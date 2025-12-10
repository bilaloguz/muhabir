
import time
import sys
import os

# Ensure we can import from local modules
sys.path.append(os.getcwd())

from vision.worker import run_vision_worker
from summarizer.worker import run_summary_worker

def main():
    print("Starting Sequential Runner (Low CPU Mode)...")
    print("Cycle: Vision -> Summarizer -> Sleep(60s)")
    
    while True:
        print("\n" + "="*40)
        print("--- [1/2] Running Vision ---")
        try:
            run_vision_worker(run_once=True)
        except Exception as e:
            print(f"Vision Step Error: {e}")

        print("\n--- [2/2] Running Summarizer ---")
        try:
            # Run summarizer until queue empty? 
            # Or just one per cycle? Let's do one per cycle to be very safe, 
            # or loop internal run_once until empty. 
            # Our modified worker breaks after ONE job or if empty.
            # To process more, we call it multiple times or adjust logic.
            # Ideally, we want to clear the queue but sequentially.
            # For now, let's call it once. The loop will come back around.
            run_summary_worker(run_once=True)
        except Exception as e:
            print(f"Summarizer Step Error: {e}")
        
        print("\n--- [3/3] Sleeping 60s ---")
        print("="*40 + "\n")
        time.sleep(60)

if __name__ == "__main__":
    main()
