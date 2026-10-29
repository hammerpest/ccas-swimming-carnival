/* ===== Marshal and Place Judge ===== */
function enabledTypes(){return (A.cfg.program||DEFAULT_CONFIG.program).filter(p=>p.on&&TYPE[p.k]).map(p=>TYPE[p.k])}
function groupChoices(t){
  if(!t)return [];
  if(t.gk==="age")return GROUPS.age.map(g=>({g,l:g,sub:g==="13"?"& under":g==="18"?"and over":""}));
  if(t.gk==="band")return GROUPS.band.map(g=>({g,l:grpName(g)}));
  if(t.gk==="open")return [{g:"O",l:"Open"}];
  return [{g:"Y12",l:"Year 12"}];
}
function eligible(k,x,g){
  const t=TYPE[k];
  if(t.relay)return TEAMS.map(id=>({id,team:true,name:teamName(id),h:id[0]}));
  let list=students();
  if(t.gk==="age")list=list.filter(s=>s.x===x&&s.g===g);
  else if(t.gk==="band")list=list.filter(s=>s.x===x&&BAND_AGES[g].includes(s.g));
  else list=list.filter(s=>s.g==="17"||s.g==="18");
  return list.slice().sort((a,b)=>(a.s+" "+a.f).localeCompare(b.s+" "+b.f));
}
function mMissing(){
  const m=A.m,t=TYPE[m.k];const miss=[];
  if(!t)miss.push("the race");
  if(!t||!t.nosex){if(!m.x)miss.push("boys or girls")}
  if(!m.g)miss.push(t&&t.gk!=="age"?"the group":"the age");
  return miss;
}
function usedInGroup(){
  const m=A.m;const key=groupKey(m.k,m.x,m.g);const used=new Set();
  for(const h of A.heats)if(groupKey(h.k,h.x,h.g)===key)for(const l in (h.lanes||{}))if(h.lanes[l])used.add(h.lanes[l]);
  return used;
}
function heatsSentFor(key){return A.heats.filter(h=>groupKey(h.k,h.x,h.g)===key).length}

