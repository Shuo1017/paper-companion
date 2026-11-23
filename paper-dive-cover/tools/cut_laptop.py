# -*- coding: utf-8 -*-
# Chroma-key the magenta laptop, measure the screen rect, split lid/deck.
import numpy as np
from PIL import Image, ImageFilter

SRC = r"C:\Users\33722\Documents\Qoder\2026-11-09\69a070b8\vibe_images\laptop-magenta_1794472950777_b6f57365.png"
OUT = r"C:\Users\33722\Documents\Qoder\2026-11-09\69a070b8\paper-dive-cover\assets"

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.int16)
r, g, b = a[..., 0], a[..., 1], a[..., 2]

# --- matte: flat magenta -> transparent, feathered edge ---
bgm = (r > 110) & (b > 110) & (g < 140) & ((r + b - 2 * g) > 60)
alpha = np.where(bgm, 0, 255).astype(np.uint8)
alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.6)))
alpha = np.where(alpha < 12, 0, np.where(alpha > 240, 255, alpha)).astype(np.uint8)

# --- magenta spill suppression on kept pixels ---
mag = (r > g + 25) & (b > g + 25) & (~bgm)
rr, bb = r.copy(), b.copy()
rr[mag] = g[mag] + ((r[mag] - g[mag]) * 0.25).astype(np.int16)
bb[mag] = g[mag] + ((b[mag] - g[mag]) * 0.25).astype(np.int16)
rgb = np.dstack([np.clip(rr, 0, 255), np.clip(g, 0, 255), np.clip(bb, 0, 255)]).astype(np.uint8)
Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save(OUT + r"\laptop-cut.png")

# --- measure screen rect: longest dark run per row ---
lum = (0.299 * rr + 0.587 * g + 0.114 * bb)
scr = (lum < 14) & (alpha > 240)
H, W = scr.shape
runs = []
for y in range(H):
    xs = np.flatnonzero(scr[y])
    if xs.size < 500:
        runs.append(None); continue
    d = np.diff(xs)
    br = np.flatnonzero(d > 1)
    segs = np.split(xs, br + 1)
    best = max(segs, key=len)
    runs.append((best[0], best[-1], len(best)) if len(best) > 500 else None)

ys = [y for y, rn in enumerate(runs) if rn]
# contiguous middle block of screen rows
blk, cur = [], [ys[0]]
for y in ys[1:]:
    if y == cur[-1] + 1: cur.append(y)
    else: blk.append(cur); cur = [y]
blk.append(cur)
blk = max(blk, key=len)
x0 = min(runs[y][0] for y in blk); x1 = max(runs[y][1] for y in blk)
t0, t1 = blk[0], blk[-1]
print("screen rect:", x0, t0, x1 - x0 + 1, t1 - t0 + 1)

# --- laptop silhouette bounds (alpha>200) ---
solid = alpha > 200
ys2 = np.flatnonzero(solid.any(axis=1)); xs2 = np.flatnonzero(solid.any(axis=0))
top, bot = ys2[0], ys2[-1]; left, right = xs2[0], xs2[-1]
hinge = t1 + 10  # bottom bezel just below screen
print("bounds:", left, top, right - left + 1, bot - top + 1, "hinge:", hinge)

full = np.dstack([rgb, alpha])
Image.fromarray(full, "RGBA").save(OUT + r"\laptop-cut.png")
# lid crop: full lid width incl. bezel margin
lx0 = max(0, x0 - 40); lx1 = min(W, x1 + 40)
Image.fromarray(full[top:hinge + 1, lx0:lx1 + 1], "RGBA").save(OUT + r"\laptop-lid.png")
Image.fromarray(full[hinge + 1:bot + 1, max(0, left - 4):right + 4], "RGBA").save(OUT + r"\laptop-deck.png")
print("lid crop:", (top, lx0, hinge - top, lx1 - lx0 + 1), "deck crop:", (hinge + 1, max(0, left - 4), bot - hinge, right + 4 - max(0, left - 4)))
