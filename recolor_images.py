import numpy as np
from PIL import Image
import os

# Decorative purple gradient backgrounds -> shift violet hue to deck lime.
TARGETS = [
    "1frdp5ogwralafen31qbi9mrj4c.jpg",   # hero bg
    "k7is9vdf8l9lfdgflrd1dcqnueq.jpg",   # section wave bg
    "u7bpd6wpcmwpsvt6vdwwtetojz0.jpg",   # rounded panel glow
    "vpnmljzicrf1mjcor7ions44a.png",     # small glow
    "5oznhz3dd31o64kjyi84hxf6snw.png",   # small glow
]
DIRS = ["assets/images", "framerusercontent.com/images"]

LIME_HUE = 86.0 / 360.0   # deck lime hue

def rgb_to_hsv_np(a):
    a = a.astype(np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.max(a[..., :3], axis=-1); mn = np.min(a[..., :3], axis=-1)
    df = mx - mn
    h = np.zeros_like(mx)
    mask = df > 1e-6
    # red is max
    idx = (mx == r) & mask
    h[idx] = ((g[idx] - b[idx]) / df[idx]) % 6
    idx = (mx == g) & mask
    h[idx] = ((b[idx] - r[idx]) / df[idx]) + 2
    idx = (mx == b) & mask
    h[idx] = ((r[idx] - g[idx]) / df[idx]) + 4
    h = (h / 6.0) % 1.0
    s = np.where(mx > 1e-6, df / mx, 0)
    v = mx
    return h, s, v

def hsv_to_rgb_np(h, s, v):
    i = np.floor(h * 6).astype(int)
    f = h * 6 - i
    p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s)
    i = i % 6
    r = np.select([i==0,i==1,i==2,i==3,i==4,i==5],[v,q,p,p,t,v])
    g = np.select([i==0,i==1,i==2,i==3,i==4,i==5],[t,v,v,q,p,p])
    b = np.select([i==0,i==1,i==2,i==3,i==4,i==5],[p,p,t,v,v,q])
    out = np.stack([r,g,b], axis=-1)
    return np.clip(out*255, 0, 255).astype(np.uint8)

def recolor(path):
    im = Image.open(path)
    mode = im.mode
    has_alpha = mode in ("RGBA", "LA", "P") and ("transparency" in im.info or mode.endswith("A"))
    im = im.convert("RGBA")
    arr = np.array(im)
    rgb = arr[..., :3]; alpha = arr[..., 3]
    h, s, v = rgb_to_hsv_np(rgb)
    # violet / blue-violet / magenta band
    band = (h >= 0.58) & (h <= 0.98) & (s > 0.04)
    h2 = h.copy(); s2 = s.copy()
    h2[band] = LIME_HUE
    s2[band] = s[band] * 0.72     # ease saturation toward the paper feel
    new_rgb = hsv_to_rgb_np(h2, s2, v)
    out = np.dstack([new_rgb, alpha])
    result = Image.fromarray(out, "RGBA")
    ext = os.path.splitext(path)[1].lower()
    if ext in (".jpg", ".jpeg"):
        result.convert("RGB").save(path, quality=90)
    else:
        result.save(path)
    return band.mean()

for d in DIRS:
    for name in TARGETS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            frac = recolor(p)
            print(f"{p}: shifted {frac*100:.1f}% of pixels")
        else:
            print(f"skip (missing): {p}")
print("done")
