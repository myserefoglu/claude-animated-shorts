#!/usr/bin/env python3
"""Free paper-cut asset maker (no AI): paper textures, torn paper sheets, printed cut-outs.

    python3 studio/scripts/paper_assets.py      (run from the repo root; writes studio/public/papertest/)

Building blocks, reusable for later videos:
  paper(w, h, rgb)            textured paper: mottling, fibres, grain
  torn_sheet(w, h, rgb, ...)  a sheet with a torn top edge and the white torn core showing
  printed_cutout(rgba, ...)   a photo cut-out as a print: white cut border, print grain, slight misregistration
"""
import os
import subprocess

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy.ndimage import binary_fill_holes, gaussian_filter

OUT = "studio/public/papertest"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(3)
W, H = 1080, 1920


def noise2d(h, w, scale, seed):
    r = np.random.default_rng(seed).standard_normal((h, w))
    n = gaussian_filter(r, scale)
    return (n - n.mean()) / (n.std() + 1e-9)


def paper(w, h, rgb, seed=0, fibre=1.0):
    """Paper surface: low-frequency mottling + directional fibres + fine grain."""
    mott = noise2d(h, w, 40, seed) * 0.035 + noise2d(h, w, 8, seed + 1) * 0.02
    fib = gaussian_filter(np.random.default_rng(seed + 2).standard_normal((h, w)), (0.6, 6)) * 0.05 * fibre
    grain = np.random.default_rng(seed + 3).standard_normal((h, w)) * 0.018
    lum = 1 + mott + fib + grain
    img = np.clip(np.array(rgb, np.float32)[None, None, :] * lum[..., None], 0, 255)
    return img


def edge_profile(n, amp, seed, base):
    """1-D torn edge: large wander + small jagged tears."""
    r = np.random.default_rng(seed)
    big = gaussian_filter(r.standard_normal(n), 60) ; big = big / (np.abs(big).max() + 1e-9) * amp
    small = gaussian_filter(r.standard_normal(n), 2.5); small = small / (np.abs(small).max() + 1e-9) * amp * 0.18
    return base + big + small


