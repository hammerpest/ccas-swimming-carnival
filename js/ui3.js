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
    const notOnSlip=r.src==="photo"&&v.t==null&&!v.st;const sm=A.slips[rid(r.race)]||{};const notRead=notOnSlip&&(sm.miss||(sm.missed||[]).includes(l)||(sm.unsure||[]).length>0);
    const val=err?err.raw:(v.t!=null?fmtTime(v.t):"");
    rows+=`<tr class="${e&&e.pink?"pinkrow":odd?"flagrow":""}">
      <td class="num" style="font:800 1.1rem var(--font-display)">${l}</td>
      <td class="nmcell">${hdot(p.h)} <b>${esc(pname(p))}</b></td>
      <td>${jp?medal(jp)+(r.dh.some(g=>g.includes(String(l)))?` <span class="tag dh">DEAD HEAT</span>`:""):`<span class="muted">${r.tapped?"By time":"&ndash;"}</span>`}</td>
      <td><input class="timein ${odd?"flag":""} ${notOnSlip?"nos":""}" id="t-${r.race}-${l}" data-time="${l}" inputmode="numeric" autocomplete="off" value="${esc(val)}" placeholder="${notRead?"Check photo":notOnSlip?"Not on slip":"Type time"}" ${lk||v.st==="DNS"?"disabled":""} aria-label="Time for lane ${l}">
        ${err?`<span class="under" style="color:var(--bad);font-weight:700">${esc(err.msg)}</span>`:notRead?`<span class="under" style="color:var(--warn);font-weight:700">Not read: check the photo</span>`:notOnSlip?`<span class="under">Not on slip</span>`:v.src?`<span class="under">${v.src==="photo"?"From slip":v.src==="multi"?"From multitimer":"Typed"}</span>`:""}</td>
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
          <button type="button" class="btn" data-act="rslip" ${r.hasSlip&&!(A.slips[rid(r.race)]||{}).multi?"":"disabled"}>View slip photo</button>
          ${r.race<max?`<button type="button" class="btn" data-act="rlatest">Back to latest</button>`:""}
          ${A.R.races.has(r.race+1)?`<button type="button" class="btn navy" data-act="rnext" style="margin-left:auto">Next race</button>`:`<button type="button" class="btn" disabled style="margin-left:auto">Waiting for marshal</button>`}
        </div>
        ${r.dh.length?`<div class="msg warn">Dead heat: ${r.dh.map(g=>"lanes "+g.join(" and ")).join("; ")} were tapped as a tie by the Place Judge. Place judges must split the result if they can. Check with them before pressing Times checked.</div>`:""}
        ${r.extra.length?`<div class="msg warn">The slip has a time for ${r.extra.length>1?"lanes "+r.extra.slice(0,-1).join(", ")+" and "+r.extra.slice(-1):"lane "+r.extra[0]}, but no swimmer was marshalled ${r.extra.length>1?"in those lanes":"in that lane"}. A swimmer may have been missed: add them here or check with the marshal.
          <div class="row" style="gap:8px;margin-top:8px">${r.extra.map(l=>`<button type="button" class="btn small" data-act="raddlane" data-l="${l}" ${lk?"disabled":""}>Add swimmer to lane ${l}</button>`).join("")}</div></div>`:""}
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
  if(missing.length){A.modal={t:"info",title:"A lane has no time",body:`<p style="margin:0">${missing.length===1?"Lane "+missing[0]+" has":"Lanes "+missing.join(", ")+" have"} no time yet. ${r.src==="multi"?"Type the time":"Type the time from the paper slip"}, or mark DNS or DQ, then press Times checked.</p>`,ok:"< Back to times"};render();return}
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
  if(meta.multi)return `<div class="panel stack"><h3>Multitimer</h3><p class="muted" style="margin:0">Timed on the phone multitimer: no slip photo. Splits in finish order:</p>${mtSplitList(meta.splits||[])}</div>`;
  const ck=key+"@"+(meta.at||0);
  if(!(ck in A.slipImg)){A.slipImg={[ck]:null};
    A.store.get("photos/"+(A.past?"y"+A.past+"-":"")+key).then(d=>{if(ck in A.slipImg){A.slipImg[ck]=(d&&d.img)||"";render()}}).catch(()=>{if(ck in A.slipImg){A.slipImg[ck]="";render()}})}
  const c=A.slipImg[ck];const un=(meta.unsure||[]).filter(l=>meta.read&&meta.read[l]!=null);
  return `<div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Time slip</h3><span class="row" style="gap:6px">${un.length?`<span class="chip prov">Hard to read: lane ${un.join(", ")}</span>`:""}${meta.two?`<span class="chip prov">May show more than one slip: check the photo</span>`:meta.mism?`<span class="chip prov">Lanes do not match marshalling: check the photo</span>`:meta.miss?`<span class="chip prov">Some lines not read: check the photo</span>`:""}</span></div>
    ${c?`<img src="${c}" alt="Time slip photo for race ${r.race}" style="display:block;width:100%;border-radius:10px;border:1px solid var(--line)">`:`<p class="muted" style="margin:0">${c===""?"No photo stored for this race.":"Loading the photo..."}</p>`}</div>`;
}

/* ---------- Time Slips (phone) ---------- */
function slipRace(){
  const list=raceList();if(!list.length)return null;
  if(A.mt&&(A.mt.phase==="run"||A.mt.phase==="place")&&A.R.races.has(A.mt.race))A.s.race=A.mt.race;
  if(A.s.race==null||!A.R.races.has(A.s.race)){const first=list.find(r=>!A.slips[rid(r.race)]);A.s.race=(first||list[list.length-1]).race}
  return A.R.races.get(A.s.race);
}
function renderSlips(){
  const r=slipRace();
  const waiting=A.s.queued||0;
  const top=waiting?`<div class="msg warn">No signal. ${plural(waiting,"photo")} waiting to send. It sends by itself when there is signal.</div>`:"";
  if(!r)return `<div class="phone">${top}${waitingCard("Waiting for the marshal","Race 1 appears here once it is sent.")}</div>`;
  if(mtWanted(r))return renderMulti(r,top);
  const done=!!A.slips[rid(r.race)];const t=slipMode();
  if(realReader()&&innerWidth<700)slipOcrLoad().catch(()=>{});
  const showNext=done&&!A.s.err&&!A.s.flash;
  const hasNext=A.R.races.has(r.race+1);
  return `${lockBar()}<div class="phone">${top}
    <div class="row" style="flex-wrap:nowrap">${badge(r.race,"xl")}<div style="min-width:0"><b style="font:800 1.15rem var(--font-display);display:block">${esc(r.label)}</b><span class="muted">Heat ${r.heat}</span></div></div>
    ${A.s.err?`<div class="msg bad" role="alert">${A.s.err}</div>`:""}
    ${showNext?`<div class="msg ok">${A.slips[rid(r.race)].multi?`Race ${r.race} multitimer times sent to the Recorder.`:`Race ${r.race} slip read and sent to the Recorder.`}</div>
       ${hasNext?`<button type="button" class="btn navy big" data-act="snext" style="width:100%">Next race</button>`:`<button type="button" class="btn big" disabled style="width:100%">Waiting for marshal</button>`}
       <label class="btn" for="camin" style="width:100%">Replace this slip with a new photo</label>`
     :A.s.reading?`<div class="cam" role="status">Reading the slip...</div>`
     :`<label class="cam" for="camin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/></svg>${A.s.err?"Take again":"Take photo of slip"}</label>`}
    <input id="camin" type="file" accept="image/*" capture="environment" hidden ${locked()?"disabled":""}>
    ${A.s.reading?"":`<button type="button" class="btn big mtopen" data-act="mtopen">${MT_ICON}Multitimer</button>`}
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
  let read=null,unsure=[],miss=false,missed=[],two=false;
  if(t==="real"){
    A.s.reading=true;render();
    const url=URL.createObjectURL(file);
    try{const res=await readSlipPhoto(url,Number(A.cfg.lanes)||8);two=!!(res.twoSlips||res.mixed);if(res.race!=null&&!res.raceUnsure&&res.order.length){read={race:res.race,lanes:res.lanes};unsure=two?res.order.slice():res.unsure;miss=two||res.problems.length>0;missed=res.missed}}catch(e){}
    URL.revokeObjectURL(url);A.s.reading=false;
  }
  const img=await shrink(file);
  if(t==="bad"||!img||(t==="real"&&!read)){A.s.err=CANT;render();return}
  if(!read)read=testRead(r);
  if(t==="wrong")read.race=r.race+1;
  if(read.race!==r.race){A.s.err=`Wrong slip? This slip says Race ${read.race}. The screen is on Race ${r.race}. Find the Race ${r.race} slip and take it again.`;render();return}
  const key=rid(r.race);
  /* a race that already has a slip asks before the new photo replaces it (decision 117), so a slip
     read as the wrong race after going back can never overwrite a good one without a yes */
  if(A.slips[key]){A.modal={t:"replaceSlip",race:r.race,go:()=>keepPhoto(r,t,key,read,unsure,miss,missed,img,two)};render();return}
  await keepPhoto(r,t,key,read,unsure,miss,missed,img,two);
}
/* anything odd is sent, never held up: doubtful lanes go yellow for the Recorder to check against the
   photo and accept (decision 118). Only a slip whose race cannot be told is refused. */
