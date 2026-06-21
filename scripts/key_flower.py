"""
Turn the black-background flower frames into transparent WebP frames.

The frames are a glowing subject composited over pure black, so the pixel
values are effectively premultiplied by their own coverage. We recover an
alpha matte from per-pixel brightness (max of R,G,B), feather the low end so
edges blend softly, then un-premultiply so the edge colours stay true instead
of going muddy/dark. The bottom-right watermark region is forced fully
transparent.
"""
import glob
import os
import numpy as np
from PIL import Image

SRC = "Assets/Images/Flower"
OUT = "public/flower_t"

# Alpha ramp (0-255 brightness): fully transparent at/below LO, opaque at/above HI.
LO, HI = 14.0, 64.0
# Watermark cover box, as fractions of width/height (bottom-right corner).
WM_X, WM_Y = 0.78, 0.76

os.makedirs(OUT, exist_ok=True)
files = sorted(
    glob.glob(os.path.join(SRC, "ezgif-frame-*.png"))
    + glob.glob(os.path.join(SRC, "ezgif-frame-*.jpg"))
)
print(f"{len(files)} frames")

for i, path in enumerate(files, 1):
    img = Image.open(path).convert("RGB")
    arr = np.asarray(img, dtype=np.float32)  # H,W,3
    h, w = arr.shape[:2]

    value = arr.max(axis=2)  # brightness per pixel
    alpha = np.clip((value - LO) / (HI - LO), 0.0, 1.0)  # 0..1 matte

    # Un-premultiply: color = frame / alpha (frame was color*alpha over black).
    safe = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip(arr / safe, 0, 255)

    out = np.empty((h, w, 4), dtype=np.uint8)
    out[..., :3] = rgb.astype(np.uint8)
    out[..., 3] = (alpha * 255).astype(np.uint8)

    # Kill the watermark corner entirely.
    x0, y0 = int(w * WM_X), int(h * WM_Y)
    out[y0:, x0:, 3] = 0

    Image.fromarray(out, "RGBA").save(
        os.path.join(OUT, f"frame-{i:03d}.webp"), "WEBP", quality=82, method=6
    )

print("done ->", OUT)
