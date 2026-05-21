import os
from PIL import Image

def generate_icons():
    # Source image path
    src_path = r"C:\Users\LOQ\.gemini\antigravity\brain\55ffd715-3c0b-47fa-bf0d-df39f0f105e8\fintrack_logo_1779367526497.png"
    
    # Destination directory (public)
    dest_dir = r"d:\Program\Ex\public"
    
    if not os.path.exists(src_path):
        print(f"Source file not found: {src_path}")
        return
        
    print(f"Opening source image: {src_path}")
    img = Image.open(src_path)
    
    # Define outputs (filename, size)
    targets = [
        ("pwa-192x192.png", (192, 192)),
        ("pwa-512x512.png", (512, 512)),
        ("apple-touch-icon.png", (180, 180)),
    ]
    
    for filename, size in targets:
        dest_path = os.path.join(dest_dir, filename)
        resized_img = img.resize(size, Image.Resampling.LANCZOS)
        resized_img.save(dest_path, "PNG")
        print(f"Saved: {dest_path} ({size[0]}x{size[1]})")
        
    # Generate favicon.ico (sizes: 16x16, 32x32, 48x48)
    favicon_path = os.path.join(dest_dir, "favicon.ico")
    img.save(favicon_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Saved: {favicon_path} (ICO)")

if __name__ == "__main__":
    generate_icons()