async function keepPhoto(r,t,key,read,unsure,miss,missed,img,two){
  A.s.pend=A.s.pend||{};
  if(A.s.pend[key]){clearTimeout(A.s.pend[key]);delete A.s.pend[key];A.s.queued=Math.max(0,(A.s.queued||1)-1);if(A.s.waiting)delete A.s.waiting[r.race]}
  /* slip lanes should match the marshalled lanes; when some slip lanes have no swimmer and some
     swimmers have no slip time, it may be the wrong slip or a misread lane: warn, never hide it */
  const mism=t==="real"&&Object.keys(read.lanes).some(l=>!r.lanes[l])&&r.filled.some(l=>read.lanes[l]==null);
  if(mism)miss=true;
  const lanes={};for(const l in read.lanes)lanes[l]={t:read.lanes[l],st:"ok",src:"photo",keep:false,chk:unsure.includes(+l)};
  const meta={race:r.race,read:read.lanes,unsure,miss,missed,mism,two:!!two,at:Date.now(),dev:DEV,test:t!=="real"};
  A.slips[key]=meta;
  A.times[key]={lanes,src:"photo",checked:false};recompute();
  if(t==="offline"){
    A.s.queued=(A.s.queued||0)+1;A.s.waiting=Object.assign(A.s.waiting||{},{[r.race]:true});
    A.s.flash={c:"amber",t:"Saved on this phone. Sends when there is signal"};render();
    setTimeout(()=>{A.s.flash=null;render()},1300);
    A.s.pend[key]=setTimeout(async()=>{delete A.s.pend[key];await sendSlip(key,img,meta,lanes);A.s.queued=Math.max(0,(A.s.queued||1)-1);delete A.s.waiting[r.race];render()},8000);
    return;
  }
  A.s.flash=two?{c:"amber",t:`Race ${r.race} sent, but the photo may show more than one slip. The Recorder will check it.`}:mism?{c:"amber",t:`Race ${r.race} sent, but the slip's lanes do not match the marshalled lanes. Check it is the Race ${r.race} slip.`}:miss||unsure.length?{c:"amber",t:`Race ${r.race} sent, but some of the slip was hard to read. Retake it if you can.`}:{c:"green",t:`Race ${r.race} read. Sent to the Recorder`};render();
  setTimeout(()=>{A.s.flash=null;render()},miss||unsure.length?3500:1100);
  await sendSlip(key,img,meta,lanes);
}
async function sendSlip(key,img,meta,lanes){
  await w(()=>A.store.set("photos/"+key,{img,at:Date.now()}));
  await w(()=>A.store.set("slips/"+key,meta));
  await w(()=>A.store.set("times/"+key,{lanes,src:"photo",checked:false,by:DEV,at:Date.now()}));
}
MODALS.pickLane=M=>{const r=A.R.races.get(M.race);if(!r)return `<p>Race not found.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">Close</button></div>`;
  const H=A.heats.find(h=>h.race===M.race)||{};const t=(r.times||{})[M.l];
  return `<h2>Add swimmer to lane ${M.l}</h2><p class="muted" style="margin:0">Race ${M.race}, ${esc(r.label)}, heat ${r.heat}.${t&&t.t!=null?` The slip time ${fmtTime(t.t)} becomes theirs.`:""}</p>
  <div style="position:relative;min-height:320px">${laneList(M.l,r.k,r.x,r.g,heatUsed(H),new Set(Object.values(H.lanes||{}).filter(Boolean)),null,"rsetlane",null,"Other heat").replace('class="picklist"','class="picklist" style="position:static;box-shadow:none"')}</div>`};
