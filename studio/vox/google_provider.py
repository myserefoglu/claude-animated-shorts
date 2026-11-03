#!/usr/bin/env python3
"""
GoogleProvider: a vox-director backend that calls Google's Gemini API directly.

Select it per project with beats.json `{"provider": "google"}`. install-vox.sh copies this
file into vox-director's scripts/ and registers it in provider.py.

How it maps onto vox-director's Provider interface
  - Gemini calls are synchronous. Each submit_* runs the request on a small thread pool and
    returns a job id at once, and get_status reports the result, so the stages' run_jobs()
    loop works unchanged.
  - Gemini takes images inline, so there is nothing to upload. upload(path) returns a
    "file://" URL, and outputs are written to local files that get_status hands back as
    "file://" URLs. download() just copies.
  - Atlas model ids (google/nano-banana-2/..., xai/tts-v1, minimax/music-2.6, ...) are mapped
    to Gemini models by job type. Override them with the env vars
    VOX_GOOGLE_IMAGE / VOX_GOOGLE_VIDEO / VOX_GOOGLE_TTS / VOX_GOOGLE_MUSIC.
  - Each call blocks until its media is ready, so a slow job is never "stalled":
    `no_stall = True` tells run_jobs (patched by install-vox.sh) not to resubmit it, which
    would pay for the same generation twice. Real failures are still retried.

Auth: GEMINI_API_KEY if it is set. In the cloud environment the proxy adds the real key to
every generativelanguage.googleapis.com request, so a dummy value is sent instead.

Status (2026-11-03): TTS is verified end to end. Image, video and music request shapes follow
the public generateContent API but were not exercised yet: the key was on the free tier,
where those models have a quota of 0.
"""
import base64
import json
import mimetypes
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor

from provider import Provider, ProviderError

API = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODELS = {
    "image": "gemini-3.1-flash-image",      # Nano Banana 2
    "video": "gemini-omni-1.1-flash",       # Gemini Omni
    "tts": "gemini-3.8-flash-tts",
    "music": "lyria-3-clip-preview",        # 30 s clips; lyria-3-pro-preview for longer
}
# vox-director's default xai voice ids -> Gemini prebuilt voices. Any Gemini voice name
# (Charon, Kore, Puck, Fenrir, Aoede, ...) can also be given directly as voice.voice_id.
VOICE_MAP = {"leo": "Charon", "eve": "Kore", "rex": "Fenrir", "sal": "Puck", "una": "Aoede"}
OUT_DIR = os.environ.get("VOX_GOOGLE_OUT", os.path.join(tempfile.gettempdir(), "vox-google"))


def _key():
    return os.environ.get("GEMINI_API_KEY") or "proxy-injected"


def _inline_part(url):
    """file:// or local path -> inlineData part. http(s) URLs are fetched first."""
    if url.startswith("file://"):
        url = url[7:]
    if url.startswith(("http://", "https://")):
        with urllib.request.urlopen(url, timeout=60) as r:
            data, mime = r.read(), r.headers.get_content_type()
    else:
        with open(url, "rb") as f:
            data = f.read()
        mime = mimetypes.guess_type(url)[0] or "application/octet-stream"
    return {"inlineData": {"mimeType": mime, "data": base64.b64encode(data).decode()}}


