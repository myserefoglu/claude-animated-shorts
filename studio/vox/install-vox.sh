#!/usr/bin/env bash
# Install vox-director (MIT, https://github.com/Alisa0808/vox-director) as a Claude skill,
# with the Google Gemini provider from this folder patched in.
# Usage: bash studio/vox/install-vox.sh   (re-run in every new cloud session)
set -euo pipefail
PIN=6a85a7c341610442a6a5b1885e6e0217ab82a11f
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
DEST="$REPO/.claude/skills/vox-director"

if [ ! -d "$DEST/.git" ]; then
  git clone --quiet https://github.com/Alisa0808/vox-director "$DEST"
fi
git -C "$DEST" fetch --quiet origin "$PIN" 2>/dev/null || true
git -C "$DEST" checkout --quiet --force "$PIN"

cp "$HERE/google_provider.py" "$DEST/scripts/google_provider.py"
python3 - "$DEST/scripts/provider.py" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
old = 'elif status == "failed" or (status == "pending" and now - s["t"] > stall_s):'
new = ('elif status == "failed" or (status == "pending" and now - s["t"] > stall_s\n'
       '                                         and not getattr(prov, "no_stall", False)):')
assert old in s, "run_jobs changed upstream; update install-vox.sh"
s = s.replace(old, new)
s += '''

# --- added by claude-animated-shorts/studio/vox/install-vox.sh ---
from google_provider import GoogleProvider  # noqa: E402
_REGISTRY["google"] = GoogleProvider
'''
open(p, "w").write(s)
PY
echo "vox-director installed at $DEST with provider 'google'"
