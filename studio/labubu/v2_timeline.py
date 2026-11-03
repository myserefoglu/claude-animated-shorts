"""Word timings for the Labubu v2 take: words spread over the speech-only parts of each line
(pauses inside a line are skipped). Writes src/videos/lab2/timeline.json.  Run from studio/."""
import json, re, subprocess
OFF = 0.5
segs = json.load(open("labubu/voice2/segments.json"))
TXT = ["What happened to Labubu?", "Last year, grown adults were sleeping outside malls for a six-inch monster with teeth.",
       "Resale prices hit hundreds of dollars.", "Everyone wanted one, and almost nobody could get one.", "Then Pop Mart fixed it.",
       "It made about ten times more of them.", "Scalpers got wiped out, and some Labubus now sell for less than retail.",
       "That should've been the win.", "Everyone finally gets the toy they wanted.", "Instead, sales fell by about half in a single quarter.",
       "In the Americas, by up to 75%.", "And for the first time ever, the Monsters line shrank in the first half of the year.",
       "Labubu isn't dead.", "It still outsells most of Pop Mart's other characters.", "But once everyone could have one,", "turns out nobody wants one."]
err = subprocess.run(["ffmpeg", "-i", "labubu/voice2/take_raw.wav", "-af", "silencedetect=n=-40dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
sil = list(zip([float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)], [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]))
words = []
for si, ((a, b), text) in enumerate(zip(segs, TXT)):
    # speech intervals inside [a, b]
    iv, t = [], a
    for s0, s1 in sil:
        if s0 > a and s1 < b:
            if s0 > t: iv.append((t, s0))
            t = s1
    iv.append((t, b))
    ws = text.split(" ")
    wt = [len(re.sub(r"[^\w%]", "", w)) + 2.0 for w in ws]
    # assign words to intervals in proportion, words never split across a pause
    tot_len = sum(e - s for s, e in iv); tot_w = sum(wt)
    out, k = [], 0
    for j, (s, e) in enumerate(iv):
        share = (e - s) / tot_len * tot_w
        grp = []
        while k < len(ws) and (sum(wt[x] for x in grp) + wt[k] <= share or j == len(iv) - 1 or not grp):
            grp.append(k); k += 1
            if j < len(iv) - 1 and sum(wt[x] for x in grp) >= share: break
        tw = sum(wt[x] for x in grp) or 1; tt = s
        for x in grp:
            d = (e - s) * wt[x] / tw
            out.append({"w": ws[x], "start": round(tt + OFF, 3), "end": round(tt + d + OFF, 3), "seg": si}); tt += d
    words += out
json.dump({"offset": OFF, "segments": [[round(a + OFF, 3), round(b + OFF, 3)] for a, b in segs], "words": words},
          open("src/videos/lab2/timeline.json", "w"), indent=0)
for w in words:
    if w["seg"] in (4, 9, 15): print(w)