def _post(model, body, timeout=600, retries=3):
    """POST generateContent. Retries 429 per-minute limits and 5xx, and fails at once
    on a daily or free-tier limit of 0 (waiting would not help)."""
    req_body = json.dumps(body).encode()
    for attempt in range(retries + 1):
        req = urllib.request.Request(
            f"{API}/{model}:generateContent", data=req_body, method="POST",
            headers={"x-goog-api-key": _key(), "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors="replace")
            try:
                err = json.loads(text).get("error", {})
            except ValueError:
                err = {"message": text}
            msg = err.get("message", "")
            if e.code == 429 and ("limit: 0" in msg or "per day" in msg.lower()):
                raise ProviderError(f"{model}: quota exhausted ({msg[:200]}). "
                                    "Image, video and music need billing enabled on the key's project.")
            if (e.code == 429 or e.code >= 500) and attempt < retries:
                m = re.search(r"retry in ([\d.]+)s", msg)
                time.sleep(min(float(m.group(1)) + 1, 90) if m else 5 * 2 ** attempt)
                continue
            raise ProviderError(f"{model} -> {e.code}: {msg[:400]}")
    raise ProviderError(f"{model}: gave up after {retries} retries")


def _media_parts(resp, model):
    cands = resp.get("candidates") or []
    if not cands:
        fb = resp.get("promptFeedback", {})
        raise ProviderError(f"{model}: no output (blocked? {fb.get('blockReason', fb)})")
    c = cands[0]
    parts = [p for p in (c.get("content") or {}).get("parts", [])
             if "inlineData" in p or "fileData" in p]
    if not parts:
        text = " ".join(p.get("text", "") for p in (c.get("content") or {}).get("parts", []))
        raise ProviderError(f"{model}: no media in response "
                            f"(finishReason={c.get('finishReason')}; {text[:200]})")
    return parts


def _save(part, stem):
    """Write one inlineData/fileData part to OUT_DIR; returns the local path."""
    os.makedirs(OUT_DIR, exist_ok=True)
    if "inlineData" in part:
        mime = part["inlineData"].get("mimeType", "")
        data = base64.b64decode(part["inlineData"]["data"])
    else:
        mime = part["fileData"].get("mimeType", "")
        uri = part["fileData"]["fileUri"]
        req = urllib.request.Request(uri + ("&" if "?" in uri else "?") + "alt=media",
                                     headers={"x-goog-api-key": _key()})
        with urllib.request.urlopen(req, timeout=600) as r:
            data = r.read()
    ext = mimetypes.guess_extension(mime.split(";")[0]) or ".bin"
    path = os.path.join(OUT_DIR, stem + ext)
    with open(path, "wb") as f:
        f.write(data)
    return path, mime


def _to(path, ext, mime=""):
    """Transcode with ffmpeg. Raw PCM (audio/L16 from TTS) needs its format spelled out."""
    out = os.path.splitext(path)[0] + ext
    pre = []
    if "L16" in mime or "pcm" in mime:
        rate = re.search(r"rate=(\d+)", mime)
        pre = ["-f", "s16le", "-ar", rate.group(1) if rate else "24000", "-ac", "1"]
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *pre, "-i", path, out], check=True)
    return out