function renderMarshal(){
  const m=A.m;
  if(m.phase==="lanes")return renderMarshalLanes();
  const types=enabledTypes();const t=TYPE[m.k];
  const miss=mMissing();const showMiss=m.showMiss;
  const row=(id,title,inner,isMiss)=>`<div class="mrow ${showMiss&&isMiss?"miss":""}" id="${id}"><span class="label">${title}</span><div class="choices">${inner}</div></div>`;
  const raceBtns=types.map(x=>`<button type="button" class="choice" data-act="mpick" data-f="k" data-v="${x.k}" aria-pressed="${m.k===x.k}">${esc(x.btn)}</button>`).join("");
  const sexBtns=[["F","Girls"],["M","Boys"]].map(([v,l])=>`<button type="button" class="choice" data-act="mpick" data-f="x" data-v="${v}" aria-pressed="${m.x===v}">${l}</button>`).join("");
  const gBtns=(t?groupChoices(t):GROUPS.age.map(g=>({g,l:g,sub:g==="13"?"& under":g==="18"?"and over":""}))).map(c=>`<button type="button" class="choice" data-act="mpick" data-f="g" data-v="${c.g}" aria-pressed="${m.g===c.g}">${esc(c.l)}${c.sub?`<small style="display:block;font-size:.7rem;font-weight:600">${c.sub}</small>`:""}</button>`).join("");
  const name=!miss.length?groupLabel(m.k,t.nosex?"X":m.x,m.g):"";
  return `${lockBar()}<div class="stack" style="max-width:1040px;margin:0 auto">
    ${m.msg?`<div class="msg ok">${esc(m.msg)}</div>`:""}
    ${A.heats.length===0&&!students().length?`<div class="msg warn">No student list loaded yet. The Carnival Organiser loads it first.</div>`:""}
    ${row("mr-race","Race",raceBtns,!t)}
    ${t&&t.nosex?"":row("mr-sex","Boys or girls",sexBtns,!m.x)}
    ${row("mr-age",t&&t.gk!=="age"?"Group":"Age",gBtns,!m.g)}
    <div class="checkline">${badge(A.counter,"xl")}
      ${miss.length?`<div class="what not"><span class="label" style="color:var(--warn)">Not ready yet</span><br>Still to choose: ${esc(miss.join(", "))}</div>`:`<div class="what">${esc(name)}<br><span class="muted" style="font:600 .95rem var(--font-body)">Heat ${heatsSentFor(groupKey(m.k,t.nosex?"X":m.x,m.g))+1}</span></div>`}
      <button type="button" class="btn go big" data-act="mgo" ${locked()?"disabled":""}>Go</button>
    </div>
  </div>`;
}
function marshalGo(){
  const m=A.m;const miss=mMissing();
  if(miss.length){m.showMiss=true;A.modal={t:"info",title:"Not ready yet",body:`<p style="margin:0">You have not selected ${esc(miss.join(", ").replace(/, ([^,]*)$/," and $1"))}.</p><p style="margin:0">Go back and choose them (marked in yellow), then press Go.</p>`,ok:"OK, go back"};render();return}
  const t=TYPE[m.k];if(t.nosex)m.x="X";
  const key=groupKey(m.k,m.x,m.g);
  if(otherPeers().some(p=>p.mk===key)){A.modal={t:"info",title:"Already selected",body:`<p style="margin:0">${esc(groupLabel(m.k,m.x,m.g))} has already been selected on another iPad. Please go back and choose another race or group.</p>`,ok:"Back"};render();return}
  m.phase="lanes";m.lanes={};m.cur=1;m.open=1;m.filter="";m.heat=heatsSentFor(key)+1;m.sent=[];m.msg="";m.showMiss=false;m.bar="";
  announce();render();
}
function renderMarshalLanes(){
  const m=A.m;const L=Number(A.cfg.lanes)||8;
  const filled=Object.keys(m.lanes).filter(l=>m.lanes[l]).length;
  const used=usedInGroup();const inHeat=new Set(Object.values(m.lanes));
  let lanes="";
  for(let l=1;l<=L;l++){
    const id=m.lanes[l];const p=id?A.R.who(id):null;
    let pick="";
    if(m.open===l){
      const list=eligible(m.k,m.x,m.g);const q=m.filter.toLowerCase();
      const shown=q?list.filter(s=>(listName(s)).toLowerCase().includes(q)):list;
      pick=`<div class="picklist" role="listbox" aria-label="Swimmers for lane ${l}">
        <div class="acts">${TYPE[m.k].relay?"":`<input id="mfilter" placeholder="Type to find a name" value="${esc(m.filter)}" style="flex:1 1 160px;min-height:48px" autocomplete="off">`}
          ${TYPE[m.k].relay?"":`<button type="button" class="btn small" data-act="maddnew" data-l="${l}">+ Not on the list</button>`}
          <button type="button" class="btn small" data-act="mclear" data-l="${l}">Clear lane</button>
          <button type="button" class="btn small" data-act="mclose">Close</button></div>
        ${shown.length?shown.map(s=>{const dis=used.has(s.id)||(inHeat.has(s.id)&&id!==s.id);return `<button type="button" class="pick" data-act="mset" data-l="${l}" data-id="${esc(s.id)}" ${dis?"disabled":""}>${hdot(s.h)}<span>${esc(listName(s))}</span>${used.has(s.id)?`<span class="muted" style="margin-left:auto;font-size:.8rem">Earlier heat</span>`:inHeat.has(s.id)&&id!==s.id?`<span class="muted" style="margin-left:auto;font-size:.8rem">In this heat</span>`:""}</button>`}).join(""):`<div class="muted" style="padding:10px">No names match.</div>`}
      </div>`;
    }
    lanes+=`<div class="lane ${m.cur===l&&!id?"cur":""}" style="position:relative"><div class="blk">${l}</div>
      <button type="button" class="body" data-act="mlane" data-l="${l}" aria-label="Lane ${l}">${p?`<span class="nm">${hdot(p.h)}<span>${esc(pname(p))}</span></span>`:`<span class="empty">${m.cur===l?"Tap to choose a swimmer":"Empty"}</span>`}</button>
      <div class="wall" aria-hidden="true"></div>${pick}</div>`;
  }
  return `${lockBar()}<div class="racebar">
      <button type="button" class="btn" data-act="mback">&lt; Back</button>
      ${badge(A.counter,"xl")}
      <div class="info"><b>${esc(groupLabel(m.k,m.x,m.g))}</b><span>Heat ${m.heat} · ${filled} of ${L} lanes filled</span></div>
      <button type="button" class="btn navy big" data-act="mnext" ${locked()?"disabled":""}>Next heat</button>
      <button type="button" class="btn big" data-act="mnew" ${locked()?"disabled":""}>New race</button>
    </div>
    ${m.bar?`<div class="msg ok" style="margin-bottom:12px">${esc(m.bar)}</div>`:""}
    <div class="pool">${lanes}</div>`;
}
function nextEmpty(from){const L=Number(A.cfg.lanes)||8;for(let i=1;i<=L;i++){const l=((from-1+i)%L)+1;if(!A.m.lanes[l])return l}return null}
async function sendHeat(){
  const m=A.m;
  const lanes={};for(const l in m.lanes)if(m.lanes[l])lanes[l]=m.lanes[l];
  if(!Object.keys(lanes).length){toast("Put at least one swimmer in a lane first.");return false}
  if(locked()){toast("Results are locked.");return false}
  if(m.sending)return false;m.sending=true;
  try{
    const n=await A.store.nextRace();
    const doc={race:n,k:m.k,x:m.x,g:m.g,heat:m.heat,lanes,at:Date.now(),dev:DEV};
    const r=await w(()=>A.store.set("heats/"+rid(n),doc));
    if(!r){m.sending=false;return false}
    A.heats=A.heats.filter(h=>h.race!==n).concat([Object.assign({_id:rid(n)},doc)]);
    m.sent.push(n);m.bar=`Race ${n} (Heat ${m.heat}) sent to the starter`;
    m.heat++;m.lanes={};m.cur=1;m.open=1;m.filter="";
    m.sending=false;recompute();return true;
  }catch(e){m.sending=false;toast(e&&e.code==="busy"?"Another marshal is sending. Press again.":"Not sent. A race number needs a connection. Try again.");return false}
}
function finishMarshalRace(){
  const m=A.m;
  m.msg=m.sent.length?`${raceRange(m.sent)} sent to the starter (${plural(m.sent.length,"heat")}). Choose the new race below.`:"";
  m.phase="start";m.k=null;m.x=null;m.g=null;m.lanes={};m.open=null;m.bar="";
  announce();render();window.scrollTo(0,0);
}
MODALS.confirmHeat=M=>{const m=A.m;const L=Number(A.cfg.lanes)||8;const f=Object.keys(m.lanes).filter(l=>m.lanes[l]).length;
  return `<h2>Confirm this heat</h2><p style="margin:0">Race ${A.counter} (Heat ${m.heat}): ${f} of ${L} lanes filled. It will be sent to the starter, then you go back to choose a new race.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn go" data-act="mconfirm">Confirm this heat</button></div>`};
