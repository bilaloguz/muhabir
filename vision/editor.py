import cv2
import numpy as np
from rembg import remove
from PIL import Image
import io

def process_remove_bg(input_path: str, output_path: str):
    """
    Removes background using rembg.
    """
    with open(input_path, 'rb') as i:
        input_data = i.read()
        output_data = remove(input_data)
    
    with open(output_path, 'wb') as o:
        o.write(output_data)

def process_smart_expand(input_path: str, output_path: str):
    """
    Converts input image to 16:9 aspect ratio by filling sides with blurred version of the original.
    """
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError("Could not read image")

    h, w = img.shape[:2]
    target_aspect = 16 / 9
    
    # Calculate target dimensions
    # If image is too tall (h/w > 9/16), we need to widen it.
    # If image is too wide (w/h > 16/9), we usually don't need to expand for 16:9 unless we want to map it exactly.
    # Logic: fit the original image centrally into a 16:9 container that matches the original's height (or width).
    
    # We want final H = h (keep original resolution height) -> New W = h * (16/9)
    # But if original is already wider than 16:9, we might pad top/bottom? 
    # Usually "Smart Expand" is for vertical/square content to fit horizontal screens.
    
    current_aspect = w / h
    
    if current_aspect >= target_aspect:
        # Already wide enough, or wider. 
        # For this feature, maybe we just save as is or force letterbox?
        # Let's assume we strictly want 16:9. If wider, we might crop or pad top/bottom.
        # Let's pad top/bottom for wider images to preserve content.
        new_w = w
        new_h = int(w / target_aspect)
        # But if current_aspect > target_aspect (e.g. 21:9), h is small relative to w.
        # new_h = w / 1.77. 
        # if w=1000, h=400 (2.5 aspect). new_h = 562. We pad 81px top/bottom.
    else:
        # Vertical or Square. h is large relative to w. 
        # Fix height, expand width.
        new_h = h
        new_w = int(h * target_aspect)
    
    # Create canvas
    canvas = np.zeros((new_h, new_w, 3), dtype=np.uint8)
    
    # 1. Fill background with blurred version
    # Resize original to cover the canvas completely (crop style)
    scale = max(new_w / w, new_h / h)
    bg_w = int(w * scale)
    bg_h = int(h * scale)
    bg_img = cv2.resize(img, (bg_w, bg_h))
    
    # Crop center of bg_img to fit canvas
    start_x = (bg_w - new_w) // 2
    start_y = (bg_h - new_h) // 2
    bg_crop = bg_img[start_y:start_y+new_h, start_x:start_x+new_w]
    
    # Strong Blur
    bg_blurred = cv2.GaussianBlur(bg_crop, (0, 0), 30) # sigmaX=30 for strong blur
    # Dim it slightly
    bg_blurred = (bg_blurred * 0.7).astype(np.uint8)
    
    canvas[:, :] = bg_blurred
    
    # 2. Place original in center
    # Calculate offset
    y_offset = (new_h - h) // 2
    x_offset = (new_w - w) // 2
    
    # In case original was wider, offsets might be negative if logic above wasn't perfect, but:
    # if current < target (vertical), new_w > w, x_offset > 0. new_h = h, y_offset = 0.
    # if current > target (wide), new_w = w, x_offset = 0. new_h > h, y_offset > 0.
    
    canvas[y_offset:y_offset+h, x_offset:x_offset+w] = img
    
    cv2.imwrite(output_path, canvas)

def process_enhance(input_path: str, output_path: str):
    """
    Upscales image 2x using bicubic interpolation and applies sharpening.
    """
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError("Could not read image")
    
    # Upscale 2x
    h, w = img.shape[:2]
    new_h, new_w = h * 2, w * 2
    upscaled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    
    # Sharpen (Unsharp Mask)
    gaussian = cv2.GaussianBlur(upscaled, (0, 0), 2.0)
    # Weighted add: src * 1.5 - blurred * 0.5 (Standard sharpening)
    sharpened = cv2.addWeighted(upscaled, 1.5, gaussian, -0.5, 0)
    
    cv2.imwrite(output_path, sharpened)
