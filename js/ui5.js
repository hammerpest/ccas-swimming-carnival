/* ===== Carnival Organiser ===== */
const SECS=[["details","Carnival details"],["students","Students"],["program","Program"],["points","Points"],["limits","Odd-time limits"],["records","Records"],["export","Export"],["lock","Lock and new carnival"]];
function secStatus(k){
  const c=A.cfg;
  if(k==="details")return c.dateConfirmed?{t:c.date}:{t:"Date not confirmed yet",a:1};
  if(k==="students"){const n=students().length;return n?{t:n+" students loaded"}:{t:"No list loaded yet",a:1}}
  if(k==="program")return {t:A.R.events.length+" races on the program"};
  if(k==="points"){const P=Object.assign({},DEFAULT_CONFIG.points,c.points||{});return {t:[P.p1,P.p2,P.p3,P.rest].join(", ")}}
  if(k==="limits")return {t:"By stroke and distance"};
  if(k==="records")return A.records.length?{t:A.records.length+" records"}:{t:"Waiting for the CCAS records list",a:1};
  if(k==="export")return {t:"No automatic backups. Export after."};
  if(k==="lock")return c.locked?{t:"Results locked",a:1}:{t:"Results open"};
}
function renderOrganiser(){
  const sec=A.o.sec;
  const nav=SECS.map(([k,l],i)=>{const s=secStatus(k);return `<button type="button" data-act="osec" data-v="${k}" aria-pressed="${sec===k}"><b>${i+1}. ${l}</b><span class="${s.a?"amber":""}">${esc(s.t)}</span></button>`}).join("");
  const body=(OSEC[sec]||(()=>""))();
  return `${lockBar()}<div class="org"><nav class="secnav" aria-label="Organiser sections">${nav}</nav><div class="panel stack" style="min-width:0">${body}</div></div>`;
}
const OSEC={};
function progList(){return (A.cfg.program||DEFAULT_CONFIG.program).filter(p=>TYPE[p.k])}
OSEC.details=()=>{const c=A.cfg;
  return `<h2>Carnival details</h2><div class="fields">
    <label style="grid-column:1/-1">Carnival name<input id="cName" value="${esc(c.name)}"></label>
    <label>Date<input id="cDate" type="date" value="${esc(c.date)}"></label>
    <label style="justify-content:flex-end"><span class="row" style="gap:8px;color:var(--ink);min-height:48px"><input type="checkbox" id="cDateOk" ${c.dateConfirmed?"checked":""} style="width:22px;height:22px"> Date confirmed</span></label>
    <label>Age as at<input id="cAge" type="date" value="${esc(c.ageDate)}"></label>
    <label>Pool<input id="cPool" value="${esc(c.pool)}"></label>
    <label>Pool length<select id="cLen"><option value="50" ${c.poolLen!=="25"?"selected":""}>50 m (LCM)</option><option value="25" ${c.poolLen==="25"?"selected":""}>25 m (SCM)</option></select></label>
    <label>Lanes<span class="stepper"><button type="button" class="btn small" data-act="olanes" data-d="-1" aria-label="Fewer lanes">-</button><b id="cLanes">${Number(c.lanes)||8}</b><button type="button" class="btn small" data-act="olanes" data-d="1" aria-label="More lanes">+</button></span></label>
  </div><div><button type="button" class="btn primary" data-act="osavedetails">Save details</button></div>
  <hr style="border:0;border-top:1px solid var(--line);width:100%">
  <h3>PINs</h3><p class="muted" style="margin:0">Each job has its own PIN and opens only that job. The Announcer PIN also opens Results and Houses. The Carnival Organiser PIN opens every job. Every PIN must be different.</p>
  <div class="tablewrap"><table><thead><tr><th>Job</th><th>PIN now</th><th>New PIN</th></tr></thead><tbody>${PIN_ROLES.map(([k,n,d])=>{const changed=c.pins&&c.pins[k]&&c.pins[k]!==DEFAULT_PINS[k];return `<tr><td><b>${esc(n)}</b></td><td>${changed?`<span class="chip final">Changed</span>`:`<span class="chip prov">Test PIN ${d}</span>`}</td><td><span class="row" style="gap:6px;flex-wrap:nowrap"><input id="pin-${k}" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="New PIN for ${esc(n)}" style="width:7em"><button type="button" class="btn small" data-act="opin" data-v="${k}">Change</button></span></td></tr>`}).join("")}</tbody></table></div>
  <hr style="border:0;border-top:1px solid var(--line);width:100%">
  <div class="row">${badge(A.counter)}<span class="muted">Next race number. It only goes back to 1 with Start a new carnival.</span></div>`};
