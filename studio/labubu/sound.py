"""Score + SFX + mix for the Labubu short. Everything is synthesized here (no samples).
Writes studio/public/labubu/mix.wav (48 kHz stereo, about -14 LUFS).
Run from studio/:  python3 labubu/sound.py
"""
import json, re, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 51.5
OFF = 0.4  # voice offset (s), must match timeline.ts VOICE_OFFSET
rng = np.random.default_rng(7)
N = int(SR * DUR)

# ---------------------------------------------------------------- timeline (mirror of timeline.ts)
SEG = [(0.0, 1.6), (2.06, 7.51), (8.08, 10.39), (11.02, 13.75), (14.5, 16.07), (16.58, 18.43), (19.11, 23.12),
       (23.88, 25.08), (25.59, 27.65), (28.33, 31.6), (32.06, 34.78), (35.44, 39.62), (40.4, 41.46), (41.84, 44.62),
       (45.16, 46.75), (47.26, 48.93)]
TXT = json.load(open("labubu/lines.json"))
TXT = [TXT[0], TXT[1], TXT[2], TXT[3], TXT[4], TXT[5], TXT[6], "That should've been the win.", "Everyone finally gets the toy they wanted.",
       TXT[8], "In the Americas, by up to 75%.", TXT[10], "Labubu isn't dead.", "It still outsells most of Pop Mart's other characters.",
       "But once everyone could have one,", "turns out nobody wants one."]
WORDS = []
for si, ((a, b), text) in enumerate(zip(SEG, TXT)):
    ws = text.split(" ")
    wt = [len(re.sub(r"[^\w%]", "", w)) + 2.2 + (1.5 if re.search(r"[,.?]$", w) else 0) for w in ws]
    t = a + OFF
    for w, x in zip(ws, wt):
        WORDS.append((si, w, t)); t += x / sum(wt) * (b - a)
def word(seg, w):
    return next(t for s, x, t in WORDS if s == seg and re.sub(r"[^\w']", "", x.lower()).startswith(w))
FR = 1 / 30
CUTS = [2.35, word(1, "for") - 0.05, 8.35, 11.3, 14.75, 16.85, 19.35, word(6, "and") - 0.05, 24.1, 28.55, 32.3, 35.6, 40.6, 45.4]

# ---------------------------------------------------------------- helpers
def env(n, a=0.005, d=0.2, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * curve / max(d, 1e-4))
    return e
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)
def add(buf, t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0: return
    j = max(0, -i); sig = sig[j:]; i = max(0, i)
    n = min(len(sig), len(buf) - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + n, 0] += sig[:n] * gain * l * 1.414
    buf[i:i + n, 1] += sig[:n] * gain * r * 1.414
def tone(freq, dur, kind="sine", harm=(1,)):
    t = np.arange(int(dur * SR)) / SR
    if callable(freq):
        ph = 2 * np.pi * np.cumsum(freq(t)) / SR
    else:
        ph = 2 * np.pi * freq * t
    if kind == "saw":
        return sum(np.sin(ph * k) / k for k in range(1, 12)) * 0.6
    if kind == "square":
        return sum(np.sin(ph * k) / k for k in range(1, 12, 2)) * 0.8
    return sum(np.sin(ph * k) * (1 / (i + 1)) for i, k in enumerate(harm))
def noise(dur):
    return rng.standard_normal(int(dur * SR))
def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- instruments
def kick(g=1.0):
    d = 0.45; f = lambda t: 45 + 110 * np.exp(-t * 30)
    return tone(f, d) * env(int(d * SR), 0.001, 0.35, 5) * g
def clap():
    d = 0.25; x = bp(noise(d), 900, 5000) * env(int(d * SR), 0.001, 0.12, 6)
    return x * 0.8
def hat(open_=False):
    d = 0.25 if open_ else 0.06; return hp(noise(d), 7000) * env(int(d * SR), 0.001, d, 5) * 0.35
def pluck(m, d=0.35, bright=1.0):
    x = tone(mtof(m), d, harm=(1, 2, 3, 4)) * env(int(d * SR), 0.002, d, 5)
    return lp(x, 2500 + 4000 * bright) * 0.5
def marimba(m, d=0.5):
    f = mtof(m); n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.4 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 25)
    return x * 0.5
def bass(m, d=0.45):
    x = tone(mtof(m), d, "square") * env(int(d * SR), 0.004, d, 3)
    return lp(x, 600) * 0.5
