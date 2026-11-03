#!/usr/bin/env python3
"""Paper assets for the Labubu short (v2, paper-cut style). Free: code-made paper + the user's
clips and photos. Run from the repo root:  python3 studio/scripts/labubu_assets.py
Writes studio/public/lab2/ (gitignored: contains derivatives of the user's material).
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from rembg import new_session, remove
from scipy.ndimage import binary_fill_holes, gaussian_filter

sys.path.insert(0, os.path.dirname(__file__))
from paper_assets import noise2d, paper, paper_plane, printed_cutout, torn_blob, torn_sheet  # noqa: E402

OUT = "studio/public/lab2"
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920
UP = "/root/.claude/uploads/c3b48720-b37c-53f1-a652-c2f272f27a1f"
SERIF = "studio/node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff"
meta = {}


def save(img, name):
    img.save(f"{OUT}/{name}.png")
    meta[name] = list(img.size)


def rgba(arr, alpha):
    return Image.fromarray(np.dstack([np.clip(arr, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8), "RGBA")


def torn_piece(w, h, rgb, seed, tear=10, rim=6):
    """A paper piece torn on all four sides (white torn core at the edge)."""
    pad = tear * 3
    W2, H2 = w + 2 * pad, h + 2 * pad
    yy, xx = np.mgrid[0:H2, 0:W2]
    d = np.minimum.reduce([xx - pad, W2 - pad - xx, yy - pad, H2 - pad - yy]).astype(np.float32)
    d += noise2d(H2, W2, 5, seed) * tear * 0.5 + noise2d(H2, W2, 1.5, seed + 1) * tear * 0.2
    body = d > 0
    core = body & (d < rim)
    img = np.where(core[..., None], paper(W2, H2, (247, 243, 234), seed + 2, 1.6), paper(W2, H2, rgb, seed))
    return rgba(img, gaussian_filter(body.astype(np.float32), 0.6))


def cut_piece(mask, rgb, seed, border=0, border_rgb=(247, 243, 234)):
    """Scissor-cut piece from a boolean mask, optional white border."""
    h, w = mask.shape
    m = mask.astype(np.float32)
    img = paper(w, h, rgb, seed)
    if border:
        outer = gaussian_filter(m, border * 0.5) > 0.12
        img = np.where(mask[..., None], img, paper(w, h, border_rgb, seed + 1))
        m = outer.astype(np.float32)
    return rgba(img, gaussian_filter(m, 0.7))


def glyph_mask(text, size, font=SERIF, pad=40):
    f = ImageFont.truetype(font, size)
    bb = f.getbbox(text)
    im = Image.new("L", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), 0)
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), text, font=f, fill=255)
    return np.asarray(im) > 128


def gear_mask(r, teeth=10, pad=20):
    n = 2 * (r + pad)
    yy, xx = np.mgrid[0:n, 0:n] - (r + pad)
    ang = np.arctan2(yy, xx); rad = np.hypot(xx, yy)
    edge = r * (0.82 + 0.18 * (np.cos(ang * teeth) > 0.2))
    return (rad < edge) & (rad > r * 0.28)


def silhouette(rgba_cut, rgb=(28, 28, 32), seed=0):
    a = binary_fill_holes(np.asarray(rgba_cut.split()[3]) > 128)
    return cut_piece(a, rgb, seed, border=8)


def worlds():
    """Paper colour worlds: background sheet + two torn strips + optional extra."""
    spec = {
        # name: (bg, strip_back, strip_front)
        "hook": ((44, 46, 54), (70, 66, 78), (96, 74, 88)),         # charcoal night
        "ruler": ((182, 192, 166), (150, 166, 138), (204, 196, 170)),  # sage
        "resale": ((196, 166, 126), (170, 140, 104), (220, 204, 176)),  # kraft
        "sky": ((150, 172, 190), (196, 196, 170), (176, 152, 118)),     # dusty blue
        "factory": ((84, 104, 124), (110, 128, 144), (140, 150, 156)),  # blueprint grey-blue
        "pile": ((228, 220, 204), (210, 200, 182), (190, 178, 160)),    # cream
        "scalper": ((120, 116, 124), (92, 88, 98), (150, 144, 148)),    # newsprint grey
        "retail": ((226, 214, 196), (204, 188, 168), (182, 162, 140)),  # pale kraft
        "win": ((226, 190, 120), (206, 160, 96), (236, 210, 156)),      # gold
        "instead": ((88, 74, 86), (70, 60, 72), (112, 92, 100)),        # dusk plum
        "chart": ((232, 228, 214), (220, 214, 198), (208, 200, 182)),   # graph paper
        "cork": ((150, 112, 80), (128, 94, 66), (170, 132, 98)),        # cork board
        "alive": ((48, 70, 60), (66, 92, 78), (90, 116, 98)),           # deep green
        "podium": ((176, 196, 212), (150, 170, 190), (206, 214, 220)),  # pale sky
        "wall": ((206, 176, 176), (186, 150, 150), (226, 204, 200)),    # dusty pink
        "end": ((58, 58, 62), (78, 76, 80), (98, 96, 100)),             # ash
    }
    for i, (name, (bg, s1, s2)) in enumerate(spec.items()):
        base = paper(W + 240, H + 240, bg, 100 + i)
        if name == "chart":  # faint grid lines
            for k in range(0, W + 240, 60):
                base[:, k:k + 2] *= 0.9
            for k in range(0, H + 240, 60):
                base[k:k + 2, :] *= 0.9
        Image.fromarray(base.clip(0, 255).astype(np.uint8)).save(f"{OUT}/bg_{name}.png")
        save(torn_sheet(W + 300, 900, s1, 120, 70, seed=200 + i), f"strip1_{name}")
        save(torn_sheet(W + 300, 700, s2, 120, 50, seed=300 + i), f"strip2_{name}")


def main():
    sess = new_session("isnet-general-use")
    worlds()
    for k, (rgb, s) in enumerate([((236, 234, 228), (520, 260)), ((226, 226, 224), (380, 190)), ((210, 206, 200), (440, 220))]):
        save(torn_blob(s[0], s[1], rgb, 41 + k), f"cloud{k + 1}")
    save(paper_plane(240, (236, 232, 222), 31), "plane1")
    save(paper_plane(170, (230, 226, 216), 32), "plane2")

    # key objects: the two Labubus as vivid printed cut-outs
    for n in ("green_kite", "pink_jump"):
        save(printed_cutout(Image.open(f"studio/public/labubu/{n}_cut.png"), border=16, seed=9, sat=1.15), n)
    pink = Image.open(f"{OUT}/pink_jump.png")
    green = Image.open(f"{OUT}/green_kite.png")
    # small versions for piles/grids
    for n, im in (("pink_s", pink), ("green_s", green)):
        s = im.copy(); s.thumbnail((240, 240)); save(s, n)
    # grey (unwanted) versions for the ending
    for n, im in (("pink_grey", pink), ("green_grey", green)):
        a = np.asarray(im, np.float32); g = a[..., :3].mean(axis=2, keepdims=True)
        save(rgba(g * 0.95 + a[..., :3] * 0.05, a[..., 3] / 255), n)

    # clip 1: mall queue excerpt + freeze + crowd lift (as in the paper test)
    q = [f for f in os.listdir(UP) if f.startswith("34c33839")][0]
    T0, T1 = 1.6, 4.0
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(T0), "-t", str(T1 - T0 + 0.2), "-i", f"{UP}/{q}", "-an",
                    "-vf", "scale=1080:1920:flags=lanczos,fps=30", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", f"{OUT}/queue.mp4"], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(T1 - T0), "-i", f"{OUT}/queue.mp4", "-frames:v", "1", f"{OUT}/freeze.png"], check=True)
    fr = Image.open(f"{OUT}/freeze.png").convert("RGB")
    crowd = remove(fr, session=sess, post_process_mask=True)
    cc = printed_cutout(crowd, border=12, seed=4, sat=1.05); save(cc, "crowd"); meta["crowd_offset"] = cc.info["offset"]
    g = np.asarray(fr, np.float32)
    hole = gaussian_filter((np.asarray(crowd.split()[3]) > 100).astype(np.float32), 6) > 0.05
    keep = (~hole).astype(np.float32); fill = np.zeros_like(g); done = np.zeros(hole.shape, bool)
    for rad in (30, 80, 200, 500):
        wg = gaussian_filter(keep, rad)
        est = np.stack([gaussian_filter(g[..., k] * keep, rad) for k in range(3)], -1) / (wg[..., None] + 1e-4)
        use = (~done) & (wg > 0.08); fill[use] = est[use]; done |= use
    fill = np.stack([gaussian_filter(fill[..., k], 12) for k in range(3)], -1)
    g = np.where(hole[..., None], fill * 0.8, g); m = g.mean(axis=2, keepdims=True); g = m + (g - m) * 0.55
    Image.fromarray((g * 0.9 + np.array([60, 66, 80]) * 0.1).clip(0, 255).astype(np.uint8)).save(f"{OUT}/freeze_print.png")
    Image.fromarray(paper(W, H, (214, 205, 188), 21).astype(np.uint8)).save(f"{OUT}/desk.png")

    # scalper: one person from a later queue frame as a black paper silhouette
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", "20.5", "-i", f"{UP}/{q}", "-frames:v", "1", "-vf", "scale=1080:1920", f"{OUT}/_scalper_src.png"], check=True)
    sc = remove(Image.open(f"{OUT}/_scalper_src.png").convert("RGB"), session=sess, post_process_mask=True)
    a = np.asarray(sc.split()[3]) > 128
    from scipy.ndimage import label
    lab, n = label(a)
    if n:
        sizes = [(lab == i).sum() for i in range(1, n + 1)]; a = lab == (1 + int(np.argmax(sizes)))
    ys, xs = np.where(a); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    save(cut_piece(np.pad(a, 20), (26, 26, 30), 61, border=8), "scalper")

    # clip 2: man covered in Labubus, dragging them (ending)
    m2 = [f for f in os.listdir(UP) if f.startswith("080fa303")][0]
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", "0.6", "-i", f"{UP}/{m2}", "-an",
                    "-vf", "scale=1080:1920:flags=lanczos,fps=30", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", f"{OUT}/drag.mp4"], check=True)

    # props
    save(cut_piece(glyph_mask("?", 900), (226, 92, 150), 71, border=14), "qmark")
    save(torn_piece(150, 1000, (232, 196, 82), 72, tear=6), "ruler")
    tag = np.ones((420, 700), bool)
    yy, xx = np.mgrid[0:420, 0:700]
    tag &= ~((xx < 130) & (np.abs(yy - 210) > (210 - xx * 1.4)))       # pointed end
    tag &= ~(np.hypot(xx - 95, yy - 210) < 26)                           # hole
    save(cut_piece(tag, (240, 232, 214), 73, border=0), "tag")
    for k, rgb in enumerate([(150, 156, 160), (190, 168, 120), (120, 136, 150)]):
        save(cut_piece(gear_mask(150 - k * 30), rgb, 80 + k, border=6), f"gear{k + 1}")
    save(torn_piece(260, 900, (226, 92, 150), 90), "bar_pink")
    save(torn_piece(260, 900, (150, 146, 150), 91), "bar_grey")
    save(torn_piece(260, 900, (214, 78, 64), 92), "bar_red")
    save(torn_piece(200, 200, (240, 232, 214), 93, tear=5), "label")
    box = torn_piece(230, 150, (226, 92, 150), 94, tear=4); save(box, "box_pink")
    save(torn_piece(230, 150, (180, 210, 90), 95, tear=4), "box_lime")
    # generic "other character" silhouettes (rounded figures, not Labubu)
    for k in range(4):
        hh, ww = 300, 200
        yy, xx = np.mgrid[0:hh, 0:ww]
        body = ((xx - ww / 2) / (ww * 0.42)) ** 2 + ((yy - hh * 0.68) / (hh * 0.34)) ** 2 < 1
        head = np.hypot(xx - ww / 2, yy - hh * 0.28) < ww * (0.3 + 0.03 * k)
        save(cut_piece(np.pad(body | head, 16), (120, 124, 132), 100 + k, border=6), f"other{k + 1}")
    save(rgba(np.zeros((60, 60, 3)) + [200, 40, 40], (np.hypot(*(np.mgrid[0:60, 0:60] - 30)) < 26).astype(float)), "pin")
    json.dump(meta, open(f"{OUT}/meta.json", "w"), indent=0)
    for f in os.listdir(OUT):
        if f.startswith("_"):
            os.remove(f"{OUT}/{f}")
    print("assets:", len(os.listdir(OUT)))


if __name__ == "__main__":
    main()
