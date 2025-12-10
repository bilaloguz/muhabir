import time
import os
import json
import uuid
import ollama
from PIL import Image as PILImage  # Requires: pip install Pillow
from model.base import ConfigSessionLocal
from model.image import Image
from sqlalchemy.orm import Session

# Models
VISION_MODEL = "llava"       # Best for looking
TEXT_MODEL = "qwen2"         # Best for speaking/translating (adjusted to installed model)
MAX_RETRIES = 3

def convert_to_jpg(image_path: str) -> str:
    """Converts image to a temporary JPG file via Pillow. Returns temp file path."""
    try:
        img = PILImage.open(image_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Create temp file
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        img.save(temp_filename, "JPEG")
        return temp_filename
    except Exception as e:
        print(f"Conversion Error: {e}")
        return None

def translate_to_turkish(english_caption: str, english_keywords: list) -> tuple:
    """Translates English content to Turkish using a text-only LLM."""
    try:
        prompt = (
            "You are a professional translator. Translate the following image description and keywords from English to Turkish.\n"
            "1. Translate the caption naturally.\n"
            "2. Translate the keywords accurately.\n"
            "Output JSON format: { 'caption': '...', 'keywords': ['...'] }\n\n"
            f"Input Caption: {english_caption}\n"
            f"Input Keywords: {english_keywords}"
        )

        response = ollama.chat(
            model=TEXT_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        
        content = response['message']['content']
        data = json.loads(content)
        return data.get("caption"), data.get("keywords")
    except Exception as e:
        print(f"Translation Error ({TEXT_MODEL}): {e}")
        # Fallback: Return original English if translation fails, so we don't lose data
        return english_caption, english_keywords

def analyze_image(image_path: str):
    """
    Two-Step Pipeline:
    1. Vision Model -> Describes in English (High Accuracy)
    2. Text Model   -> Translates to Turkish (High Fluency)
    """
    temp_path = None
    try:
        # CONVERT IMAGE FIRST
        temp_path = convert_to_jpg(image_path)
        target_path = temp_path if temp_path else image_path

        # STEP 1: VISION (English)
        prompt_en = (
            "Describe this image in detail in a single sentence. "
            "Also list 5 main keywords. "
            "Format: { 'caption': '...', 'keywords': ['...'] } JSON."
        )
        
        print(f"  > Step 1: Vision (English) with {VISION_MODEL}...")
        response = ollama.chat(
            model=VISION_MODEL,
            messages=[{
                'role': 'user',
                'content': prompt_en,
                'images': [target_path] 
            }],
            format='json'
        )
        
        vision_data = json.loads(response['message']['content'])
        en_caption = vision_data.get("caption")
        en_keywords = vision_data.get("keywords", [])

        if not en_caption:
            return None, None

        # STEP 2: TRANSLATION (Turkish)
        print(f"  > Step 2: Translation (Turkish) with {TEXT_MODEL}...")
        tr_caption, tr_keywords = translate_to_turkish(en_caption, en_keywords)
        
        return tr_caption, tr_keywords

    except Exception as e:
        print(f"Pipeline Error: {e}")
        return None, None
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

def run_vision_worker(run_once=False):
    print(f"Vision Worker started.")
    print(f"  - Vision: {VISION_MODEL}")
    print(f"  - Text:   {TEXT_MODEL}")
    
    while True:
        db = ConfigSessionLocal()
        found_job = False
        try:
            # Fetch unanalyzed images
            images = db.query(Image).filter(Image.isAnalyzed == False).limit(5).all()
            
            if not images:
                if run_once: break # Exit if no work
                time.sleep(10)
                continue
                
            found_job = True
            for img in images:
                print(f"Processing Image {img.id} ({img.localPath})...")
                
                # Check file existence
                if not os.path.exists(img.localPath):
                    print(f"File missing: {img.localPath}. Skipping.")
                    img.isAnalyzed = True
                    img.analysis = "Error: File missing"
                    db.commit()
                    continue

                # RETRY LOOP
                success = False
                for attempt in range(1, MAX_RETRIES + 1):
                    caption, tags = analyze_image(img.localPath)
                    
                    if caption:
                        # Success
                        img.analysis = caption
                        img.tags = json.dumps(tags, ensure_ascii=False) if tags else "[]"
                        img.isAnalyzed = True
                        print(f"  > Done: {caption[:50]}...")
                        success = True
                        break
                    else:
                        print(f"  > Attempt {attempt}/{MAX_RETRIES} failed.")
                        time.sleep(1)
                
                if not success:
                    print(f"FAILED Image {img.id}. Marking as Error.")
                    img.isAnalyzed = True
                    img.analysis = "Error: Analysis Failed"
                    img.tags = "[]"
                
                db.commit()
                
                if run_once: break # Exit after ONE image
            
        except Exception as e:
            print(f"Vision Loop Error: {e}")
            time.sleep(5)
        finally:
            db.close()
        
        if run_once: break # Ensure we exit the outer loop too

if __name__ == "__main__":
    run_vision_worker()