def pad(ms, d, cutoff=1400):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(tone(mtof(m) * (1 + det), d, "saw") for m in ms for det in (-0.004, 0.004))
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return lp(x, cutoff) * a * 0.08
def musicbox(m, d=1.6):
    f = mtof(m) * (1 + rng.uniform(-0.006, 0.006)); n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 6) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    return lp(x * np.exp(-t * 2.2) * 0.4, 5000)

# ---------------------------------------------------------------- score
mus = np.zeros((N, 2))
BPM = 120; B = 60 / BPM
# Section A: 0 .. 28.55 major, C G Am F (one bar each)
A_END = 28.55
prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
arp_pat = [0, 1, 2, 1, 2, 0, 1, 2]
t = 0.0; bar = 0
while t < A_END - 0.01:
    root, ch = prog[bar % 4]
    for beat in range(4):
        tb = t + beat * B
        if tb >= A_END: break
        intro = tb < 2.35
        add(mus, tb, kick(0.9 if not intro else 0.7))
        if beat % 2 == 1 and not intro: add(mus, tb, clap(), 0.7, 0.1)
        for e in range(2):
            te = tb + e * B / 2
            if te < A_END and not intro: add(mus, te, hat(open_=(e == 1 and beat == 3)), 0.8, 0.3)
        add(mus, tb, bass(root + (12 if beat == 3 else 0)), 0.9)
        if not intro:
            for e in range(2):
                te = tb + e * B / 2
                if te < A_END:
                    n = ch[arp_pat[(beat * 2 + e) % 8]] + 12
                    add(mus, te, marimba(n), 0.55, -0.3 + 0.6 * ((beat * 2 + e) % 2))
    t += 4 * B; bar += 1
# lift into the win (24.1 .. 28.55): add a bright pad
add(mus, 24.1, pad([72, 76, 79], 4.45, 3000), 1.0)

# Section B: 28.55 .. 40.6 dark minor, half-time. Am F Dm E
B0, B_END = 28.95, 40.6
progm = [(45, [57, 60, 64]), (41, [57, 60, 65]), (38, [57, 62, 65]), (40, [56, 59, 64])]
t = B0; bar = 0
while t < B_END - 0.01:
    root, ch = progm[bar % 4]
    d = min(4 * B, B_END - t)
    add(mus, t, pad(ch, d + 0.3, 900), 1.0)
    add(mus, t, bass(root - 12, d), 0.9)
    add(mus, t, kick(1.0));
    if t + 2 * B < B_END: add(mus, t + 2 * B, clap(), 0.35)
    for k in range(8):
        tk = t + k * B / 2
        if tk < B_END: add(mus, tk, hat(), 0.35 + 0.25 * (k % 2), 0.4)
    for k, n in enumerate([ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]):
        tk = t + k * B
        if tk < B_END: add(mus, tk, pluck(n, 0.5, 0.2), 0.35, -0.4)
    t += 4 * B; bar += 1

# Section C: 40.6 .. 45.4 "not dead": hopeful, C G with marimba again but sparse
t = 40.6; bar = 0
while t < 45.4 - 0.01:
    root, ch = [(48, [60, 64, 67]), (43, [59, 62, 67])][bar % 2]
    add(mus, t, pad(ch, min(4 * B, 45.4 - t) + 0.2, 1800), 0.9)
    for beat in range(4):
        tb = t + beat * B
        if tb >= 45.4: break
        add(mus, tb, kick(0.8))
        add(mus, tb, bass(root), 0.7)
        add(mus, tb, marimba(ch[beat % 3] + 12), 0.45, 0.3 * (1 if beat % 2 else -1))
    t += 4 * B; bar += 1

# Section D: 45.4 .. end, music box melody, slowing, detuned
mb = [(0.0, 76), (0.5, 79), (1.0, 84), (1.5, 83), (2.0, 79), (2.6, 76), (3.3, 74), (4.1, 72), (5.0, 71)]
for dt, m in mb:
    add(mus, 45.4 + dt * 1.05, musicbox(m, 2.5), 0.9, 0.2)
add(mus, 45.4, pad([60, 64, 67], 2.0, 1200), 0.6)
add(mus, 47.4, pad([57, 60, 64], 4.0, 700), 0.7)

# ---------------------------------------------------------------- SFX
sfx = np.zeros((N, 2))
def whoosh(d=0.35, up=True):
    n = int(d * SR); x = noise(d); t = np.arange(n) / SR
    # sweep a bandpass by chunks
    out = np.zeros(n); step = 1200
    for i in range(0, n, step):
        fr = i / n
        c = 400 + (6000 if up else 2000) * (fr if up else 1 - fr)
        out[i:i + step] = bp(x[max(0, i - 2000):i + step], c * 0.7, min(c * 1.4, 20000))[-len(out[i:i + step]):]
    return out * np.sin(np.pi * t / d) ** 2 * 0.6
