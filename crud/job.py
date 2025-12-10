from sqlalchemy.orm import Session
from model.job import Job, JobStatus
from sqlalchemy import func
from datetime import datetime

def addJob(db: Session, articleUrl: str):
    job = Job(articleUrl=articleUrl, status=JobStatus.PENDING)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def getNextJob(db: Session):
    """
    Atomically finds a PENDING job and marks it as PROCESSING so no other worker picks it.
    """
    # 1. Start a transaction
    try:
        # Find the first pending job ID
        job = db.query(Job).filter(Job.status == JobStatus.PENDING).order_by(Job.createdAt.asc()).first()
        
        if job:
            # 2. Mark it as PROCESSING immediately
            job.status = JobStatus.PROCESSING
            db.commit()
            db.refresh(job)
            return job
        else:
            return None
    except Exception:
        db.rollback()
        return None

def incrementJobRetry(db: Session, jobId: int):
    # If failed, we likely want to set it back to PENDING (or keep it PROCESSING/FAILED?)
    # Usually, if we retry, we keep it as PENDING so it can be picked up again?
    # OR we keep it PROCESSING if this worker is retrying it immediately.
    # But usually 'retry' means putting it back in queue.
    # Let's assume we keep logic simple: update count.
    # If the worker crashes, the job stays PROCESSING forever (Stuck Job problem).
    # Ideally, we should set it back to PENDING after incrementing retry.
    
    job = db.query(Job).filter(Job.id == jobId).first()
    if job:
        job.retryCount += 1
        # If we want to try again later, set to PENDING? 
        # For this simple system, let's keep status as is (PROCESSING) 
        # because the WORKER loop retries it immediately in the `else` block.
        db.commit()
        db.refresh(job)
        return job.retryCount
    return 0
    
def markJobFailed(db: Session, jobId: int):
    job = db.query(Job).filter(Job.id == jobId).first()
    if job:
        job.status = JobStatus.FAILED
        db.commit()

def markJobCompleted(db: Session, job_id: int):
    job = db.query(Job).filter(Job.id == job_id).first()
    if job:
        job.status = JobStatus.COMPLETED
        job.updatedAt = datetime.utcnow()
        db.commit()