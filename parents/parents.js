/* ===== Swim Opt 2.8: results for parents (look only) =====
   Asks the server's parent_results() every minute (no sign-in). It only hands out results once the
   organiser turns parent results on, with names only if the organiser chooses them. The places, points and
   champions are worked out here by the same engine as the app (js/core.js). An event's results show
   only once every heat of it is in (Final); the age champions count Final events only.
   Swim Opt 2.19 (S1.45): names are off unless the organiser chooses first initial and surname; the tabs and home cards follow
   the organiser's ticks; with "show before final" ticked an event part way through shows marked Provisional.
   Test mode (?mode=local, or no project set up) reads this browser's test data with the same rules as the server. */
const P={data:null,v:"",R:null,off:false,err:false,at:0,sex:"F",age:"all",q:""};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
/* Swim Opt 2.18: labels follow the carnival's ages (primary 8 to 12 or secondary 13 to 18) */
const AGE_LABEL=new Proxy({},{get:(o,a)=>{a=ageGrp(a);const on=GROUPS.age;if(!on.includes(a))return "";return a===on[0]&&on.length>1?a+" & under":a===on[on.length-1]?a+"+":a+" years"}});

/* ---- data ---- */
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const LOCAL=new URLSearchParams(location.search).get("mode")==="local"||!(window.SWIM_CONFIG||{}).url;
/* test mode: the answer parent_results would give, from the data this browser keeps (store-local.js, "swim_db:") */
function localAnswer(){
  const mem={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("swim_db:"))mem[k.slice(8)]=JSON.parse(localStorage.getItem(k))}}catch(e){}
  const cfg=mem["config/main"];if(!cfg||cfg.parents!==true)return {off:true};
  const on=cfg.parentsNames==="short",prov=cfg.parentsProv===true;
  const col=p=>Object.keys(mem).filter(k=>k.startsWith(p+"/")).map(k=>Object.assign({_id:k.slice(p.length+1)},mem[k]));
  const map=p=>Object.fromEntries(col(p).map(d=>[d._id,d]));
  const code=id=>TEAMS.includes(id)?id:"p"+[...id].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7).toString(36).padStart(10,"0").slice(-10);
  const heats=col("heats").filter(h=>h.race);const used=new Set();for(const h of heats)for(const v of Object.values(h.lanes||{}))if(v)used.add(v);
  const studs=[].concat((mem["roster/F"]||{}).students||[],(mem["roster/M"]||{}).students||[],col("extras"));
  const times=map("times"),finish=map("finish");const held={};
  /* the server's rule: every heat (cancelled ones too) of an event that has a heat not in is held back */
  if(!prov){const R=compute({config:cfg,students:studs,heats,times,finish,slips:{},records:[]});
    const open=new Set([...R.groups.values()].filter(G=>!G.final).map(G=>G.key));
    for(const h of heats){if(!open.has(groupKey(h.k,h.x,h.g)))continue;const r=R.races.get(h.race);held[h._id]=!!(r&&r.done&&!h.cancelled)}}
  const ini=n=>{n=String(n||"").replace(/^Test: /,"").trim();const w=n.split(/\s+/);return w.length<2?n:w[0][0]+" "+w[w.length-1]};
  return {v:"local-"+Date.now(),
    config:Object.assign(Object.fromEntries(["name","date","dateConfirmed","pool","lanes","points","program","notSwum","locked","level","agesOff","parentsShow"].map(k=>[k,cfg[k]])),{parentsNames:on?"short":"none",parentsProv:prov}),
    heats:heats.map(h=>({_id:h._id,race:h.race,heat:h.heat,k:h.k,x:h.x,g:h.g,gen:h.gen,cancelled:h.cancelled,edited:h.edited,at:h.at,in:h._id in held?held[h._id]:undefined,
      lanes:Object.fromEntries(Object.entries(h.lanes||{}).filter(([,v])=>v).map(([l,v])=>[l,code(v)]))})),
    times:Object.fromEntries(Object.entries(times).filter(([k])=>!(k in held)).map(([k,t])=>[k,{gen:t.gen,checked:t.checked,checkedAt:t.checkedAt,at:t.at,lanes:Object.fromEntries(Object.entries(t.lanes||{}).map(([l,v])=>[l,{t:v.t,st:v.st,slip:v.slip}]))}])),
    finish:Object.fromEntries(Object.entries(finish).filter(([k])=>!(k in held)).map(([k,f])=>[k,{order:f.order,gen:f.gen,ck:f.ck,ok:f.ok,at:f.at,multi:f.multi,taps:f.taps,n:f.n}])),
    records:((mem["records/all"]||{}).list||[]).map(r=>({key:r.key,t:r.t,holders:(r.holders||[]).map(x=>({n:on?ini(x.n):"A swimmer",h:x.h,y:x.y}))})),
    students:(()=>{const sent=studs.filter(x=>used.has(x.id)),key=x=>String(x.f||"").trim().slice(0,1).toLowerCase()+"|"+String(x.s||"").trim().toLowerCase(),n={};
      for(const x of sent)n[key(x)]=(n[key(x)]||0)+1;
      /* Swim Opt 2.22 (decision 171): two swimmers with the same first initial and surname show two letters ("Le Bell", "Lu Bell") */
      return sent.map(x=>({id:code(x.id),f:on?String(x.f||"").trim().slice(0,n[key(x)]>1?2:1):"Swimmer",s:on?String(x.s||"").trim():"",h:x.h,x:x.x,g:x.g}))})()};
}
async function pull(){
  const C=window.SWIM_CONFIG||{};
  try{
    let d;
    if(LOCAL)d=localAnswer();
    else{
      const r=await fetch(C.url+"/rest/v1/rpc/parent_results",{method:"POST",headers:{apikey:C.key,"Content-Type":"application/json"},body:JSON.stringify({have:P.v}),cache:"no-store"});
      if(!r.ok)throw new Error(r.status);
      d=await r.json();
    }
    P.err=false;P.at=Date.now();
    if(d.off){P.off=true;P.data=null;P.v="";lsSet("swim_parents",null);render();return}
    P.off=false;
    if(!d.same){P.data=d;P.v=d.v;d.at=P.at;lsSet("swim_parents",d);work();refresh()}
    else renderTop();
  }catch(e){P.err=true;P.R?renderTop():render()}
}
function work(){
  const d=P.data;if(!d){P.R=null;return}
  const S={config:d.config,students:d.students,heats:(d.heats||[]).filter(h=>h&&h.race),times:d.times,finish:d.finish,slips:{},records:d.records||[]};
  P.R=compute(S);
  /* age champions from Final events only, so a champion never rests on a heat still being checked */
  const fin=new Set(P.R.events.filter(e=>P.R.isFinal(e.key)).map(e=>e.key));
  P.RF=compute(Object.assign({},S,{heats:S.heats.filter(h=>fin.has(groupKey(h.k,h.x,h.g)))}));
}
/* new data while a parent types a name: only the list under the box changes, so the iPhone keyboard stays up */
function refresh(){if(route().a==="find"&&document.activeElement&&document.activeElement.id==="q"){renderTop();$("hits").innerHTML=hitList()}else render()}

