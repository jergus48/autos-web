import numpy as np
from PIL import Image
import os

# Convert the decorative gradient backdrops (currently lime-on-near-white) into
# clean dark-with-lime glows: flat/bright areas -> near-black, coloured rays -> lime.
TARGETS = [
    "1frdp5ogwralafen31qbi9mrj4c.jpg",
    "k7is9vdf8l9lfdgflrd1dcqnueq.jpg",
    "u7bpd6wpcmwpsvt6vdwwtetojz0.jpg",
    "vpnmljzicrf1mjcor7ions44a.png",
    "5oznhz3dd31o64kjyi84hxf6snw.png",
]
DIRS = ["assets/images", "framerusercontent.com/images"]
LIME = np.array([176, 229, 98], dtype=np.float32)

def recolor(path):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    rgb, alpha = arr[..., :3], arr[..., 3]
    L = (0.2126*rgb[...,0] + 0.7152*rgb[...,1] + 0.0722*rgb[...,2]) / 255.0
    # energy = how far from bright/flat white; flat bg -> ~0, coloured rays -> higher
    e = np.clip((1.0 - L - 0.04) * 2.4, 0.0, 1.0) ** 1.2
    out_rgb = LIME[None, None, :] * e[..., None]        # lime glow on black
    out = np.dstack([np.clip(out_rgb, 0, 255), alpha]).astype(np.uint8)
    res = Image.fromarray(out, "RGBA")
    ext = os.path.splitext(path)[1].lower()
    if ext in (".jpg", ".jpeg"):
        res.convert("RGB").save(path, quality=90)
    else:
        res.save(path)

for d in DIRS:
    for name in TARGETS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            recolor(p); print("darkened:", p)
print("done")