MODALS.addSwimmer=M=>{const m=A.m;const t=TYPE[m.k];
  const ages=t.gk==="age"?[m.g]:t.gk==="band"?BAND_AGES[m.g]:["17","18"];
  return `<h2>Swimmer not on the list</h2><p class="muted" style="margin:0">Adds the swimmer for everyone. ${esc(sexName(m.x)||"")}</p>
  <div class="fields"><label>Surname<input id="nsS" autocomplete="off"></label><label>First name<input id="nsF" autocomplete="off"></label>
  <label>House<select id="nsH">${HOUSES.map(h=>`<option value="${h.c}">${h.n}</option>`).join("")}</select></label>
  ${m.x==="X"?`<label>Sex<select id="nsX"><option value="F">Girl</option><option value="M">Boy</option></select></label>`:""}
  <label>Age group<select id="nsG">${ages.map(a=>`<option value="${a}">${grpName(a)}</option>`).join("")}</select></label></div>
  <div class="acts"><button type="button" class="btn" data-act="closemodal">Cancel</button><button type="button" class="btn primary" data-act="maddsave" data-l="${M.l}">Add to lane ${M.l}</button></div>`};
async function addSwimmer(l){
  const s=document.getElementById("nsS").value.trim(),f=document.getElementById("nsF").value.trim();
  if(!s||!f){toast("Type a surname and first name.");return}
  const x=A.m.x==="X"?document.getElementById("nsX").value:A.m.x;
  const st={id:"x-"+(s+"-"+f).toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+Date.now().toString(36),s,f,h:document.getElementById("nsH").value,x,g:document.getElementById("nsG").value,added:true};
  const r=await w(()=>A.store.set("extras/"+st.id,st));if(!r)return;
  A.extras=A.extras.concat([st]);A.m.lanes[l]=st.id;A.m.cur=nextEmpty(l)||l;A.m.open=null;A.modal=null;recompute();render();
}

