/* ===== Announcer, Results, Houses ===== */
function finalsInOrder(){return [...A.R.groups.values()].filter(G=>G.final).sort((a,b)=>a.checkedAt-b.checkedAt)}
function readSet(){try{return new Set(JSON.parse(localStorage.getItem("swim_read")||"[]"))}catch(e){return new Set()}}
function markRead(key){try{const s=readSet();s.add(key);localStorage.setItem("swim_read",JSON.stringify([...s]))}catch(e){}}
function recordLine(G){
  if(!G.record)return "";
  const h=G.record.holders||[];
  return `Record ${fmtTime(G.record.t)}, ${esc(h.map(x=>x.n).join(" and "))}${h[0]&&h[0].y?" "+h[0].y:""}`;
}
function standings(){
  const R=A.R;const max=Math.max(1,...R.houseRank.map(h=>h.total));
  return `<div class="stack" style="gap:10px">${R.houseRank.map((h,i)=>`<div class="stand">${medal(i+1)}<div style="min-width:0"><div class="row" style="justify-content:space-between;gap:6px"><span class="htag">${hdot(h.c)}<b>${esc(h.n)}</b></span><b style="font:800 1.2rem var(--font-display)">${fmtPts(h.total)}</b></div><div class="barw" style="--hc:${hc(h.c)}"><div class="bar" style="width:${Math.round(h.total/max*100)}%"></div></div></div><span></span></div>`).join("")}</div>`;
}
function fmtPts(n){return (Math.round(n*100)/100).toLocaleString("en-AU")}
function statusChip(){const R=A.R;const n=R.events.length;const k=R.finalCount;return k>=n&&n?`<span class="chip final">Final, all ${n} results in</span>`:`<span class="chip prov">Provisional, ${k} of ${n} results in</span>`}
function brokenCards(){
  const b=A.R.broken.filter(G=>G.rows.some(r=>r.place===1));
  if(!b.length)return `<p class="muted" style="margin:0">No records broken yet.</p>`;
  return b.map(G=>{const n=G.recordNote;return `<div class="panel" style="padding:10px 12px;border-left:5px solid var(--flame)"><div class="row" style="justify-content:space-between;gap:6px"><b>${esc(G.label)}</b><span class="tag ${n.kind==="new"?"rec":"eq"}">${n.kind==="new"?"NEW RECORD":"EQUALS RECORD"}</span></div>
    <div style="font-size:.92rem">${n.rows.map(r=>`${esc(pname(r.p))} (${esc(houseName(r.p.h))}) ${fmtTime(r.eff)}`).join(", ")}. ${n.kind==="new"?`Old record ${fmtTime(n.old.t)}, ${esc((n.old.holders||[]).map(x=>x.n).join(" and "))} ${(n.old.holders||[])[0]?.y||""}`:`Shares the record with ${esc((n.old.holders||[]).map(x=>x.n+" "+(x.y||"")).join(" and "))}`}${G.final?"":" (provisional)"}</div></div>`}).join("");
}
function renderAnnouncer(){
  const list=raceList();const last=list[list.length-1];
  const finals=finalsInOrder();
  if(A.a.idx==null||A.a.idx>=finals.length){const rs=readSet();const i=finals.findIndex(G=>!rs.has(G.key));A.a.idx=i<0?Math.max(0,finals.length-1):i}
  const G=finals[A.a.idx];
  const more=finals.length-1-A.a.idx;
  let card="";
  if(G){
    const top=G.rows.filter(r=>r.place&&r.place<=3);
    card=`<div class="panel stack"><div class="row" style="justify-content:space-between"><span class="label">Read out next</span><span class="chip ${more>0?"info":""}">${more>0?more+" more ready":"Up to date"}</span></div>
      <div class="row">${G.raceNos.map(n=>badge(n,"sm")).join("")}<div style="flex:1;min-width:0"><h2>${esc(G.label)}</h2><div class="muted">${raceRange(G.raceNos)}, ${plural(G.heats.length,"heat")}, timed final</div></div><span class="chip final">Final</span></div>
      <div class="podium">${top.map(r=>`<div class="pr">${medal(r.place)}<div style="min-width:0"><b>${esc(pname(r.p))}</b><span class="htag">${hdot(r.p.h)}${esc(houseName(r.p.h))}</span>${r.tag?` <span class="tag ${r.tag==="NEW RECORD"?"rec":"eq"}">${r.tag}</span>`:""}</div><span class="t">${fmtTime(r.eff)}</span></div>`).join("")||`<p class="muted">No finishers.</p>`}</div>
      ${G.record&&!G.recordNote?`<div class="muted" style="font-size:.9rem">${recordLine(G)}</div>`:""}
      <div class="row"><button type="button" class="btn" data-act="aprev" ${A.a.idx>0?"":"disabled"}>&lt; Earlier result</button><button type="button" class="btn navy big" data-act="anext" style="flex:1" ${more>0?"":"disabled"}>${more>0?"Next result":"Waiting for the next result"}</button></div></div>`;
  }else card=`<div class="panel stack"><span class="label">Read out next</span><p class="muted" style="margin:0">Waiting for the first checked result. A result appears when every heat of a group has its times checked.</p></div>`;
  return `<div class="ann"><div class="stack">
      <div class="water"><span class="label">In the water now</span>${last?badge(last.race,"xl")+`<div><b style="font:800 1.25rem var(--font-display)">${esc(last.label)}</b><br><span style="color:var(--navy-muted)">Heat ${last.heat}</span></div>`:`<span>Nothing sent yet</span>`}</div>
      ${card}
    </div>
    <div class="stack"><div class="panel stack"><h3>Records broken today</h3>${brokenCards()}</div>
      <div class="panel stack"><div class="row" style="justify-content:space-between"><h3>House standings</h3>${statusChip()}</div>${standings()}</div>
      <div class="panel stack"><h3>Program</h3>${programPanel(last)}</div></div>
  </div>`;
}

