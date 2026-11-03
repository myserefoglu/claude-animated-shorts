#!/usr/bin/env python3
"""Free look test: one photo -> 2 layers (subdued background, vivid key object) + slow parallax
push + serif text with the key word in the object's colour. No AI generation.

usage: python3 studio/scripts/grade_test.py photo.png out_dir "small words|KEY WORD" "#hexkey" [crop_cx]
writes out_dir/compare.jpg (original vs graded) and out_dir/parallax.mp4 (4 s, 1080x1920)
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from rembg import new_session, remove

src, out, text, keycol = sys.argv[1:5]
crop_cx = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
os.makedirs(out, exist_ok=True)
FONT = "studio/node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff"
W, H, FPS, SECS = 1080, 1920, 30, 4

# 9:16 crop around crop_cx, then 1.15x oversize so the camera has room to move
im = Image.open(src).convert("RGB")
w, h = im.size
cw = min(w, int(h * 9 / 16)); ch = int(cw * 16 / 9)
x0 = int(min(max(crop_cx * w - cw / 2, 0), w - cw))
im = im.crop((x0, (h - ch) // 2, x0 + cw, (h - ch) // 2 + ch)).resize((int(W * 1.15), int(H * 1.15)), Image.LANCZOS)

# key object mask
cut = remove(im, session=new_session("isnet-general-use"), post_process_mask=True)
mask = cut.split()[3]
from scipy.ndimage import binary_fill_holes
mask = Image.fromarray(np.maximum(np.asarray(mask), binary_fill_holes(np.asarray(mask) > 128) * 255).astype(np.uint8))
cut.putalpha(mask)
m = np.asarray(mask, np.float32) / 255

# background: fill the hole behind the object (normalized blur), then grade + depth blur
a = np.asarray(im, np.float32)
hole = (np.asarray(mask.filter(ImageFilter.MaxFilter(31)), np.float32) / 255 > 0.1).astype(np.float32)
keep = 1 - hole
def blur(x, r):
    return np.asarray(Image.fromarray(np.clip(x, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32)
# multi-scale fill: for each pixel use the smallest blur radius that has enough known pixels
fill = np.zeros_like(a); done = np.zeros(keep.shape, bool)
for r in (40, 90, 180, 360, 720):
    wg = blur(keep * 255, r) / 255
    est = np.stack([blur(a[..., c] * keep, r) for c in range(3)], -1) / (wg[..., None] + 1e-4)
    use = (~done) & (wg > 0.08)
    fill[use] = est[use]; done |= use
fill[~done] = a[keep > 0.5].mean(axis=0)
fill = np.stack([blur(fill[..., c], 25) for c in range(3)], -1)
bg = a * keep[..., None] + fill * hole[..., None]
bgi = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8))
bgi = ImageEnhance.Color(bgi).enhance(0.62)            # subdued, still colour
bgi = ImageEnhance.Brightness(bgi).enhance(0.86)
bgi = ImageEnhance.Contrast(bgi).enhance(0.9)
tint = Image.new("RGB", bgi.size, (70, 85, 110))       # pull towards one cool colour family
bgi = Image.blend(bgi, tint, 0.07).filter(ImageFilter.GaussianBlur(5))  # depth of field

# key object: vivid + crisp
obj = ImageEnhance.Color(cut.convert("RGB")).enhance(1.18)
obj = ImageEnhance.Contrast(obj).enhance(1.06)
obj = ImageEnhance.Sharpness(obj).enhance(1.3)
obj.putalpha(mask)
# soft contact shadow
sh = Image.new("RGBA", obj.size, (0, 0, 0, 0))
sh.putalpha(mask.filter(ImageFilter.GaussianBlur(25)).point(lambda v: int(v * 0.45)))

small, key = text.split("|")
f_small = ImageFont.truetype(FONT, 70)
f_key = ImageFont.truetype(FONT, 190)
def rgb(hexs):
    hexs = hexs.lstrip("#"); return tuple(int(hexs[i:i + 2], 16) for i in (0, 2, 4))

def frame(t):
    """t in 0..1"""
    e = 1 - (1 - t) ** 2  # ease-out
    canvas = Image.new("RGB", (W, H))
    def place(layer, scale, dx, dy, base=None):
        s = layer.resize((int(layer.width * scale), int(layer.height * scale)), Image.BILINEAR)
        x = (W - s.width) // 2 + int(dx); y = (H - s.height) // 2 + int(dy)
        if s.mode == "RGBA":
            canvas.paste(s, (x, y), s)
        else:
            canvas.paste(s, (x, y))
    place(bgi, 1.0 + 0.03 * e, -20 * e, 0)                      # far layer: small move
    OS, OY = 0.68, 260                                           # object smaller + lower: room for text
    place(sh, OS * (1.0 + 0.085 * e), 40 * e + 18, OY + 26)      # shadow follows object
    sway = np.sin(t * np.pi * 1.2) * 0.6
    o = obj.rotate(sway, resample=Image.BICUBIC, center=(obj.width / 2, obj.height * 0.8))
    place(o, OS * (1.0 + 0.085 * e), 40 * e, OY)                 # near layer: bigger move
    d = ImageDraw.Draw(canvas)
    # words land in sequence: small words at 0.15, key word at 0.4
    def word(txt, font, col, y, at):
        k = min(1, max(0, (t - at) / 0.12))
        if k <= 0: return
        bb = d.textbbox((0, 0), txt, font=font); tw = bb[2] - bb[0]
        layer = Image.new("RGBA", (W, 400), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        ld.text(((W - tw) / 2 + 4, 104), txt, font=font, fill=(0, 0, 0, int(140 * k)))
        lay2 = layer.filter(ImageFilter.GaussianBlur(8)); ld2 = ImageDraw.Draw(lay2)
        ld2.text(((W - tw) / 2, 100 - 14 * (1 - k)), txt, font=font, fill=col + (int(255 * k),))
        canvas.paste(lay2, (0, y - 100), lay2)
    word(small, f_small, (245, 240, 230), 250, 0.12)
    word(key, f_key, rgb(keycol), 330, 0.38)
    return canvas

fr = os.path.join(out, "frames"); os.makedirs(fr, exist_ok=True)
N = FPS * SECS
for i in range(N):
    frame(i / (N - 1)).save(os.path.join(fr, f"{i:04d}.jpg"), quality=90)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(fr, "%04d.jpg"),
                "-vf", "noise=alls=6:allf=t", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                os.path.join(out, "parallax.mp4")], check=True)
# side-by-side: original crop | graded last frame
orig = im.resize((W, H)).crop((0, 0, W, H))
last = Image.open(os.path.join(fr, f"{N - 1:04d}.jpg"))
cmp_ = Image.new("RGB", (W * 2 + 20, H), "white"); cmp_.paste(orig, (0, 0)); cmp_.paste(last, (W + 20, 0))
cmp_.resize((cmp_.width // 2, cmp_.height // 2)).save(os.path.join(out, "compare.jpg"), quality=88)
print("wrote", out)
