"""Swim Opt 2.20 test (Playwright): the slip reader on Jordan's sample slip (tests/slip-sample-1.png, made-up times) and
harder copies of it (blurred, tilted, smaller, dim, compressed, shadowed), plus a copy whose race number is changed to 3.
The race number must be read as 1 (or 3 for that copy) with the lanes and times right, or the photo refused; never a wrong race.
Run: python3 tests/slip220.py http://127.0.0.1:8102/"""
import asyncio, base64, io, os, sys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
from playwright.async_api import async_playwright
ROOT = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8102/").split("?")[0].rstrip("/") + "/"
HERE = os.path.dirname(os.path.abspath(__file__))
TIMES = {4: 2744, 5: 2770, 3: 2802, 6: 2820, 2: 2862, 7: 2911, 1: 2932, 8: 2991}
fails = []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name, flush=True); ok or fails.append(name)

def variants():
    im = Image.open(os.path.join(HERE, "slip-sample-1.png")).convert("RGB")
    v = {"as sent": im}
    v["blurred"] = im.filter(ImageFilter.GaussianBlur(1.2))
    v["tilted 3 degrees"] = im.rotate(3, expand=True, fillcolor=(235, 235, 235), resample=Image.BICUBIC)
    v["tilted -2 degrees"] = im.rotate(-2, expand=True, fillcolor=(235, 235, 235), resample=Image.BICUBIC)
    v["smaller (60%)"] = im.resize((int(im.width * .6), int(im.height * .6)), Image.LANCZOS)
    v["dim, low contrast"] = ImageEnhance.Contrast(ImageEnhance.Brightness(im).enhance(.7)).enhance(.6)
    b = io.BytesIO(); im.save(b, "JPEG", quality=35); v["heavy JPEG"] = Image.open(io.BytesIO(b.getvalue())).convert("RGB")
    sh = im.copy(); d = ImageDraw.Draw(sh, "RGBA")
    for x in range(sh.width): d.line([(x, 0), (x, sh.height)], fill=(0, 0, 0, int(90 * x / sh.width)))
    v["shadow across"] = sh
    r3 = im.copy(); r3.paste((242, 242, 242), (490, 125, 540, 175)); r3.paste(im.crop((240, 405, 282, 448)), (495, 128))
    v["race 3"] = r3
    # check 3's case: race 10, blurred and tilted; the whole readings agree on 19 at low confidence. Must never be 19.
    v["race 10 blurred and tilted"] = Image.open(os.path.join(HERE, "slip-race10-blurtilt.png")).convert("RGB")
    return v

def url(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(); p = await br.new_page()
        await p.goto(ROOT + "?mode=local"); await p.wait_for_function("typeof readSlipPhoto==='function'")
        for name, im in variants().items():
            r = await p.evaluate("async d=>{const r=await readSlipPhoto(d,8);delete r.text;return r}", url(im))
            want = 3 if name == "race 3" else 10 if name.startswith("race 10") else 1
            refused = r["race"] is None or r["raceUnsure"] or not r["order"]
            if refused:
                print("     ", name, "refused (asks for the photo again):", r["race"], r["raceUnsure"])
                check(name != "as sent", name + ": refused is safe, but the sample itself must read")
                continue
            check(r["race"] == want, f"{name}: race number {r['race']} (want {want})")
            if want != 1: continue
            wrong = {l: t for l, t in ((int(k), v) for k, v in r["lanes"].items()) if TIMES.get(l) != t and l not in r["unsure"]}
            check(not wrong, f"{name}: every lane time right, or yellow for the Recorder ({len(r['lanes'])} lanes, unsure {r['unsure']})")
        await br.close()
    print(f"\n{len(fails)} failed" if fails else "\nall passed"); sys.exit(1 if fails else 0)

asyncio.run(main())