OSEC.students=()=>{
  const all=students();const cnt={};for(const s of all){cnt[s.x+s.g]=(cnt[s.x+s.g]||0)+1}
  const pv=A.o.preview;
  return `<h2>Students</h2>
   ${all.length?`<div class="tablewrap"><table><thead><tr><th></th>${AGE_GROUPS.map(a=>`<th class="num">${esc(grpName(a))}</th>`).join("")}<th class="num">Total</th></tr></thead><tbody>${["F","M"].map(x=>`<tr><td><b>${sexName(x)}</b></td>${AGE_GROUPS.map(a=>`<td class="num">${cnt[x+a]||0}</td>`).join("")}<td class="num"><b>${AGE_GROUPS.reduce((t,a)=>t+(cnt[x+a]||0),0)}</b></td></tr>`).join("")}</tbody></table></div>
     <p class="muted" style="margin:0">${all.length} students loaded${A.extras.length?", including "+A.extras.length+" added on the day":""}. Houses: ${HOUSES.map(h=>h.n+" "+all.filter(s=>s.h===h.c).length).join(", ")}.</p>`:`<div class="msg warn">No student list loaded yet.</div>`}
   <div class="msg info">Columns: Surname, Firstname, House (B, J or N), Sex (F or M), DOB. The date of birth is used on this computer only to work out the age group. It is never saved or sent.</div>
   <textarea id="oText" placeholder="Paste the student list here (from Excel)">${esc(A.o.text)}</textarea>
   <div class="row"><label class="btn" for="oFile">Choose CSV file</label><input id="oFile" type="file" accept=".csv,.txt,.tsv" hidden><button type="button" class="btn" data-act="ocheck">Check list</button>
     <button type="button" class="btn" data-act="otest">Load the 620 test students</button></div>
   ${pv?`<div class="stack"><div class="row"><span class="chip final">${pv.ok.length} ready</span><span class="chip ${pv.bad.length?"bad":"final"}">${pv.bad.length?pv.bad.length+" with problems":"No problems"}</span></div>
     ${pv.bad.length?`<div class="tablewrap"><table><thead><tr><th>Row</th><th>Surname</th><th>First name</th><th>House</th><th>Sex</th><th>DOB</th><th>Problem</th></tr></thead><tbody>${pv.bad.slice(0,50).map(b=>`<tr class="probrow"><td>${b.row.n}</td><td>${esc(b.row.s)}</td><td>${esc(b.row.f)}</td><td>${esc(b.row.h)}</td><td>${esc(b.row.x)}</td><td>${esc(b.row.dob)}</td><td><b>${esc(b.probs.join(" "))}</b></td></tr>`).join("")}</tbody></table></div><p class="muted" style="margin:0">Fix these rows in the file and paste it again, or import the rows that are ready now.</p>`:""}
     <div class="tablewrap"><table><thead><tr><th>Surname</th><th>First name</th><th>House</th><th>Sex</th><th>Age group</th></tr></thead><tbody>${pv.ok.slice(0,6).map(s=>`<tr><td>${esc(s.s)}</td><td>${esc(s.f)}</td><td>${hdot(s.h)}</td><td>${s.x}</td><td>${esc(grpName(s.g))}</td></tr>`).join("")}</tbody></table></div>
     <div><button type="button" class="btn primary" data-act="oimport" ${pv.ok.length?"":"disabled"}>Import ${pv.ok.length} students</button></div></div>`:""}
   <p class="muted" style="margin:0;font-size:.88rem">Importing replaces the current list. "+ Not on the list" still works on the day.</p>`};
OSEC.program=()=>{const prog=progList();
  return `<h2>Program</h2><p class="muted" style="margin:0">Swim order for the day. Girls then boys in each group. Race numbers on the day follow whatever the marshal sends.</p>
  <div class="tablewrap"><table><thead><tr><th>Order</th><th>Start</th><th>Race</th><th>Groups</th><th class="num">Races</th><th>On</th></tr></thead><tbody>
  ${prog.map((p,i)=>{const t=TYPE[p.k];const n=GROUPS[t.gk].length*(t.nosex?1:2);return `<tr><td><div class="row" style="gap:4px;flex-wrap:nowrap"><button type="button" class="btn small" data-act="omove" data-i="${i}" data-d="-1" ${i?"":"disabled"} aria-label="Move up">&uarr;</button><button type="button" class="btn small" data-act="omove" data-i="${i}" data-d="1" ${i<prog.length-1?"":"disabled"} aria-label="Move down">&darr;</button></div></td>
    <td>${esc(t.start)}</td><td><b>${esc(t.name)}</b>${t.optional?` <span class="muted">(if time allows)</span>`:""}</td><td>${esc(GROUPS[t.gk].map(grpName).join(", "))}</td><td class="num">${n}</td>
    <td><button type="button" class="switch" role="switch" aria-checked="${p.on}" data-act="oswitch" data-i="${i}" aria-label="${esc(t.name)} on or off"></button></td></tr>`}).join("")}
  </tbody></table></div><p style="margin:0"><b>${A.R.events.length} races on the program</b></p>
  <p class="muted" style="margin:0;font-size:.88rem">Printing the program and blank lane cards comes with the GitHub version; the Claude page cannot open the print dialog.</p>`};
