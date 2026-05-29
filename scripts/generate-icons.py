#!/usr/bin/env python3
"""Generate PWA icons from SVG using cairosvg"""
import os
import sys

# Check if cairosvg is installed
try:
    import cairosvg
except ImportError:
    print("Installing cairosvg...")
    os.system(f"{sys.executable} -m pip install cairosvg")
    import cairosvg

# Icon sizes needed for PWA
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_PATH = os.path.join(BASE_DIR, 'public', 'favicon.svg')
OUTPUT_DIR = os.path.join(BASE_DIR, 'public', 'icons')

def generate_icons():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Read SVG content
    with open(SVG_PATH, 'r', encoding='utf-8') as f:
        svg_content = f.read()
    
    # Generate each size
    for size in SIZES:
        output_path = os.path.join(OUTPUT_DIR, f'icon-{size}x{size}.png')
        try:
            cairosvg.svg2png(
                bytestring=svg_content.encode('utf-8'),
                write_to=output_path,
                output_width=size,
                output_height=size
            )
            print(f"✓ Generated {size}x{size}")
        except Exception as e:
            print(f"✗ Failed {size}x{size}: {e}")
    
    print(f"\nIcons generated in: {OUTPUT_DIR}")

if __name__ == '__main__':
    generate_icons()