/* ---------- Results ---------- */
function resultGroups(){
  const f=A.res;const out=[];
  for(const e of A.R.events){
    const G=A.R.groups.get(e.key);if(!G)continue;
    if(f.sex!=="all"&&e.x!==f.sex&&e.x!=="X")continue;
    if(f.type!=="all"&&e.k!==f.type)continue;
    if(f.age!=="all"&&!(e.g===f.age||(TYPE[e.k].gk==="band"&&BAND_OF[f.age]===e.g)))continue;
    out.push(G);
  }
  return out;
}
function filtersBar(){
  const f=A.res;
  return `<div class="row" style="margin-bottom:12px">
    <div class="tabs" style="margin:0">${[["all","All"],["F","Girls"],["M","Boys"]].map(([k,l])=>`<button type="button" data-act="rf" data-f="sex" data-v="${k}" aria-pressed="${f.sex===k}">${l}</button>`).join("")}</div>
    <select id="rfType" aria-label="Race"><option value="all">All races</option>${TYPES.map(t=>`<option value="${t.k}" ${f.type===t.k?"selected":""}>${esc(t.name)}</option>`).join("")}</select>
    <select id="rfAge" aria-label="Age"><option value="all">All ages</option>${AGE_GROUPS.map(a=>`<option value="${a}" ${f.age===a?"selected":""}>${esc(grpName(a))}</option>`).join("")}</select>
  </div>`;
}
function renderResults(){
  const f=A.res;
  const tabs=`<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="tabs" style="margin:0">${[["race","Race results"],["hris","HRIS Team List"],["news","Newsletter draft"]].map(([k,l])=>`<button type="button" data-act="rtab" data-v="${k}" aria-pressed="${f.tab===k}">${l}</button>`).join("")}</div>
    <div class="row">${statusChip()}<button type="button" class="btn" data-act="csv">Export CSV</button></div></div>`;
  if(f.tab==="news")return tabs+renderNews();
  const gs=resultGroups();
  if(f.tab==="hris"){
    const ind=gs.filter(G=>!TYPE[G.k].nopts);
    return tabs+filtersBar()+`<div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap"><table><thead><tr><th>Race</th><th>1st</th><th>2nd</th><th>Status</th></tr></thead><tbody>
    ${ind.length?ind.map(G=>{const top=G.rows.filter(r=>r.hris);const cell=i=>top[i]?`${hdot(top[i].p.h)} ${esc(pname(top[i].p))} <span class="muted">${fmtTime(top[i].eff)}</span>`:`<span class="muted">Spot open</span>`;
      return `<tr><td><b>${esc(G.label)}</b></td><td>${cell(0)}</td><td>${cell(1)}</td><td><span class="chip ${G.final?"final":"prov"}">${G.status}</span></td></tr>`}).join(""):`<tr><td colspan="4" class="muted">No results yet.</td></tr>`}
    </tbody></table></div></div><p class="muted" style="font-size:.88rem">Top 2 in every race and group, relays included (top 2 teams). Their times are the seed times.</p>`;
  }
  return tabs+filtersBar()+`<div class="stack">${gs.length?gs.map(G=>`<article class="gcard"><div class="ghead"><h3>${esc(G.label)}</h3><span class="meta">${raceRange(G.raceNos)}, ${plural(G.heats.length,"heat")}, timed final${G.record?" · "+recordLine(G):""}</span><span class="chip ${G.final?"final":"prov"}">${G.status}</span></div>
     ${G.recordNote?`<div class="recbox"><b>Records broken or equalled in this race:</b> ${G.recordNote.rows.map(r=>`${esc(pname(r.p))} (${esc(houseName(r.p.h))}) ${fmtTime(r.eff)}`).join(", ")}. ${G.recordNote.kind==="new"?`Old record ${fmtTime(G.recordNote.old.t)}, ${esc((G.recordNote.old.holders||[]).map(x=>x.n+" "+(x.y||"")).join(" and "))}.`:`Shares the record with ${esc((G.recordNote.old.holders||[]).map(x=>x.n+" "+(x.y||"")).join(" and "))}.`}${G.final?"":" Provisional until all heats are checked."}</div>`:G.record?`<div class="recbox" style="border-left-color:var(--line);background:var(--sunk)">No records broken</div>`:""}
     ${overallTable(G,{pink:false})}</article>`).join(""):`<div class="panel muted">No results match these filters yet.</div>`}</div>`;
}
function newsText(){
  const R=A.R;const yr=(A.cfg.date||"2027").slice(0,4);const lead=R.houseRank[0];
  const P=[];
  P.push((lead&&lead.total?lead.n+" wins the "+yr+" Swimming Carnival":"Swimming Carnival "+yr).toUpperCase());
  const swimmers=new Set();for(const G of R.groups.values())for(const r of G.rows)if(!r.p.team&&r.st!=="wait")swimmers.add(r.id);
  P.push(`Our ${yr} Swimming Carnival at ${A.cfg.pool||"the pool"} saw ${swimmers.size} students swim in ${R.heats.length} races, from the 50 m butterfly to the relays. Thank you to every student who got in the water and had a go.`);
  if(lead&&lead.total){const rest=R.houseRank.slice(1).map(h=>h.n+" ("+fmtPts(h.total)+")");P.push(`In the house competition, ${lead.n} took first place with ${fmtPts(lead.total)} points, ahead of ${rest.join(" and ")}.`)}
  const ch=[];
  for(const ag of AGE_GROUPS)for(const x of ["F","M"]){const c=R.champs[ag+"|"+x];if(!c||!c.winners.length)continue;
    ch.push(`${grpName(ag)} ${x==="F"?"girls":"boys"}: ${c.winners.map(w=>pname(w.p)+" ("+houseName(w.p.h)+")").join(" and ")}${c.runners.length?", runner up "+c.runners.map(w=>pname(w.p)).join(" and "):""}.`)}
  if(ch.length){P.push("Congratulations to our age champions:");P.push(ch.join("\n"))}
  const rec=R.broken.filter(G=>G.final);
  if(rec.length)P.push("Records: "+rec.map(G=>G.recordNote.rows.map(r=>pname(r.p)).join(" and ")+(G.recordNote.kind==="new"?" set a new record":" equalled the record")+" in the "+G.label+" ("+fmtTime(G.recordNote.rows[0].eff)+")").join(". ")+".");
  P.push("The top two swimmers in each race have been named in the HRIS Team List. Team details will be sent home soon.");
  P.push("Thank you to the staff who marshalled, judged, timed and recorded, and to the parents who came along to cheer.");
  return P.join("\n\n");
}
function renderNews(){
  return `<div class="panel stack" style="max-width:860px">${A.R.finalCount<A.R.events.length?`<div class="msg warn">Some results are still provisional. Check the article again once everything is final.</div>`:""}
    <p class="muted" style="margin:0">A draft written from the results. Edit it here, then copy it into the newsletter. Check every student named has publishing consent.</p>
    <div class="row"><button type="button" class="btn primary" data-act="newscopy">Copy article</button></div>
    <textarea id="newsText" style="min-height:420px;font-family:var(--font-body);font-size:1rem;line-height:1.6">${esc(A.newsEdit!=null?A.newsEdit:newsText())}</textarea></div>`;
}
async function exportCsv(){
  const R=A.R;const cell=v=>{v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const lines=[["Race","Heat","Lane","Event","Sex","Group","Surname","First name","House","Recorded time","Result time","Status","Place","Points","HRIS","Record"].join(",")];
  for(const G of R.groups.values())for(const r of G.rows){
    const t=TYPE[G.k];
    lines.push([r.race,r.heat,r.lane,t.name,sexName(G.x)||"Mixed",grpName(G.g),r.p.team?r.p.name:r.p.s,r.p.team?"":r.p.f,houseName(r.p.h),fmtTime(r.rec),fmtTime(r.eff),r.st,r.place||"",r.place?r.pts:0,r.hris?"Yes":"",r.tag||""].map(cell).join(","));
  }
  lines.push("");lines.push("House,Individual,Relays,Total");
  for(const h of R.houseRank)lines.push([h.n,h.indiv,h.relay,h.total].join(","));
  lines.push("");lines.push("Age group,Sex,Champion,Points,Runner up,Points");
  for(const ag of AGE_GROUPS)for(const x of ["F","M"]){const c=R.champs[ag+"|"+x];lines.push([grpName(ag),sexName(x),c.winners.map(w=>pname(w.p)).join(" and "),c.winners[0]?c.winners[0].pts:"",c.runners.map(w=>pname(w.p)).join(" and "),c.runners[0]?c.runners[0].pts:""].map(cell).join(","))}
  const data=lines.join("\n");const name="CCAS swimming results "+new Date().toISOString().slice(0,10)+".csv";
  let dl=null;try{dl=await window.claude.use("downloads")}catch(e){}
  if(dl){try{await dl.save({filename:name,data});return}catch(e){if(e&&e.code==="cancelled")return}}
  try{await navigator.clipboard.writeText(data);toast("Results copied. Paste them into Excel.")}catch(e){toast("Export is not available in this view.")}
}

/* ---------- Houses ---------- */
function renderHouses(){
  const R=A.R;const max=Math.max(1,...R.houseRank.map(h=>h.total));
  const cards=R.houseRank.map((h,i)=>`<div class="hcard" style="--hc:${hc(h.c)}"><div class="row" style="justify-content:space-between">${medal(i+1)}<span class="htag">${hdot(h.c)}<b style="font:800 1.2rem var(--font-display)">${esc(h.n)}</b></span></div>
    <div class="pts">${fmtPts(h.total)}</div><div class="barw"><div class="bar" style="width:${Math.round(h.total/max*100)}%"></div></div>
    <div class="muted" style="font-size:.88rem">Individual ${fmtPts(h.indiv)}, ${h.relay?"relays "+fmtPts(h.relay):"relays not swum yet"}</div></div>`).join("");
  const rowsAge=AGE_GROUPS.map(a=>{const vals=HOUSES.map(h=>R.house[h.c].byAge[a]);const top=Math.max(...vals);return `<tr><td>${esc(grpName(a))}</td>${vals.map(v=>`<td class="num" style="${v===top&&v>0?"font-weight:800":""}">${fmtPts(v)}</td>`).join("")}</tr>`}).join("");
  const relayVals=HOUSES.map(h=>R.house[h.c].relay);const rtop=Math.max(...relayVals);
  const champ=AGE_GROUPS.map(a=>`<div class="panel stack" style="gap:8px;padding:12px"><div class="row" style="justify-content:space-between"><b>${esc(grpName(a))}</b></div>
    ${["F","M"].map(x=>{const c=R.champs[a+"|"+x];return `<div><div class="row" style="justify-content:space-between"><span class="label">${sexName(x)}</span><span class="chip ${c.done>=c.of?"final":"prov"}">${c.done>=c.of?"Final":"Provisional, "+c.done+" of "+c.of}</span></div>
      ${c.winners.length?c.winners.map(w=>`<div class="champ">${medal(1)}<span>${esc(pname(w.p))}</span>${hdot(w.p.h)}<span></span><span class="muted" style="font-size:.85rem">${fmtPts(w.pts)} points</span></div>`).join(""):`<div class="muted" style="font-size:.88rem">No points yet</div>`}
      ${c.runners.map(w=>`<div class="champ">${medal(2)}<span>${esc(pname(w.p))}</span>${hdot(w.p.h)}<span></span><span class="muted" style="font-size:.85rem">${fmtPts(w.pts)} points</span></div>`).join("")}</div>`}).join("")}</div>`).join("");
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>House points</h2>${statusChip()}</div>
    <div class="hcards" style="margin-bottom:16px">${cards}</div>
    <div class="grid2"><div class="panel stack"><h3>Points by age group</h3><div class="tablewrap"><table><thead><tr><th>Age group</th>${HOUSES.map(h=>`<th class="num">${hdot(h.c)}</th>`).join("")}</tr></thead><tbody>${rowsAge}
      <tr><td>Relays</td>${relayVals.map(v=>`<td class="num" style="${v===rtop&&v>0?"font-weight:800":""}">${fmtPts(v)}</td>`).join("")}</tr>
      <tr><td><b>Total</b></td>${HOUSES.map(h=>`<td class="num"><b>${fmtPts(R.house[h.c].total)}</b></td>`).join("")}</tr></tbody></table></div>
      <p class="muted" style="margin:0;font-size:.85rem">Girls and boys together. 200 m freestyle points count in each swimmer's own age group.</p></div>
      <div class="stack"><h3>Age champions</h3><div class="grid2" style="gap:10px">${champ}</div>
      <p class="muted" style="margin:0;font-size:.85rem">Most individual points in each age group, relays not included. Equal points are joint champions.</p></div></div>`;
}

/* Announcer program: each race type in swim order with its start time and how many results are final (decision 96) */
function programPanel(last){
  const R=A.R;const prog=(A.cfg.program||DEFAULT_CONFIG.program).filter(p=>TYPE[p.k]&&p.on);
  const rows=prog.map(p=>{const t=TYPE[p.k];const evs=R.events.filter(e=>e.k===p.k);
    const fin=evs.filter(e=>{const G=R.groups.get(e.key);return G&&G.final}).length;
    const started=evs.some(e=>R.groups.has(e.key));
    const now=last&&last.k===p.k;
    const st=now?`<span class="chip info">In the water</span>`:fin===evs.length&&evs.length?`<span class="chip final">Done</span>`:started?`<span class="chip prov">${fin} of ${evs.length} final</span>`:`<span class="chip">To come</span>`;
    return `<tr style="${now?"background:var(--warn-bg)":""}"><td class="num" style="white-space:nowrap">${esc(t.start)}</td><td><b>${esc(t.name)}</b><div class="muted" style="font-size:.82rem">${esc(GROUPS[t.gk].map(grpName).join(", "))}${t.relay?", girls and boys":""}</div></td><td style="text-align:right">${st}</td></tr>`}).join("");
  return `<div class="tablewrap"><table><tbody>${rows}</tbody></table></div><p class="muted" style="margin:0;font-size:.82rem">Start times are a guide. Race numbers follow the order the marshal sends.</p>`;
}
