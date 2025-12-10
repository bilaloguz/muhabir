import time
import os
from openai import OpenAI
from model.base import ConfigSessionLocal, TodaySessionLocal
from crud.job import getNextJob, markJobCompleted, incrementJobRetry, markJobFailed
from crud.article import getArticleByUrl, updateArticle
from schema.article import ArticleUpdate

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2")
# Configurable Language
SUMMARY_LANGUAGE = os.getenv("SUMMARY_LANGUAGE", "Turkish") 

client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="ollama")

def summarize_text(text: str) -> str:
    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "Sen tecrübeli bir haber editörüsün. "
                        "Görevin, sana verilen haber metnini Türkçe olarak özetlemektir. "
                        "KURALLAR:\n"
                        "1. Sadece Türkçe cevap ver.\n"
                        "2. Haberin en önemli noktalarını 3-4 maddelik madde işaretleri (bullet points) halinde yaz.\n"
                        "3. Asla Çince veya başka bir dil kullanma.\n"
                        "4. Eğer metin boş veya anlamsızsa 'İçerik yok' diye cevap ver."
                    )
                },
                {"role": "user", "content": f"Aşağıdaki haberi özetle:\n\n{text}"}
            ],
            timeout=300.0 # Increased timeout
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return None

def run_summary_worker(run_once=False):
    print(f"Summarizer Worker started (Language: {SUMMARY_LANGUAGE})...")
    while True:
        configDb = ConfigSessionLocal()
        todayDb = TodaySessionLocal()
        
        try:
            job = getNextJob(configDb)
            if not job:
                if run_once: break
                time.sleep(5) 
                continue

            print(f"Processing Job {job.id} for {job.articleUrl}")
            
            article = getArticleByUrl(todayDb, job.articleUrl)
            if not article:
                print("Article not found in TodayDB or moved. Deleting Job.")
                markJobCompleted(configDb, job.id)
                continue

            summary = summarize_text(article.content)
            
            if summary:
                updateArticle(todayDb, article.id, ArticleUpdate(
                    isSummarized=True,
                    summary=summary
                ))
                markJobCompleted(configDb, job.id)
                print(f"Job {job.id} complete.")
            else:
                # Retry Logic
                print(f"Job {job.id} failed to summarize.")
                attempts = incrementJobRetry(configDb, job.id)
                print(f"Retry count: {attempts}")
                
                if attempts >= 3:
                     print(f"Job {job.id} exceeded max retries. Marking FAILED.")
                     markJobFailed(configDb, job.id)
                
                time.sleep(5)
            
            if run_once: break # Processed one job, then exit

        except Exception as e:
            print(f"Worker Loop Error: {e}")
            time.sleep(5)
        finally:
            configDb.close()
            todayDb.close()

if __name__ == "__main__":
    run_worker()