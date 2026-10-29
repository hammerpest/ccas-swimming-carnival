/* ===== Swim Opt 1: app shell, PIN, header, shared helpers ===== */
const JOBS=[
  {k:"marshal",n:1,name:"Marshal",badge:"MARSHAL",dev:"iPad",desc:"Put swimmers in lanes and send each heat"},
  {k:"judge",n:2,name:"Place Judge",badge:"PLACE JUDGE",dev:"iPad",desc:"Tap the top places in each heat"},
  {k:"slips",n:3,name:"Time Slips",badge:"TIME SLIPS",dev:"Phone",desc:"Photograph each printed time slip"},
  {k:"recorder",n:4,name:"Recorder",badge:"RECORDER",dev:"MacBook",desc:"Check times and press Times checked"},
  {k:"announcer",n:5,name:"Announcer",badge:"ANNOUNCER",dev:"iPad or laptop",desc:"Read results, records and house points"}
];
const ORG_JOB={k:"organiser",n:6,name:"Carnival Organiser",badge:"CARNIVAL ORGANISER",dev:"MacBook",desc:"Organiser only"};
const A={
  store:null,cfg:Object.assign({},DEFAULT_CONFIG),roster:{F:[],M:[]},extras:[],heats:[],times:{},finish:{},slips:{},records:[],counter:1,
  peers:[],R:null,loaded:false,
  role:ssGet("swim_role",null),job:ssGet("swim_job",null),pin:"",pinErr:false,
  m:{phase:"start",k:null,x:null,g:null,lanes:{},heat:1,cur:1,open:null,filter:"",sent:[],msg:""},
  j:{race:null,dh:false},r:{race:null,since:Date.now(),errs:{}},s:{race:null,test:null,flash:null,err:null},slipImg:{},
  a:{idx:null},res:{tab:"race",sex:"all",type:"all",age:"all"},o:{sec:"details",preview:null,text:""},
  menu:false,modal:null,renderPending:false,
  past:null,years:[],L:{},yearPicked:ssGet("swim_year",null)
};
function ssGet(k,d){try{const v=sessionStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function ssSet(k,v){try{if(v==null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function rid(n){return "r"+String(n).padStart(4,"0")}
function pinHash(p){let h=2166136261;const s="ccas-swim:"+p;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
/* One PIN per job (decision 88). The organiser PIN opens every job. */
const PIN_ROLES=[["marshal","Marshal","1111"],["judge","Place Judge","2222"],["slips","Time Slips","4444"],["recorder","Recorder","3333"],["announcer","Announcer","5555"],["org","Carnival Organiser","9999"]];
const DEFAULT_PINS=Object.fromEntries(PIN_ROLES.map(([k,,p])=>[k,pinHash(p)]));
function pins(){const c=A.cfg.pins||{};return Object.fromEntries(PIN_ROLES.map(([k])=>[k,c[k]||DEFAULT_PINS[k]]))}
function canOpen(k){if(A.role==="org")return true;if(!A.role)return false;if(k===A.role)return true;return A.role==="announcer"&&(k==="results"||k==="houses")}
function homeJob(){return A.role==="announcer"?"announcer":A.role}
if(!PIN_ROLES.some(x=>x[0]===A.role)){A.role=null;A.job=null}
function hc(h){return h==="B"?"var(--hB)":h==="J"?"var(--hJ)":h==="N"?"var(--hN)":"var(--grey)"}
function hdot(h){return `<i class="hdot" style="--hc:${hc(h)}">${esc(h||"?")}</i>`}
function htag(h){return `<span class="htag">${hdot(h)}${esc(houseName(h))}</span>`}
function badge(n,cls){return `<span class="racebadge ${cls||""}"><small>RACE</small><b>${n==null?"-":n}</b></span>`}
function medal(p){return `<span class="medal m${Math.min(p,4)}">${p}</span>`}
function pname(p){return p?(p.team?p.name:(p.f+" "+p.s)):"Empty"}
function listName(st){return st.team?st.name:st.s+", "+st.f}
function locked(){if(A.past)return true;return !!A.cfg.locked&&A.job!=="organiser"}
function curYear(){return (A.L.cfg&&A.L.cfg.date||A.cfg.date||"2027").slice(0,4)}
let toastT=null;
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3000)}
function students(){return [...A.roster.F,...A.roster.M,...A.extras]}
function studentById(id){return students().find(s=>s.id===id)}
function otherPeers(){return A.peers.filter(p=>p&&p.dev&&p.dev!==DEV)}
function openGroups(){const s=new Set();if(A.past)return s;for(const p of otherPeers())if(p.mk)s.add(p.mk);if(A.job==="marshal"&&A.m.phase==="lanes")s.add(groupKey(A.m.k,A.m.x,A.m.g));return s}
function raceList(){return A.R?[...A.R.races.values()].sort((a,b)=>a.race-b.race):[]}
function plural(n,w,ws){return n+" "+(n===1?w:(ws||w+"s"))}
function raceRange(nos){if(!nos.length)return "";if(nos.length===1)return "Race "+nos[0];if(nos.length===2)return "Races "+nos[0]+" and "+nos[1];return "Races "+nos[0]+" to "+nos[nos.length-1]}

/* ---------- data ---------- */
function recompute(){
  const S={config:A.cfg,students:students(),heats:A.heats,times:A.times,finish:A.finish,slips:A.slips,records:A.records,openGroups:openGroups()};
  A.R=compute(S);
}
function schedule(){
  if(A.renderPending)return;A.renderPending=true;
  requestAnimationFrame(()=>{A.renderPending=false;recompute();
    const ae=document.activeElement;
    if(ae&&ae.closest&&ae.closest("main")&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)&&ae.type!=="file"){A.dirty=true;renderHeader();return}
    render()});
}
document.addEventListener("focusout",()=>{if(A.dirty){A.dirty=false;setTimeout(()=>{const ae=document.activeElement;if(!(ae&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)))render();else A.dirty=true},50)}});
async function connect(){
  let st=null;
  try{if(typeof supabaseStore==="function")st=await supabaseStore(()=>renderHeader())}catch(e){}
  if(!st)try{st=await claudeStore(()=>renderHeader())}catch(e){}
  if(!st)st=localStore(()=>renderHeader());
  A.store=st;
  /* Supabase: the server decides the job; forget a job it does not know about */
  if(st.claimRole&&st.role!==A.role){A.role=null;A.job=null;A.yearPicked=null;ssSet("swim_role",null);ssSet("swim_job",null);ssSet("swim_year",null);render()}
  if(A.pin.length===4)pressKey("");
  const s=A.store;
  /* live data goes to A.L; it shows on screen unless a past year is open (decision 95) */
  const live=(k,v)=>{A.L[k]=v;if(!A.past)A[k]=v;schedule()};
  A.L.roster={F:[],M:[]};
  s.onDoc("config/main",d=>{A.loaded=true;live("cfg",Object.assign({},DEFAULT_CONFIG,d||{}))});
  for(const x of ["F","M"])s.onDoc("roster/"+x,d=>{const r=Object.assign({},A.L.roster);r[x]=(d&&d.students)||[];live("roster",r)});
  s.onCol("extras",l=>live("extras",l));
  s.onCol("heats",l=>live("heats",l.filter(h=>h&&h.race)));
  s.onCol("times",l=>live("times",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onCol("finish",l=>live("finish",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onCol("slips",l=>live("slips",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onDoc("records/all",d=>live("records",(d&&d.list)||[]));
  s.onDoc("counter/race",d=>live("counter",(d&&Number(d.next))||1));
  s.onCol("years",l=>{A.years=l.filter(y=>y&&y.year).sort((a,b)=>String(b.year).localeCompare(String(a.year)));schedule()});
  if(A.yearPicked&&A.yearPicked!=="current"&&A.role==="org")setTimeout(()=>enterYear(A.yearPicked),300);
  s.onPeers(list=>{A.peers=list;schedule()});
  announce();
  schedule();
}
function announce(){
  if(!A.store)return;
  const p={job:A.job||null,mk:null,rec:null,recSince:null};
  if(A.job==="marshal"&&A.m.phase==="lanes")p.mk=groupKey(A.m.k,A.m.x,A.m.g);
  if(A.job==="recorder"&&A.r.race!=null){p.rec=A.r.race;p.recSince=A.r.since}
  A.store.presence(p);
}
async function w(fn){
  if(locked()){toast("Results are locked. Nothing can be changed.");return null}
  try{const r=await fn();if(r&&r.queued)toast("Saved on this device. Sends when there is signal.");return r||{ok:true}}
  catch(e){toast(e&&e.code==="invalid_argument"?"Not saved. Calling Tech Boy to help you. Enjoy grandstand duty next year.":"Not saved. Check the connection and try again.");return null}
}

/* ---------- header ---------- */
function curJob(){return A.job==="organiser"?ORG_JOB:JOBS.find(j=>j.k===A.job)||(A.job==="results"?{k:"results",badge:"RESULTS",name:"Announcer"}:A.job==="houses"?{k:"houses",badge:"HOUSES",name:"Announcer"}:null)}
function pillName(){if(A.job==="results"||A.job==="houses")return "Announcer";const j=curJob();return j?j.name:""}
function renderHeader(){
  const h=document.getElementById("hdr");
  const j=curJob();
  const s=A.store;let live="Connecting",cls="";
  if(s){
    const n=s.pending();
    if(s.mode==="local"){live="This device only (test)";cls="off"}
    else if(n){live=plural(n,"change")+" waiting to send";cls="off"}
    else live=A.job==="organiser"?"Online, all saved":"Online, all sent";
  }
  const links=A.job==="announcer"?`<button type="button" class="hlink" data-act="goto" data-job="results">Full results</button><button type="button" class="hlink" data-act="goto" data-job="houses">Houses</button>`
    :A.job==="results"?`<button type="button" class="hlink" data-act="goto" data-job="houses">Houses</button><button type="button" class="hlink" data-act="goto" data-job="announcer">Back to Announcer</button>`
    :A.job==="houses"?`<button type="button" class="hlink" data-act="goto" data-job="results">Results</button><button type="button" class="hlink" data-act="goto" data-job="announcer">Back to Announcer</button>`:"";
  const jobs=A.role==="org"?[...JOBS,ORG_JOB]:[];
  h.innerHTML=`<div class="wrap"><div class="topin">
    ${j?`<span class="jobbadge">${esc(j.badge)}</span>`:""}
    <div class="ttl"><b>Swimming Carnival ${A.past?esc(A.past):esc(curYear())}</b><small>${esc(A.cfg.name||"CCAS")}${A.job==="organiser"?" · Organiser PIN only":""}</small></div>
    ${A.role==="org"&&A.yearPicked?`<button type="button" class="hlink" data-act="changeyear">${A.past?"Look only · ":""}Change year</button>`:""}
    ${links}
    <span class="live ${cls}"><i></i>${esc(live)}</span>
    ${j?`<div class="jobpill"><button type="button" data-act="menu" aria-expanded="${A.menu}">Job: ${esc(pillName())}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      ${A.menu?`<div class="jobmenu" role="menu">${jobs.length?`<div class="label">Change job</div>`:`<div class="label">Your PIN opens ${esc(pillName())} only</div>`}${jobs.map(x=>`<button type="button" role="menuitem" data-act="goto" data-job="${x.k}"><span class="n">${x.n}</span>${esc(x.name)}${pillName()===x.name?`<span class="tick">&#10003;</span>`:""}</button>`).join("")}<hr><button type="button" role="menuitem" data-act="signout">Sign out (back to PIN)</button></div>`:""}
    </div>`:""}
  </div></div>`;
}

/* ---------- home ---------- */
function renderHome(){
  if(A.role==="org"&&!A.yearPicked)return renderYearPick();
  if(!A.role){
    return `<div class="home"><h1>Swimming Carnival</h1><p class="muted" style="margin:0">Type the PIN to start.</p>
      <div class="dots" aria-label="PIN digits typed">${[0,1,2,3].map(i=>`<i class="${A.pin.length>i?"on":""}"></i>`).join("")}</div>
      ${A.pinErr?`<div class="msg bad" role="alert">That PIN is not right. Try again.</div>`:""}
      <div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" data-act="key" data-k="${n}">${n}</button>`).join("")}<button type="button" data-act="key" data-k="c" aria-label="Clear" style="font-size:1rem">Clear</button><button type="button" data-act="key" data-k="0">0</button><button type="button" data-act="key" data-k="b" aria-label="Delete" style="font-size:1rem">Delete</button></div>

    </div>`;
  }
  const tiles=JOBS.map((j,i)=>`<button type="button" class="tile ${i===4?"wide":""}" data-act="goto" data-job="${j.k}"><span class="n">${j.n}</span><b>${j.name}</b><span>${esc(j.desc)}</span></button>`).join("");
  return `<div class="home"><h1>Swimming Carnival</h1><p class="muted" style="margin:0">Choose your job.</p>
    <div class="tiles">${tiles}${A.role==="org"?`<button type="button" class="tile orgtile wide" data-act="goto" data-job="organiser"><span class="n">6</span><b>Carnival Organiser</b><span>Organiser only</span></button>`:""}</div>
    <button type="button" class="linkbtn" data-act="signout">Sign out (back to PIN)</button></div>`;
}
function renderYearPick(){
  const cur=curYear();
  return `<div class="home"><h1>Which carnival?</h1><p class="muted" style="margin:0">Pick the year. Past years are look only.</p>
    <div class="stack" style="width:100%;max-width:520px">
      <button type="button" class="tile wide" style="min-height:0" data-act="year" data-v="current"><span class="row" style="justify-content:space-between;width:100%"><b>${esc(cur)}</b><span class="chip final">Current carnival</span></span><span>${esc(A.L.cfg?A.L.cfg.name:A.cfg.name)} · live</span></button>
      ${A.years.filter(y=>String(y.year)!==cur).map(y=>`<button type="button" class="tile wide" style="min-height:0" data-act="year" data-v="${esc(y.year)}"><span class="row" style="justify-content:space-between;width:100%"><b>${esc(y.year)}</b><span class="chip">Look only</span></span><span>${esc(y.name||"")} · ${y.heats||0} races, ${y.students||0} students</span></button>`).join("")||`<p class="muted" style="margin:0">No past years kept yet. A year is kept when the organiser presses Start a new carnival.</p>`}
    </div>
    <button type="button" class="linkbtn" data-act="signout">Sign out (back to PIN)</button></div>`;
}
async function enterYear(y){
  A.r.race=null;A.j.race=null;A.s.race=null;A.a.idx=null;A.modal=null;
  if(y==="current"||!y){
    A.past=null;for(const k of ["cfg","roster","extras","heats","times","finish","slips","records","counter"])if(A.L[k]!==undefined)A[k]=A.L[k];
  }else{
    try{
      const [c,r,d]=await Promise.all(["config","roster","data"].map(n=>A.store.get("archive/"+y+"-"+n)));
      if(!c||!d){toast("The "+y+" carnival could not be loaded.");return}
      A.past=String(y);
      A.cfg=Object.assign({},DEFAULT_CONFIG,c.cfg||{});A.records=c.records||[];
      A.roster={F:(r&&r.F)||[],M:(r&&r.M)||[]};A.extras=(r&&r.extras)||[];
      A.heats=d.heats||[];A.times=d.times||{};A.finish=d.finish||{};A.slips=d.slips||{};A.counter=d.counter||1;
    }catch(e){toast("The "+y+" carnival could not be loaded. Check the connection.");return}
  }
  A.yearPicked=y||"current";ssSet("swim_year",A.yearPicked);
  if(A.store&&A.store.setYear)A.store.setYear(A.yearPicked).catch(()=>{});
  recompute();render();
}
function pressKey(k){
  if(k==="c"){A.pin="";A.pinErr=false}
  else if(k==="b"){A.pin=A.pin.slice(0,-1)}
  else if(A.pin.length<4){A.pin+=k;A.pinErr=false}
  /* Supabase still connecting: hold the 4 digits until it is ready (connect() checks them) */
  if(A.pin.length===4&&!A.store&&window.SWIM_CONFIG&&SWIM_CONFIG.url){render();return}
  if(A.pin.length===4&&A.store&&A.store.claimRole){
    /* Supabase: the server checks the PIN and sets this device's job */
    const h=pinHash(A.pin);A.pin="";render();
    A.store.claimRole(h).then(r=>{
      if(r){A.role=r;ssSet("swim_role",r);if(r!=="org"){goJob(homeJob());return}}else A.pinErr=true;
      render();
    },()=>{toast("No connection. Try again.");render()});
    return;
  }
  if(A.pin.length===4){
    const h=pinHash(A.pin),P=pins();
    const hit=PIN_ROLES.find(([k])=>P[k]===h);
    if(hit){A.role=hit[0];ssSet("swim_role",hit[0]);if(hit[0]!=="org"){A.pin="";goJob(homeJob());return}}
    else A.pinErr=true;
    A.pin="";
  }
  render();
}
function goJob(k){
  if(!canOpen(k==="organiser"?"org":k))return;
  if(A.job==="marshal"&&A.m.phase==="lanes"&&Object.keys(A.m.lanes).length&&k!=="marshal"){
    A.modal={t:"leaveMarshal",to:k};A.menu=false;render();return;
  }
  if(A.job==="marshal"&&k!=="marshal")A.m.phase="start";
  A.job=k;ssSet("swim_job",k);A.menu=false;A.modal=null;
  if(k==="recorder")A.r.since=Date.now();
  announce();render();window.scrollTo(0,0);
}
function signOut(){if(A.past)enterYear("current");if(A.store&&A.store.releaseRole)A.store.releaseRole().catch(()=>{});A.yearPicked=null;ssSet("swim_year",null);A.role=null;A.job=null;ssSet("swim_role",null);ssSet("swim_job",null);A.menu=false;A.m.phase="start";announce();render()}

/* ---------- modal ---------- */
function modalHtml(){
  const M=A.modal;if(!M)return "";
  const f=MODALS[M.t];if(!f)return "";
  return `<div class="modalbg" data-act="modalbg"><div class="modal" role="dialog" aria-modal="true">${f(M)}</div></div>`;
}
const MODALS={};
MODALS.leaveMarshal=M=>`<h2>Leave without sending?</h2><p style="margin:0">This heat has swimmers in lanes but has not been sent to the starter. If you leave now, the lanes are cleared.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn danger" data-act="leaveok">Leave and clear</button></div>`;
MODALS.info=M=>`<h2>${esc(M.title)}</h2>${M.body}<div class="acts"><button type="button" class="btn primary" data-act="closemodal">${esc(M.ok||"OK")}</button></div>`;