MODALS.replaceSlip=M=>`<h2>Replace the Race ${M.race} slip?</h2><p style="margin:0">Race ${M.race} already has a slip. This photo will replace its times.</p><p style="margin:0">Check the race number on the paper slip says ${M.race}.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="sreplace">Replace the slip</button></div>`;
MODALS.overall=M=>{const r=A.R.races.get(M.race);const G=r&&A.R.groups.get(r.key);
  return `<h2>Race overall</h2><div class="muted">${esc(r?r.label:"")}</div>${overallTable(G,{hris:false})}<div class="acts"><button type="button" class="btn primary" data-act="closemodal">Close</button></div>`};

/* ---------- Multitimer (decision 121, S1.40) ----------
   For 100 m and 200 m races that finish at the far end. START on the gun, SPLIT at each touch, STOP,
   then tap lanes in finish order: each tap takes the next split. The top 4 taps are the places
   (they replace the Place Judge for the race). Sent like a slip: times, places and a slips record. */
const MT_ICON=`<svg class="mtico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="14" r="7"/><path d="M12 10v4l2 2M10 3h4M12 3v4"/></svg>`;
const CAM_ICON=`<svg class="mtico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/></svg>`;
function mtBlank(race,sig){return {race,sig:sig||"",phase:"ready",t0:0,stopAt:0,splits:[],taps:[]}}
function mtSig(r){return r.key+"/"+r.heat}
/* kept on the phone so a reload mid-race keeps the clock and splits */
const MT_KEY="swim_mt_"+(/[?&]mode=local\b/.test(location.search)?"test":"live");
function mtSave(){try{localStorage.setItem(MT_KEY,JSON.stringify({ov:A.s.mtov||{},mt:A.mt}))}catch(e){}}
(function(){let d=null;try{d=JSON.parse(localStorage.getItem(MT_KEY)||"null")}catch(e){}
  A.mt=d&&d.mt||mtBlank(null);A.s.mtov=d&&d.ov||{}})();