/* ---------- Place Judge ---------- */
function judgeRace(){
  const list=raceList();if(!list.length)return null;
  if(A.j.race==null||!A.R.races.has(A.j.race))A.j.race=list[0].race;
  return A.R.races.get(A.j.race);
}
function renderJudge(){
  const r=judgeRace();
  if(!r)return waitingCard("Waiting for the marshal","The first race appears here as soon as the marshal sends it.");
  const L=Number(A.cfg.lanes)||8;const fin=A.finish[rid(r.race)]||{};const order=fin.order||[];
  const placeOf=finishOrderFromTaps(order);
  const placed=Object.keys(placeOf).length;const need=r.need;
  const max=raceList().slice(-1)[0].race;
  const done=placed>=need;
  const nextPlace=A.j.dh&&order.length?placeOf[String(order[order.length-1][0])]:placed+1;
  let lanes="";
  for(let l=1;l<=L;l++){
    const id=r.lanes[l];const p=id?A.R.who(id):null;const pl=placeOf[String(l)];
    let wall="";
    if(p){
      if(pl)wall=`<button type="button" class="spot p${Math.min(pl,4)}" data-act="jtap" data-l="${l}" aria-label="Lane ${l}, place ${pl}. Tap to remove">${pl}</button>`;
      else if(!done)wall=`<button type="button" class="spot" data-act="jtap" data-l="${l}" aria-label="Lane ${l}, tap for place ${nextPlace}"></button>`;
      else wall=`<span class="bytime">By time</span>`;
    }
    lanes+=`<div class="lane"><div class="blk">${l}</div><div class="body" style="cursor:default">${p?`<span class="nm">${hdot(p.h)}<span>${esc(pname(p))}</span></span>`:`<span class="empty">Empty</span>`}</div><div class="wall">${wall}</div></div>`;
  }
  const ord=["1st","2nd","3rd","4th"];
  const prompt=done?`Top ${need} placed. Press Next race.`:A.j.dh?`Dead heat: tap the lane that tied for ${ord[nextPlace-1]||nextPlace+"th"}.`:`Tap the lane that touched ${ord[placed]||(placed+1)+"th"}${placed===0?" first":""}.`;
  return `${lockBar()}<div class="racebar">${badge(r.race,"xl")}<div class="info"><b>${esc(r.label)}</b><span>Heat ${r.heat}${r.race<max?" · Earlier race: changes save straight away":""}</span></div>
      <button type="button" class="btn" data-act="jgoto">Go to race</button>
      ${r.race<max?`<button type="button" class="btn" data-act="jlatest">Back to latest</button>`:""}
      ${A.R.races.has(r.race+1)?`<button type="button" class="btn navy big" data-act="jnext">Next race</button>`:`<button type="button" class="btn big" disabled>Waiting for marshal</button>`}
    </div>
    <div class="prompt ${done?"done":""}">${esc(prompt)}</div>
    <div class="pool">${lanes}</div>
    <div class="row" style="margin-top:12px">
      <button type="button" class="btn" data-act="jdh" aria-pressed="${A.j.dh}" ${!placed||locked()?"disabled":""} style="${A.j.dh?"background:var(--sun);border-color:var(--sun);color:var(--sun-ink)":""}">Dead heat</button>
      <button type="button" class="btn" data-act="jundo" ${!placed||locked()?"disabled":""}>Undo last</button>
      <button type="button" class="btn danger" data-act="jreset" ${!placed||locked()?"disabled":""}>Start again</button>
    </div>`;
}
async function judgeTap(l){/* dead heat confirmed in MODALS.deadHeat */
  const r=judgeRace();const key=rid(r.race);
  const fin=A.finish[key]||{};let order=(fin.order||[]).map(g=>g.slice());let seq=(fin.seq||[]).slice();
  const at=order.findIndex(g=>g.includes(l));
  if(at>=0){order[at]=order[at].filter(x=>x!==l);order=order.filter(g=>g.length);seq=seq.filter(x=>x!==l)}
  else{
    const placed=order.reduce((t,g)=>t+g.length,0);if(placed>=r.need)return;
    if(A.j.dh&&order.length)order[order.length-1].push(l);else order.push([l]);
    seq.push(l);A.j.dh=false;
  }
  await saveFinish(key,order,seq);
}
async function saveFinish(key,order,seq){
  const doc={order,seq,at:Date.now(),dev:DEV};
  A.finish[key]=doc;recompute();render();
  await w(()=>A.store.set("finish/"+key,doc));
}
function judgeUndo(){const r=judgeRace();const key=rid(r.race);const fin=A.finish[key]||{};const seq=(fin.seq||[]).slice();const last=seq.pop();if(last==null)return;
  let order=(fin.order||[]).map(g=>g.filter(x=>x!==last)).filter(g=>g.length);saveFinish(key,order,seq)}
