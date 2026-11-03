"""Score + SFX + mix for Labubu v2 (paper-cut). Synthesized, no samples. Run from studio/.
Thriller grammar (STYLE.md): drone + low pulse that builds through the hype, a hard stop and
dark half-time after "Instead", a detuned music box at the end; paper foley on every move.
Writes public/lab2/mix.wav (48 kHz stereo, -14 LUFS)."""
import json, re, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 54.0; N = int(SR * DUR); FR = 1 / 30
rng = np.random.default_rng(11)
TL = json.load(open("src/videos/lab2/timeline.json"))
WORDS = TL["words"]
def W(seg, w):
    return next(x["start"] for x in WORDS if x["seg"] == seg and re.sub(r"[^\w']", "", x["w"].lower()).startswith(w))
CUTS = {"queue": 2.45, "ruler": W(1, "for") - 0.1, "resale": 8.62, "wanted": 11.5, "factory": 15.05, "tenx": 17.7, "scalpers": 20.05,
        "retail": W(6, "and") - 0.05, "win": 24.8, "gets": 26.3, "instead": 29.25, "americas": 33.2, "firsttime": 36.6, "alive": 41.8,
        "podium": W(13, "it") - 0.15, "wall": 45.85, "drag": 48.0}

def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "highpass", fs=SR, output="sos"), x)
def env(n, a, d, c=4.0):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * c / max(d, 1e-4))
def add(buf, t, sig, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf): return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(buf) - i); l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + n, 0] += sig[:n] * g * l * 1.414; buf[i:i + n, 1] += sig[:n] * g * r * 1.414
def tone(freq, dur, harm=(1,)):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * (np.cumsum(freq(t)) / SR if callable(freq) else freq * t)
    return sum(np.sin(ph * k) / (i + 1) for i, k in enumerate(harm))
def saw(f, d): return tone(f, d, harm=tuple(range(1, 10))) * 0.5
def noise(d): return rng.standard_normal(int(d * SR))
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# ---------------- score
def drone(t0, t1, notes, cutoff, g):
    d = t1 - t0; n = int(d * SR); t = np.arange(n) / SR
    x = sum(lp(saw(mtof(m) * (1 + det), d), cutoff) for m in notes for det in (-0.003, 0.003))
    a = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 0.8)
    add(mus, t0, x * a * 0.05, g)
def pulse_note(t, m, d=0.18, cut=900, g=1.0):
    x = lp(saw(mtof(m), d), cut) * env(int(d * SR), 0.003, d, 4); add(mus, t, x * 0.18, g)
def kick(t, g=1.0):
    d = 0.5; x = tone(lambda u: 42 + 80 * np.exp(-u * 28), d) * env(int(d * SR), 0.001, 0.4, 5); add(mus, t, x * 0.6, g)
def heart(t, g=1.0): kick(t, 0.55 * g); kick(t + 0.18, 0.35 * g)
def tick(t, g=1.0, f=6000):
    d = 0.03; add(sfx, t, hp(noise(d), f) * env(int(d * SR), 0.0005, 0.03, 5) * 0.25, g, rng.uniform(-0.4, 0.4))
def shimmer(t0, t1, notes, g):
    d = t1 - t0; n = int(d * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * mtof(m) * tt + 3 * np.sin(2 * np.pi * 5.5 * tt)) for m in notes)
    add(mus, t0, x * np.minimum(1, tt / 1.5) * np.minimum(1, (d - tt) / 0.5) * 0.02, g)

# hook: drone + heartbeat
drone(0.0, 2.6, [33, 40, 45], 500, 1.0)
for k in range(3): heart(0.35 + k * 0.85, 0.8)
# hype (2.45 .. 29.25): A minor pulse at 100 BPM, building; bass line per bar
B = 60 / 100 / 2  # eighth
prog = [45, 45, 41, 43]  # A A F G
t = 2.45; i = 0
while t < 29.25 - 0.01:
    bar = int((t - 2.45) / (B * 8)); root = prog[bar % 4]
    build = min(1, (t - 2.45) / 22)
    pulse_note(t, root - 12 + (12 if i % 8 == 7 else 0), cut=500 + 1400 * build, g=0.7 + 0.5 * build)
    if i % 4 == 0: kick(t, 0.5 + 0.4 * build)
    if t > 8.6: tick(t + B / 2, 0.35 + 0.4 * build)
    t += B; i += 1