/* camera or multitimer is picked by the race (decision 125): 50 m races the camera; 100 m, 200 m and
   relays the multitimer. Multitimer and Back to slip photo switch one race by hand. A race being
   timed or placed always shows the multitimer. */
function mtWanted(r){
  const M=A.mt;if(M.race===r.race&&(!M.sig||M.sig===mtSig(r))&&(M.phase==="run"||M.phase==="place"))return true;
  const o=A.s.mtov[mtOvKey(r)];return o!=null?o:TYPE[r.k].dist>50;
}
/* a hand switch belongs to one race of this carnival: race number, event and heat */
function mtOvKey(r){return r.race+"|"+mtSig(r)}
/* the slim banner (S1.41) shows while the multitimer is on screen, on a phone only */
function mtSlim(){if(A.job!=="slips"||A.past||innerWidth>=700)return false;const r=slipRace();return !!r&&mtWanted(r)}
/* a race being timed or placed is never thrown away while it still exists; a stored race whose event
   and heat no longer match (a new carnival, or cleared data) starts fresh */
function mtFor(r){const M=A.mt;
  if((M.phase==="run"||M.phase==="place")&&A.R.races.has(M.race)&&M.race!==r.race)return M;
  if(M.race!==r.race||(M.sig&&M.sig!==mtSig(r))){A.mt=mtBlank(r.race,mtSig(r));mtSave()}
  else if(!M.sig){M.sig=mtSig(r);mtSave()}
  return A.mt}