/* ---- S1.45: what the organiser lets parents see ---- */
const SHOW0={house:true,age:true,events:true,find:true,champs:true,records:true};
const show=()=>Object.assign({},SHOW0,(P.data&&P.data.config&&P.data.config.parentsShow)||{});
const namesOn=()=>!!(P.data&&P.data.config&&P.data.config.parentsNames==="short");
const prov=()=>!!(P.data&&P.data.config&&P.data.config.parentsProv);
const nm=p=>p?(p.team||namesOn()?p.name:"Swimmer"):"";
const nmA=p=>p?(p.team||namesOn()?p.name:"A swimmer"):"";
function tabsOn(){const s=show();return [["home","Home","#/"],["events","Events","#/events",s.events],["find","Find","#/find",s.find&&namesOn()],["houses","Houses","#/houses",s.house||s.age]].filter(t=>t.length<4||t[3])}
function drawTabs(){const t=tabsOn();const n=$("tabs");n.style.gridTemplateColumns=`repeat(${t.length},minmax(0,1fr))`;n.innerHTML=t.map(([k,l,h])=>`<a href="${h}" data-tab="${k}">${l}</a>`).join("")}

/* ---- small parts ---- */
const dot=h=>h?`<span class="dot ${esc(h)}" aria-label="${esc(houseName(h))}">${esc(h)}</span>`:"";
const med=pl=>pl&&pl<=3?`<span class="med p${pl}">${pl}</span>`:`<span class="pl">${pl||""}</span>`;
const ptsTxt=n=>String(Math.round(n*100)/100);
function stLabel(r){return r.st==="NT"?"No time":r.st==="DNS"?"Did not swim":r.st==="DQ"?"Disqualified":""}
/* equal totals share a place: "=1st" */
function ranks(list,val){return list.map(x=>1+list.filter(y=>val(y)>val(x)).length).map((r,i,a)=>(a.filter(z=>z===r).length>1?"=":"")+r)}
function finalGroups(){const R=P.R;return R?R.events.map(e=>R.groups.get(e.key)).filter(G=>G&&G.final):[]}
function raceText(G){const n=G.raceNos||[];if(!n.length)return "";const h=n.length===1?"1 heat":n.length+" heats";return (n.length===1?"Race "+n[0]:"Races "+n.slice(0,-1).join(", ")+" and "+n[n.length-1])+", "+h}
function evStatus(e){
  const R=P.R;const G=R.groups.get(e.key);
  if(R.notSwum.has(e.key))return ["n","Not swum"];
  if(!G||!G.heats.length)return ["n","To come"];
  if(G.final)return ["f","Final"];
  /* Swim Opt 2.19: a heat held back on the server says whether it is in */
  const inn=h=>{const hh=(P.data.heats||[]).find(x=>x.race===h.race);return hh&&hh.in!=null?!!hh.in:h.done};
  const done=G.heats.filter(inn).length;
  return ["p",(prov()&&done?"Provisional, ":"")+done+" of "+G.heats.length+" heats in"];
}
function recBadge(G){if(!G.recordNote)return "";return G.recordNote.kind==="new"?`<span class="tag">NEW RECORD</span>`:`<span class="tag eq">EQUALS RECORD</span>`}
function topRows(G,n){return G.rows.filter(r=>r.place&&r.place<=n)}
function resRow(r,showHeat){
  const sub=[];if(showHeat)sub.push("Heat "+r.heat);if(r.tie)sub.push("Tie");if(r.tag)sub.push(r.tag==="NEW RECORD"?"New record":"Equals record");
  const right=r.eff!=null&&r.st!=="DQ"?fmtTime(r.eff):stLabel(r);
  return `<div class="res">${med(r.place)}<span class="nm"><b>${esc(nm(r.p))}</b>${sub.length?`<small>${esc(sub.join(", "))}</small>`:""}</span>${dot(r.p&&r.p.h)}<span class="time">${esc(right)}</span>${showHeat?`<span class="pts">${r.pts?ptsTxt(r.pts)+" pts":""}</span>`:""}</div>`;
}
function evCard(G,n){
  return `<article class="card ev"><a class="bar2" href="#/event/${encodeURIComponent(G.key)}"><h3>${esc(G.label)}<span class="sub">${esc(raceText(G))}</span></h3>${recBadge(G)||'<span class="chip ok">Final</span>'}</a>${topRows(G,n).map(r=>resRow(r,false)).join("")}</article>`;
}