function judgeNext(force){
  const r=judgeRace();
  if(!force){const placed=Object.keys(finishOrderFromTaps((A.finish[rid(r.race)]||{}).order)).length;
    if(placed<r.need){A.modal={t:"confirmPlaces",race:r.race,heat:r.heat,placed,need:r.need};render();return}}
  if(A.R.races.has(r.race+1)){A.j.race=r.race+1;A.j.dh=false}
  A.modal=null;render();window.scrollTo(0,0);
}
MODALS.confirmPlaces=M=>`<h2>Confirm places</h2><p style="margin:0">Race ${M.race}, Heat ${M.heat}: ${M.placed} of ${M.need} places tapped. Times will decide any place not tapped.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn go" data-act="jconfirm">Confirm</button></div>`;
MODALS.goRace=M=>{
  const list=raceList();
  return `<h2>Go to race</h2><div class="stack" style="gap:6px">${list.length?list.slice().reverse().map(r=>{
    let st="";
    if(M.job==="judge"){const p=Object.keys(finishOrderFromTaps((A.finish[rid(r.race)]||{}).order)).length;st=p>=r.need?`Top ${r.need} done`:p?`${p} of ${r.need} placed`:"Not started"}
    else if(M.job==="recorder"){st=lockedBy(r.race)?"On another device":r.tstatus}
    else{st=A.slips[rid(r.race)]?(A.s.waiting&&A.s.waiting[r.race]?"Waiting to send":""):"No slip yet"}
    const tick=(M.job==="slips"||M.job==="recorder")&&A.slips[rid(r.race)]&&!(M.job==="slips"&&A.s.waiting&&A.s.waiting[r.race]);
    return `<button type="button" class="btn" style="justify-content:flex-start;gap:12px" data-act="pickrace" data-race="${r.race}" data-job="${M.job}">${badge(r.race,"sm")}<span style="flex:1;text-align:left">${esc(r.label)}<br><span class="muted" style="font-weight:600;font-size:.85rem">Heat ${r.heat}</span></span>${st?`<span class="chip">${esc(st)}</span>`:""}${tick?slipTick():""}</button>`}).join(""):`<p class="muted">No races sent yet.</p>`}</div>
  <div class="acts"><button type="button" class="btn" data-act="closemodal">Close</button></div>`;
};
function slipTick(){return `<span class="sliptick"><span class="tk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>Slip added</span>`}
function waitingCard(t,s){return `<div class="panel stack" style="max-width:640px;margin:30px auto;text-align:center;align-items:center">${badge(null,"xl")}<h2>${esc(t)}</h2><p class="muted" style="margin:0">${esc(s)}</p></div>`}
function lockBar(){if(A.past)return `<div class="lockbar">You are looking at the ${esc(A.past)} carnival. Look only: nothing can be changed. Use Change year to go back to ${esc(curYear())}.</div>`;return locked()?`<div class="lockbar">Results are locked. You can look, but nothing can be changed until the organiser unlocks them.</div>`:""}

MODALS.deadHeat=M=>`<h2>Dead heat?</h2><p style="margin:0">Place judges must split the result. Only use Dead heat if two swimmers touched at exactly the same moment and the judges cannot separate them.</p><p style="margin:0">A dead heat is flagged for the Recorder to check.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">Cancel, we can split it</button><button type="button" class="btn" style="background:var(--sun);border-color:var(--sun);color:var(--sun-ink)" data-act="jdhok">Yes, a true dead heat</button></div>`;
