"""Visual baseline for Swim Opt 1.4 (and the check for Swim Opt 2.0).
Runs the whole carnival flow once per device size and theme, and saves a
screenshot of every screen and state as <screen>-<state>-<device>-<theme>.png.
Usage: python3 baseline_shots.py <page url> <output folder>"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL=sys.argv[1]; OUT=sys.argv[2]
DEVICES={"ipad-land":(1180,820),"ipad-port":(820,1180),"macbook":(1512,982),"phone":(390,844)}
SEED="""(()=>{let s=42;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}})();"""
errs=[]
async def run(pw,dev,theme):
    w,h=DEVICES[dev]
    b=await pw.chromium.launch()
    ctx=await b.new_context(viewport={"width":w,"height":h},color_scheme=theme,locale="en-AU",timezone_id="Australia/Sydney")
    await ctx.add_init_script(SEED)
    async def page():
        p=await ctx.new_page()
        p.on("pageerror",lambda e:errs.append((dev,theme,str(e))))
        await p.goto(URL); await p.wait_for_timeout(400); return p
    async def shot(p,name):
        await p.wait_for_timeout(150)
        await p.screenshot(path=os.path.join(OUT,f"{name}-{dev}-{theme}.png"),full_page=True)
    async def pin(p,c):
        for k in c: await p.click(f'[data-act=key][data-k="{k}"]')
        await p.wait_for_timeout(150)
    O=await page()
    await shot(O,"home-pin")
    await pin(O,"0000"); await shot(O,"home-wrongpin")
    await pin(O,"9999"); await shot(O,"home-yearpick")
    await O.click('[data-act=year][data-v=current]'); await shot(O,"home-orgtiles")
    await O.click('.tile[data-job=organiser]')
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=otest]'); await shot(O,"org-students-preview")
    await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)
    await O.click('[data-act=osec][data-v=records]'); await O.click('[data-act=orectest]'); await O.wait_for_timeout(200)
    for sec in ["details","students","program","points","limits","records","export","lock"]:
        await O.click(f'[data-act=osec][data-v={sec}]'); await shot(O,f"org-{sec}")
    await O.click('[data-act=menu]'); await shot(O,"org-jobmenu"); await O.click('[data-act=menu]')
    M=await page(); await pin(M,"1111"); await shot(M,"marshal-start")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-notready"); await M.click('[data-act=closemodal]')
    await M.click('[data-act=mpick][data-v=back50]'); await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=g][data-v="14"]'); await shot(M,"marshal-ready")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-lanes-listopen")
    for i in range(8): await M.click('.picklist button.pick:not([disabled]) >> nth=0')
    await shot(M,"marshal-lanes-full")
    await M.click('[data-act=mnext]'); await M.wait_for_timeout(200)
    for i in range(3): await M.click('.picklist button.pick:not([disabled]) >> nth=0')
    await M.click('[data-act=mnew]'); await shot(M,"marshal-confirmheat"); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(200)
    await shot(M,"marshal-sent")
    await M.click('[data-act=menu]'); await shot(M,"marshal-jobmenu"); await M.click('[data-act=menu]')
    J=await page(); await pin(J,"2222")
    for l in [5,4,1,2]: await J.click(f'[data-act=jtap][data-l="{l}"]'); await J.wait_for_timeout(60)
    await shot(J,"judge-race1-placed")
    await J.click('[data-act=jnext]'); await J.wait_for_timeout(150)
    await J.click('[data-act=jtap][data-l="2"]'); await J.click('[data-act=jdh]'); await shot(J,"judge-deadheat-box")
    await J.click('[data-act=jdhok]'); await J.click('[data-act=jtap][data-l="3"]'); await shot(J,"judge-race2-deadheat")
    S=await page(); await pin(S,"4444"); await shot(S,"slips-ready")
    await S.click('[data-act=stest][data-v=bad]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(400); await shot(S,"slips-cannotread")
    await S.click('[data-act=stest][data-v=good]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(300); await shot(S,"slips-flash")
    await S.wait_for_timeout(1300); await shot(S,"slips-readok")
    await S.click('[data-act=snext]'); await S.click('[data-act=stest][data-v=wrong]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(400); await shot(S,"slips-wrongslip")
    await S.click('[data-act=stest][data-v=offline]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(500); await shot(S,"slips-nosignal")
    await S.wait_for_timeout(9000)
    R=await page(); await pin(R,"3333"); await R.wait_for_timeout(300)
    await R.fill('#t-1-3','7512'); await R.press('#t-1-3','Enter'); await R.wait_for_timeout(150); await shot(R,"recorder-over60")
    await R.fill('#t-1-3','2100'); await R.press('#t-1-3','Enter'); await R.wait_for_timeout(200); await shot(R,"recorder-pink-odd")
    R2=await page(); await pin(R2,"3333"); await R2.wait_for_timeout(400); await shot(R2,"recorder-locked")
    await R2.close(); await R.wait_for_timeout(300)
    await R.click('[data-act=rcheck]'); await shot(R,"recorder-missinglane"); await R.click('[data-act=closemodal]')
    await R.click('[data-act=rst][data-l="6"][data-st=DNS]'); await R.wait_for_timeout(100)
    await R.click('[data-act=rcheck]'); await shot(R,"recorder-checkbox"); await R.click('[data-act=rforce]'); await R.wait_for_timeout(250)
    await shot(R,"recorder-race2-deadheat")
    await R.click('[data-act=rcheck]'); await R.wait_for_timeout(100); await R.click('[data-act=rforce]'); await R.wait_for_timeout(250)
    await M.click('[data-act=mpick][data-v=free50]'); await M.wait_for_timeout(100)
    A=await page(); await pin(A,"5555"); await A.wait_for_timeout(300); await shot(A,"announcer")
    await A.click('.hlink[data-job=results]'); await shot(A,"results-race")
    await A.click('[data-act=rtab][data-v=hris]'); await shot(A,"results-hris")
    await A.click('[data-act=rtab][data-v=news]'); await shot(A,"results-newsletter")
    await A.click('.hlink[data-job=houses]'); await shot(A,"houses")
    await O.click('[data-act=osec][data-v=lock]'); await O.click('[data-act=olock]'); await O.wait_for_timeout(200)
    await A.click('.hlink[data-job=results]'); await shot(A,"results-locked")
    await O.click('[data-act=olock]'); await O.wait_for_timeout(200)
    await O.click('[data-act=onew]'); await O.fill('#ncPin','9999'); await O.click('[data-act=onew1]'); await shot(O,"org-newcarnival-records")
    await O.click('[data-act=onew2][data-v=yes]'); await O.wait_for_timeout(2500); await shot(O,"org-newcarnival-done")
    await O.click('[data-act=changeyear]'); await O.wait_for_timeout(300); await shot(O,"home-yearpick-2years")
    await O.click('[data-act=year][data-v="2027"]'); await O.wait_for_timeout(500)
    await O.click('.tile[data-job=announcer]'); await O.wait_for_timeout(300); await shot(O,"pastyear-announcer")
    await O.click('.tile[data-job=organiser]') if False else None
    await O.click('[data-act=menu]'); await O.click('.jobmenu [data-job=recorder]'); await O.wait_for_timeout(300); await shot(O,"pastyear-recorder")
    await b.close()
SLIP=os.path.join(os.path.dirname(os.path.abspath(__file__)),"slip.jpg")
async def main():
    os.makedirs(OUT,exist_ok=True)
    only=sys.argv[3:] or None
    async with async_playwright() as pw:
        for dev in DEVICES:
            for theme in ["light","dark"]:
                if only and f"{dev}-{theme}" not in only: continue
                await run(pw,dev,theme); print("done",dev,theme,flush=True)
    print("ERRORS",errs)
asyncio.run(main())
