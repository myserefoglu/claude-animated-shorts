#!/usr/bin/env python3
"""Clean Pop edit engine: burns the preset's captions + graphics + synthesized SFX onto one clip.

    python3 edit.py timeline.json out.mp4              final (same size/fps as source, CRF 16)
    python3 edit.py timeline.json out.mp4 --preview    720p preview for the review panel
    python3 edit.py timeline.json out.jpg --stills 3.8,11.3,58.0   still sheet for a quick look

Everything visual comes from style.json (next to this file) + the clip's timeline.json.
Any time in timeline.json may be a number (seconds in the source clip) or a word reference:
    "@Hot"          start of the first spoken word "Hot"
    "@Hot#2"        start of the 2nd "Hot"
    "@tier+0.2"     0.2 s after "tier" starts      "@hype>"  end of "hype" (">" = word end)
Words come from words.json made by align.py (case- and punctuation-insensitive matching).
Writes <out>_sfx.wav (SFX stem alone) and <out>_cues.json next to the video.
"""
import json, math, os, re, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PRESET = os.path.dirname(os.path.abspath(__file__))
TL_PATH, OUT = sys.argv[1], sys.argv[2]
PREVIEW = "--preview" in sys.argv
STILLS = [float(x) for x in sys.argv[sys.argv.index("--stills") + 1].split(",")] if "--stills" in sys.argv else None
TL = json.load(open(TL_PATH))
TLDIR = os.path.dirname(os.path.abspath(TL_PATH))
ST = json.load(open(os.path.join(PRESET, "style.json")))

def P(p):
    """Resolve a path from the timeline: absolute, relative to the timeline, or relative to the preset."""
    if os.path.isabs(p): return p
    for base in (TLDIR, PRESET):
        q = os.path.join(base, p)
        if os.path.exists(q): return q
    return os.path.join(TLDIR, p)

def font_path(name):
    f = ST["fonts"][name]
    return f if os.path.isabs(f) else os.path.join(PRESET, f)

SRC = P(TL["src"])
FPS = TL.get("fps", 30)
W, H = TL.get("size", [1920, 1080])
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", SRC],
                           capture_output=True, text=True).stdout)
NF = int(round(dur * FPS))
WORDS = json.load(open(P(TL["words"])))
if isinstance(WORDS, dict): WORDS = WORDS[TL["section"]]

# ---------------- time references ----------------
def _norm(s): return re.sub(r"[^\w]", "", s.replace("İ", "i").replace("I", "ı").lower())
def T(v):
    if isinstance(v, (int, float)): return float(v)
    m = re.fullmatch(r"@(.+?)(?:#(\d+))?(>)?([+-][\d.]+)?", v.strip())
    if not m: raise ValueError(f"bad time {v!r}")
    key, nth, end, off = _norm(m.group(1)), int(m.group(2) or 1), m.group(3), float(m.group(4) or 0)
    hits = [w for w in WORDS if _norm(w["w"]).startswith(key)]
    if len(hits) < nth: raise ValueError(f"word {m.group(1)!r} #{nth} not found in words.json")
    w = hits[nth - 1]
    return (w["e"] if end else w["s"]) + off

# ---------------- helpers ----------------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease_out_cubic(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_in_cubic(x): x = clamp(x); return x ** 3
def ease_in_out(x): x = clamp(x); return 3 * x * x - 2 * x ** 3
def ease_out_back(x, s=1.4): x = clamp(x); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
def tr_upper(s): return s.replace("i", "İ").replace("ı", "I").upper()
def rgba(c): return tuple(c) if len(c) == 4 else tuple(c) + (255,)

def with_alpha(im, a):
    if a >= 0.999: return im
    arr = np.array(im); arr[..., 3] = (arr[..., 3].astype(np.float32) * clamp(a)).astype(np.uint8)
    return Image.fromarray(arr)

def soft_shadow(im, radius=10, opacity=0.45, off=(0, 6), grow=0):
    a = im.split()[3]; pad = radius * 3
    sh = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    m = Image.new("L", sh.size, 0); m.paste(a, (pad, pad))
    if grow: m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    m = m.filter(ImageFilter.GaussianBlur(radius)).point(lambda v: int(v * opacity))
    sh.putalpha(m)
    out = Image.new("RGBA", sh.size, (0, 0, 0, 0)); out.alpha_composite(sh, (off[0], off[1])); out.alpha_composite(im, (pad, pad))
    return out, pad

