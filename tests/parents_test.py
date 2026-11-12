"""Swim Opt 2.19 test (Playwright, test mode): Carnival Organiser section 9 Parents page and the parents page (S1.45, decisions 165 to 168).
Run: python3 tests/parents_test.py http://127.0.0.1:8102/   (the site root; test mode is added here)"""
import asyncio, json, sys
from playwright.async_api import async_playwright
ROOT = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8102/").split("?")[0].rstrip("/") + "/"
fails, errs = [], []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name); ok or fails.append(name)

# Swim Opt 2.25: the job screens show some words in uppercase; read the words as written
WORDS = """(sel)=>{const s=document.createElement('style');s.textContent='*{text-transform:none!important}';document.head.appendChild(s);const t=document.querySelector(sel).innerText;s.remove();return t}"""
async def main():
  async with async_playwright() as pw:
    b = await pw.chromium.launch()
    ctx = await b.new_context(viewport={"width": 1512, "height": 982})
    O = await ctx.new_page(); O.on("pageerror", lambda e: errs.append(("org", str(e))))
    O.on("console", lambda m: errs.append(("org", m.text)) if m.type == "error" else None)
    await O.goto(ROOT + "?mode=local"); await O.wait_for_function("!!A.store")
    for k in "9999": await O.click(f'[data-act=key][data-k="{k}"]')
    await O.wait_for_timeout(150); await O.click('[data-act=year][data-v=current]'); await O.click('.tile[data-job=organiser]')
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(400)
    # race 1: a finished 50 m freestyle; races 2 and 3: a 50 m backstroke in two heats, heat 2 not in yet
    who = await O.evaluate("""(async()=>{
      const g=students().filter(s=>s.x==='F'&&s.g==='14');const a=g[0],b=g[1],c=g[2],d=g[3];
      await A.store.set('heats/r0001',{race:1,k:'free50',x:'F',g:'14',heat:1,lanes:{4:a.id,5:b.id},at:Date.now(),dev:'secret-device'});
      await A.store.set('times/r0001',{lanes:{4:{t:3400,st:'ok',src:'photo'},5:{t:3550,st:'ok',src:'photo'}},checked:false,gen:0,by:'secret-device'});
      await A.store.set('finish/r0001',{order:[[4],[5]],ok:true,gen:0,dev:'secret-device'});
      await A.store.set('heats/r0002',{race:2,k:'back50',x:'F',g:'14',heat:1,lanes:{3:c.id},at:Date.now(),dev:'secret-device'});
      await A.store.set('times/r0002',{lanes:{3:{t:4200,st:'ok',src:'photo'}},gen:0});
      await A.store.set('finish/r0002',{order:[[3]],ok:true,gen:0});
      await A.store.set('heats/r0003',{race:3,k:'back50',x:'F',g:'14',heat:2,lanes:{6:d.id},at:Date.now(),dev:'secret-device'});
      await A.store.set('records/all',{list:[{key:'free50|F|14',t:3450,holders:[{n:'Test: Jane Mary Citizen',h:'B',y:'2019'}]}]});
      return [a,b,c,d].map(s=>({id:s.id,f:s.f,s:s.s}))})()""")
    await O.wait_for_timeout(400)
    a = who[0]

    # ---- Organiser section 9
    await O.click('[data-act=osec][data-v=parents]'); await O.wait_for_timeout(200)
    t = await O.evaluate(WORDS, "body")
    check(await O.locator('[data-act=osec]').count() == 9 and "9. Parents page" in t and "Parents page is off" in t, "Organiser: section 9 is Parents page, off to start")
    check(await O.locator('[data-act=pshow]').count() == 6 and await O.evaluate("[...document.querySelectorAll('[data-act=pshow]')].every(c=>c.checked)"), "Organiser: six ticks, all ticked to start")
    check(await O.get_attribute('[data-act=pnames][data-v=none]', "aria-pressed") == "true", "Organiser: No names to start")
    check(not await O.is_checked('[data-act=pprov]'), "Organiser: show before final not ticked to start")
    check("parents/" in t and "media consent" in t, "Organiser: the link and the consent warning show")
    small = await O.evaluate("[...document.querySelectorAll('[data-act=ptog],[data-act=pcopy],[data-act=pnames]')].filter(e=>e.getBoundingClientRect().height<48&&e.dataset.act!=='ptog').length")
    check(small == 0, "Organiser: buttons are 48 px or more")

    P = await ctx.new_page(); P.on("pageerror", lambda e: errs.append(("parents", str(e))))
    P.on("console", lambda m: errs.append(("parents", m.text)) if m.type == "error" else None)
    await P.set_viewport_size({"width": 390, "height": 844})
    async def load(h="#/"):
        await P.goto("about:blank"); await P.goto(ROOT + "parents/index.html?mode=local" + h); await P.wait_for_timeout(500)
        # Swim Opt 2.24: the words as written (the S1.46 look shows some in uppercase)
        return await P.evaluate("[...document.querySelectorAll('#hdr,main,#tabs')].map(e=>e.textContent).join(' ')")
    pt = await load()
    check("Results are not open yet" in pt, "off: parents see Results are not open yet")

    await O.click('[data-act=ptog]'); await O.wait_for_timeout(250)
    check(await O.evaluate("A.cfg.parents") is True and "Parents page is on" in await O.evaluate(WORDS, "body") and "On, no names" in await O.evaluate(WORDS, "nav.secnav"), "Organiser: the switch turns the page on")
    pt = await load()
    check(all(h in pt for h in ["Bradman", "Jackson", "Newcombe"]) and "Age champions" in pt, "on: Home shows house points and age champions")
    tabs = await P.locator("#tabs a").all_text_contents()
    check(tabs == ["Home", "Events", "Houses"], "names off: no Find tab " + str(tabs))
    data = await P.evaluate("JSON.stringify(P.data)"); html = await P.content()
    names = [w for s in who for w in (s["f"], s["s"])]
    check(not any(n in data or n in html for n in names), "names off: no first name or surname in the data or the page")
    check(not any(s["id"] in data for s in who) and "secret-device" not in data and "Citizen" not in data, "no student id, device id or record holder name in the data")
    pt = await load("#/event/free50%7CF%7C14")
    check("Swimmer" in pt and "34.00" in pt and "A swimmer" in pt, "names off: an event shows Swimmer, the time, and A swimmer for the old record")
    pt = await load("#/events")
    check("1 of 2 heats in" in pt, "held back: the events list still counts the heats in")
    check(json.loads(await P.evaluate("JSON.stringify(Object.keys(P.data.times))")) == ["r0001"], "held back: only the finished event's times are in the data")
    pt = await load("#/find")
    check("Find a swimmer" not in pt and "Type a surname" not in pt, "names off: a saved Find link goes to Home")

    # ---- names on
    await O.click('[data-act=pnames][data-v=short]'); await O.wait_for_timeout(250)
    check(await O.evaluate("A.cfg.parentsNames") == "short", "Organiser: names choice saved")
    short = a["f"][0] + " " + a["s"]
    pt = await load("#/event/free50%7CF%7C14")
    check(short in pt and "J Citizen" in pt, "names on: first initial and surname (" + short + "), record holder J Citizen")
    data = await P.evaluate("JSON.stringify(P.data)")
    check(a["f"] not in data or len(a["f"]) == 1, "names on: the first name itself is never sent")
    tabs = await P.locator("#tabs a").all_text_contents()
    check(tabs == ["Home", "Events", "Find", "Houses"], "names on: Find tab is back")
    await load("#/find"); await P.fill("#q", a["s"][:3]); await P.wait_for_timeout(250)
    check(short in await P.inner_text("#hits"), "Find a swimmer by surname")

    # ---- show before final
    pt = await load("#/event/back50%7CF%7C14")
    check("Provisional" not in pt and "Results show here once every heat" in pt, "not ticked: an unfinished event shows no results")
    await O.click('[data-act=pprov]'); await O.wait_for_timeout(250)
    pt = await load("#/event/back50%7CF%7C14")
    check("Provisional" in pt and "42.00" in pt and "Places can change" in pt, "ticked: an unfinished event shows, marked Provisional")
    await O.click('[data-act=pprov]'); await O.wait_for_timeout(200)

    # ---- ticks
    await O.click('[data-act=pshow][data-v=age]'); await O.wait_for_timeout(150); await O.click('[data-act=pshow][data-v=find]'); await O.wait_for_timeout(150)
    await O.click('[data-act=pshow][data-v=champs]'); await O.wait_for_timeout(200)
    check(await O.evaluate("A.cfg.parentsShow.age===false&&A.cfg.parentsShow.find===false&&A.cfg.parentsShow.champs===false"), "Organiser: ticks saved")
    pt = await load("#/houses")
    check("Points by age group" not in pt and "Newcombe" in pt, "Points by age group unticked: the table goes, the houses stay")
    check(await P.locator("#tabs a").all_text_contents() == ["Home", "Events", "Houses"], "Find unticked: no Find tab")
    pt = await load()
    check("Age champions" not in pt and "By age group" not in pt, "Age champions unticked: gone from Home")
    await O.click('[data-act=pshow][data-v=events]'); await O.wait_for_timeout(150); await O.click('[data-act=pshow][data-v=house]'); await O.wait_for_timeout(200)
    pt = await load("#/events")
    check(await P.locator("#tabs a").all_text_contents() == ["Home"] and "Latest results" not in pt and "House points" not in await P.text_content("main"), "Events and House points unticked: only Home, without those cards")
    check(await P.evaluate("document.documentElement.scrollWidth<=innerWidth"), "no sideways scroll on a phone")

    # ---- off again
    await O.click('[data-act=ptog]'); await O.wait_for_timeout(250)
    pt = await load()
    check("Results are not open yet" in pt and "Off" in await O.evaluate(WORDS, "nav.secnav"), "turned off again")
    check(errs == [], "no page errors " + str(errs[:3]))
    await b.close()
  print(f"\n{len(fails)} failed" if fails else "\nall passed"); sys.exit(1 if fails else 0)

asyncio.run(main())