def torn_sheet(w, h, rgb, top, amp=60, seed=0, rim=10):
    """Sheet filling below a torn top edge at y≈top. Returns RGBA."""
    y_edge = edge_profile(w, amp, seed, top)
    yy = np.arange(h)[:, None]
    body = yy > y_edge[None, :]
    # torn paper shows a white fibrous core just inside the tear
    rim_w = rim * (0.6 + 0.8 * np.abs(gaussian_filter(np.random.default_rng(seed + 9).standard_normal(w), 4)))
    core = (yy > y_edge[None, :]) & (yy < (y_edge + rim_w)[None, :])
    col = paper(w, h, rgb, seed)
    white = paper(w, h, (246, 242, 232), seed + 5, fibre=1.6)
    img = np.where(core[..., None], white, col)
    alpha = body.astype(np.float32)
    # fuzzy fibres on the very edge
    fuzz = (np.random.default_rng(seed + 11).random((h, w)) < 0.35) & (np.abs(yy - y_edge[None, :]) < 2.5)
    alpha = np.maximum(alpha, fuzz * 0.7)
    alpha = gaussian_filter(alpha, 0.6)
    return Image.fromarray(np.dstack([img, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA")


def printed_cutout(rgba, border=14, seed=0, sat=1.0, rough=True):
    """Photo cut-out -> printed paper piece: white border, print grain, slight misregistration."""
    a = np.asarray(rgba.split()[3]) > 128
    a = binary_fill_holes(a)
    pad = border * 3
    rgb = np.asarray(rgba.convert("RGB"), np.float32)
    H_, W_ = a.shape
    A = np.zeros((H_ + 2 * pad, W_ + 2 * pad), bool); A[pad:-pad, pad:-pad] = a
    R = np.zeros((H_ + 2 * pad, W_ + 2 * pad, 3), np.float32); R[pad:-pad, pad:-pad] = rgb
    dist = gaussian_filter(A.astype(np.float32), border * 0.55)
    wobble = noise2d(*A.shape, 14, seed) * 0.05 if rough else 0
    outer = ((dist + wobble * (dist > 0.03)) > 0.12) & (dist > 0.03)
    # print: slight saturation change, grain, 1px red/blue misregistration
    if sat != 1.0:
        g = R.mean(axis=2, keepdims=True); R = g + (R - g) * sat
    R[..., 0] = np.roll(R[..., 0], 1, axis=1); R[..., 2] = np.roll(R[..., 2], -1, axis=0)
    R = R * (1 + np.random.default_rng(seed).standard_normal(A.shape)[..., None] * 0.03)
    white = paper(A.shape[1], A.shape[0], (247, 244, 236), seed + 7)
    img = np.where(A[..., None], R, white)
    alpha = gaussian_filter(outer.astype(np.float32), 0.7)
    out = Image.fromarray(np.dstack([img, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA")
    bb = out.getbbox()
    out = out.crop(bb)
    out.info['offset'] = (bb[0] - pad, bb[1] - pad)  # position of the crop in the source image
    return out


def torn_blob(w, h, rgb, seed, rim=7):
    """Cloud-like torn paper piece: union of ellipses with a torn outline and a white torn core."""
    r = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    m = np.zeros((h, w), np.float32)
    for _ in range(5):
        cx, cy = r.uniform(0.25, 0.75) * w, r.uniform(0.45, 0.65) * h
        rx, ry = r.uniform(0.15, 0.24) * w, r.uniform(0.18, 0.28) * h
        m = np.maximum(m, 1 - ((xx - cx) / rx) ** 2 - ((yy - cy) / ry) ** 2)
    win = np.sqrt(np.sin(np.pi * xx / (w - 1)).clip(0) * np.sin(np.pi * yy / (h - 1)).clip(0))
    m = (m + noise2d(h, w, 3, seed) * 0.05 + noise2d(h, w, 12, seed + 1) * 0.1) * win - (1 - win) * 0.5
    body = m > 0.05
    inner = m > 0.09 + noise2d(h, w, 2, seed + 2) * 0.01
    img = np.where(inner[..., None], paper(w, h, rgb, seed), paper(w, h, (248, 245, 238), seed + 3, 1.6))
    a = gaussian_filter(body.astype(np.float32), 0.6)
    return Image.fromarray(np.dstack([img, a * 255]).clip(0, 255).astype(np.uint8), "RGBA")


def paper_plane(size, rgb, seed):
    """Folded paper plane: two facets in slightly different tones."""
    w, h = size, int(size * 0.55)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    tip, tail_top, tail_bot, fold = (w - 4, h * 0.35), (4, 4), (4, h - 4), (w * 0.28, h * 0.48)
    base = np.array(rgb)
    d.polygon([tip, tail_top, fold], fill=tuple(base) + (255,))
    d.polygon([tip, fold, tail_bot], fill=tuple((base * 0.86).astype(int)) + (255,))
    d.line([tip, fold], fill=tuple((base * 0.75).astype(int)) + (255,), width=2)
    tex = paper(w, h, (255, 255, 255), seed)[..., 0] / 255
    arr = np.asarray(img, np.float32); arr[..., :3] *= tex[..., None]
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA")


if __name__ == "__main__":
    sess = new_session("isnet-general-use")
    up = "/root/.claude/uploads/c3b48720-b37c-53f1-a652-c2f272f27a1f"
    queue = [f for f in os.listdir(up) if f.startswith("34c33839")][0]

    # --- shot 1: clip excerpt (silent, 1080x1920) + freeze frame + crowd cut-out
    T0, T1 = 1.6, 4.0   # excerpt, freezes at T1 (crowd facing the POP MART store)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(T0), "-t", str(T1 - T0 + 0.2), "-i", f"{up}/{queue}",
                    "-an", "-vf", "scale=1080:1920:flags=lanczos,fps=30", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                    f"{OUT}/queue.mp4"], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(T1 - T0), "-i", f"{OUT}/queue.mp4", "-frames:v", "1",
                    f"{OUT}/freeze.png"], check=True)
    fr = Image.open(f"{OUT}/freeze.png").convert("RGB")
    crowd = remove(fr, session=sess, post_process_mask=True)
    cc = printed_cutout(crowd, border=12, seed=4, sat=1.05)
    cc.save(f"{OUT}/crowd_cut.png")
    import json
    json.dump({"crowd_offset": cc.info["offset"], "crowd_size": cc.size}, open(f"{OUT}/meta.json", "w"))
    # the freeze frame as a print on paper (subdued background layer)
    g = np.asarray(fr, np.float32)
    # remove the crowd from the print underneath (no ghost when the cut-out lifts): multi-scale fill
    hole = gaussian_filter((np.asarray(crowd.split()[3]) > 100).astype(np.float32), 6) > 0.05
    keep = (~hole).astype(np.float32); fill = np.zeros_like(g); done = np.zeros(hole.shape, bool)
    for rad in (30, 80, 200, 500):
        wg = gaussian_filter(keep, rad)
        est = np.stack([gaussian_filter(g[..., k] * keep, rad) for k in range(3)], -1) / (wg[..., None] + 1e-4)
        use = (~done) & (wg > 0.08); fill[use] = est[use]; done |= use
    fill = np.stack([gaussian_filter(fill[..., k], 12) for k in range(3)], -1)
    g = np.where(hole[..., None], fill * 0.8, g)
    m = g.mean(axis=2, keepdims=True); g = m + (g - m) * 0.55
    g = g * 0.9 + np.array([60, 66, 80]) * 0.1
    Image.fromarray(g.clip(0, 255).astype(np.uint8)).save(f"{OUT}/freeze_print.png")
    Image.fromarray(paper(W, H, (214, 205, 188), 21).astype(np.uint8)).save(f"{OUT}/desk.png")

    # --- shot 2: paper world
    Image.fromarray(paper(W + 200, H + 200, (150, 172, 190), 1).astype(np.uint8)).save(f"{OUT}/sky.png")
    torn_sheet(W + 300, 900, (196, 196, 170), 120, 70, seed=2).save(f"{OUT}/hill_back.png")   # dusty sage
    torn_sheet(W + 300, 800, (176, 152, 118), 150, 55, seed=5).save(f"{OUT}/hill_front.png")  # kraft
    torn_sheet(W + 300, 500, (214, 206, 190), 90, 35, seed=8).save(f"{OUT}/ground.png")       # cream
    torn_blob(520, 260, (232, 230, 224), 41).save(f"{OUT}/cloud1.png")
    torn_blob(380, 190, (222, 224, 226), 42).save(f"{OUT}/cloud2.png")
    paper_plane(260, (236, 232, 222), 31).save(f"{OUT}/plane1.png")
    paper_plane(180, (230, 226, 216), 32).save(f"{OUT}/plane2.png")
    lab = Image.open("studio/public/labubu/green_kite_cut.png")
    printed_cutout(lab, border=16, seed=9, sat=1.15).save(f"{OUT}/labubu_print.png")
    print("assets ->", OUT, sorted(os.listdir(OUT)))