def card_shadow(im): s = ST["shadow"]; return soft_shadow(im, s["radius"], s["opacity"], tuple(s["offset"]))

def rounded(w, h, r, fill):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(im).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=fill); return im

def load_img(spec):
    """'file.png' or {"file":..., "crop":[x0,y0,x1,y1]}"""
    if isinstance(spec, str): spec = {"file": spec}
    im = Image.open(P(spec["file"])).convert("RGBA")
    return im.crop(tuple(spec["crop"])) if spec.get("crop") else im

# ---------------- SFX (synthesized, nothing sampled) ----------------
SR = 44100
rng = np.random.default_rng(11)
sfx = np.zeros(int(dur * SR) + SR); cues = []
LV = ST["sfx"]
def place(snd, at, name):
    i = int(max(0, at) * SR); j = min(len(sfx), i + len(snd)); sfx[i:j] += snd[: j - i]; cues.append({"t": round(at, 3), "sfx": name})
def envx(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def s_pop(gain, f0=700):
    n = int(0.08 * SR); t = np.arange(n) / SR; f = f0 * np.exp(-t * 22) + 220
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * envx(n, 0.02) * gain
def s_click(gain):
    n = int(0.05 * SR); x = rng.standard_normal(n) * envx(n, 0.003)
    t = np.arange(n) / SR; tone = np.sin(2 * np.pi * 2400 * t) * envx(n, 0.006) * 0.5
    return (np.convolve(x, np.ones(4) / 4, "same") + tone) * gain
def s_sparkle(gain):
    n = int(0.6 * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for k, f in enumerate([1568, 2093, 2637, 3136]):
        d = k * 0.045; m = t >= d; tt = t[m] - d; s[m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9)
    return s / 2.2 * gain
def s_whoosh(len_s, gain, up=True):
    n = int(len_s * SR); x = rng.standard_normal(n); out = np.zeros(n); y1 = y2 = 0.0
    for i in range(n):
        p = i / n if up else 1 - i / n
        fc = 400 + 3800 * p ** 2; f = 2 * math.sin(math.pi * fc / SR); q = 0.5
        hp = x[i] - y2 - q * y1; y1 = f * hp + y1; y2 = f * y1 + y2; out[i] = y1
    return out / (np.abs(out).max() + 1e-9) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * gain
def s_thock(gain, f0=150):
    n = int(0.18 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (f0 + 80 * np.exp(-t * 40)) * t) * envx(n, 0.05)
    return (body + rng.standard_normal(n) * envx(n, 0.002) * 0.25) * gain

# ================= CAPTIONS =================
CS = ST["captions"]
CAP_RANGES = [(T(a), T(b)) for a, b in TL.get("captions", {}).get("ranges", [])]
def in_cap(t): return any(a <= t <= b for a, b in CAP_RANGES)
cwords = [w for w in WORDS if any(a - 0.05 <= w["s"] <= b for a, b in CAP_RANGES)]
chunks, cur = [], []
for i, w in enumerate(cwords):
    cur.append(w); nxt = cwords[i + 1] if i + 1 < len(cwords) else None
    txt = " ".join(x["w"] for x in cur)
    if (nxt is None or w["w"][-1] in ".?!" or (w["w"][-1] == "," and len(cur) >= 3) or nxt.get("line") != w.get("line")
            or len(cur) >= CS["max_words"] or len(txt) + 1 + len(nxt["w"]) > CS["max_chars"] or nxt["s"] - w["e"] > CS["break_gap"]):
        chunks.append(cur); cur = []
CH = []
for i, c in enumerate(chunks):
    st = c[0]["s"] - CS["lead"]
    nx = chunks[i + 1][0]["s"] - CS["lead"] if i + 1 < len(chunks) else 1e9
    en = max(c[-1]["e"] + CS["hold"], st + CS["min_on"])
    if nx - c[-1]["e"] < CS["bridge_gap"]: en = nx
    CH.append({"w": c, "s": st, "e": min(en, nx)})
cap_font = ImageFont.truetype(font_path(CS["font"]), CS["size"]); cap_cache = {}
def caption_img(ci, ns):
    key = (ci, ns)
    if key in cap_cache: return cap_cache[key]
    toks = [w["w"] for w in CH[ci]["w"]]; sp = CS["word_gap"]
    ws = [cap_font.getlength(t) for t in toks]
    im = Image.new("RGBA", (int(sum(ws) + sp * (len(toks) - 1)) + 8, int(CS["size"] * 1.55)), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    x = 4
    for j, (tk, wd) in enumerate(zip(toks, ws)):
        d.text((x, 8), tk, font=cap_font, fill=rgba(CS["color"])[:3] + (255 if j < ns else CS["upcoming_alpha"],)); x += wd + sp
    sh = CS["shadow"]; out = soft_shadow(im, sh["radius"], sh["opacity"], tuple(sh["offset"]), sh["grow"])
    if len(cap_cache) > 300: cap_cache.clear()
    cap_cache[key] = out; return out
def draw_caption(frame, t):
    if not in_cap(t): return
    for ci, c in enumerate(CH):
        if c["s"] <= t < c["e"]:
            im, pad = caption_img(ci, sum(1 for w in c["w"] if w["s"] - 0.04 <= t))
            k = ease_out_cubic((t - c["s"]) / CS["fade_in"])
            ko = clamp((c["e"] - t) / CS["fade_out"]) if (ci + 1 >= len(CH) or CH[ci + 1]["s"] - c["e"] > 0.05) else 1
            frame.alpha_composite(with_alpha(im, k * ko), ((W - im.width) // 2, H - CS["bottom"] - pad + int((1 - k) * CS["rise"])))
            return

# ================= ELEMENTS =================
ELS = []          # (draw_fn, t_from, t_to)

# ---- tap buttons: like / subscribe / hype (one pointer taps them in order) ----
BS = ST["buttons"]
fa_r = ImageFont.truetype(font_path("icons_regular"), BS["icon_size"]); fa_s = ImageFont.truetype(font_path("icons_solid"), BS["icon_size"])
fa_hand = ImageFont.truetype(font_path("icons_solid"), BS["pointer_size"]); f_btn = ImageFont.truetype(font_path(BS["font"]), BS["label_size"])
def btn_img(label, icon, ifont, bg, fg, scale=1.0):
    pad_l, gap, pad_r, h = 40, 20, 46, BS["height"]
    iw = ifont.getlength(icon); tw = f_btn.getlength(label); w = int(pad_l + iw + gap + tw + pad_r)
    im = rounded(w, h, h // 2, bg); d = ImageDraw.Draw(im)
    d.text((pad_l, 27), icon, font=ifont, fill=fg); d.text((pad_l + iw + gap, 29), label, font=f_btn, fill=fg)
    if abs(scale - 1) > 1e-3: im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    return im
HAND = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
ImageDraw.Draw(HAND).text((14, 10), "", font=fa_hand, fill=(255, 255, 255, 255), stroke_width=5, stroke_fill=(17, 17, 20, 255))
def btn_spec(kind):
    k = BS["kinds"][kind]; fonts = {"regular": fa_r, "solid": fa_s}
    return dict(off=(k["off"]["label"], chr(int(k["off"]["icon"], 16)), fonts[k["off"]["style"]], rgba(k["off"]["bg"]), rgba(k["off"]["fg"])),
                on=(k["on"]["label"], chr(int(k["on"]["icon"], 16)), fonts[k["on"]["style"]], rgba(k["on"]["bg"]), rgba(k["on"]["fg"])))

def add_buttons(el):
    items = []
    for it in el["items"]:
        b = btn_spec(it["kind"]); b.update(cx=it["x"], cy=it["y"], t_in=T(it["in"]), tap=T(it["tap"]), t_out=T(it["out"])); items.append(b)
        place(s_pop(LV["button_pop"], 650), b["t_in"], "btn-pop-in"); place(s_click(LV["button_click"]), b["tap"], "btn-click")
        place(s_sparkle(LV["button_sparkle"]), b["tap"] + 0.02, "btn-sparkle")
    place(s_whoosh(0.25, LV["button_out"], up=False), items[-1]["t_out"], "btn-out")
    cache = {}
    def draw(frame, t):
        for bi, b in enumerate(items):
            if not (b["t_in"] <= t <= b["t_out"] + 0.3): continue
            on = t >= b["tap"]
            k_in = ease_out_back((t - b["t_in"]) / 0.30)
            k_out = ease_in_cubic((t - b["t_out"]) / 0.25) if t > b["t_out"] else 0
            bump = 1 + 0.15 * math.sin((t - b["tap"]) / 0.22 * math.pi) if on and t - b["tap"] < 0.22 else 1.0
            sc = round((0.6 + 0.4 * k_in) * bump * (1 - 0.15 * k_out), 3)
            key = (bi, on, sc)
            if key not in cache:
                if len(cache) > 300: cache.clear()
                cache[key] = soft_shadow(btn_img(*(b["on"] if on else b["off"]), scale=sc), radius=14, opacity=0.45, off=(0, 8))
            im, pad = cache[key]
            im = with_alpha(im, clamp((t - b["t_in"]) / 0.12) * (1 - k_out))
            cx, cy = b["cx"], b["cy"] - int(k_out * 30)
            frame.alpha_composite(im, (cx - im.width // 2, cy - im.height // 2))
            if on and t - b["tap"] < 0.45:
                p = (t - b["tap"]) / 0.45; d = ImageDraw.Draw(frame)
                ix, iy = cx - (im.width - 2 * pad) // 2 + 66, cy; col = b["on"][3]
                for k in range(10):
                    ang = k / 10 * 2 * math.pi + 0.3
                    r1, r2 = 50 + 70 * ease_out_cubic(p), 62 + 92 * ease_out_cubic(p); a = int(255 * (1 - p))
                    d.line((ix + r1 * math.cos(ang), iy + r1 * math.sin(ang), ix + r2 * math.cos(ang), iy + r2 * math.sin(ang)),
                           fill=(col[0], col[1], col[2], a) if k % 2 else (255, 255, 255, a), width=6)
        taps = [(b["tap"], b["cx"] - 60, b["cy"] + 6) for b in items]
        t_start, t_end = taps[0][0] - 0.45, taps[-1][0] + 0.6
        if not (t_start <= t <= t_end): return
        sx, sy = taps[0][1] + 260, taps[0][2] + 220
        if t < taps[0][0]:
            g = ease_out_cubic((t - t_start) / 0.42); hx, hy = sx + (taps[0][1] - sx) * g, sy + (taps[0][2] - sy) * g
        else:
            hx, hy = taps[0][1], taps[0][2]
            for i in range(1, len(taps)):
                a0 = taps[i - 1][0] + 0.08
                if t >= a0:
                    g = ease_in_out((t - a0) / max(0.12, taps[i][0] - a0 - 0.02))
                    hx = taps[i - 1][1] + (taps[i][1] - taps[i - 1][1]) * g; hy = taps[i - 1][2] + (taps[i][2] - taps[i - 1][2]) * g
        leave = clamp((t - taps[-1][0] - 0.3) / 0.3); hx += leave * 200; hy += leave * 160
        h = HAND.resize((103, 103), Image.LANCZOS) if any(0 <= t - tp < 0.12 for tp, _, _ in taps) else HAND
        frame.alpha_composite(with_alpha(h, 1 - leave), (int(hx), int(hy)))
    ELS.append((draw, min(b["t_in"] for b in items), max(b["t_out"] for b in items) + 0.7))

# ---- logo card (+ optional fan of images under it) ----
def add_logo_card(el):
    LS = ST["logo_card"]; t_in, t_out = T(el["in"]), T(el["out"]); x, y = el.get("x", 400), el.get("y", 160)
    lg = load_img(el["logo"]); lg.thumbnail(tuple(LS["logo_max"]), Image.LANCZOS)
    card = rounded(LS["w"], LS["h"], LS["radius"], rgba(ST["colors"]["card"])); d = ImageDraw.Draw(card)
    card.alpha_composite(lg, ((LS["w"] - lg.width) // 2, 22))
    if el.get("subtitle"):
        f = ImageFont.truetype(font_path("semibold"), LS["subtitle_size"]); s_ = el["subtitle"]
        d.text(((LS["w"] - d.textlength(s_, font=f)) / 2, LS["h"] - 44), s_, font=f, fill=rgba(ST["colors"]["muted"]))
    cimg, cpad = card_shadow(card)
    place(s_whoosh(0.32, LV["logo_in"]), t_in - 0.15, "logo-in"); place(s_whoosh(0.25, LV["logo_out"], up=False), t_out, "logo-out")
    fan, fan_in = [], None
    if el.get("fan"):
        fan_in = T(el["fan"]["in"]); place(s_whoosh(0.40, LV["fan_in"]), fan_in - 0.10, "fan-in")
        for spec in el["fan"]["images"]:
            c = load_img(spec); c.thumbnail(tuple(LS["fan_card_max"]), Image.LANCZOS)
            fr_ = rounded(c.width + 10, c.height + 10, 12, (255, 255, 255, 255)); fr_.alpha_composite(c, (5, 5)); fan.append(fr_)
    def draw(frame, t):
        if not (t_in <= t <= t_out + 0.3): return
        ko = ease_in_cubic((t - t_out) / 0.25) if t > t_out else 0
        sc = 0.7 + 0.3 * ease_out_back((t - t_in) / 0.32, 1.2)
        im2 = cimg.resize((int(cimg.width * sc), int(cimg.height * sc)), Image.LANCZOS) if abs(sc - 1) > 1e-3 else cimg
        cy = y - int(ko * 40)
        frame.alpha_composite(with_alpha(im2, clamp((t - t_in) / 0.12) * (1 - ko)), (x - im2.width // 2, cy - im2.height // 2))
        if fan and t >= fan_in:
            n = len(fan)
            for i, c in enumerate(fan):
                ti = fan_in + i * 0.07
                if t < ti: continue
                g = ease_out_back((t - ti) / 0.38, 1.1); ang = (i - (n - 1) / 2) * 9.0
                tx = x + (i - (n - 1) / 2) * 118; ty = y + 310 + abs(i - (n - 1) / 2) ** 2 * 9
                ci = c.rotate(-(ang * g - (1 - g) * 25), resample=Image.BICUBIC, expand=True)
                ci, _ = soft_shadow(ci, radius=10, opacity=0.4, off=(0, 6))
                frame.alpha_composite(with_alpha(ci, clamp((t - ti) / 0.1) * (1 - ko)),
                                      (int(tx - ci.width // 2), int(ty + (1 - g) * 380 - ci.height // 2 - ko * 40)))
    ELS.append((draw, t_in, t_out + 0.35))

# ---- brand badge (logo + name + model) ----
def add_badge(el):
    BD = ST["badge"]; t_in, t_out = T(el["in"]) + 0.05, T(el["out"]) - 0.05; x, y = el.get("x", 150), el.get("y", 330)
    card = rounded(BD["w"], BD["h"], BD["radius"], rgba(ST["colors"]["card_badge"])); d = ImageDraw.Draw(card)
    lg = load_img(el["logo"]); lg.thumbnail(tuple(BD["wordmark_max"] if el.get("wordmark") else BD["logo_max"]), Image.LANCZOS)
    card.alpha_composite(lg, ((BD["w"] - lg.width) // 2, 40 + (170 - lg.height) // 2))
    fb = ImageFont.truetype(font_path("black"), BD["title_size"]); fm = ImageFont.truetype(font_path("semibold"), BD["subtitle_size"])
    d.text(((BD["w"] - d.textlength(el["title"], font=fb)) / 2, 228), el["title"], font=fb, fill=rgba(ST["colors"]["ink"]))
    if el.get("subtitle"):
        d.text(((BD["w"] - d.textlength(el["subtitle"], font=fm)) / 2, 272), el["subtitle"], font=fm, fill=rgba(ST["colors"]["muted"]))
    img, pad = card_shadow(card)
    place(s_whoosh(0.30, LV["badge_in"]), t_in - 0.17, "badge-whoosh")
    def draw(frame, t):
        if not (t_in <= t <= t_out + 0.25): return
        k = ease_out_cubic((t - t_in) / 0.32); ko = ease_in_cubic((t - t_out) / 0.22) if t > t_out else 0
        frame.alpha_composite(with_alpha(img, k * (1 - ko)), (x - int((1 - k) * 120) - int(ko * 60) - pad, y - pad))
    ELS.append((draw, t_in, t_out + 0.3))

# ---- tier list (rows land as they are said; an image moves into each) ----
def add_tier_list(el):
    TS = ST["tier_list"]; t_in, t_out, park = T(el["in"]), T(el["out"]), T(el["park"]) if el.get("park") else None
    rows_t = [T(r["at"]) for r in el["rows"]]
    BX, BY, BW, HDR, RH, GAP, LW = el.get("x", 80), el.get("y", 110), TS["w"], TS["header_h"], TS["row_h"], TS["gap"], TS["label_w"]
    f_hdr = ImageFont.truetype(font_path("black"), TS["title_size"]); f_lab = ImageFont.truetype(font_path("black"), TS["label_size"])
    f_sub = ImageFont.truetype(font_path("semibold"), TS["subtitle_size"])
    hdr = rounded(BW, HDR, 18, rgba(TS["header_bg"])); d = ImageDraw.Draw(hdr)
    d.text((28, 15), el.get("title", "TIER LIST"), font=f_hdr, fill=(255, 255, 255, 255))
    if el.get("subtitle"): d.text((260, 25), el["subtitle"], font=f_sub, fill=rgba(TS["subtitle_color"]))
    HDR_IMG = soft_shadow(hdr, radius=14, opacity=0.4, off=(0, 8))
    ROWS = []
    for i, r in enumerate(el["rows"]):
        col = rgba(r.get("color", TS["colors"][i % len(TS["colors"])]))
        im = Image.new("RGBA", (BW, RH), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.rounded_rectangle((0, 0, BW - 1, RH - 1), 18, fill=rgba(TS["row_bg"]))
        d.rounded_rectangle((0, 0, LW, RH - 1), 18, fill=col); d.rectangle((LW - 20, 0, LW, RH - 1), fill=col)
        txt = tr_upper(r["label"]); ws = txt.split()
        lines = [txt] if f_lab.getlength(txt) < LW - 40 else [" ".join(ws[:-1]), ws[-1]]
        yy = (RH - len(lines) * 42) / 2
        for ln in lines: d.text(((LW - f_lab.getlength(ln)) / 2, yy), ln, font=f_lab, fill=rgba(ST["colors"]["ink"])); yy += 42
        ROWS.append(soft_shadow(im, radius=12, opacity=0.35, off=(0, 6)))
    pic = load_img(el["image"]); pic.thumbnail((10000, TS["image_h"]), Image.LANCZOS)
    fr_ = Image.new("RGBA", (pic.width + 12, pic.height + 12), (255, 255, 255, 255)); fr_.alpha_composite(pic, (6, 6))
    PIC = soft_shadow(fr_, radius=12, opacity=0.5, off=(0, 8))
    def row_y(i): return BY + HDR + GAP + i * (RH + GAP)
    place(s_whoosh(0.4, LV["board_in"]), t_in - 0.2, "board-in")
    for i, rt in enumerate(rows_t):
        place(s_thock(LV["tier_row"], 150 - i * 12), rt, f"tier-{i + 1}"); place(s_whoosh(0.22, LV["tier_move"]), rt + 0.02, "pic-move")
    place(s_whoosh(0.35, LV["board_out"], up=False), t_out, "board-out")
    wait = (BX + BW + 40, row_y(0) + 4)
    pts, times = [wait], [t_in]
    for i, rt in enumerate(rows_t):
        pts.append((BX + LW + 30, row_y(i) + (RH - PIC[0].height + 2 * PIC[1]) // 2)); times.append(rt + 0.02)
    if park is not None: pts.append(wait); times.append(park)
    def pic_pos(t):
        x, y = pts[0]
        for i in range(1, len(pts)):
            if t >= times[i]:
                g = ease_in_out((t - times[i]) / 0.30)
                x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * g; y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * g
        return x, y
    def draw(frame, t):
        if not (t_in <= t <= t_out + 0.35): return
        ko = ease_in_cubic((t - t_out) / 0.3) if t > t_out else 0; k = ease_out_cubic((t - t_in) / 0.35)
        dx = int(-(1 - k) * 120 - ko * 200); alpha = k * (1 - ko)
        im, pad = HDR_IMG; frame.alpha_composite(with_alpha(im, alpha), (BX - pad + dx, BY - pad))
        for i, rt in enumerate(rows_t):
            y = row_y(i)
            if t < rt:
                ghost = Image.new("RGBA", (BW, RH), (0, 0, 0, 0))
                ImageDraw.Draw(ghost).rounded_rectangle((0, 0, BW - 1, RH - 1), 18, outline=(255, 255, 255, 90), width=3)
                frame.alpha_composite(with_alpha(ghost, alpha * clamp((t - t_in - 0.1 * i) / 0.3)), (BX + dx, y))
            else:
                kr = ease_out_back((t - rt) / 0.28, 1.2); rim, rp = ROWS[i]
                frame.alpha_composite(with_alpha(rim, alpha * clamp((t - rt) / 0.1)), (BX - rp + dx + int((1 - kr) * -60), y - rp))
        sx, sy = pic_pos(t); sim, sp = PIC
        frame.alpha_composite(with_alpha(sim, alpha * clamp((t - t_in - 0.2) / 0.3)), (int(sx - sp + dx), int(sy - sp)))
    ELS.append((draw, t_in, t_out + 0.4))

ADDERS = {"buttons": add_buttons, "logo_card": add_logo_card, "badge": add_badge, "tier_list": add_tier_list}
ORDER = {"tier_list": 0, "logo_card": 1, "badge": 2, "buttons": 3}   # back-to-front
for el in sorted(TL.get("elements", []), key=lambda e: ORDER[e["type"]]):
    ADDERS[el["type"]](el)

def render_frame(t):
    fr = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for draw, a, b in ELS:
        if a - 0.05 <= t <= b: draw(fr, t)
    draw_caption(fr, t)
    return fr

def busy(t): return in_cap(t) or any(a - 0.05 <= t <= b for _, a, b in ELS)

if STILLS:
    tiles = []
    for t in STILLS:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", SRC, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], capture_output=True).stdout
        fr = Image.frombytes("RGBA", (W, H), raw); fr.alpha_composite(render_frame(t)); tiles.append(fr.convert("RGB").resize((W // 2, H // 2)))
    sheet = Image.new("RGB", (W, H // 2 * ((len(tiles) + 1) // 2)))
    for i, tl in enumerate(tiles): sheet.paste(tl, ((i % 2) * (W // 2), (i // 2) * (H // 2)))
    sheet.save(OUT, quality=85); print("stills", OUT); sys.exit()

stem = OUT.rsplit(".", 1)[0] + "_sfx.wav"
with wave.open(stem, "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(sfx[: int(dur * SR)], -1, 1) * 32767).astype(np.int16).tobytes())
json.dump({"captions": [{"s": round(c["s"], 3), "e": round(c["e"], 3), "text": " ".join(w["w"] for w in c["w"])} for c in CH], "sfx": cues},
          open(OUT.rsplit(".", 1)[0] + "_cues.json", "w"), ensure_ascii=False, indent=1)
vf = "[0:v][1:v]overlay=0:0:format=auto" + (",scale=1280:720" if PREVIEW else "")
lim = ST["mix"]["limiter"]
cmd = ["ffmpeg", "-v", "error", "-y", "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", stem,
       "-filter_complex", vf + f"[v];[0:a][2:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit={lim}:level=false[a]",
       "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "28" if PREVIEW else "16", "-preset", "medium" if PREVIEW else "slow",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k" if PREVIEW else "192k", "-r", str(FPS), "-movflags", "+faststart", OUT]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE); blank = bytes(W * H * 4)
for f in range(NF):
    t = f / FPS
    p.stdin.write(render_frame(t).tobytes() if busy(t) else blank)
p.stdin.close(); p.wait()
print("done", OUT, len(CH), "caption lines,", len(cues), "sfx")