drone(2.45, 24.8, [45, 52, 57], 700, 0.8)
shimmer(11.5, 24.8, [81, 88], 0.8)
# win: brighter (F major-ish) lift
drone(24.8, 29.3, [53, 57, 60, 65], 1800, 1.0)
# instead: hard stop, impact, dark half-time
def boom(t, g=1.0):
    d = 2.8; x = tone(lambda u: 30 + 50 * np.exp(-u * 4), d) * env(int(d * SR), 0.005, 2.4, 3); add(mus, t, x * 0.9, g)
INST = W(9, 'instead')
boom(INST, 1.25)
drone(29.65, 41.9, [38, 45, 50], 420, 1.0)
shimmer(30.0, 41.9, [74, 75], 0.9)          # minor-second unease
t = 29.95
while t < 41.8:
    kick(t, 0.55); pulse_note(t, 26, 0.35, 300, 0.9); t += 60 / 70
# alive / podium: pulse returns, a little hope
t = 41.8; i = 0
while t < 45.85:
    pulse_note(t, [45, 48, 52, 57][i % 4] - 12, 0.2, 900, 0.7)
    if i % 4 == 0: kick(t, 0.5)
    t += B; i += 1
drone(41.8, 46.0, [45, 52, 60], 1000, 0.8)
# wall: tension riser into the drop
d = 2.2; n = int(d * SR); tt = np.arange(n) / SR
add(mus, 45.85, bp(noise(d), 400, 6000) * (tt / d) ** 2 * 0.12, 1.0)
drone(45.85, 48.1, [44, 51, 56], 900, 0.9)
# ending: drop to a detuned music box over a low drone
boom(48.0, 0.7)
drone(48.0, 54.0, [33, 40], 300, 0.8)
def musicbox(t, m, g=1.0):
    d = 2.2; f = mtof(m) * (1 + rng.uniform(-0.008, 0.008)); tt = np.arange(int(d * SR)) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 6)
    add(mus, t, lp(x * np.exp(-tt * 2) * 0.25, 5000), g, 0.2)
for k, m in enumerate([76, 79, 84, 83, 79, 76, 74, 72]):
    musicbox(48.2 + k * 0.62 * (1 + k * 0.05), m)

# ---------------- SFX (paper foley + story hits)
def slide(t, g=1.0):
    d = 0.32; tt = np.arange(int(d * SR)) / SR
    add(sfx, t, bp(noise(d), 700, 4000) * np.sin(np.pi * tt / d) ** 2 * 0.35, g, rng.uniform(-0.5, 0.5))
def slap(t, g=1.0):
    d = 0.18; add(sfx, t, (bp(noise(d), 300, 3500) * env(int(d * SR), 0.001, 0.08, 6) * 0.7 + tone(lambda u: 90 + 60 * np.exp(-u * 40), d) * env(int(d * SR), 0.001, 0.12, 5) * 0.4), g)
def thud(t, g=1.0):
    d = 0.6; add(sfx, t, tone(lambda u: 40 + 90 * np.exp(-u * 18), d) * env(int(d * SR), 0.001, 0.5, 5) + lp(noise(d), 1500) * env(int(d * SR), 0.001, 0.08, 6) * 0.5, g)
def tear(t, g=1.0):
    d = 0.55; x = bp(noise(d), 1500, 7000) * (np.random.default_rng(5).random(int(d * SR)) < 0.25)
    add(sfx, t, lp(x, 7000) * env(int(d * SR), 0.01, d, 1.5) * 0.9, g)
def squeak(t, g=1.0):
    d = 0.35; add(sfx, t, bp(noise(d), 2000, 3200) * np.sin(np.pi * np.arange(int(d * SR)) / (d * SR)) * 0.25, g)
def pop(t, g=1.0):
    d = 0.08; add(sfx, t, tone(lambda u: 900 * (1 + 2 * np.exp(-u * 60)), d) * env(int(d * SR), 0.001, 0.06, 4) * 0.25, g, rng.uniform(-0.5, 0.5))

for name, c in CUTS.items():
    if name not in ("tenx", "instead", "americas"): slide(c - 0.12, 0.8)