/* hand timing drops the thousandths, it never rounds up */
function mtNow(at){const M=A.mt;return Math.max(0,Math.floor(((M.phase==="run"?at||Date.now():M.stopAt)-M.t0)/10))}
function mtFmt(cs){const m=Math.floor(cs/6000),s=Math.floor((cs%6000)/100),h=cs%100;return m+":"+String(s).padStart(2,"0")+"."+String(h).padStart(2,"0")}
function mtOrd(n){const t=n%100;return n+(t>10&&t<14?"th":["th","st","nd","rd"][n%10]||"th")}
function mtSplitList(sp){return `<ol class="splits">${sp.map((t,i)=>`<li><b>${i+1}</b><span>${fmtTime(t)}</span></li>`).join("")}</ol>`}
function mtLimit(r){return Math.min(A.mt.splits.length,r.filled.length)}
function renderMulti(r,top){
  const M=mtFor(r);const n=r.filled.length;const lk=locked();
  const hasNext=A.R.races.has(r.race+1);
  const head=`<div class="row" style="flex-wrap:nowrap">${badge(r.race,"xl")}<div style="min-width:0"><b style="font:800 1.15rem var(--font-display);display:block">${esc(r.label)}</b><span class="muted">Heat ${r.heat}</span></div></div>`;
  const nav=`<div class="row"><button type="button" class="btn" data-act="sgoto" style="flex:1">Check race</button><button type="button" class="btn" data-act="soverall" style="flex:1">Race overall</button></div>`;
  const back=`<button type="button" class="btn" data-act="mtclose" style="width:100%">${CAM_ICON}Back to slip photo</button>`;
  let body="";
  if(M.phase==="ready"){
    const has=!!A.slips[rid(r.race)]||r.nTimes>0||r.tapped>0;
    body=`<div class="clock pin" id="mtclock" role="timer">0:00.00</div>
      <div class="mtbtns"><button type="button" class="btn mtgo" data-act="mtgo" data-mt ${lk||!n?"disabled":""}>START</button><button type="button" class="btn mtsplit" disabled>SPLIT</button></div>
      ${has?`<div class="msg info">Race ${r.race} already has ${r.tapped&&!r.nTimes?"places":"times"}. Sending replaces them.</div>`:""}
      <p class="muted" style="margin:0;font-size:.88rem">${n?`${plural(n,"swimmer")} marshalled: lane${n>1?"s":""} ${r.filled.join(", ")}.`:"No swimmers marshalled in this heat."}</p>
      ${nav}${back}`;
  }else if(M.phase==="run"){
    body=`<div class="clock run pin" id="mtclock" role="timer">${mtFmt(mtNow())}</div>
      <div class="mtbtns"><button type="button" class="btn mtstop" data-act="mtstop" data-mt>STOP</button><button type="button" class="btn mtsplit" data-act="mtsplit" data-mt>SPLIT</button></div>
      <div class="panel stack" style="gap:8px"><div class="row" style="justify-content:space-between"><span class="label">Splits</span><span class="chip">${M.splits.length} of ${plural(n,"swimmer")}</span></div>
        ${M.splits.length?mtSplitList(M.splits):`<p class="muted" style="margin:0">Tap SPLIT as each swimmer touches.</p>`}</div>
      <button type="button" class="btn" data-act="mtunsplit" style="width:100%" ${M.splits.length?"":"disabled"}>Undo last split</button>`;
  }else if(M.phase==="place"){
    const lim=mtLimit(r);const done=M.taps.length>=lim;const L=Number(A.cfg.lanes)||8;
    let lanes="";
    for(let l=1;l<=L;l++){
      const id=r.lanes[l];const p=id?A.R.who(id):null;const i=M.taps.indexOf(l);let wall="";
      if(p){
        if(i>=0)wall=`<button type="button" class="spot ${i<4?"p"+(i+1):"px"}" data-act="mttap" data-l="${l}" aria-label="Lane ${l}, place ${i+1}, ${fmtTime(M.splits[i])}. Tap to remove" ${lk?"disabled":""}>${i+1}</button><span class="mtt">${fmtTime(M.splits[i])}</span>`;
        else if(!done)wall=`<button type="button" class="spot" data-act="mttap" data-l="${l}" aria-label="Lane ${l}, tap for place ${M.taps.length+1}" ${lk?"disabled":""}></button>`;
        else wall=`<span class="bytime">No time</span>`;
      }
      lanes+=`<div class="lane"><div class="blk">${l}</div><div class="body" style="cursor:default">${p?`<span class="nm">${hdot(p.h)}<span>${esc(pname(p))}</span></span>`:`<span class="empty">Empty</span>`}</div><div class="wall mt">${wall}</div></div>`;
    }
    const sp=M.splits.length;
    const prompt=!sp?"No splits were taken. Use Fix splits to add the times.":!done?`Tap the lane that touched ${mtOrd(M.taps.length+1)} (${fmtTime(M.splits[M.taps.length])}).`:sp===n?`All ${n} placed. Check the times, then send.`:`All ${plural(lim,"time")} placed. Check the times, then send.`;
    const warn=sp<n&&sp?`${plural(sp,"split")} for ${plural(n,"swimmer")}. ${n-sp===1?"One swimmer has":n-sp+" swimmers have"} no time: add a missed time with Fix splits, or the Recorder can type it or mark DNS.`:sp>n?`${plural(sp,"split")} for ${plural(n,"swimmer")}. Delete the extra ${sp-n===1?"split":"splits"} with Fix splits, or the last ${sp-n===1?"one is":sp-n+" are"} not used.`:"";
    body=`<div class="clock pin" id="mtclock" role="timer">${mtFmt(mtNow())}</div>
      <div class="prompt ${done&&sp?"done":""}">${esc(prompt)}</div>
      ${warn?`<div class="msg warn">${esc(warn)}</div>`:""}
      <div class="pool">${lanes}</div>
      <div class="row mtrow"><button type="button" class="btn" data-act="mtundo" ${M.taps.length&&!lk?"":"disabled"}>Undo last</button><button type="button" class="btn danger" data-act="mtreset" ${M.taps.length&&!lk?"":"disabled"}>Start again</button><button type="button" class="btn" data-act="mtfix" ${lk?"disabled":""}>Fix splits</button></div>
      <button type="button" class="btn go big" data-act="mtsend" style="width:100%" ${done&&sp&&!lk?"":"disabled"}>Send to Recorder</button>`;
  }else{
    body=`<div class="msg ok">Race ${r.race} times sent to the Recorder.</div>
      ${hasNext?`<button type="button" class="btn navy big" data-act="mtnext" style="width:100%">Next race</button>`:`<button type="button" class="btn big" disabled style="width:100%">Waiting for marshal</button>`}
      ${nav}${back}`;
  }
  return `${lockBar()}<div class="phone">${top}${head}${body}</div>
  ${A.s.flash?`<div class="flash ${A.s.flash.c}" role="status">${esc(A.s.flash.t)}</div>`:""}`;
}
/* keep the phone awake while the clock runs (a 200 m race is about 3 minutes) */
let mtLock=null;
let mtVid=null;
function mtVideo(on){
  try{
    if(on){if(!mtVid){mtVid=document.createElement("video");mtVid.muted=true;mtVid.loop=true;mtVid.setAttribute("playsinline","");mtVid.setAttribute("muted","");mtVid.setAttribute("aria-hidden","true");mtVid.style.cssText="position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";mtVid.src=SILENT_MP4;document.body.appendChild(mtVid)}
      const p=mtVid.play();if(p&&p.catch)p.catch(()=>{})}
    else if(mtVid)mtVid.pause();
  }catch(e){}
}
async function mtWake(on){mtVideo(on);try{if(on&&navigator.wakeLock&&!mtLock){mtLock=await navigator.wakeLock.request("screen");mtLock.addEventListener("release",()=>{mtLock=null})}else if(!on&&mtLock){await mtLock.release();mtLock=null}}catch(e){mtLock=null}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&A.mt&&A.mt.phase==="run")mtWake(true)});
if(A.mt.phase==="run")mtWake(true);
function mtGo(at){const M=A.mt;if(M.phase!=="ready"||locked())return;M.t0=at||Date.now();M.stopTap=0;M.phase="run";M.splits=[];M.taps=[];mtSave();mtWake(true);render()}
function mtSplit(at){const M=A.mt;if(M.phase!=="run")return;M.splits.push(mtNow(at));mtSave();render()}
function mtStop(force,at){
  const r=slipRace();const M=A.mt;if(!r||M.phase!=="run")return;
  if(!force){M.stopTap=at||Date.now();if(M.splits.length<r.filled.length){A.modal={t:"mtStop",n:M.splits.length,of:r.filled.length};render();return}}
  M.stopAt=M.stopTap||Date.now();M.phase="place";M.taps=[];A.modal=null;mtSave();mtWake(false);render();
}
function mtTap(l){
  const r=slipRace();const M=A.mt;if(!r||M.phase!=="place")return;
  const i=M.taps.indexOf(l);
  if(i>=0)M.taps.splice(i,1);else if(M.taps.length<mtLimit(r))M.taps.push(l);
  mtSave();render();
}
async function mtSend(force){
  const r=slipRace();const M=A.mt;if(!r||M.phase!=="place"||locked())return;
  const key=rid(r.race);
  if(!force&&(A.slips[key]||r.nTimes>0||r.tapped>0)){A.modal={t:"mtReplace",race:r.race,judge:r.tapped>0};render();return}
  A.modal=null;
  const lanes={},read={};
  M.taps.forEach((l,i)=>{lanes[l]={t:M.splits[i],st:"ok",src:"multi",keep:false,chk:false};read[l]=M.splits[i]});
  const top=M.taps.slice(0,Math.min(4,r.filled.length));
  const fin={order:top.map(l=>[l]),seq:top.slice(),at:Date.now(),dev:DEV};
  const meta={race:r.race,multi:true,splits:M.splits.slice(),read,unsure:[],miss:false,missed:[],mism:false,two:false,at:Date.now(),dev:DEV,test:false};
  A.slips[key]=meta;A.times[key]={lanes,src:"multi",checked:false};A.finish[key]=fin;recompute();
  M.phase="sent";mtSave();
  A.s.flash={c:"green",t:`Race ${r.race} sent to the Recorder`};render();
  setTimeout(()=>{A.s.flash=null;render()},1100);
  await w(()=>A.store.set("slips/"+key,meta));
  await w(()=>A.store.set("times/"+key,{lanes,src:"multi",checked:false,by:DEV,at:Date.now()}));
  await w(()=>A.store.set("finish/"+key,fin));
}
/* Fix splits: delete a double tap, add a missed time, or clear and time again */
function mtFixSplits(sp){const M=A.mt;M.splits=sp.slice().sort((a,b)=>a-b);M.taps=[];mtSave();render()}
MODALS.mtStop=M=>`<h2>Stop the clock?</h2><p style="margin:0">Only ${plural(M.n,"split")} for ${plural(M.of,"swimmer")}. Stop anyway?</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Keep timing</button><button type="button" class="btn redfill" data-act="mtstopok">Stop the clock</button></div>`;
MODALS.mtReplace=M=>`<h2>Replace the Race ${M.race} results?</h2><p style="margin:0">Race ${M.race} already has ${M.judge?"times or Place Judge places":"times"}. These multitimer times and places will replace them.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="mtsendok">Replace the results</button></div>`;
MODALS.mtFix=M=>{const sp=A.mt.splits;
  return `<h2>Fix splits</h2><p class="muted" style="margin:0">Delete a double tap, or add a time that was missed. Changing the splits clears the places tapped so far.</p>
  ${sp.length?`<ol class="splits">${sp.map((t,i)=>`<li><b>${i+1}</b><span style="flex:1">${fmtTime(t)}</span><button type="button" class="btn small danger" data-act="mtdel" data-i="${i}">Delete</button></li>`).join("")}</ol>`:`<p class="muted" style="margin:0">No splits yet.</p>`}
  <label class="label" for="mtadd">Add a missed time</label>
  <div class="row" style="flex-wrap:nowrap"><input class="timein" id="mtadd" inputmode="numeric" autocomplete="off" placeholder="Type time" value="${esc(M.raw||"")}" style="flex:1;min-height:48px"><button type="button" class="btn" data-act="mtaddok">Add</button></div>
  ${M.err?`<span style="color:var(--bad);font-weight:700">${esc(M.err)}</span>`:`<span class="muted" style="font-size:.88rem">Type digits only: 12734 is 1:27.34.</span>`}
  <div class="acts"><button type="button" class="btn danger" data-act="mtclear">Clear the clock and time again</button><button type="button" class="btn primary" data-act="closemodal">Done</button></div>`};
setInterval(()=>{if(A.mt&&A.mt.phase==="run"){const c=document.getElementById("mtclock");if(c)c.textContent=mtFmt(mtNow())}},47);