class GoogleProvider(Provider):
    name = "google"
    no_stall = True

    def __init__(self, models=None, workers=None):
        self.models = dict(DEFAULT_MODELS)
        for k in self.models:
            self.models[k] = os.environ.get(f"VOX_GOOGLE_{k.upper()}", self.models[k])
        self.models.update(models or {})
        self.pool = ThreadPoolExecutor(max_workers=workers or int(os.environ.get("VOX_GOOGLE_WORKERS", 3)))
        self.jobs = {}

    def _submit(self, fn, *args):
        jid = f"g-{uuid.uuid4().hex[:12]}"
        self.jobs[jid] = self.pool.submit(fn, jid, *args)
        return jid

    # ------------------------------------------------------------- image
    def submit_image(self, model, prompt, **params):
        return self._submit(self._image, prompt, params)

    def _image(self, jid, prompt, params):
        m = self.models["image"]
        parts = [_inline_part(u) for u in params.get("images") or []]
        if params.get("image"):
            parts.append(_inline_part(params["image"]))
        parts.append({"text": prompt})
        cfg = {"responseModalities": ["IMAGE"]}
        img_cfg = {}
        if params.get("aspect_ratio"):
            img_cfg["aspectRatio"] = params["aspect_ratio"]
        if params.get("resolution"):
            img_cfg["imageSize"] = str(params["resolution"]).upper()   # 1k -> 1K
        if img_cfg:
            cfg["imageConfig"] = img_cfg
        resp = _post(m, {"contents": [{"parts": parts}], "generationConfig": cfg})
        path, mime = _save(_media_parts(resp, m)[0], jid)
        return path if path.endswith((".jpg", ".jpeg")) else _to(path, ".jpg")

    # ------------------------------------------------------------- video
    def submit_video(self, model, prompt, **params):
        return self._submit(self._video, prompt, params)

    def _video(self, jid, prompt, params):
        m = self.models["video"]
        parts = []
        for key in ("image", "video"):
            if params.get(key):
                parts.append(_inline_part(params[key]))
        for u in params.get("images") or params.get("reference_images") or []:
            parts.append(_inline_part(u))
        dur = params.get("duration")
        spec = []
        if dur:
            spec.append(f"{dur} seconds long")
        if params.get("aspect_ratio") or params.get("ratio"):
            spec.append(f"aspect ratio {params.get('aspect_ratio') or params.get('ratio')}")
        text = prompt + (f"\n\nOutput: one video clip, {', '.join(spec)}, no audio." if spec else "")
        parts.append({"text": text})
        resp = _post(m, {"contents": [{"parts": parts}],
                         "generationConfig": {"responseModalities": ["VIDEO"]}}, timeout=900)
        path, mime = _save(_media_parts(resp, m)[0], jid)
        return path if path.endswith(".mp4") else _to(path, ".mp4")

    # ------------------------------------------------------------- audio
    def submit_audio(self, model, **params):
        if "music" in model or ("prompt" in params and "text" not in params):
            return self._submit(self._music, params)
        return self._submit(self._tts, params)

    def _tts(self, jid, params):
        m = self.models["tts"]
        voice = params.get("voice_id") or "leo"
        voice = VOICE_MAP.get(voice.lower(), voice)
        style = params.get("style") or "Read this clearly in a warm, punchy documentary narrator voice"
        speed = float(params.get("speed") or 1.0)
        if speed > 1.05:
            style += ", a little faster than normal"
        elif speed < 0.95:
            style += ", a little slower than normal"
        lang = params.get("language")
        if lang and lang != "en":
            style += f", in the language with code '{lang}'"
        body = {"contents": [{"parts": [{"text": f"{style}:\n\n{params['text']}"}]}],
                "generationConfig": {"responseModalities": ["AUDIO"],
                                     "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
        resp = _post(m, body)
        path, mime = _save(_media_parts(resp, m)[0], jid)
        return _to(path, ".mp3", mime)

    def _music(self, jid, params):
        m = self.models["music"]
        prompt = params.get("prompt", "")
        if params.get("is_instrumental"):
            prompt += ". Instrumental only, no vocals."
        resp = _post(m, {"contents": [{"parts": [{"text": prompt}]}]}, timeout=900)
        path, mime = _save(_media_parts(resp, m)[0], jid)
        return path if path.endswith(".mp3") else _to(path, ".mp3", mime)

    # ------------------------------------------------------------- misc
    def remove_bg(self, model, image_url, **params):
        raise ProviderError("google provider has no background removal (Gemini cannot output "
                            "transparency). Cut out elements locally, e.g. `pip install rembg`.")

    def get_status(self, job_id):
        fut = self.jobs.get(job_id)
        if fut is None:
            return {"status": "failed", "output": None, "error": f"unknown job {job_id}"}
        if not fut.done():
            return {"status": "pending", "output": None, "error": None}
        err = fut.exception()
        if err:
            return {"status": "failed", "output": None, "error": str(err)}
        return {"status": "completed", "output": "file://" + fut.result(), "error": None}

    def upload(self, path):
        return "file://" + os.path.abspath(os.path.expanduser(path))

    def download(self, url, dest):
        src = url[7:] if url.startswith("file://") else url
        if src.startswith(("http://", "https://")):
            urllib.request.urlretrieve(src, dest)
        elif os.path.abspath(src) != os.path.abspath(dest):
            shutil.copyfile(src, dest)
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            raise ProviderError(f"download produced empty file: {url}")
        return dest


if __name__ == "__main__":
    # Smoke test: python3 google_provider.py [tts|image|video|music]
    import sys
    from provider import run_jobs
    p = GoogleProvider()
    what = sys.argv[1] if len(sys.argv) > 1 else "tts"
    submit = {
        "tts": lambda: p.submit_audio("xai/tts-v1", text="Why is everyone obsessed with this tiny monster?", voice_id="leo"),
        "image": lambda: p.submit_image("x", "a red paper star sticker on cream paper, collage", aspect_ratio="9:16", resolution="1k"),
        "video": lambda: p.submit_video("x", "a paper star slowly rotating on cream paper", duration=4, aspect_ratio="9:16"),
        "music": lambda: p.submit_audio("minimax/music-2.6", prompt="playful plucky pizzicato, curious", is_instrumental=True),
    }[what]
    out = run_jobs(p, {what: submit}, poll_s=1, stall_s=900, max_retries=0)[what]
    print("output:", out)
