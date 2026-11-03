#!/usr/bin/env python3
"""Measure how a video moves, so our renders can be compared with the references.

usage: python3 studio/scripts/motion_stats.py video.mp4 [video2.mp4 ...]

Per video (frames compared at 96x170 greyscale, so it is fast and size-independent):
  held %     frames that are effectively identical to the previous one (stillness / holds)
  calm %     frames with only small change (slow drift, a piece settling)
  busy %     frames with large change (fast motion, shake, flashes)
  cuts/min   hard cuts (a big jump between two frames)
  avg shot   average seconds between cuts
  flashes    frames much brighter than both neighbours (white-flash transitions)
  mean lum   average brightness 0-255 (dark/moody vs bright)
  sat        average colour saturation 0-1 (muted vs loud)
"""
import subprocess
import sys

import numpy as np

W, H = 96, 170


def frames(path, fmt, ch):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-map", "0:v:0", "-vf",
                          f"scale={W}:{H},format={fmt}", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, ch).astype(np.float32)


def fps_of(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True).stdout.strip().split("\n")[0]
    a, b = r.split("/")
    return float(a) / float(b)


def stats(path):
    rgb = frames(path, "rgb24", 3)
    g = rgb.mean(axis=3)
    fps = fps_of(path)
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
    n = len(d)
    lum = g.mean(axis=(1, 2))
    mx, mn = rgb.max(axis=3), rgb.min(axis=3)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0).mean()
    cuts = int((d > 25).sum())
    dur = len(g) / fps
    flashes = int(((lum[1:-1] - np.maximum(lum[:-2], lum[2:])) > 25).sum())
    return {
        "held %": round(100 * (d < 0.3).mean()),
        "calm %": round(100 * ((d >= 0.3) & (d < 2)).mean()),
        "busy %": round(100 * (d >= 6).mean()),
        "cuts/min": round(cuts / dur * 60, 1),
        "avg shot": round(dur / max(cuts, 1), 1),
        "flashes": flashes,
        "mean lum": round(float(lum.mean())),
        "sat": round(float(sat), 2),
        "dur": round(dur, 1),
    }


if __name__ == "__main__":
    rows = [(p.split("/")[-1][:28], stats(p)) for p in sys.argv[1:]]
    keys = list(rows[0][1].keys())
    print(f"{'video':30}" + "".join(f"{k:>10}" for k in keys))
    for name, s in rows:
        print(f"{name:30}" + "".join(f"{s[k]:>10}" for k in keys))