def pop(m=84):
    d = 0.12; f = lambda t: mtof(m) * (1 + 2.5 * np.exp(-t * 60))
    return tone(f, d) * env(int(d * SR), 0.001, 0.08, 4) * 0.32
def thud():
    d = 0.6; f = lambda t: 38 + 90 * np.exp(-t * 18)
    x = tone(f, d) * env(int(d * SR), 0.001, 0.5, 5) + lp(noise(d), 1500) * env(int(d * SR), 0.001, 0.08, 6) * 0.6
    return x
def ching():
    d = 1.2; n = int(d * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 3), (2637, 4), (3136, 5), (4186, 6)]) * 0.25
    return lp(x + hp(noise(d), 4000) * np.exp(-t * 40) * 0.2, 9000) * 0.63
def scratch():
    d = 0.55; n = int(d * SR); t = np.arange(n) / SR
    x = noise(d); out = np.zeros(n); step = 600
    for i in range(0, n, step):
        c = 600 + 2500 * abs(np.sin(i / n * np.pi * 3.2))
        out[i:i + step] = bp(x[max(0, i - 2000):i + step], c * 0.8, c * 1.25)[-len(out[i:i + step]):]
    return out * 2.2 * (t < d)
def slide_down(d=0.9, f0=900, f1=120):
    f = lambda t: f0 * (f1 / f0) ** (t / d)
    return tone(f, d, harm=(1, 2)) * np.minimum(1, (d - np.arange(int(d * SR)) / SR) / 0.1) * 0.25
def beep(f=1000, d=0.12):
    return tone(f, d) * env(int(d * SR), 0.002, d, 2) * 0.3
def boom():
    d = 2.5; f = lambda t: 30 + 40 * np.exp(-t * 3)
    return tone(f, d) * env(int(d * SR), 0.01, 2.0, 3) * 1.1
def horn():
    d = 0.5; f = lambda t: 520 + 120 * np.sin(t * 40)
    return lp(tone(f, d, "saw"), 3000) * env(int(d * SR), 0.01, 0.5, 2) * 0.25

for c in CUTS:
    add(sfx, c - 0.18, whoosh(0.32), 0.7, rng.uniform(-0.4, 0.4))
# hook: drop + land + letters
add(sfx, 4 * FR, whoosh(0.4, up=False), 0.5)
add(sfx, 16 * FR, thud(), 0.8)
lab = word(0, "labubu")
for i in range(7):
    add(sfx, lab - 2 * FR + i * 2 * FR, pop(72 + i * 2), 0.6, -0.5 + i / 6)
# queue: snore-ish low wobble under "sleeping"
add(sfx, word(1, "sleeping"), lp(tone(lambda t: 90 + 30 * np.sin(t * 6), 1.0, "saw"), 400) * np.sin(np.linspace(0, np.pi, SR)) * 0.25, 1.0)
# ruler grow + teeth
add(sfx, word(1, "six") - 4 * FR, tone(lambda t: 300 + 600 * t, 0.8, harm=(1, 2)) * env(int(0.8 * SR), 0.05, 0.8, 1.5) * 0.15, 1.0)
add(sfx, word(1, "teeth") + 3 * FR, thud(), 0.6); add(sfx, word(1, "teeth") + 3 * FR, pop(60), 0.8)
# resale: ching + stamp
add(sfx, word(2, "hundreds") + 4 * FR, thud(), 0.8); add(sfx, word(2, "hundreds") + 6 * FR, ching(), 0.7, 0.3)
# wanted: sold out stamp
add(sfx, word(3, "nobody") + 2 * FR, thud(), 1.0)
# fixed: needle sweep + clunk
add(sfx, 14.75 + 6 * FR, tone(lambda t: 200 + 900 * t, 1.0, harm=(1, 3)) * env(SR, 0.05, 1.0, 1.2) * 0.12, 1.0)
add(sfx, word(4, "fixed") + 4 * FR, thud(), 0.7); add(sfx, word(4, "fixed"), pop(88), 0.7)
# ten x: rapid pops as the grid multiplies
t0 = word(5, "ten") - 6 * FR
for k in range(8):
    add(sfx, t0 + k * 4.5 * FR, pop(70 + k * 3), 0.55, rng.uniform(-0.6, 0.6))