OSEC.points=()=>{const P=Object.assign({},DEFAULT_CONFIG.points,A.cfg.points||{});
  return `<h2>Points</h2><div class="fields">
    <label>1st<input id="pt1" type="number" min="0" value="${P.p1}"></label><label>2nd<input id="pt2" type="number" min="0" value="${P.p2}"></label>
    <label>3rd<input id="pt3" type="number" min="0" value="${P.p3}"></label><label>4th and below, finished<input id="ptr" type="number" min="0" value="${P.rest}"></label></div>
  <p class="muted" style="margin:0">DQ and DNS get 0. Placegetters get only their place points. Relay teams use the same scale, A and B teams alike, for house points only. Age champions count the 5 age races plus the 200 m freestyle. Relay points count for house totals only, never for individual points or age champions. Equal times share the place and split the points.</p>
  <div><button type="button" class="btn primary" data-act="osavepoints">Save points</button></div>`};
OSEC.limits=()=>{const L=Object.assign({},DEFAULT_LIMITS,A.cfg.limits||{});
  return `<h2>Odd-time limits</h2><p class="muted" style="margin:0">A time outside these asks the recorder to check it (Keep or Fix). Type digits, for example 2600 for 26.00 or 13000 for 1:30.00.</p>
  <div class="tablewrap"><table><thead><tr><th>Race</th><th>Check if faster than</th><th>Check if slower than</th></tr></thead><tbody>
  ${TYPES.map(t=>L[t.k]?`<tr><td>${esc(t.name)}</td><td><input class="timein" id="lf-${t.k}" value="${fmtTime(L[t.k][0])}"></td><td><input class="timein" id="ls-${t.k}" value="${fmtTime(L[t.k][1])}"></td></tr>`:`<tr><td>${esc(t.name)}</td><td colspan="2" class="muted">No check</td></tr>`).join("")}
  </tbody></table></div><p class="muted" style="margin:0">Always checked as well: a seconds part of 60 or more without minutes (7512), and too many or too few digits.</p>
  <div><button type="button" class="btn primary" data-act="osavelimits">Save limits</button></div>`};
OSEC.records=()=>{
  const rows=A.records.slice().sort((a,b)=>a.key.localeCompare(b.key));
  const fromNow=A.R.broken.filter(G=>G.final);
  return `<h2>Records</h2>${A.records.length?"":`<div class="msg warn">Waiting for the CCAS records list.</div>`}
  <div class="tablewrap"><table><thead><tr><th>Race</th><th>Group</th><th class="num">Time</th><th>Holder</th><th>House</th><th>Year</th><th></th></tr></thead><tbody>
  ${rows.map(rc=>{const {k,x,g}=splitKey(rc.key);return `<tr><td>${esc(TYPE[k]?TYPE[k].name:k)}</td><td>${esc((sexName(x)+" "+grpName(g)).trim())}</td><td class="num">${fmtTime(rc.t)}</td><td>${esc((rc.holders||[]).map(h=>h.n).join(" and "))}</td><td>${(rc.holders||[]).map(h=>h.h?hdot(h.h):"").join(" ")}</td><td>${esc((rc.holders||[]).map(h=>h.y).join(", "))}</td><td><button type="button" class="btn small danger" data-act="orecdel" data-k="${esc(rc.key)}">Remove</button></td></tr>`}).join("")||`<tr><td colspan="7" class="muted">No records yet.</td></tr>`}
  ${fromNow.map(G=>`<tr style="background:var(--ok-bg)"><td>${esc(TYPE[G.k].name)}</td><td>${esc(sexName(G.x)+" "+grpName(G.g))}</td><td class="num">${fmtTime(G.recordNote.rows[0].eff)}</td><td>${esc(G.recordNote.rows.map(r=>pname(r.p)).join(" and "))}</td><td>${G.recordNote.rows.map(r=>hdot(r.p.h)).join(" ")}</td><td>${(A.cfg.date||"").slice(0,4)}</td><td><span class="chip final">This carnival</span></td></tr>`).join("")}
  </tbody></table></div>
  <p class="muted" style="margin:0;font-size:.88rem">Records broken or equalled this carnival show in green once their race is Final. Start a new carnival asks whether to bring them in.</p>
  <h3>+ Add one</h3><div class="fields">
    <label>Race<select id="rcK">${TYPES.filter(t=>!t.nopts).map(t=>`<option value="${t.k}">${esc(t.name)}</option>`).join("")}</select></label>
    <label>Sex<select id="rcX"><option value="F">Girls</option><option value="M">Boys</option></select></label>
    <label>Group<select id="rcG">${[...GROUPS.age,...GROUPS.band,"O"].map(g=>`<option value="${g}">${esc(grpName(g))}</option>`).join("")}</select></label>
    <label>Time (digits)<input id="rcT" inputmode="numeric" placeholder="3610"></label>
    <label>Holder<input id="rcN" placeholder="First and last name"></label>
    <label>House<select id="rcH"><option value="">Not known</option>${HOUSES.map(h=>`<option value="${h.c}">${h.n}</option>`).join("")}</select></label>
    <label>Year<input id="rcY" inputmode="numeric" placeholder="2019"></label></div>
  <div class="row"><button type="button" class="btn primary" data-act="orecadd">Add record</button><button type="button" class="btn" data-act="orectest">Add made-up test records</button></div>
  <h3>Upload records list</h3><p class="muted" style="margin:0">Paste rows: Race, Sex, Group, Time, Holder, House, Year. For example: 50 m backstroke, F, 14, 36.10, Jess Moran, B, 2019. The real layout will be matched once the CCAS list arrives.</p>
  <textarea id="rcPaste" style="min-height:100px"></textarea><div><button type="button" class="btn" data-act="orecpaste">Add these records</button></div>`};
