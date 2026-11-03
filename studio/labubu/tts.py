"""Narration: one Gemini TTS take per script line -> labubu/voice/lNN.wav (48 kHz mono, trimmed).
Plain text only: any style instruction in the prompt makes the model add sound effects/padding."""
import json, sys, os, base64, subprocess, time, urllib.request, urllib.error
lines = json.load(open("labubu/lines.json"))
VOICE = sys.argv[1] if len(sys.argv) > 1 else "Puck"
MODEL = "gemini-3.8-flash-tts"
for i, text in enumerate(lines):
    out = f"labubu/voice/l{i:02d}.wav"
    if os.path.exists(out): continue
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
              "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
    for t in range(8):
        try:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                data=json.dumps(body).encode(), headers={"x-goog-api-key": "proxy", "Content-Type": "application/json"})
            p = json.load(urllib.request.urlopen(req, timeout=120))["candidates"][0]["content"]["parts"][0]["inlineData"]
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode()
            if e.code == 429 and "per day" in msg.lower() and "PerMinute" not in msg: sys.exit(f"daily quota hit at line {i}")
            print(i, e.code, "waiting"); time.sleep(20)
    raw = base64.b64decode(p["data"]); tmp = out + ".raw"
    open(tmp, "wb").write(raw)
    fmt = [] if "wav" in p["mimeType"] else ["-f", "s16le", "-ar", "24000", "-ac", "1"]
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *fmt, "-i", tmp, "-af",
        "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
        "-ar", "48000", "-ac", "1", out], check=True)
    os.remove(tmp)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout.strip()
    print(i, d, text[:50], flush=True)
    time.sleep(6)
