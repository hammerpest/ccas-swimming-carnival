"""Swim Opt 2.23 test (Playwright): the slip reader's second try on Jordan's phone photo of a photocopied slip
(tests/slip-photo-2.jpg, made-up times, race 1) and harder copies of it. The race must be 1 or the photo refused; every
lane read as sure must be right (a wrong time may only show as yellow for the Recorder). The as-sent photo must read.
Run: python3 tests/slip223.py http://127.0.0.1:8102/"""
import asyncio, base64, io, os, sys
from PIL import Image, ImageFilter
from playwright.async_api import async_playwright
ROOT = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8102/").split("?")[0].rstrip("/") + "/"
HERE = os.path.dirname(os.path.abspath(__file__))
TIMES = {4: 2744, 5: 2770, 3: 2802, 6: 2820, 2: 2862, 7: 2911, 1: 2932, 8: 2991}
fails = []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name, flush=True); ok or fails.append(name)
def variants():
    ph = Image.open(os.path.join(HERE, "slip-photo-2.jpg")).convert("RGB")
    return {"as sent": ph, "smaller": ph.resize((900, 1200), Image.LANCZOS),
            "tilted 2 degrees": ph.rotate(2, expand=True, fillcolor=(200, 200, 200), resample=Image.BICUBIC),
            "blurred": ph.filter(ImageFilter.GaussianBlur(1.5))}
def url(im):
    b = io.BytesIO(); im.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(); p = await br.new_page()
        await p.goto(ROOT + "?mode=local"); await p.wait_for_function("typeof readSlipPhoto==='function'")
        for name, im in variants().items():
            r = await p.evaluate("async d=>{const r=await readSlipPhoto(d,8);return {race:r.race,ru:r.raceUnsure,lanes:r.lanes,unsure:r.unsure}}", url(im))
            if r["ru"]:
                print("     ", name, "refused (asks for the photo again):", r["race"])
                check(name != "as sent", name + ": refused is safe, but the photo as sent must read")
                continue
            check(r["race"] == 1, f"{name}: race number {r['race']} (want 1)")
            wrong = [l for l, t in r["lanes"].items() if TIMES.get(int(l)) != t and int(l) not in r["unsure"]]
            check(not wrong and len(r["lanes"]) >= 6, f"{name}: every sure lane right ({len(r['lanes'])} lanes, unsure {r['unsure']})")
        await br.close()
    print("\nall passed" if not fails else f"\n{len(fails)} FAILED"); sys.exit(1 if fails else 0)
asyncio.run(main())