/* ---- screens ---- */
function home(){
  const R=P.R;const all=R.events.length;
  const hr=R.houseRank;const top=Math.max(1,...hr.map(h=>h.total));const rk=ranks(hr,h=>h.total);
  const allFinal=R.finalCount===all;
  const latest=finalGroups().sort((a,b)=>b.checkedAt-a.checkedAt||Math.max(...b.raceNos)-Math.max(...a.raceNos)).slice(0,5);
  const broken=R.broken.filter(G=>G.final);const nNew=broken.filter(G=>G.recordNote.kind==="new").length,nEq=broken.length-nNew;
  const s=show();
  return `
  ${s.house?`<section class="card pad" style="display:flex;flex-direction:column;gap:10px">
    <div class="head"><h2>House points</h2>${s.age?'<a class="more" href="#/houses">By age group</a>':""}</div>
    ${hr.map((h,i)=>`<div class="hrow"><div class="l"><span class="rank">${rk[i]}</span>${dot(h.c)}<span class="n">${esc(h.n)}</span><span class="t">${ptsTxt(h.total)}</span></div><div class="bar"><i class="${h.c}" style="width:${Math.round(h.total/top*100)}%"></i></div></div>`).join("")}
    <p class="note">${allFinal?"Final":"Provisional"}: ${R.finalCount} of ${all} events final.</p>
  </section>`:""}
  ${s.records&&broken.length?`<a class="card link recs" href="#/records"><span class="tag">RECORDS</span><span class="grow">${[nNew?nNew+" record"+(nNew>1?"s":"")+" broken":"",nEq?nEq+" equalled":""].filter(Boolean).join(", ")} today</span><span class="chev" aria-hidden="true">&gt;</span></a>`:""}
  ${s.champs?`<a class="card link" href="#/champions"><span class="med p1">1</span><span class="grow">Age champions</span><span class="chev" aria-hidden="true">&gt;</span></a>`:""}
  ${s.events?`<div class="head"><h2>Latest results</h2><a class="more" href="#/events">All events</a></div>
  ${latest.length?latest.map(G=>evCard(G,3)).join(""):`<div class="card empty">No results yet. Results show once every heat of an event is in.</div>`}`:""}
  <p class="note">Updates by itself every minute. An event shows once every heat of it is in.</p>`;
}
function events(){
  const R=P.R;
  const ages=["all",...GROUPS.age];
  const ev=R.events.filter(e=>e.x===P.sex||e.x==="X").filter(e=>{
    if(P.age==="all")return true;const t=TYPE[e.k];
    return e.g===P.age||(t.gk==="band"&&BAND_OF[P.age]===e.g)||t.gk==="open";
  });
  return `
  <div class="seg" role="group" aria-label="Girls or boys"><button type="button" data-sex="F" aria-pressed="${P.sex==="F"}">Girls</button><button type="button" data-sex="M" aria-pressed="${P.sex==="M"}">Boys</button></div>
  <label class="field">Age<select id="age">${ages.map(a=>`<option value="${a}"${a===P.age?" selected":""}>${a==="all"?"All ages":AGE_LABEL[a]}</option>`).join("")}</select></label>
  <section class="card list">${ev.map(e=>{const [c,t]=evStatus(e);const G=R.groups.get(e.key);
    return `<a href="#/event/${encodeURIComponent(e.key)}"><span class="grow"><b>${esc(groupLabel(e.k,e.x,e.g).replace(/, (Girls|Boys) /,", "))}</b></span>${G&&G.final&&G.recordNote?recBadge(G):""}<span class="st ${c}">${esc(t)}</span><span class="chev" aria-hidden="true">&gt;</span></a>`}).join("")}</section>`;
}
function eventPage(key){
  const R=P.R;const G=R.groups.get(key);const {k,x,g}=splitKey(key);
  const label=groupLabel(k,x,g);
  if(G&&!G.final&&prov()&&G.heats.some(h=>h.done)){
    const [,t]=evStatus({key,k,x,g});
    return `<article class="card ev"><div class="bar2"><h3>${esc(label)}<span class="sub">${esc(raceText(G))}</span></h3><span class="chip wait">Provisional</span></div><div class="recnote"><span>${esc(t)}. Places can change until every heat is in.</span></div>
    ${G.rows.filter(r=>r.st!=="wait"&&(r.place||r.eff!=null||r.st)).map(r=>resRow(r,true)).join("")}</article>`;
  }
  if(!G||!G.final){
    const [,t]=TYPE[k]?evStatus({key,k,x,g}):["n","Not found"];
    return `<article class="card ev"><div class="bar2"><h3>${esc(label)}</h3><span class="chip wait">${esc(t)}</span></div><div class="empty">Results show here once every heat of this event is in.</div></article>`;
  }
  const rn=G.recordNote;const old=G.record;
  const recLine=rn?`<div class="recnote">${recBadge(G)}<span>${esc(fmtTime(rn.rows[0].eff))}. Old record ${esc(fmtTime(rn.old.t))}${esc(oldWho(rn.old))}</span></div>`:old?`<div class="recnote" style="background:var(--sunk)"><span class="muted">Record ${esc(fmtTime(old.t))}${esc(oldWho(old))}</span></div>`:"";
  return `<article class="card ev"><div class="bar2"><h3>${esc(label)}<span class="sub">${esc(raceText(G))}${G.heats.length>1?", timed final":""}</span></h3><span class="chip ok">Final</span></div>${recLine}
    ${G.rows.map(r=>resRow(r,true)).join("")}</article>
    <p class="note">${G.heats.length>1?"Places are across all heats (timed final). ":""}Points: 1st ${R.P.p1}, 2nd ${R.P.p2}, 3rd ${R.P.p3}, everyone else who swims ${R.P.rest}.</p>`;
}
function oldWho(rec){const h=(rec.holders||[])[0];if(!h)return "";const y=h.y?", "+h.y:"";return " ("+String(h.n||"").replace(/^Test: /,"")+y+")"}
function swimmers(){
  /* swimmers in a Final event, with their Final results */
  const map=new Map();
  for(const G of finalGroups()){if(TYPE[G.k].relay)continue;
    for(const r of G.rows){if(!r.p||r.p.team)continue;const m=map.get(r.id)||{p:r.p,ev:[]};m.ev.push({G,r});map.set(r.id,m)}}
  return map;
}
function matches(q){
  if(q.length<2)return [];
  return [...swimmers().entries()].filter(([,m])=>{const n=m.p.name.toLowerCase();return n.startsWith(q)||n.split(/\s+/).some(w=>w.startsWith(q))}).sort((a,b)=>a[1].p.name.localeCompare(b[1].p.name)).slice(0,40);
}
function find(){
  return `<label class="field">Type a surname<input id="q" type="search" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="search" value="${esc(P.q)}" placeholder="For example, Smith"></label>
  <div id="hits">${hitList()}</div>`;
}
function hitList(){
  const q=P.q.trim().toLowerCase();const hits=matches(q);
  if(q.length<2)return `<p class="note">Names show as first initial and surname. Only swimmers in finished events show.</p>`;
  if(!hits.length)return `<div class="card empty">No swimmer called "${esc(P.q)}" in a finished event yet.</div>`;
  return `<p class="note">${hits.length} swimmer${hits.length>1?"s":""} found</p><section class="card list">${hits.map(([id,m])=>{const pts=m.ev.reduce((s,e)=>s+(e.r.pts||0),0);
    return `<a href="#/swimmer/${encodeURIComponent(id)}">${dot(m.p.h)}<span class="grow"><b>${esc(m.p.name)}</b><span class="small muted">${esc(houseName(m.p.h))}, ${esc(sexName(m.p.x))} ${esc(AGE_LABEL[m.p.g]||"")}</span></span><span class="time">${ptsTxt(pts)} pts</span><span class="chev" aria-hidden="true">&gt;</span></a>`}).join("")}</section>`;
}
function swimmerPage(id){
  const m=swimmers().get(id);
  if(!m)return `<div class="card empty">No finished results for this swimmer yet.</div>`;
  const R=P.R;const pts=m.ev.reduce((s,e)=>s+(e.r.pts||0),0);const wins=m.ev.filter(e=>e.r.place===1).length;
  const c=P.RF.champs[ageGrp(m.p.g)+"|"+m.p.x];
  const champ=c&&c.winners.some(w=>w.id===id)?`<div class="recnote"><span class="med p1">1</span><b>${c.winners.length>1?"Joint age champion":"Age champion"}, ${esc(sexName(m.p.x))} ${esc(AGE_LABEL[m.p.g])}${c.done<c.of?" (so far)":""}</b></div>`:"";
  const ev=m.ev.slice().sort((a,b)=>(a.r.place||99)-(b.r.place||99));
  return `<article class="card">
    <div class="pad" style="display:flex;align-items:center;gap:12px"><span class="dot ${esc(m.p.h)}" style="width:40px;height:40px;font-size:17px">${esc(m.p.h)}</span><div><h2 style="font-weight:800;font-size:22px">${esc(m.p.name)}</h2><span class="small muted">${esc(houseName(m.p.h))}, ${esc(sexName(m.p.x))} ${esc(AGE_LABEL[m.p.g]||"")}</span></div></div>
    <div class="stats"><div><b>${ptsTxt(pts)}</b><span>POINTS</span></div><div><b>${wins}</b><span>WINS</span></div><div><b>${m.ev.length}</b><span>EVENTS</span></div></div>
    ${champ}
    ${ev.map(({G,r})=>`<a class="res" href="#/event/${encodeURIComponent(G.key)}" style="text-decoration:none;color:inherit">${med(r.place)}<span class="nm"><b>${esc(TYPE[G.k].name)}</b><small>${esc(raceText(G))}${G.heats.length>1?", heat "+r.heat:""}${r.tag?", "+(r.tag==="NEW RECORD"?"new record":"equals record"):""}</small></span><span style="display:flex;flex-direction:column;align-items:flex-end"><span class="time">${esc(r.eff!=null&&r.st!=="DQ"?fmtTime(r.eff):stLabel(r))}</span><span class="small muted">${r.pts?ptsTxt(r.pts)+" pts":""}</span></span></a>`).join("")}
  </article>
  <p class="note">Only finished events show. Places are across all heats of each event.</p>`;
}
function houses(){
  const R=P.R;const hr=R.houseRank;const ord=n=>n+(n===1?"st":n===2?"nd":n===3?"rd":"th");const rk=ranks(hr,h=>h.total).map(r=>r[0]==="="?"="+ord(+r.slice(1)):ord(+r));const allFinal=R.finalCount===R.events.length;
  const rows=[...AGE_GROUPS.map(a=>[AGE_LABEL[a],...HOUSES.map(h=>R.house[h.c].byAge[a])]),["Relays",...HOUSES.map(h=>R.house[h.c].relay)],["Total",...HOUSES.map(h=>R.house[h.c].total)]];
  const s=show();
  return `${s.house?hr.map((h,i)=>`<div class="card" style="display:flex"><div style="width:10px;background:var(--h${h.c})"></div><div class="pad" style="flex:1;display:flex;align-items:center;gap:12px"><span style="font-family:var(--font-display);font-weight:900;font-size:26px;width:56px">${rk[i]}</span><span style="flex:1;display:flex;flex-direction:column"><span style="font-family:var(--font-display);font-weight:800;font-size:20px">${esc(h.n)}</span><span class="small muted">${ptsTxt(h.indiv)} swimming, ${ptsTxt(h.relay)} relays</span></span><span class="time" style="font-size:22px">${ptsTxt(h.total)}</span></div></div>`).join(""):""}
  <p class="note">${allFinal?"Final.":"Provisional: "+R.finalCount+" of "+R.events.length+" events final."}</p>
  ${s.age?`<section class="card"><h2 class="pad" style="font-weight:800;font-size:18px;padding-bottom:10px">Points by age group</h2>
  <table class="tbl"><thead><tr><th scope="col">AGE</th>${HOUSES.map(h=>`<th scope="col"><span class="dot ${h.c}" style="width:12px;height:12px;vertical-align:-1px;margin-right:4px" aria-hidden="true"></span>${esc(h.n.slice(0,4).toUpperCase())}</th>`).join("")}</tr></thead>
  <tbody>${rows.map(r=>{const mx=Math.max(r[1],r[2],r[3]);return `<tr${r[0]==="Total"?' class="tot"':""}><td>${esc(r[0])}</td>${r.slice(1).map(v=>`<td>${v===mx&&mx>0?`<b>${ptsTxt(v)}</b>`:ptsTxt(v)}</td>`).join("")}</tr>`}).join("")}</tbody></table>
  <p class="note pad" style="padding-top:10px">Bold is the top house in each row. Points: 1st ${R.P.p1}, 2nd ${R.P.p2}, 3rd ${R.P.p3}, everyone else who swims ${R.P.rest}.</p></section>`:""}`;
}
function champions(){
  const R=P.RF;
  return `${AGE_GROUPS.map(a=>`<section class="card"><h2 style="padding:8px 14px;background:var(--sunk);font-weight:800;font-size:15px">${esc(AGE_LABEL[a])}</h2>
    ${["F","M"].map(x=>{const c=R.champs[a+"|"+x];if(!c||!c.winners.length)return `<div class="res"><span style="width:48px" class="small muted"><b>${x==="F"?"GIRLS":"BOYS"}</b></span><span class="nm muted">No points yet</span></div>`;
      const w=c.winners;const run=c.runners.length?(c.runners.length>2?c.runners.length+" tied":c.runners.map(r=>nmA(r.p)).join(" and "))+", "+ptsTxt(c.runners[0].pts):"";
      return `<div class="res"><span style="width:48px" class="small muted"><b>${x==="F"?"GIRLS":"BOYS"}</b></span>${dot(w.length===1?w[0].p.h:"")}<span class="nm"><b style="white-space:normal">${esc(w.map(r=>nmA(r.p)).join(" and "))}</b><small>${w.length>1?"Joint champions":run?"Runner up: "+esc(run):""}${c.done<c.of?` (${c.done} of ${c.of} races final)`:""}</small></span><span class="time">${ptsTxt(w[0].pts)}</span></div>`}).join("")}</section>`).join("")}
  <p class="note">Most points from the five age races${carnLevel(P.RF&&P.RF.cfg)==="primary"?"":" and the 200 m freestyle"}. Finished events only.</p>`;
}
function records(){
  const list=P.R.broken.filter(G=>G.final);
  if(!list.length)return `<div class="card empty">No records broken yet.</div>`;
  return list.map(G=>{const rn=G.recordNote;return `<article class="card pad" style="display:flex;flex-direction:column;gap:6px;padding:12px 14px">
    <div class="head" style="align-items:center"><h2 style="font-weight:700;font-size:15px">${esc(G.label)}</h2>${recBadge(G)}</div>
    <div style="display:flex;align-items:center;gap:10px">${dot(rn.rows[0].p&&rn.rows[0].p.h)}<span style="flex:1;font-weight:700">${esc(rn.rows.map(r=>nmA(r.p)).join(" and "))}</span><span class="time" style="font-size:18px">${esc(fmtTime(rn.rows[0].eff))}</span></div>
    <span class="small muted">Old record ${esc(fmtTime(rn.old.t))}${esc(oldWho(rn.old))}</span></article>`}).join("");
}

