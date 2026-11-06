#!/usr/bin/env python3
"""Word-level timings for captions: force-align an approved transcript to the clip's audio.

    python3 tools/align.py clip.mp4 lines.txt words.json [--from 52.3] [--to 88]

lines.txt: the approved transcript, one spoken line per row, exactly as it should read in the captions.
words.json: [{"w": "İzlediğiniz", "line": 0, "s": 52.41, "e": 52.96, "score": 0.42}, ...]  (seconds in the clip)

Uses Meta's MMS forced aligner (torchaudio MMS_FA, 1100+ languages, Turkish included) with uroman romanization.
Needs: pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu ; pip install uroman
Hosts (cloud sessions): download.pytorch.org, download-r2.pytorch.org, dl.fbaipublicfiles.com (model, 1.2 GB, cached).
Start --from just before the first word you want: anything spoken before it gets swallowed into the first word.
Words with score < 0.15 are usually English loanwords or mumbles; they still land in the right place, check them.
"""
import argparse, json, re, subprocess
import numpy as np, torch
from torchaudio.pipelines import MMS_FA as bundle
import uroman as ur

ap = argparse.ArgumentParser()
ap.add_argument("media"); ap.add_argument("lines"); ap.add_argument("out")
ap.add_argument("--from", dest="a", type=float, default=0.0); ap.add_argument("--to", dest="b", type=float, default=None)
args = ap.parse_args()

SR = bundle.sample_rate
U = ur.Uroman()
def tr_lower(s): return s.replace("I", "ı").replace("İ", "i").lower()
def norm(w): return re.sub(r"[^a-z]", "", U.romanize_string(tr_lower(w)).lower())

if args.b is None:
    args.b = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", args.media],
                                  capture_output=True, text=True).stdout)
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(args.a), "-t", str(args.b - args.a), "-i", args.media,
                      "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
wav = torch.from_numpy(np.frombuffer(raw, np.float32).copy()).unsqueeze(0)

lines = [l.strip() for l in open(args.lines, encoding="utf-8") if l.strip()]
toks, disp = [], []
for li, line in enumerate(lines):
    for w in line.split():
        n = norm(w)
        if n: toks.append(n); disp.append((w, li))

model = bundle.get_model(); model.eval()
with torch.inference_mode():
    em, _ = model(wav); em = torch.log_softmax(em, -1)
spans = bundle.get_aligner()(em[0], bundle.get_tokenizer()(toks))
ratio = wav.shape[1] / em.shape[1] / SR
out = []
for (w, li), sp in zip(disp, spans):
    out.append({"w": w, "line": li, "s": round(args.a + sp[0].start * ratio, 3), "e": round(args.a + sp[-1].end * ratio, 3),
                "score": round(float(np.mean([x.score for x in sp])), 2)})
json.dump(out, open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
for li in range(len(lines)):
    ws = [r for r in out if r["line"] == li]
    if ws: print(f'{ws[0]["s"]:7.2f}-{ws[-1]["e"]:7.2f}  {lines[li][:60]}')
low = [r["w"] for r in out if r["score"] < 0.15]
if low: print("check these (low confidence):", ", ".join(low))