OSEC.export=()=>`<h2>Export</h2>
  <div class="panel stack" style="background:var(--sunk);border-color:transparent"><h3>Results backup (CSV)</h3><p class="muted" style="margin:0">Every heat, time, place and points, house totals and age champions. There are no automatic backups, so export after the carnival.</p><div><button type="button" class="btn primary" data-act="csv">Export CSV</button></div></div>
  <div class="panel stack" style="background:var(--sunk);border-color:transparent"><h3>Meet Manager file (RE1)</h3><p class="muted" style="margin:0">Load the original student list with DOB on this computer, then write the RE1 file. DOB is matched here and nothing is kept.</p><div><button type="button" class="btn" disabled>Write RE1 file</button></div><p class="muted" style="margin:0;font-size:.88rem">Waiting for the sample RE1 file from the next level, so the layout matches exactly.</p></div>`;
OSEC.lock=()=>`<h2>Lock and new carnival</h2>
  <div class="row" style="justify-content:space-between"><div><b>Lock results</b><p class="muted" style="margin:0">Locked: every job can look but nothing can be changed. Unlock to undo.</p></div><button type="button" class="switch" role="switch" aria-checked="${!!A.cfg.locked}" data-act="olock" aria-label="Lock results"></button></div>
  <div class="panel stack" style="border:2px solid var(--bad)"><h3 style="color:var(--bad)">Start a new carnival</h3>
   <p style="margin:0">Keeps this whole year (students, heats, places, times, slip photos and results) as a look-only past year, then starts next year empty with the race number back to 1. Settings, PINs, program, points, limits and records carry over.</p>
   <p style="margin:0;font-weight:700">Export the CSV as well, as a backup.</p>
   <div><button type="button" class="btn redfill" data-act="onew">Start a new carnival</button></div></div>
  ${A.o.newMsg?`<div class="msg ok">${esc(A.o.newMsg)}</div>`:""}`;