/* ---- page frame ---- */
function route(){const h=location.hash.replace(/^#\/?/,"");const [a,b]=h.split("/");return {a:a||"",b:b?decodeURIComponent(b):""}}
function title(r){
  return {"":"Swimming carnival",events:"Events",event:"Event results",find:"Find a swimmer",swimmer:"Swimmer",houses:"House points",champions:"Age champions",records:"Records broken today"}[r.a]||"Swimming carnival";
}
function renderTop(){
  const r=route();const d=P.data;const R=P.R;
  const name=d&&d.config&&d.config.name||"CCAS Swimming Carnival";
  let chip="";
  if(P.err)chip=`<span class="chip wait">${P.R?"Offline, saved results":"Offline"}</span>`;
  else if(R)chip=R.finalCount===R.events.length?`<span class="chip ok">Final, all ${R.events.length} results in</span>`:`<span class="chip wait">${R.finalCount} of ${R.events.length} events final</span>`;
  const sub=d&&d.config?[dateText(d.config),d.config.pool].filter(Boolean).join(", "):"";
  const back=["event","swimmer","champions","records"].includes(r.a)?`<a class="back" data-back href="${r.a==="swimmer"?"#/find":r.a==="event"?"#/events":"#/"}">&lt; Back</a>`:"";
  const upd=P.at||P.savedAt?`<p class="upd">Updated ${new Date(P.at||P.savedAt).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"})}</p>`:"";
  $("hdr").innerHTML=`<div class="row"><span class="badge">LIVE RESULTS</span>${chip}</div>${back?`<div style="margin-top:8px">${back}</div>`:""}<h1>${lastYellow(r.a===""?name:title(r))}</h1>${r.a===""&&sub?`<p>${esc(sub)}</p>`:""}${r.a===""?upd:""}`;
  drawTabs();renderTicker();
  const tab={"":"home",events:"events",event:"events",find:"find",swimmer:"find",houses:"houses",champions:"home",records:"home"}[r.a]||"home";
  for(const a of document.querySelectorAll("#tabs a"))a.dataset.tab===tab?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current");
}
/* Swim Opt 2.24 (S1.46): the heading's last word in yellow, and the ticker words from the carnival's own details */
function lastYellow(t){const w=String(t).trim().split(/\s+/);if(w.length<2)return esc(t);const l=w.pop();return esc(w.join(" "))+' <span class="y">'+esc(l)+"</span>"}
function renderTicker(){
  const c=P.data&&P.data.config||{};
  const words=["Results update every minute",c.pool,dateText(c),"Bradman","Jackson","Newcombe"].filter(Boolean);
  const html=`<div>${words.map(w=>esc(w)+" &nbsp;/&nbsp; ").join("")}</div>`;
  const t=$("tick");if(t&&t.dataset.w!==html){t.dataset.w=html;t.innerHTML=html}
}
function dateText(c){if(!c.date||c.dateConfirmed===false)return "";const d=new Date(c.date+"T00:00:00");return isNaN(d)?"":d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}
function render(){
  renderTop();const r=route();const m=$("main");
  document.title=(r.a?title(r)+", ":"")+"CCAS Swimming Carnival results";
  if(P.off){m.innerHTML=`<div class="card empty"><b>Results are not open yet.</b><br>Check back on carnival day.</div>`;return}
  if(!P.R){m.innerHTML=`<div class="empty">${P.err?"No connection. Results will show when your phone is back online.":"Loading results..."}</div>`;return}
  /* a hidden screen (link saved before a tick was taken off) goes to Home */
  const s=show();const hide={find:!(s.find&&namesOn()),swimmer:!(s.find&&namesOn()),events:!s.events,event:!s.events,houses:!(s.house||s.age),champions:!s.champs,records:!s.records};
  if(hide[r.a]){location.replace("#/");return}
  const keep=document.activeElement&&document.activeElement.id==="q";
  m.innerHTML=r.a==="events"?events():r.a==="event"?eventPage(r.b):r.a==="find"?find():r.a==="swimmer"?swimmerPage(r.b):r.a==="houses"?houses():r.a==="champions"?champions():r.a==="records"?records():home();
  if(keep){const q=$("q");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}
  /* the house bars grow once: after the first screen with bars, later refreshes show them still */
  if(!P.grown&&m.querySelector(".bar i")){P.grown=true;setTimeout(()=>document.documentElement.classList.add("grown"),1600)}
}

let moves=0;
document.addEventListener("click",e=>{const b=e.target.closest("[data-sex]");if(b){P.sex=b.dataset.sex;render();return}
  /* Back goes to where the parent came from when this visit has somewhere to go back to */
  if(e.target.closest("[data-back]")&&moves>0){e.preventDefault();moves-=2;history.back()}});
document.addEventListener("change",e=>{if(e.target.id==="age"){P.age=e.target.value;render()}});
document.addEventListener("input",e=>{if(e.target.id==="q"){P.q=e.target.value;
  $("hits").innerHTML=hitList()}});
window.addEventListener("hashchange",()=>{moves++;render();window.scrollTo(0,0)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)pull()});

const saved=lsGet("swim_parents");if(saved&&saved.v){P.data=saved;P.savedAt=saved.at||0;P.v="";work()}
render();pull();
setInterval(()=>{if(!document.hidden)pull()},60000);