slap(0.25, 0.8); slap(4 * FR + 0.1, 0.9)                                    # hook pieces land
slap(2.45 + 72 * FR, 0.6); slide(2.45 + 80 * FR, 0.7)                       # clip freezes, print lands, crowd lifts
r0 = CUTS["ruler"]; six = W(1, "six")
for k in range(6): tick(six - 0.2 + k * 0.1, 1.2, 4000)
squeak(W(1, "teeth") + 4 * FR, 1.0)
a, b = W(2, "prices"), W(2, "hundreds") + 8 * FR                            # price racing up
t = a
while t < b: tick(t, 1.0, 3500); t += max(0.03, 0.12 * (1 - (t - a) / (b - a)))
thud(b, 0.6)
thud(W(3, "get") - 2 * FR, 1.0)                                              # SOLD OUT
for k in range(5): slap(W(4, "fixed") - 6 * FR + k * 0.2 + 0.2, 0.35)        # boxes on the line
t0 = W(5, "ten") - 10 * FR                                                   # x10 pile
for k in range(30): pop(t0 + k * 0.03, 0.6)
for k in range(10): tick(t0 + k * 0.087, 1.4, 3000)
thud(t0 + 0.9, 0.6)
tear(W(6, "wiped") - 4 * FR, 1.1); thud(W(6, "wiped") + 0.3, 0.6)            # scalpers wiped
less = W(6, "less")
for k in range(12): tick(less - 0.6 + k * 0.05, 1.0, 3000)
thud(less + 11 * FR, 1.0)                                                    # BELOW RETAIL
slap(CUTS["win"] + 0.05, 0.7); slap(CUTS["win"] + 0.2, 0.7)
for k in range(9): slap(W(8, "finally") - 4 * FR + k * 4 * FR + 0.5, 0.3)
fell, half = W(9, "fell"), W(9, "half")
t = fell
while t < half + 0.2: tick(t, 1.0, 2500); t += 0.06
thud(half + 6 * FR, 0.9)
up = W(10, "up") - 6 * FR
for k in range(16): tick(up + k * 0.05, 1.0, 2500)
thud(up + 0.8, 0.8)
for k in range(6): pop(CUTS["firsttime"] + 0.2 + k * 0.45, 1.2)
thud(W(11, "shrank") + 8 * FR, 1.2)
slap(W(12, "dead") - 4 * FR + 0.4, 0.9)
for k in range(5): slap(CUTS["podium"] + 0.15 + k * 0.13, 0.5)
for k in range(24): pop(W(14, "everyone") - 4 * FR + k * 0.017 * 3, 0.4)

# ---------------- voice + mix
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "labubu/voice2/take_raw.wav", "-af",
                "highpass=f=70,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=4:attack=4:release=100:makeup=5",
                "-ar", str(SR), "-ac", "1", "-f", "f32le", "/tmp/v2voice.f32"], check=True)
v = np.fromfile("/tmp/v2voice.f32", dtype=np.float32).astype(np.float64)
voice = np.zeros(N); i0 = int(TL["offset"] * SR); voice[i0:i0 + len(v)] = v[:N - i0]
e = np.convolve(np.abs(voice), np.ones(int(0.03 * SR)) / int(0.03 * SR), "same")
duck = 1 - 0.65 * np.clip(e / (np.percentile(e[e > 0], 80) + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), "same")
gate = np.ones(N); gate[int((INST - 0.22) * SR):int(INST * SR)] = 0         # vacuum before "Instead"
# after the hit the music comes back muffled, opening up over ~1.5 s
post = int(INST * SR); seg = mus[post:post + int(1.6 * SR)].copy()
for ch in range(2): seg[:, ch] = lp(seg[:, ch], 350)
w = np.linspace(1, 0, len(seg))[:, None]; mus[post:post + len(seg)] = seg * w + mus[post:post + len(seg)] * (1 - w)
sfx[int((INST - 0.22) * SR):int(INST * SR)] = 0
boom(W(15, 'nobody'), 0.9)
for ch in range(2): mus[:, ch] -= 0.45 * bp(mus[:, ch], 1000, 3000)          # room for the voice
for ch in range(2): sfx[:, ch] = lp(sfx[:, ch], 6000)                       # soften paper crinkle
sfx *= gate[:, None]
mix = mus * (duck * gate)[:, None] * 0.6 + sfx * 0.38 + voice[:, None]
fade = np.ones(N); fade[int(51.6 * SR):] = np.linspace(1, 0, N - int(51.6 * SR)) ** 1.5
mix = np.tanh(mix * fade[:, None] * 0.9) / 0.9
mix.astype(np.float32).tofile("/tmp/v2mix.f32")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "/tmp/v2mix.f32",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "public/lab2/mix.wav"], check=True)
print("wrote public/lab2/mix.wav")
