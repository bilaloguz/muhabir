import httpx
import os
import uuid
from bs4 import BeautifulSoup
from email.utils import parsedate_to_datetime
from datetime import datetime
from urllib.parse import urljoin

from model.base import TodaySessionLocal, ConfigSessionLocal
from crud.article import createArticle, getArticleByUrl
from schema.article import ArticleCreate, ArticleUpdate
from crud.job import addJob
from model.image import Image
from crud.article import updateArticle
from crud.source import getSource

# Ensure images directory exists
IMAGES_ROOT = "images"
os.makedirs(IMAGES_ROOT, exist_ok=True)

# Filters for junk images
JUNK_KEYWORDS = ["logo", "icon", "share", "social", "button", "badge", "avatar", "profile", "tracker", "pixel", "ad-", "banner"]

def download_and_save_image(src_url: str, article_base_url: str) -> tuple[str, str, str]:
    """
    Downloads image with filtering for junk (logos, icons, tiny files).
    Returns: (local_path, web_path, original_url) or None
    """
    if not src_url:
        return None
        
    try:
        # 1. Text Filter: Check URL for junk keywords
        lower_url = src_url.lower()
        if any(keyword in lower_url for keyword in JUNK_KEYWORDS):
            return None
            
        # Avoid data URIs, svgs (icons), and gifs (often loaders)
        if src_url.startswith("data:") or ".svg" in lower_url or ".gif" in lower_url:
            return None

        headers = {"User-Agent": "Mozilla/5.0"}
        full_url = urljoin(article_base_url, src_url)
        
        # 2. Content Filter: Stream headers first
        with httpx.stream("GET", full_url, headers=headers, timeout=10.0) as resp:
            resp.raise_for_status()
            
            # Size Check (Skip if < 5KB)
            content_length = resp.headers.get("content-length")
            if content_length and int(content_length) < 5120:
                return None
                
            # Content-Type Check
            ctype = resp.headers.get("content-type", "").lower()
            if "image" not in ctype:
                 # Last chance: check extension if header is missing/wrong
                 if not any(ext in lower_url for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                     return None

            # --- Save Logic ---
            now = datetime.utcnow()
            year_str = now.strftime("%Y")
            month_str = now.strftime("%m")
            folder_path = os.path.join(IMAGES_ROOT, year_str, month_str)
            os.makedirs(folder_path, exist_ok=True)
            
            # Extension deduction
            ext = ".jpg"
            if "png" in ctype or ".png" in lower_url: ext = ".png"
            elif "webp" in ctype or ".webp" in lower_url: ext = ".webp"
            
            filename = f"{uuid.uuid4()}{ext}"
            local_file_path = os.path.join(folder_path, filename)
            web_path = f"/static/images/{year_str}/{month_str}/{filename}"
            
            # Download body
            with open(local_file_path, "wb") as f:
                downloaded_size = 0
                for chunk in resp.iter_bytes():
                    f.write(chunk)
                    downloaded_size += len(chunk)
            
            # Final Size Check (if Content-Length was missing)
            if downloaded_size < 5120: 
                os.remove(local_file_path)
                return None
            
            return (local_file_path, web_path, full_url)

    except Exception as e:
        # print(f"Image download error: {e}")
        return None

def fetch_and_process_article_content(db, article_db_obj, url: str) -> str:
    """
    EXTRACTOR MODE (V3 - PLAIN TEXT):
    Returns pure text separated by newlines. 
    Images are saved to DB but excluded from text.
    """
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = httpx.get(url, headers=headers, timeout=10.0, follow_redirects=True)
        resp.raise_for_status()
        
        soup = BeautifulSoup(resp.content, "html.parser")
        
        # 1. Identify Container
        article_node = soup.find("article")
        if not article_node:
            candidates = ["content", "news-detail", "article-body", "post-body", "entry-content"]
            for token in candidates:
                # Limit search to Layout/Block tags to avoid matching menu items (li, span, a)
                article_node = soup.find(["div", "main", "section", "article"], class_=lambda c: c and token in c) or \
                               soup.find(["div", "main", "section", "article"], id=lambda i: i and token in i)
                if article_node: break
        
        if not article_node:
            article_node = soup.body

        # 2. Decompose Junk
        junk_patterns = ["share", "social", "related", "most-read", "banner", "author-info", "date-info", "taboola", "newsletter"]
        def is_junk_node(tag):
            if not tag.name: return False
            check_str = (" ".join(tag.get("class") or []) + " " + str(tag.get("id") or "")).lower()
            return any(p in check_str for p in junk_patterns)

        for tag in article_node.find_all(is_junk_node): tag.decompose()
        for tag in article_node(["script", "style", "noscript", "button", "iframe", "form", "svg", "nav", "aside", "footer", "header"]): tag.decompose()

        clean_text_lines = []
        
        # 3. Extraction Loop
        for element in article_node.find_all(['p', 'h2', 'img', 'li']):
            
            # CASE A: IMAGE (Save to DB, Skip Text)
            if element.name == 'img':
                src = element.get("src") or element.get("data-src")
                if src and "logo" not in src.lower() and "icon" not in src.lower():
                    result = download_and_save_image(src, url)
                    if result:
                        db.add(Image(articleId=article_db_obj.id, localPath=result[0], originalUrl=result[2]))
                continue # Do not add <img> tag to text

            # CASE B: TEXT
            text = element.get_text(" ", strip=True)
            if len(text) < 20: continue 
            
            # Filters
            text_lower = text.lower()
            block_phrases = ["haberi devamı", "ilginizi çekebilir", "paylaş:", "abone ol", "flipboard"]
            if any(bp in text_lower for bp in block_phrases): continue
            if text.startswith("#"): continue
            if sum(c.isdigit() for c in text) > 6 and ("/" in text or ":" in text): continue
            
            if clean_text_lines and text in clean_text_lines[-1]: continue

            # Append PLAIN TEXT
            clean_text_lines.append(text)

        return "\n\n".join(clean_text_lines)

    except Exception as e:
        print(f"Error: {e}")
        return ""

def processSource(sourceId: int, sourceUrl: str, sourceName: str):
    print(f"Downloading RSS {sourceName} ({sourceUrl})...")
    
    # 1. Fetch Source Object to get Category/Language
    db_config = ConfigSessionLocal()
    source_obj = getSource(db_config, sourceId)
    db_config.close()

    try:
        response = httpx.get(sourceUrl, timeout=60.0)
    except Exception as e:
        print(f"Failed to fetch RSS {sourceUrl}: {e}")
        return

    soup = BeautifulSoup(response.content, features="xml")
    items = soup.find_all(["item", "entry"])
    print(f"Found {len(items)} items in {sourceName}")
    
    db = TodaySessionLocal()
    new_count = 0
    
    try:
        for item in items:
            # ... (Title/Link extraction logic stays the same) ...
            title_node = item.find("title")
            title = title_node.get_text().strip() if title_node else "No Title"
            
            link = None
            link_node = item.find("link")
            if link_node: 
                link = link_node.get_text().strip()
                if not link and link_node.has_attr('href'): link = link_node['href']
            if not link:
                atom_link = item.find(["atom:link", "link"])
                if atom_link and atom_link.has_attr("href"): link = atom_link["href"]
            if not link: continue
            
            if getArticleByUrl(db, link): continue
            
            pubDate = datetime.utcnow()
            # ... (Date parsing logic stays the same) ...
            pubDateNode = item.find(["pubDate", "pubdate", "published", "updated"])
            if pubDateNode:
                try:
                    pubDate = parsedate_to_datetime(pubDateNode.get_text()).replace(tzinfo=None)
                except: pass

            # CREATE ARTICLE with Category & Language
            articleData = ArticleCreate(
                title=title,
                url=link,
                content="Fetching...",
                pubDate=pubDate,
                sourceName=sourceName,
                isSummarized=False,
                category=source_obj.category,  # <--- PASS CATEGORY
                language=source_obj.language  # <--- PASS LANGUAGE
            )
            created_article = createArticle(db, articleData)
            
            if created_article:
                new_count += 1
                # ... (Content processing stays the same) ...
                print(f"Processing content for: {title}")
                final_html = fetch_and_process_article_content(db, created_article, link)
                if final_html: 
                    created_article.content = final_html
                    db.add(created_article)
                    db.commit()
                
                configDb = ConfigSessionLocal()
                addJob(configDb, link)
                configDb.close()
        
        db.commit()
        print(f"Saved {new_count} new articles from {sourceName}")
        
    except Exception as e:
        print(f"Error processing RSS {sourceName}: {e}")
        db.rollback()
    finally:
        db.close()