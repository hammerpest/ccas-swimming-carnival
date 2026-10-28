"""Check 1 of the triple visual check: compare new screenshots with baseline/.
Usage: python3 tests/visual_diff.py baseline/ new-shots/ [threshold, default 0.001 = 0.1%]
Writes diff-report/ with a side-by-side image for every screen over the threshold."""
import sys, os
from PIL import Image, ImageChops
base, new = sys.argv[1], sys.argv[2]
limit = float(sys.argv[3]) if len(sys.argv) > 3 else 0.001
os.makedirs("diff-report", exist_ok=True)
fails, missing = [], []
for name in sorted(os.listdir(base)):
    if not name.endswith(".png"): continue
    p = os.path.join(new, name)
    if not os.path.exists(p): missing.append(name); continue
    a = Image.open(os.path.join(base, name)).convert("RGB"); b = Image.open(p).convert("RGB")
    if a.size != b.size:
        fails.append((name, 1.0, f"size {a.size} vs {b.size}"))
    else:
        d = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > 24 else 0)
        share = sum(d.histogram()[255:]) / (a.size[0] * a.size[1])
        if share <= limit: continue
        fails.append((name, share, ""))
    w = a.size[0] + b.size[0]; h = max(a.size[1], b.size[1])
    side = Image.new("RGB", (w, h), "white"); side.paste(a, (0, 0)); side.paste(b, (a.size[0], 0))
    side.save(os.path.join("diff-report", name))
for n in missing: print("MISSING", n)
for n, s, note in fails: print(f"DIFF {n} {s*100:.2f}% {note}")
print(f"{len(fails)} different, {len(missing)} missing, threshold {limit*100:.1f}%")
sys.exit(1 if fails or missing else 0)
