/* ===== Recorder and Time Slips ===== */
function lockedBy(race){
  /* another Recorder that opened this race first holds it */
  const mine=A.job==="recorder"&&A.r.race===race?A.r.since:Infinity;
  return otherPeers().some(p=>p.job==="recorder"&&p.rec===race&&(p.recSince||0)<mine);
}
function recRace(){
  const list=raceList();if(!list.length)return null;
  if(A.r.race==null||!A.R.races.has(A.r.race)){A.r.race=list[0].race;A.r.since=Date.now();announce()}
  return A.R.races.get(A.r.race);
}
function overallTable(G,opts){
  opts=opts||{};
  if(!G||!G.rows.length)return `<p class="muted">No swimmers yet.</p>`;
  return `<div class="tablewrap"><table><thead><tr><th class="num">Place</th><th>Swimmer</th><th>House</th><th class="num">Time</th><th class="num">Heat</th>${opts.pts===false?"":`<th class="num">Points</th>`}<th></th></tr></thead><tbody>
  ${G.rows.map(x=>`<tr class="${x.race===opts.hl?"":""}"><td class="num">${x.place?(x.place<=3?medal(x.place):x.place):"&ndash;"}</td><td>${esc(pname(x.p))}</td><td>${hdot(x.p&&x.p.h)}</td>
    <td class="num ${x.pink&&opts.pink!==false?"pinkt":""}">${x.st==="DNS"||x.st==="DQ"?x.st:x.eff!=null?fmtTime(x.eff):`<span class="muted">waiting</span>`}</td><td class="num">${x.heat}</td>${opts.pts===false?"":`<td class="num">${x.place?x.pts:0}</td>`}
    <td>${x.dh?`<span class="tag dh">DEAD HEAT</span> `:""}${x.tag?`<span class="tag ${x.tag==="NEW RECORD"?"rec":"eq"}">${x.tag}</span> `:""}${x.hris&&opts.hris!==false?`<span class="tag hris">HRIS</span>`:""}</td></tr>`).join("")}
  </tbody></table></div>`;
}
function renderRecorder(){
  const r=recRace();
  if(!r)return waitingCard("Waiting for the first race","Race 1 appears here once the marshal sends it. Times arrive from the time slip photo, or you can type them.");
  const lk=lockedBy(r.race)||locked();
  const max=raceList().slice(-1)[0].race;
  const L=Number(A.cfg.lanes)||8;const G=A.R.groups.get(r.key);
  let rows="";
  for(let l=1;l<=L;l++){
    const id=r.lanes[l];if(!id)continue;
    const p=A.R.who(id);const v=r.times[l]||{};const e=r.eff[l];const jp=r.placeTaps[l];
    const odd=v.t!=null&&v.st!=="DNS"&&v.st!=="DQ"&&!v.keep?(oddTime(r.k,v.t,A.cfg.limits)||(v.chk?"slip hard to read":null)):null;
    const err=A.r.errs[r.race+"-"+l];
    const notOnSlip=r.src==="photo"&&v.t==null&&!v.st;
    const val=err?err.raw:(v.t!=null?fmtTime(v.t):"");
    rows+=`<tr class="${e&&e.pink?"pinkrow":odd?"flagrow":""}">
      <td class="num" style="font:800 1.1rem var(--font-display)">${l}</td>
      <td class="nmcell">${hdot(p.h)} <b>${esc(pname(p))}</b></td>
      <td>${jp?medal(jp)+(r.dh.some(g=>g.includes(String(l)))?` <span class="tag dh">DEAD HEAT</span>`:""):`<span class="muted">${r.tapped?"By time":"&ndash;"}</span>`}</td>
      <td><input class="timein ${odd?"flag":""}" id="t-${r.race}-${l}" data-time="${l}" inputmode="numeric" autocomplete="off" value="${esc(val)}" placeholder="${notOnSlip?"Not on slip":"Type time"}" ${lk||v.st==="DNS"?"disabled":""} aria-label="Time for lane ${l}">
        ${err?`<span class="under" style="color:var(--bad);font-weight:700">${esc(err.msg)}</span>`:notOnSlip?`<span class="under">Not on slip</span>`:v.src?`<span class="under">${v.src==="photo"?"From slip":"Typed"}</span>`:""}</td>
      <td class="num">${e&&e.eff!=null&&v.st!=="DQ"?`<span class="${e.pink?"pinkt":""}" style="font:800 1.05rem var(--font-mono)">${fmtTime(e.eff)}</span>${e.pink?`<span class="under pinkn">Slip ${fmtTime(e.rec)}</span>`:""}`:""}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap"><button type="button" class="stbtn" data-act="rst" data-l="${l}" data-st="DNS" aria-pressed="${v.st==="DNS"}" ${lk?"disabled":""}>DNS</button><button type="button" class="stbtn" data-act="rst" data-l="${l}" data-st="DQ" aria-pressed="${v.st==="DQ"}" ${lk?"disabled":""}>DQ</button></div></td>
      <td>${odd?`<div style="min-width:150px"><span style="color:var(--warn);font-weight:700;font-size:.85rem">Check this time: ${esc(odd)}</span><div class="row" style="gap:6px;margin-top:4px"><button type="button" class="btn small" data-act="rkeep" data-l="${l}" ${lk?"disabled":""}>Keep</button><button type="button" class="btn small" data-act="rfix" data-l="${l}" ${lk?"disabled":""}>Fix</button></div></div>`:""}</td>
    </tr>`;
  }
  const canCheck=r.nTimes>0&&!lk;
  return `${lockBar()}<div class="recgrid">
      <div class="stack">
        <div class="row" style="flex-wrap:nowrap">${badge(r.race,"xl")}<div class="info" style="min-width:0"><b style="display:block;font:800 1.3rem var(--font-display)">${esc(r.label)}</b><span class="muted" style="font-weight:600">Heat ${r.heat} · <span class="chip ${r.checked?"final":r.nTimes?"prov":""}">${esc(r.tstatus)}</span></span></div></div>
        <div class="row recnav">
          <button type="button" class="btn" data-act="rgoto">Go to race</button>
          <button type="button" class="btn" data-act="rslip" ${r.hasSlip?"":"disabled"}>View slip photo</button>
          ${r.race<max?`<button type="button" class="btn" data-act="rlatest">Back to latest</button>`:""}
          ${A.R.races.has(r.race+1)?`<button type="button" class="btn navy" data-act="rnext" style="margin-left:auto">Next race</button>`:`<button type="button" class="btn" disabled style="margin-left:auto">Waiting for marshal</button>`}
        </div>
        ${r.dh.length?`<div class="msg warn">Dead heat: ${r.dh.map(g=>"lanes "+g.join(" and ")).join("; ")} were tapped as a tie by the Place Judge. Place judges must split the result if they can. Check with them before pressing Times checked.</div>`:""}
        ${r.extra.length?`<div class="msg warn">The slip has a time for ${r.extra.length>1?"lanes "+r.extra.slice(0,-1).join(", ")+" and "+r.extra.slice(-1):"lane "+r.extra[0]}, but no swimmer was marshalled ${r.extra.length>1?"in those lanes":"in that lane"}. A swimmer may have been missed: check with the marshal.</div>`:""}
        ${lockedBy(r.race)?`<div class="msg warn">Being entered by another device. You can look, but times cannot be changed here until it is finished.</div>`:""}
        <div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap"><table>
          <thead><tr><th class="num">Lane</th><th>Swimmer</th><th>Place</th><th>Time</th><th class="num">Result</th><th>DNS / DQ</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="7" class="muted">No swimmers in this heat.</td></tr>`}</tbody></table></div></div>
        <p class="muted" style="margin:0;font-size:.88rem">Type digits only: 3412 is 34.12 and 10234 is 1:02.34. Press Enter to save and move down. Pink times were moved by the Place Judge's order; the slip time shows underneath.</p>
        <button type="button" class="btn big ${r.checked?"go":"navy"}" data-act="rcheck" ${canCheck&&!r.checked?"":"disabled"} style="width:100%">${r.checked?"Checked":"Times checked"}</button>
      </div>
      <div class="stack"><div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Race overall</h3><span class="chip ${G&&G.final?"final":"prov"}">${G?G.status:""}</span></div>
        <div class="muted" style="font-size:.88rem">${esc(r.label)} · ${raceRange(G?G.raceNos:[])}, ${plural(G?G.heats.length:0,"heat")}, timed final</div>
        ${overallTable(G,{hl:r.race})}</div>
        ${slipPanel(r)}</div>
    </div>`;
}
async function saveTime(l,raw){
  const r=recRace();if(!r||lockedBy(r.race)||locked())return false;
  const key=r.race+"-"+l;
  if(!String(raw).trim()){delete A.r.errs[key];return true}
  const p=parseTime(raw);
  if(p.err){A.r.errs[key]={raw,msg:p.err};render();return false}
  delete A.r.errs[key];
  const cur=r.times[l]||{};
  if(cur.t===p.cs&&cur.st!=="DNS")return true;
  const lanes={};lanes[l]={t:p.cs,st:"ok",src:"typed",keep:false,chk:false};
  const T=A.times[rid(r.race)]||{};
  A.times[rid(r.race)]=Object.assign({},T,{lanes:Object.assign({},T.lanes||{},lanes),checked:false});
  recompute();
  await w(()=>A.store.update("times/"+rid(r.race),{lanes,checked:false,by:DEV,at:Date.now()}));
  return true;
}
async function setLane(l,patch){
  const r=recRace();if(!r||lockedBy(r.race)||locked())return;
  const T=A.times[rid(r.race)]||{};const cur=(T.lanes||{})[l]||{};
  const nv=Object.assign({},cur,patch);
  const lanes={};lanes[l]=nv;
  A.times[rid(r.race)]=Object.assign({},T,{lanes:Object.assign({},T.lanes||{},lanes),checked:patch.keep&&Object.keys(patch).length===1?T.checked:false});
  recompute();render();
  await w(()=>A.store.update("times/"+rid(r.race),{lanes,checked:A.times[rid(r.race)].checked,by:DEV,at:Date.now()}));
}
function recNextToCheck(from){
  const list=raceList().filter(x=>x.race>from&&!x.checked);
  return list.length?list[0].race:(A.R.races.has(from+1)?from+1:from);
}
async function timesChecked(force){
  const r=recRace();if(!r)return;
  const missing=r.filled.filter(l=>{const v=r.times[l]||{};return v.t==null&&v.st!=="DNS"&&v.st!=="DQ"});
  if(missing.length){A.modal={t:"info",title:"A lane has no time",body:`<p style="margin:0">${missing.length===1?"Lane "+missing[0]+" has":"Lanes "+missing.join(", ")+" have"} no time yet. Type the time from the paper slip, or mark DNS or DQ, then press Times checked.</p>`,ok:"< Back to times"};render();return}
  if(!force&&(r.flagged||r.dh.length)){A.modal={t:"flagged",n:r.flagged,dh:r.dh};render();return}
  const key=rid(r.race);const T=A.times[key]||{};
  const patch={checked:true,checkedAt:Date.now(),checkedBy:DEV};
  if(force){const lanes={};for(const l in (T.lanes||{})){const v=T.lanes[l];if(v.t!=null&&oddTime(r.k,v.t,A.cfg.limits))lanes[l]=Object.assign({},v,{keep:true})}patch.lanes=lanes}
  A.times[key]=Object.assign({},T,patch,{lanes:Object.assign({},T.lanes||{},patch.lanes||{})});
  A.modal=null;
  const ok=await w(()=>A.store.update("times/"+key,patch));
  if(ok){A.r.race=recNextToCheck(r.race);A.r.since=Date.now();announce()}
  recompute();render();
}
MODALS.flagged=M=>`<h2>${M.n?"A time still needs a check":"Dead heat in this race"}</h2>${M.n?`<p style="margin:0">${plural(M.n,"time is","times are")} marked yellow because ${M.n===1?"it looks":"they look"} odd for this race.</p>`:""}${M.dh&&M.dh.length?`<p style="margin:0"><b>Dead heat:</b> ${M.dh.map(g=>"lanes "+g.join(" and ")).join("; ")} were tapped as a tie. Place judges must split the result if they can. Only keep it if they confirm it was a true dead heat.</p>`:""}<div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to times</button><button type="button" class="btn go" data-act="rforce">${M.n?"Times are right":"Keep the dead heat"}</button></div>`;
MODALS.slip=M=>`<h2>Slip photo: Race ${M.race}</h2>${M.img?`<img src="${M.img}" alt="Time slip photo for race ${M.race}" style="border-radius:10px;border:1px solid var(--line)">`:`<p class="muted">${M.loading?"Loading the photo...":"No photo stored for this race."}</p>`}
  ${M.read?`<div class="label">What was read</div><table><tbody>${Object.keys(M.read).sort((a,b)=>a-b).map(l=>`<tr><td>Lane ${l}</td><td class="num">${fmtTime(M.read[l])}</td></tr>`).join("")}</tbody></table>`:""}
  <div class="acts"><button type="button" class="btn primary" data-act="closemodal">Close</button></div>`;
async function viewSlip(race){
  const key=rid(race);const meta=A.slips[key]||{};
  A.modal={t:"slip",race,loading:true,read:meta.read||null};render();
  try{const d=await A.store.get("photos/"+(A.past?"y"+A.past+"-":"")+key);if(A.modal&&A.modal.t==="slip"){A.modal.img=d&&d.img;A.modal.loading=false;render()}}catch(e){if(A.modal){A.modal.loading=false;render()}}
}

/* the slip photo under Race overall, so times, result and slip are on one screen */
function slipPanel(r){
  const key=rid(r.race);const meta=A.slips[key];
  if(!meta)return `<div class="panel stack"><h3>Time slip</h3><p class="muted" style="margin:0">No slip yet for Race ${r.race}.</p></div>`;
  const ck=key+"@"+(meta.at||0);
  if(!(ck in A.slipImg)){A.slipImg={[ck]:null};
    A.store.get("photos/"+(A.past?"y"+A.past+"-":"")+key).then(d=>{if(ck in A.slipImg){A.slipImg[ck]=(d&&d.img)||"";render()}}).catch(()=>{if(ck in A.slipImg){A.slipImg[ck]="";render()}})}
  const c=A.slipImg[ck];const un=(meta.unsure||[]).filter(l=>meta.read&&meta.read[l]!=null);
  return `<div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Time slip</h3><span class="row" style="gap:6px">${un.length?`<span class="chip prov">Hard to read: lane ${un.join(", ")}</span>`:""}${meta.miss?`<span class="chip prov">Some lines not read: check the photo</span>`:""}</span></div>
    ${c?`<img src="${c}" alt="Time slip photo for race ${r.race}" style="display:block;width:100%;border-radius:10px;border:1px solid var(--line)">`:`<p class="muted" style="margin:0">${c===""?"No photo stored for this race.":"Loading the photo..."}</p>`}</div>`;
}

/* ---------- Time Slips (phone) ---------- */
function slipRace(){
  const list=raceList();if(!list.length)return null;
  if(A.s.race==null||!A.R.races.has(A.s.race)){const first=list.find(r=>!A.slips[rid(r.race)]);A.s.race=(first||list[list.length-1]).race}
  return A.R.races.get(A.s.race);
}
function renderSlips(){
  const r=slipRace();
  const waiting=A.s.queued||0;
  const top=waiting?`<div class="msg warn">No signal. ${plural(waiting,"photo")} waiting to send. It sends by itself when there is signal.</div>`:"";
  if(!r)return `<div class="phone">${top}${waitingCard("Waiting for the marshal","Race 1 appears here once it is sent.")}</div>`;
  const done=!!A.slips[rid(r.race)];const t=slipMode();
  if(realReader()&&innerWidth<700)slipOcrLoad().catch(()=>{});
  const showNext=done&&!A.s.err&&!A.s.flash;
  const hasNext=A.R.races.has(r.race+1);
  return `${lockBar()}<div class="phone">${top}
    <div class="row" style="flex-wrap:nowrap">${badge(r.race,"xl")}<div style="min-width:0"><b style="font:800 1.15rem var(--font-display);display:block">${esc(r.label)}</b><span class="muted">Heat ${r.heat}</span></div></div>
    ${A.s.err?`<div class="msg bad" role="alert">${A.s.err}</div>`:""}
    ${showNext?`<div class="msg ok">Race ${r.race} slip read and sent to the Recorder.</div>
       ${hasNext?`<button type="button" class="btn navy big" data-act="snext" style="width:100%">Next race</button>`:`<button type="button" class="btn big" disabled style="width:100%">Waiting for marshal</button>`}
       <label class="btn" for="camin" style="width:100%">Replace this slip with a new photo</label>`
     :A.s.reading?`<div class="cam" role="status">Reading the slip...</div>`
     :`<label class="cam" for="camin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/></svg>${A.s.err?"Take again":"Take photo of slip"}</label>`}
    <input id="camin" type="file" accept="image/*" capture="environment" hidden ${locked()?"disabled":""}>
    <div class="row"><button type="button" class="btn" data-act="sgoto" style="flex:1">Check race</button><button type="button" class="btn" data-act="soverall" style="flex:1">Race overall</button></div>
    <div class="panel stack" style="gap:8px;background:var(--sunk);border-color:transparent">
      ${realReader()?`<span class="label">Slip reader</span>
      <p style="margin:0;font-size:.88rem">Read the photo reads the race number, lanes and times from the slip. For practice without a slip, the other buttons make up test times instead:</p>`
      :`<span class="label">Slip reader: test mode</span>
      <p style="margin:0;font-size:.88rem">The reader for the Swiss Timing slip is built once real slip photos arrive. Until then the photo is saved and test times are made up, so the Recorder can be tried. Pick what the next photo should do:</p>`}
      <div class="row" style="gap:6px">${(realReader()?[["real","Read the photo"]]:[]).concat([["good","Read OK"],["bad","Cannot read"],["wrong","Wrong slip"],["offline","No signal"]]).map(([k,l])=>`<button type="button" class="choice" style="min-height:48px;min-width:0;font-size:.9rem" data-act="stest" data-v="${k}" aria-pressed="${t===k}">${l}</button>`).join("")}</div>
    </div>
  </div>
  ${A.s.flash?`<div class="flash ${A.s.flash.c}" role="status">${esc(A.s.flash.t)}</div>`:""}`;
}
function shrink(file){
  return new Promise(res=>{
    const fr=new FileReader();
    fr.onload=()=>{const img=new Image();img.onload=()=>{
      const sc=Math.min(1,1000/Math.max(img.width,img.height));const c=document.createElement("canvas");
      c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      let q=0.6,d=c.toDataURL("image/jpeg",q);while(d.length>180000&&q>0.25){q-=0.1;d=c.toDataURL("image/jpeg",q)}
      res(d)};img.onerror=()=>res(null);img.src=fr.result};
    fr.onerror=()=>res(null);fr.readAsDataURL(file);
  });
}
function testRead(r){
  /* made-up times for test mode: plausible for the race, judge's order mostly kept */
  const t=TYPE[r.k];const base={50:3400,100:7600,200:17500,0:4000}[t.dist]||4000;
  const read={};
  for(const l of r.filled){read[l]=Math.round(base*(0.85+Math.random()*0.35))}
  if(r.filled.length>3&&Math.random()<0.3){const l=r.filled[r.filled.length-1];delete read[l]}
  return {race:r.race,lanes:read};
}
/* live mode reads the photo for real (decision 110); test mode and the practice buttons make up times */
function realReader(){return !!(A.store&&A.store.mode!=="local")}
function slipMode(){return A.s.test||(realReader()?"real":"good")}
async function onPhoto(file){
  const r=slipRace();if(!r||!file)return;
  const t=slipMode();
  A.s.err=null;
  const CANT="Could not read the slip. Hold the phone flat over the slip so all lanes and times are in the picture, with no glare. Then take it again.";
  let read=null,unsure=[],miss=false;
  if(t==="real"){
    A.s.reading=true;render();
    const url=URL.createObjectURL(file);
    try{const res=await readSlipPhoto(url,Number(A.cfg.lanes)||8);if(res.race!=null&&res.order.length){read={race:res.race,lanes:res.lanes};unsure=res.unsure;miss=res.problems.length>0}}catch(e){}
    URL.revokeObjectURL(url);A.s.reading=false;
  }
  const img=await shrink(file);
  if(t==="bad"||!img||(t==="real"&&!read)){A.s.err=CANT;render();return}
  if(!read)read=testRead(r);
  if(t==="wrong")read.race=r.race+1;
  if(read.race!==r.race){A.s.err=`Wrong slip? This slip says Race ${read.race}. The screen is on Race ${r.race}. Find the Race ${r.race} slip and take it again.`;render();return}
  const key=rid(r.race);
  const lanes={};for(const l in read.lanes)lanes[l]={t:read.lanes[l],st:"ok",src:"photo",keep:false,chk:unsure.includes(+l)};
  const meta={race:r.race,read:read.lanes,unsure,miss,at:Date.now(),dev:DEV,test:t!=="real"};
  A.slips[key]=meta;
  A.times[key]={lanes,src:"photo",checked:false};recompute();
  if(t==="offline"){
    A.s.queued=(A.s.queued||0)+1;A.s.waiting=Object.assign(A.s.waiting||{},{[r.race]:true});
    A.s.flash={c:"amber",t:"Saved on this phone. Sends when there is signal"};render();
    setTimeout(()=>{A.s.flash=null;render()},1300);
    setTimeout(async()=>{await sendSlip(key,img,meta,lanes);A.s.queued=Math.max(0,(A.s.queued||1)-1);delete A.s.waiting[r.race];render()},8000);
    return;
  }
  A.s.flash=miss||unsure.length?{c:"amber",t:`Race ${r.race} sent, but some of the slip was hard to read. Retake it if you can.`}:{c:"green",t:`Race ${r.race} read. Sent to the Recorder`};render();
  setTimeout(()=>{A.s.flash=null;render()},miss||unsure.length?2500:1100);
  await sendSlip(key,img,meta,lanes);
}
async function sendSlip(key,img,meta,lanes){
  await w(()=>A.store.set("photos/"+key,{img,at:Date.now()}));
  await w(()=>A.store.set("slips/"+key,meta));
  await w(()=>A.store.set("times/"+key,{lanes,src:"photo",checked:false,by:DEV,at:Date.now()}));
}
MODALS.overall=M=>{const r=A.R.races.get(M.race);const G=r&&A.R.groups.get(r.key);
  return `<h2>Race overall</h2><div class="muted">${esc(r?r.label:"")}</div>${overallTable(G,{hris:false})}<div class="acts"><button type="button" class="btn primary" data-act="closemodal">Close</button></div>`};
