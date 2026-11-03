"""Narration for the Labubu short: ONE Gemini TTS take of the whole script -> labubu/voice/take_raw.wav (48 kHz mono).

Run from studio/:  python3 labubu/tts.py [voice]      (default voice: Puck)

Lessons from the first session:
  - Send the plain script only. Any style instruction ("read this with energy...") makes the model
    perform around the line: long takes padded with claps and other sounds.
  - One take for the whole script flows better than per-line takes and costs 1 request
    (gemini-3.8-flash-tts allows only 10 requests/day on the free tier).
  - Line timings come from the pauses between lines:
      ffmpeg -i labubu/voice/take_raw.wav -af silencedetect=n=-40dB:d=0.25 -f null -
    then update SEGMENTS in src/videos/labubu/timeline.ts and SEG in labubu/sound.py.
"""
import base64, json, subprocess, sys, time, urllib.error, urllib.request

MODEL = "gemini-2.5-flash-preview-tts"   # 3.8-flash-tts is newer but its free daily quota is tiny
voice = sys.argv[1] if len(sys.argv) > 1 else "Puck"
text = "\n\n".join(json.load(open("labubu/lines.json")))
body = {"contents": [{"parts": [{"text": text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
                             "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
for attempt in range(4):
    try:
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                     data=json.dumps(body).encode(),
                                     headers={"x-goog-api-key": "proxy-injected", "Content-Type": "application/json"})
        part = json.load(urllib.request.urlopen(req, timeout=300))["candidates"][0]["content"]["parts"][0]["inlineData"]
        break
    except urllib.error.HTTPError as e:   # 502s happen on long takes; just retry
        print(e.code, e.read().decode()[:200]); time.sleep(15)
else:
    sys.exit("TTS failed")
raw = base64.b64decode(part["data"])
fmt = [] if "wav" in part["mimeType"] else ["-f", "s16le", "-ar", "24000", "-ac", "1"]
open("labubu/voice/take.raw", "wb").write(raw)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *fmt, "-i", "labubu/voice/take.raw", "-ar", "48000", "-ac", "1",
                "labubu/voice/take_raw.wav"], check=True)
print("wrote labubu/voice/take_raw.wav")