add(sfx, t0 + 30 * FR, thud(), 0.5)
# scalpers: wave whoosh + hit
w = word(6, "wiped")
add(sfx, w - 10 * FR, whoosh(0.6), 1.0); add(sfx, w, thud(), 0.9); add(sfx, w + 2 * FR, slide_down(0.6, 1200, 400), 0.8)
# retail: falling slide
add(sfx, word(6, "less") - 0.6, slide_down(0.9, 700, 150), 0.9); add(sfx, word(6, "less") + 6 * FR, thud(), 0.6)
# win: party horn + pops
add(sfx, word(7, "win") - 2 * FR, horn(), 0.9, -0.3); add(sfx, word(7, "win"), pop(90), 0.8)
for k in range(6): add(sfx, word(8, "everyone") + k * 0.09, pop(80 + k * 2), 0.4, rng.uniform(-0.7, 0.7))
# instead: record scratch, cut music
sc = scratch(); sc = sc + np.concatenate([np.zeros(int(0.03 * SR)), sc[:-int(0.03 * SR)]]) * 0.3
add(sfx, 28.5, lp(sc, 6000), 0.45)
# -50%: crash slide
add(sfx, word(9, "fell"), slide_down(1.1, 600, 90), 1.0); add(sfx, word(9, "half") + 4 * FR, thud(), 0.9)
# americas: battery drain beeps
s = word(10, "up") - 6 * FR
for k in range(6): add(sfx, s + k * 0.17, beep(900 - k * 110, 0.1), 0.8)
add(sfx, s + 1.0, thud(), 0.6)
# first time ever
add(sfx, word(11, "shrank") - 2 * FR, slide_down(0.6, 800, 200), 0.8); add(sfx, word(11, "shrank") + 8 * FR, thud(), 1.0)
# not dead: ECG beeps (one per 20 frames) until the leaderboard
board = word(13, "it") - 4 * FR
t = 40.6 + 0.25
while t < board: add(sfx, t, beep(1000, 0.09), 0.7, 0.2); t += 20 * FR
add(sfx, word(12, "dead") + 3 * FR, thud(), 0.6)
add(sfx, word(13, "outsells"), ching(), 0.4, -0.3)
# ending: grid pops, then boom on "nobody"
for k in range(10): add(sfx, 45.4 + k * 0.035 * 3, pop(76 + (k % 5) * 3), 0.25, rng.uniform(-0.8, 0.8))
add(sfx, word(15, "nobody") - 2 * FR, boom(), 0.9)

# ---------------------------------------------------------------- voice
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "labubu/voice/take_raw.wav", "-af",
                "highpass=f=75,equalizer=f=3500:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3.5:attack=5:release=120:makeup=4",
                "-ar", str(SR), "-ac", "1", "-f", "f32le", "/tmp/voice.f32"], check=True)
v = np.fromfile("/tmp/voice.f32", dtype=np.float32).astype(np.float64)
voice = np.zeros(N); i = int(OFF * SR); voice[i:i + len(v)] = v[:N - i]

# duck music under the voice
e = np.abs(voice); k = int(0.03 * SR)
e = np.convolve(e, np.ones(k) / k, "same")
e = np.maximum.accumulate(e[::-1])[::-1] * 0 + e  # (keep simple)
duck = 1 - 0.55 * np.clip(e / (np.percentile(e[e > 0], 80) + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), "same")
# the record scratch kills the music for a beat
gate = np.ones(N); a, b = int(28.55 * SR), int(28.95 * SR); gate[a:b] = 0.0
# carve 1-3 kHz out of the music for the voice; first half 3 dB lower
for ch in range(2): mus[:, ch] -= 0.5 * bp(mus[:, ch], 1000, 3000)
sec = np.ones(N); sec[:int(28.55 * SR)] = 0.71
mus *= (duck * gate * sec)[:, None] * 0.55
sfx *= 0.55

mix = mus + sfx + voice[:, None] * 1.0
mix = np.tanh(mix * 0.9) / 0.9  # soft clip
mix.astype(np.float32).tofile("/tmp/mix.f32")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "/tmp/mix.f32",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "public/labubu/mix.wav"], check=True)
for name, x in [("music", mus), ("sfx", sfx)]:
    x.astype(np.float32).tofile(f"/tmp/{name}.f32")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", f"/tmp/{name}.f32", f"labubu/{name}_stem.wav"], check=True)
print("wrote public/labubu/mix.wav")