MODALS.newCarnival=M=>M.step===1?`<h2>Start a new carnival</h2>
  <div><b>Kept as the ${esc((A.cfg.date||"2027").slice(0,4))} carnival (look only):</b> all ${students().length} students, ${A.heats.length} heats with their places, times and slip photos, results and records. Open it any time from Change year.</div>
  <div><b>Then the new ${+((A.cfg.date||"2027").slice(0,4))+1} carnival starts empty:</b> no students or heats, race number back to 1. Carnival details, PINs, program, points, odd-time limits and records carry over.</div>
  <label class="stack" style="gap:4px;font-weight:600">Type the organiser PIN<input id="ncPin" inputmode="numeric" maxlength="4" autocomplete="off" style="width:8em"></label>
  ${M.err?`<div class="msg bad">${esc(M.err)}</div>`:""}
  <div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn redfill" data-act="onew1">Keep this year and continue</button></div>`
 :`<h2>Bring in the updated records?</h2>${M.list.length?`<p style="margin:0">Records broken or equalled this carnival:</p><ul style="margin:0">${M.list.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p style="margin:0">No records were broken or equalled this carnival.</p>`}
  <div class="acts"><button type="button" class="btn" data-act="onew2" data-v="no">No, I will upload a list</button><button type="button" class="btn primary" data-act="onew2" data-v="yes">Yes, bring them in</button></div>`;
async function saveCfg(patch,msg){
  const c=Object.assign({},A.cfg,patch);
  A.cfg=c;recompute();
  const r=await w0(()=>A.store.set("config/main",c));
  if(r){toast(msg||"Saved");render()}
}
async function w0(fn){if(A.past){toast("Past years are look only.");return null}try{const r=await fn();if(r&&r.queued)toast("Saved on this device. Sends when there is signal.");return r||{ok:true}}catch(e){toast("Not saved. Calling Tech Boy to help you. Enjoy grandstand duty next year.");return null}}
async function newCarnival(bring){
  const yr=(A.cfg.date||"2027").slice(0,4);
  let recs=A.records.slice();
  if(bring){for(const G of A.R.broken.filter(G=>G.final)){const holders=G.recordNote.rows.map(r=>({n:pname(r.p),h:r.p.h,y:yr}));
    const old=G.recordNote.old;recs=recs.filter(x=>x.key!==G.key);recs.push({key:G.key,t:G.recordNote.rows[0].eff,holders:G.recordNote.kind==="equal"?[...(old.holders||[]),...holders]:holders})}}
  /* keep the whole year first (decision 95) */
  toast("Keeping the "+yr+" carnival...");
  const strip=o=>JSON.parse(JSON.stringify(o));
  const a1=await w0(()=>A.store.set("archive/"+yr+"-config",{cfg:strip(A.cfg),records:strip(A.records)}));
  const a2=a1&&await w0(()=>A.store.set("archive/"+yr+"-roster",{F:strip(A.roster.F),M:strip(A.roster.M),extras:strip(A.extras)}));
  const a3=a2&&await w0(()=>A.store.set("archive/"+yr+"-data",{heats:strip(A.heats),times:strip(A.times),finish:strip(A.finish),slips:strip(A.slips),counter:A.counter}));
  if(!a3){A.modal=null;toast("The "+yr+" carnival could not be kept, so nothing was cleared. Try again.");render();return}
  for(const id of Object.keys(A.slips)){try{const ph=await A.store.get("photos/"+id);if(ph)await A.store.set("photos/y"+yr+"-"+id,ph)}catch(e){}}
  await w0(()=>A.store.set("years/"+yr,{year:yr,name:A.cfg.name,date:A.cfg.date,archivedAt:Date.now(),heats:A.heats.length,students:students().length}));
  const ids=A.heats.map(h=>h._id||rid(h.race));
  const jobs=[];
  for(const id of ids){jobs.push("heats/"+id,"times/"+id,"finish/"+id,"slips/"+id,"photos/"+id)}
  for(const id of Object.keys(A.times))jobs.push("times/"+id);
  for(const id of Object.keys(A.finish))jobs.push("finish/"+id);
  for(const id of Object.keys(A.slips))jobs.push("slips/"+id,"photos/"+id);
  for(const e of A.extras)jobs.push("extras/"+e.id);
  jobs.push("roster/F","roster/M");
  const uniq=[...new Set(jobs)];
  toast("Clearing...");
  for(const p of uniq){try{await A.store.del(p)}catch(e){}}
  await A.store.set("counter/race",{next:1,at:Date.now()});
  await A.store.set("records/all",{list:recs});
  const ny=String(+yr+1);
  await A.store.set("config/main",Object.assign({},A.cfg,{locked:false,lockedAt:null,date:ny+(A.cfg.date||"2027-02-10").slice(4),dateConfirmed:false,ageDate:yr+"-12-31",name:String(A.cfg.name||"").includes(yr)?A.cfg.name.replace(yr,ny):A.cfg.name}));
  A.heats=[];A.times={};A.finish={};A.slips={};A.extras=[];A.roster={F:[],M:[]};A.records=recs;A.counter=1;
  A.o.newMsg="The "+yr+" carnival is kept (look only, open it from Change year). The "+ny+" carnival is ready. Race number back to 1. Load the new student list in section 2 and check the date in section 1.";
  A.modal=null;recompute();render();
}
function parseRecordRows(text){
  const out=[];const bad=[];
  String(text||"").split(/\r?\n/).filter(l=>l.trim()).forEach((line,i)=>{
    const c=splitRow(line).map(s=>s.trim());if(i===0&&/race/i.test(c[0])&&/sex/i.test(c[1]||""))return;
    const t=TYPES.find(t=>t.name.toLowerCase()===String(c[0]).toLowerCase()||t.btn.toLowerCase()===String(c[0]).toLowerCase());
    const x=String(c[1]||"").toUpperCase().slice(0,1);let g=String(c[2]||"").replace(/\s*&\s*under|\+/gi,"").trim();
    const gm={junior:"J",intermediate:"I",senior:"S",open:"O"};g=gm[g.toLowerCase()]||g;
    const tm=parseTime(c[3]);
    if(!t||!["F","M"].includes(x)||tm.err){bad.push(i+1);return}
    out.push({key:groupKey(t.k,x,g),t:tm.cs,holders:[{n:c[4]||"",h:(c[5]||"").toUpperCase().slice(0,1),y:c[6]||""}]});
  });
  return {out,bad};
}
async function addRecords(list){
  const map=new Map(A.records.map(r=>[r.key,r]));for(const r of list)map.set(r.key,r);
  A.records=[...map.values()];recompute();
  const r=await w0(()=>A.store.set("records/all",{list:A.records}));if(r){toast(plural(list.length,"record")+" added");render()}
}

/* ===== render + actions ===== */
function render(){
  if(A.rendering)return;A.rendering=true;
  try{renderInner()}finally{A.rendering=false}
}
function renderInner(){
  if(!A.R)recompute();
  if(A.role==="org"&&!A.yearPicked)A.job=null;
  if(A.role&&A.role!=="org"&&(!A.job||!canOpen(A.job))){A.job=homeJob();ssSet("swim_job",A.job)}
  if(A.role==="org"&&A.job&&!canOpen(A.job==="organiser"?"org":A.job))A.job=null;
  renderHeader();
  const main=document.getElementById("main");
  let html="";
  if(!A.role||!A.job)html=renderHome();
  else if(A.job==="marshal")html=renderMarshal();
  else if(A.job==="judge")html=renderJudge();
  else if(A.job==="recorder")html=renderRecorder();
  else if(A.job==="slips")html=renderSlips();
  else if(A.job==="announcer")html=renderAnnouncer();
  else if(A.job==="results")html=lockBar()+renderResults();
  else if(A.job==="houses")html=renderHouses();
  else if(A.job==="organiser")html=A.role==="org"?renderOrganiser():renderHome();
  const sx=window.scrollX,sy=window.scrollY;
  const fid=document.activeElement&&document.activeElement.id;
  main.innerHTML=`<div class="wrap">${html}</div>`;
  document.getElementById("mod").innerHTML=modalHtml();
  if(fid){const el=document.getElementById(fid);if(el&&el.focus){el.focus();if(el.setSelectionRange&&el.type!=="number")try{el.setSelectionRange(el.value.length,el.value.length)}catch(e){}}}
  window.scrollTo(sx,sy);
  wireInputs();
}
function wireInputs(){
  const f=document.getElementById("mfilter");if(f){f.oninput=()=>{A.m.filter=f.value;render()}}
  const cam=document.getElementById("camin");if(cam)cam.onchange=e=>{const file=e.target.files[0];e.target.value="";onPhoto(file)};
  document.querySelectorAll("[data-time]").forEach(inp=>{
    inp.onfocus=()=>{inp.value=inp.value.replace(/[^0-9]/g,"");inp.select()};
    inp.onkeydown=async e=>{if(e.key==="Enter"){e.preventDefault();inp.dataset.saved="1";const l=inp.dataset.time;const all=[...document.querySelectorAll("[data-time]")];const i=all.findIndex(x=>x.dataset.time===l);const ok=await saveTime(l,inp.value);if(ok){const nx=document.querySelectorAll("[data-time]")[i+1];if(nx)nx.focus();else inp.blur();render();const n2=document.querySelectorAll("[data-time]")[i+1];if(n2)n2.focus()}}};
    inp.onchange=()=>{if(A.rendering||inp.dataset.saved)return;saveTime(inp.dataset.time,inp.value).then(ok=>{if(ok&&!A.rendering)render()})};
  });
  const t=document.getElementById("rfType");if(t)t.onchange=()=>{A.res.type=t.value;render()};
  const a=document.getElementById("rfAge");if(a)a.onchange=()=>{A.res.age=a.value;render()};
  const nt=document.getElementById("newsText");if(nt)nt.oninput=()=>{A.newsEdit=nt.value};
  const ot=document.getElementById("oText");if(ot)ot.oninput=()=>{A.o.text=ot.value;A.o.preview=null};
  const of=document.getElementById("oFile");if(of)of.onchange=e=>{const file=e.target.files[0];if(!file)return;const fr=new FileReader();fr.onload=()=>{A.o.text=String(fr.result);A.o.preview=parseStudents(A.o.text,A.cfg.ageDate);render()};fr.readAsText(file)};
}
const ACT={
  key:el=>pressKey(el.dataset.k),
  menu:()=>{A.menu=!A.menu;renderHeader()},
  goto:el=>goJob(el.dataset.job),
  signout:()=>{if(A.job==="marshal"&&A.m.phase==="lanes"&&Object.keys(A.m.lanes).length){A.modal={t:"leaveMarshal",to:null};A.menu=false;render();return}signOut()},
  closemodal:()=>{A.modal=null;render()},
  modalbg:(el,e)=>{if(e.target===el){A.modal=null;render()}},
  leaveok:()=>{const to=A.modal&&A.modal.to;A.modal=null;A.m.phase="start";A.m.lanes={};if(to)goJob(to);else signOut()},
  mpick:el=>{const m=A.m;m[el.dataset.f]=el.dataset.v;m.msg="";
    if(el.dataset.f==="k"){const t=TYPE[m.k];if(m.g&&!groupChoices(t).some(c=>c.g===m.g))m.g=null;if(t.gk!=="age"&&t.gk!=="band")m.g=groupChoices(t)[0].g;if(t.nosex)m.x=null}
    render()},
  mgo:()=>marshalGo(),
  mlane:el=>{const l=+el.dataset.l;A.m.open=A.m.open===l?null:l;A.m.cur=l;A.m.filter="";render()},
  mset:el=>{const l=+el.dataset.l;A.m.lanes[l]=el.dataset.id;const n=nextEmpty(l);A.m.cur=n||l;A.m.open=n;A.m.filter="";render()},
  mclear:el=>{delete A.m.lanes[+el.dataset.l];A.m.cur=+el.dataset.l;render()},
  mclose:()=>{A.m.open=null;render()},
  maddnew:el=>{A.modal={t:"addSwimmer",l:+el.dataset.l};render()},
  maddsave:el=>addSwimmer(+el.dataset.l),
  mback:()=>{if(Object.keys(A.m.lanes).length){A.modal={t:"leaveMarshal",to:"marshal"};render();return}finishMarshalRace()},
  mnext:async()=>{if(await sendHeat())render()},
  mnew:()=>{if(Object.keys(A.m.lanes).length){A.modal={t:"confirmHeat"};render()}else finishMarshalRace()},
  mconfirm:async()=>{A.modal=null;if(await sendHeat())finishMarshalRace();else render()},
  jtap:el=>{if(!locked())judgeTap(+el.dataset.l)},
  jdh:()=>{if(A.j.dh){A.j.dh=false;render();return}A.modal={t:"deadHeat"};render()},
  jdhok:()=>{A.j.dh=true;A.modal=null;render()},
  jundo:()=>judgeUndo(),
  jreset:()=>{const r=judgeRace();saveFinish(rid(r.race),[],[])},
  jnext:()=>judgeNext(false),
  jconfirm:()=>judgeNext(true),
  jlatest:()=>{A.j.race=raceList().slice(-1)[0].race;render()},
  jgoto:()=>{A.modal={t:"goRace",job:"judge"};render()},
  rgoto:()=>{A.modal={t:"goRace",job:"recorder"};render()},
  sgoto:()=>{A.modal={t:"goRace",job:"slips"};render()},
  pickrace:el=>{const n=+el.dataset.race;const j=el.dataset.job;if(j==="judge")A.j.race=n;else if(j==="recorder"){A.r.race=n;A.r.since=Date.now();announce()}else{A.s.race=n;A.s.err=null}A.modal=null;render()},
  rnext:()=>{A.r.race=A.r.race+1;A.r.since=Date.now();announce();render()},
  rlatest:()=>{A.r.race=raceList().slice(-1)[0].race;A.r.since=Date.now();announce();render()},
  rslip:()=>viewSlip(A.r.race),
  sreplace:()=>{const go=A.modal&&A.modal.go;A.modal=null;render();if(go)go()},
  rst:el=>{const r=recRace();const cur=(r.times[el.dataset.l]||{});const st=el.dataset.st;setLane(el.dataset.l,cur.st===st?{st:cur.t!=null?"ok":null}:{st,src:cur.src||"typed"})},
  rkeep:el=>setLane(el.dataset.l,{keep:true}),
  rfix:el=>{const r=recRace();const i=document.getElementById("t-"+r.race+"-"+el.dataset.l);if(i)i.focus()},
  rcheck:()=>timesChecked(false),
  rforce:()=>timesChecked(true),
  snext:()=>{A.s.race=A.s.race+1;A.s.err=null;render()},
  stest:el=>{A.s.test=el.dataset.v;render()},
  soverall:()=>{const r=slipRace();if(r){A.modal={t:"overall",race:r.race};render()}},
  aprev:()=>{A.a.idx=Math.max(0,A.a.idx-1);render()},
  anext:()=>{const f=finalsInOrder();if(f[A.a.idx])markRead(f[A.a.idx].key);A.a.idx=Math.min(f.length-1,A.a.idx+1);render()},
  rtab:el=>{A.res.tab=el.dataset.v;render()},
  rf:el=>{A.res[el.dataset.f]=el.dataset.v;render()},
  csv:()=>exportCsv(),
  newscopy:async()=>{const ta=document.getElementById("newsText");try{await navigator.clipboard.writeText(ta.value);toast("Article copied")}catch(e){ta.focus();ta.select();toast("Press Ctrl+C or Cmd+C to copy")}},
  osec:el=>{A.o.sec=el.dataset.v;render()},
  year:el=>enterYear(el.dataset.v),
  changeyear:()=>{A.yearPicked=null;ssSet("swim_year",null);A.job=null;A.menu=false;render()},
  olanes:el=>{const b=document.getElementById("cLanes");b.textContent=Math.max(4,Math.min(10,(+b.textContent)+(+el.dataset.d)))},
  osavedetails:()=>saveCfg({name:document.getElementById("cName").value.trim()||A.cfg.name,date:document.getElementById("cDate").value,dateConfirmed:document.getElementById("cDateOk").checked,ageDate:document.getElementById("cAge").value||"2026-12-31",pool:document.getElementById("cPool").value.trim(),poolLen:document.getElementById("cLen").value,lanes:+document.getElementById("cLanes").textContent},"Details saved"),
  opin:el=>{const v=el.dataset.v;const p=document.getElementById("pin-"+v).value.trim();
    if(!/^\d{4}$/.test(p)){toast("A PIN is 4 digits.");return}
    const h=pinHash(p);const P=pins();const clash=PIN_ROLES.find(([k])=>k!==v&&P[k]===h);
    if(clash){toast("That PIN is already used for "+clash[1]+". Pick a different one.");return}
    const name=PIN_ROLES.find(x=>x[0]===v)[1];
    saveCfg({pins:Object.assign({},A.cfg.pins||{},{[v]:h})},name+" PIN changed")},
  ocheck:()=>{const ta=document.getElementById("oText");A.o.text=ta.value;A.o.preview=parseStudents(A.o.text,A.cfg.ageDate);render()},
  otest:()=>{A.o.preview={ok:TEST_STUDENTS(),bad:[]};A.o.text="";render()},
  oimport:async()=>{const ok=A.o.preview.ok;const F=ok.filter(s=>s.x==="F"),M=ok.filter(s=>s.x==="M");
    const r1=await w0(()=>A.store.set("roster/F",{students:F,at:Date.now()}));const r2=r1&&await w0(()=>A.store.set("roster/M",{students:M,at:Date.now()}));
    if(r2){A.roster={F,M};A.o.preview=null;A.o.text="";recompute();toast(ok.length+" students imported");render()}},
  omove:el=>{const p=progList().map(x=>Object.assign({},x));const i=+el.dataset.i,j=i+(+el.dataset.d);[p[i],p[j]]=[p[j],p[i]];saveCfg({program:p},"Program order saved")},
  oswitch:el=>{const p=progList().map(x=>Object.assign({},x));p[+el.dataset.i].on=!p[+el.dataset.i].on;saveCfg({program:p},"Program saved")},
  osavepoints:()=>saveCfg({points:{p1:+document.getElementById("pt1").value||0,p2:+document.getElementById("pt2").value||0,p3:+document.getElementById("pt3").value||0,rest:+document.getElementById("ptr").value||0}},"Points saved"),
  osavelimits:()=>{const L={};for(const t of TYPES){if(!DEFAULT_LIMITS[t.k])continue;const f=parseTime(document.getElementById("lf-"+t.k).value),s=parseTime(document.getElementById("ls-"+t.k).value);if(f.err||s.err){toast("Check the limits for "+t.name+".");return}L[t.k]=[f.cs,s.cs]}saveCfg({limits:L},"Limits saved")},
  orecdel:el=>{A.records=A.records.filter(r=>r.key!==el.dataset.k);w0(()=>A.store.set("records/all",{list:A.records}));recompute();render()},
  orecadd:()=>{const k=document.getElementById("rcK").value,x=document.getElementById("rcX").value,g=document.getElementById("rcG").value;const t=parseTime(document.getElementById("rcT").value);
    const okG=GROUPS[TYPE[k].gk].includes(g);if(!okG){toast("That group does not swim the "+TYPE[k].name+".");return}
    if(t.err){toast("Time: "+t.err);return}
    addRecords([{key:groupKey(k,x,g),t:t.cs,holders:[{n:document.getElementById("rcN").value.trim()||"Unknown",h:document.getElementById("rcH").value,y:document.getElementById("rcY").value.trim()}]}])},
  orectest:()=>{const list=[];const names=["Jess Moran","Ryan Cole","Mia Tran","Sam Price","Ella Ward","Noah Bell"];let i=0;
    for(const k of ["fly50","back50","free50","breast50"])for(const g of GROUPS.age)for(const x of ["F","M"]){const base={fly50:3500,back50:3600,free50:3000,breast50:4000}[k]-(+g-13)*120-(x==="M"?150:0);list.push({key:groupKey(k,x,g),t:base,holders:[{n:"Test: "+names[i++%names.length],h:HOUSES[i%3].c,y:String(2015+(i%10))}]})}
    addRecords(list)},
  orecpaste:()=>{const p=parseRecordRows(document.getElementById("rcPaste").value);if(p.bad.length)toast("Rows not understood: "+p.bad.join(", "));if(p.out.length)addRecords(p.out)},
  olock:()=>saveCfg({locked:!A.cfg.locked,lockedAt:A.cfg.locked?null:Date.now()},A.cfg.locked?"Results unlocked":"Results locked"),
  onew:()=>{if(A.past){toast("Past years are look only.");return}const yr=(A.cfg.date||"2027").slice(0,4);if(A.years.some(y=>String(y.year)===yr)){A.modal={t:"info",title:"Year already kept",body:`<p style="margin:0">The ${esc(yr)} carnival has already been kept. Change the carnival date in section 1 to the right year first.</p>`};render();return}A.modal={t:"newCarnival",step:1};A.o.newMsg="";render()},
  onew1:async()=>{const p=document.getElementById("ncPin").value.trim();
    /* Supabase: the organiser PIN is checked on the server */
    let ok;if(A.store&&A.store.checkPin){try{ok=await A.store.checkPin("org",pinHash(p))}catch(e){toast("No connection. Try again.");return}}else ok=pinHash(p)===pins().org;
    if(!ok){A.modal.err="That PIN is not right. Try again.";render();return}
    const list=A.R.broken.filter(G=>G.final).map(G=>G.label+": "+G.recordNote.rows.map(r=>pname(r.p)).join(" and ")+" "+fmtTime(G.recordNote.rows[0].eff)+(G.recordNote.kind==="new"?" (new)":" (equal)"));
    A.modal={t:"newCarnival",step:2,list};render()},
  onew2:el=>newCarnival(el.dataset.v==="yes")
};
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");
  if(!el){if(A.menu&&!e.target.closest(".jobpill")){A.menu=false;renderHeader()}return}
  if(el.disabled)return;
  const f=ACT[el.dataset.act];if(f)f(el,e);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(A.modal){A.modal=null;render()}else if(A.menu){A.menu=false;renderHeader()}}});
render();
connect();
