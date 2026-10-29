/* ===== Swim Opt 1: core rules (no screen code) ===== */
const TYPES=[
  {k:"fly50",name:"50 m butterfly",btn:"50 m fly",dist:50,stroke:"Butterfly",gk:"age",start:"8:55 am"},
  {k:"back50",name:"50 m backstroke",btn:"50 m back",dist:50,stroke:"Backstroke",gk:"age",start:"9:15 am"},
  {k:"free50",name:"50 m freestyle",btn:"50 m free",dist:50,stroke:"Freestyle",gk:"age",start:"10:00 am"},
  {k:"free100",name:"100 m freestyle",btn:"100 m free",dist:100,stroke:"Freestyle",gk:"age",start:"10:45 am"},
  {k:"breast50",name:"50 m breaststroke",btn:"50 m breast",dist:50,stroke:"Breaststroke",gk:"age",start:"11:30 am"},
  {k:"free200",name:"200 m freestyle",btn:"200 m free",dist:200,stroke:"Freestyle",gk:"band",start:"12:15 pm"},
  {k:"relayfree",name:"4 x 50 m freestyle relay",btn:"Free relay",dist:200,stroke:"Freestyle",gk:"band",relay:true,start:"1:00 pm"},
  {k:"relaymed",name:"4 x 50 m medley relay",btn:"Medley relay",dist:200,stroke:"Medley",gk:"open",relay:true,start:"1:25 pm",optional:true}
];
const TYPE=Object.fromEntries(TYPES.map(t=>[t.k,t]));
const GROUPS={age:["13","14","15","16","17","18"],band:["J","I","S"],open:["O"],y12:["Y12"]};
const AGE_GROUPS=GROUPS.age;
const BAND_OF={"13":"J","14":"J","15":"I","16":"I","17":"S","18":"S"};
const BAND_AGES={J:["13","14"],I:["15","16"],S:["17","18"]};
const HOUSES=[{c:"B",n:"Bradman"},{c:"J",n:"Jackson"},{c:"N",n:"Newcombe"}];
const TEAMS=["B-A","B-B","J-A","J-B","N-A","N-B"];

const DEFAULT_LIMITS={fly50:[2600,9000],back50:[2700,9000],free50:[2300,9000],free100:[5200,18000],breast50:[3000,10500],free200:[11500,36000],relayfree:[10000,30000],relaymed:[11000,33000]};
const DEFAULT_CONFIG={
  name:"CCAS Swimming Carnival 2027",date:"2027-02-10",dateConfirmed:false,ageDate:"2026-12-31",
  pool:"Mingara Aquatic Centre",lanes:8,poolLen:"50",
  points:{p1:20,p2:15,p3:10,rest:5},
  limits:DEFAULT_LIMITS,
  program:TYPES.map(t=>({k:t.k,on:true})),
  locked:false,lockedAt:null
};

function grpName(g){
  if(g==="13")return "13 & under";if(g==="18")return "18+";
  if(g==="J")return "Junior";if(g==="I")return "Intermediate";if(g==="S")return "Senior";
  if(g==="O")return "Open";if(g==="Y12")return "Year 12";return g;
}
function sexName(x){return x==="F"?"Girls":x==="M"?"Boys":""}
function groupLabel(k,x,g){
  const t=TYPE[k];if(!t)return "";
  if(t.nosex)return t.name;
  return t.name+", "+sexName(x)+" "+grpName(g);
}
function groupKey(k,x,g){return k+"|"+x+"|"+g}
function splitKey(key){const [k,x,g]=key.split("|");return {k,x,g}}
function houseName(c){const h=HOUSES.find(h=>h.c===c);return h?h.n:""}
function teamName(t){const [h,l]=t.split("-");return houseName(h)+" "+l}

/* Program events in swim order (event numbers stay behind the scenes) */
function programEvents(cfg){
  const out=[];let no=0;
  const prog=(cfg&&cfg.program)||DEFAULT_CONFIG.program;
  for(const p of prog){
    const t=TYPE[p.k];if(!t||!p.on)continue;
    for(const g of GROUPS[t.gk]){
      for(const x of (t.nosex?["X"]:["F","M"])){no++;out.push({no,k:t.k,x,g,key:groupKey(t.k,x,g)})}
    }
  }
  return out;
}

/* ---- times are whole hundredths (centiseconds) ---- */
function parseTime(raw){
  const d=String(raw||"").replace(/[^0-9]/g,"");
  if(!d)return {err:"Type the time"};
  if(d.length<3)return {err:"Too few digits"};
  if(d.length>6)return {err:"Too many digits"};
  const hh=+d.slice(-2),ss=+d.slice(-4,-2),mm=d.length>4?+d.slice(0,-4):0;
  if(ss>=60)return {err:mm?"Seconds over 59":"Over 60 sec: add minutes"};
  return {cs:mm*6000+ss*100+hh};
}
function fmtTime(cs){
  if(cs==null||!isFinite(cs))return "";
  cs=Math.round(cs);
  const m=Math.floor(cs/6000),s=Math.floor((cs%6000)/100),h=cs%100;
  const hs=String(h).padStart(2,"0");
  return m?m+":"+String(s).padStart(2,"0")+"."+hs:s+"."+hs;
}
function digitsOf(cs){if(cs==null)return "";const m=Math.floor(cs/6000),s=Math.floor((cs%6000)/100),h=cs%100;return (m?String(m)+String(s).padStart(2,"0"):String(s))+String(h).padStart(2,"0")}
function oddTime(k,cs,limits){
  const lim=(limits&&limits[k])||DEFAULT_LIMITS[k];
  if(!lim||cs==null)return null;
  if(cs<lim[0])return "Faster than "+fmtTime(lim[0]);
  if(cs>lim[1])return "Slower than "+fmtTime(lim[1]);
  return null;
}

/* ---- Step 1: one heat. The judge decides the top places; the fastest times go to them in the judge's order ---- */
function heatEffective(laneTimes,judgeOrder){
  /* laneTimes: {lane:{t,st}}; judgeOrder: [[lane,...],...] place groups */
  const ok={};
  for(const ln in laneTimes){const v=laneTimes[ln];if(v&&v.st!=="DNS"&&v.st!=="DQ"&&v.t!=null)ok[ln]=v.t}
  const res={};
  const judged=[];const groupOf={};
  (judgeOrder||[]).forEach((grp,i)=>grp.forEach(ln=>{ln=String(ln);if(ok[ln]!=null){judged.push(ln);groupOf[ln]=i}}));
  const all=Object.values(ok).sort((a,b)=>a-b);
  const judgedSet=new Set(judged);
  judged.forEach((ln,i)=>{res[ln]=all[i]});
  /* dead heat in the judge's order: those swimmers share the faster time */
  const byGroup={};judged.forEach(ln=>{(byGroup[groupOf[ln]]=byGroup[groupOf[ln]]||[]).push(ln)});
  for(const g in byGroup){const ls=byGroup[g];if(ls.length>1){const m=Math.min(...ls.map(l=>res[l]));ls.forEach(l=>res[l]=m)}}
  const rest=Object.keys(ok).filter(ln=>!judgedSet.has(ln)).sort((a,b)=>ok[a]-ok[b]||(+a)-(+b));
  const left=all.slice(judged.length);
  rest.forEach((ln,i)=>{res[ln]=left[i]});
  const out={};
  for(const ln in ok)out[ln]={rec:ok[ln],eff:res[ln],pink:res[ln]!==ok[ln]};
  return out;
}

/* points for one place, ties split */
function pointsFor(place,size,P,noPts){
  if(noPts)return 0;
  const at=i=>i===1?P.p1:i===2?P.p2:i===3?P.p3:P.rest;
  let s=0;for(let i=place;i<place+size;i++)s+=at(i);
  return Math.round(s/size*100)/100;
}
function finishOrderFromTaps(order){
  /* order: [[lane],[lane,lane]] → {lane:place} */
  const out={};let p=1;
  for(const g of order||[]){for(const ln of g)out[String(ln)]=p;p+=g.length}
  return out;
}

/* ---- Step 2: everything worked out from the stored records ---- */
function compute(S){
  const cfg=Object.assign({},DEFAULT_CONFIG,S.config||{});
  const P=Object.assign({},DEFAULT_CONFIG.points,cfg.points||{});
  const people=new Map();
  for(const st of (S.students||[]))people.set(st.id,st);
  const who=id=>{
    if(!id)return null;
    if(TEAMS.includes(id))return {id,s:teamName(id),f:"",h:id[0],team:true,name:teamName(id)};
    const st=people.get(id);
    if(!st)return {id,s:"Unknown swimmer",f:"",h:"",name:"Unknown swimmer"};
    return Object.assign({name:st.f+" "+st.s},st);
  };
  const events=programEvents(cfg);
  const evByKey=new Map(events.map(e=>[e.key,e]));
  const heats=[...(S.heats||[])].sort((a,b)=>a.race-b.race);
  const races=new Map();
  const groups=new Map();
  const ensure=(key)=>{
    if(!groups.has(key)){const {k,x,g}=splitKey(key);groups.set(key,{key,k,x,g,label:groupLabel(k,x,g),ev:evByKey.get(key)||null,heats:[],rows:[],status:"none",checkedAt:0})}
    return groups.get(key);
  };
  for(const h of heats){
    if(!TYPE[h.k])continue;
    const key=groupKey(h.k,h.x,h.g);
    const id="r"+String(h.race).padStart(4,"0");
    const T=(S.times||{})[id]||{};
    const F=(S.finish||{})[id]||{};
    const lanes=h.lanes||{};
    const filled=Object.keys(lanes).filter(l=>lanes[l]);
    const lt=T.lanes||{};
    /* only marshalled lanes count; a slip time for an empty lane is shown to the Recorder as "extra" */
    const ltIn={};for(const l of filled)if(lt[l])ltIn[l]=lt[l];
    const eff=heatEffective(ltIn,(F.order||[]).map(g=>g.filter(l=>lanes[l])).filter(g=>g.length));
    const extra=Object.keys(lt).filter(l=>!lanes[l]&&lt[l]&&lt[l].t!=null&&lt[l].st!=="DNS"&&lt[l].st!=="DQ").map(Number).sort((a,b)=>a-b);
    const placeTaps=finishOrderFromTaps(F.order);
    const nTimes=filled.filter(l=>lt[l]&&(lt[l].t!=null||lt[l].st==="DNS"||lt[l].st==="DQ")).length;
    const flagged=filled.filter(l=>{const v=lt[l];return v&&v.t!=null&&v.st!=="DNS"&&v.st!=="DQ"&&!v.keep&&(oddTime(h.k,v.t,cfg.limits)||v.chk)}).length;
    const need=Math.min(4,filled.length);
    const dh=(F.order||[]).map(g=>g.map(String).filter(l=>lanes[l])).filter(g=>g.length>1);
    const tapped=Object.keys(placeTaps).filter(l=>lanes[l]).length;
    let tstatus="Waiting for slip";
    if(nTimes)tstatus=T.checked?"Checked":"To check";
    const r={race:h.race,heat:h.heat,k:h.k,x:h.x,g:h.g,key,label:groupLabel(h.k,h.x,h.g),lanes,filled,times:lt,eff,placeTaps,
      tstatus,checked:!!T.checked,checkedAt:T.checkedAt||0,nTimes,flagged,need,tapped,dh,extra,src:T.src||null,hasSlip:!!(S.slips&&S.slips[id])};
    races.set(h.race,r);
    const G=ensure(key);G.heats.push(r);
  }
  for(const G of groups.values()){
    const t=TYPE[G.k];const rows=[];
    for(const r of G.heats){
      for(const ln of r.filled){
        const p=who(r.lanes[ln]);const v=r.times[ln]||{};const e=r.eff[ln];
        rows.push({id:r.lanes[ln],p,race:r.race,heat:r.heat,lane:+ln,st:v.st||(v.t!=null?"ok":"wait"),rec:v.t!=null?v.t:null,eff:e?e.eff:null,pink:!!(e&&e.pink),judge:r.placeTaps[ln]||null,dh:r.dh.some(g=>g.includes(String(ln))),place:null,pts:0});
      }
    }
    const ok=rows.filter(x=>x.eff!=null).sort((a,b)=>a.eff-b.eff);
    let i=0;
    while(i<ok.length){
      let j=i;while(j<ok.length&&ok[j].eff===ok[i].eff)j++;
      const size=j-i;const pts=pointsFor(i+1,size,P,!!t.nopts);
      for(let q=i;q<j;q++){ok[q].place=i+1;ok[q].pts=pts;ok[q].tie=size>1}
      i=j;
    }
    const others=rows.filter(x=>x.eff==null).sort((a,b)=>(a.st==="wait")-(b.st==="wait")||a.race-b.race||a.lane-b.lane);
    G.rows=[...ok,...others];
    G.allChecked=G.heats.length>0&&G.heats.every(h=>h.checked);
    G.open=!!(S.openGroups&&S.openGroups.has(G.key));
    G.final=G.allChecked&&!G.open;
    G.status=G.final?"Final":"Provisional";
    G.checkedAt=Math.max(0,...G.heats.map(h=>h.checkedAt||0));
    G.raceNos=G.heats.map(h=>h.race);
  }
  /* records */
  const recList=(S.records||[]);
  const recByKey=new Map();
  for(const rc of recList)recByKey.set(rc.key,rc);
  const broken=[];
  for(const G of groups.values()){
    const old=recByKey.get(G.key);G.record=old||null;G.recordNote=null;
    if(!old||TYPE[G.k].nopts)continue;
    const best=G.rows.filter(r=>r.place===1);
    if(!best.length)continue;
    const bt=best[0].eff;
    if(bt<old.t){best.forEach(r=>r.tag="NEW RECORD");G.recordNote={kind:"new",rows:best,old};broken.push(G)}
    else if(bt===old.t){best.forEach(r=>r.tag="EQUALS RECORD");G.recordNote={kind:"equal",rows:best,old};broken.push(G)}
  }
  /* HRIS Team List: top 2 places in every race and group, relays included (decision 90) */
  for(const G of groups.values()){
    const t=TYPE[G.k];
    if(t.nopts)continue;
    G.rows.forEach(r=>{if(r.place&&r.place<=2)r.hris=true});
  }
  /* houses and champions */
  const house={};for(const h of HOUSES)house[h.c]={c:h.c,n:h.n,byAge:Object.fromEntries(AGE_GROUPS.map(a=>[a,0])),relay:0,indiv:0,total:0};
  const champ={};
  for(const G of groups.values()){
    const t=TYPE[G.k];if(t.nopts)continue;
    for(const r of G.rows){
      if(!r.pts||!r.p||!house[r.p.h])continue;
      if(t.relay){house[r.p.h].relay+=r.pts}
      else{
        const ag=r.p.g||G.g;
        if(house[r.p.h].byAge[ag]!=null)house[r.p.h].byAge[ag]+=r.pts;
        house[r.p.h].indiv+=r.pts;
        const ck=ag+"|"+(r.p.x||G.x);
        (champ[ck]=champ[ck]||{}),(champ[ck][r.id]=(champ[ck][r.id]||0)+r.pts);
      }
    }
  }
  for(const h of Object.values(house)){h.total=Math.round((h.indiv+h.relay)*100)/100;h.indiv=Math.round(h.indiv*100)/100}
  const houseRank=Object.values(house).sort((a,b)=>b.total-a.total);
  const champs={};
  for(const ag of AGE_GROUPS)for(const x of ["F","M"]){
    const ck=ag+"|"+x;const m=champ[ck]||{};
    const list=Object.entries(m).map(([id,pts])=>({id,pts,p:who(id)})).sort((a,b)=>b.pts-a.pts);
    const top=list.length?list[0].pts:null;
    const winners=list.filter(r=>r.pts===top);
    const second=list.find(r=>r.pts<top);
    const runners=second?list.filter(r=>r.pts===second.pts):[];
    /* races that count: 5 age races + 200 m band race */
    const counting=events.filter(e=>e.x===x&&((TYPE[e.k].gk==="age"&&e.g===ag)||(e.k==="free200"&&e.g===BAND_OF[ag])));
    const done=counting.filter(e=>{const G=groups.get(e.key);return G&&G.final}).length;
    champs[ck]={winners,runners,done,of:counting.length};
  }
  const finalCount=events.filter(e=>{const G=groups.get(e.key);return G&&G.final}).length;
  const maxRace=heats.length?heats[heats.length-1].race:0;
  return {cfg,P,events,groups,races,heats,house,houseRank,champs,broken,finalCount,maxRace,who};
}

/* ---- time slip text (Swiss Timing printer, decision 110) ----
   "LANE MODE 1/ 7": the number after the slash is the race number; the number before it is ignored.
   "start" and the clock times are ignored. Each "stop 4 09:19:41.700" line gives the lane; the
   "34.70 sec" line under it is that lane's time. Lines come in finish order; a lane with no stop line
   was not timed. Times over a minute may print as 72.34 or 1:12.34. Text comes from the phone's reader,
   so common misreads (O for 0, l for 1, comma for point) are allowed for.
   Nothing doubtful is passed off as sure. A lane goes in "unsure" (the Recorder checks it against the
   paper slip) when stop clock minus start clock does not equal its time, when a clock could not be read,
   when the reader was not confident of its lane number or time, or when the lane appears twice.
   "problems" lists lines that could not be used; "missed" lists lanes with a stop line but no time.
   A photo showing more than one slip sets "twoSlips" and the phone asks for a photo of one slip only, so
   another race's lanes are never mixed in. Sure signs: a second "LANE MODE" or "start" (even on the
   same line), two stop lines or two times on one line, any printed lane or time above the "LANE MODE"
   line, or a lane whose stop clock is more than 10 seconds away from its time ("far": the phone refuses
   when both readings agree on that). Weaker signs that a misread can also cause (a lane twice, a time
   more than a second faster than the one above it, as a real slip is in finish order) set "mixed"; a
   smaller dip makes both lanes unsure. A line with a clock or a time on it that cannot be used is never
   skipped quietly: it goes in "problems". The race number is the last number after the slash; when
   the slash is lost the last number after "MODE" is used. Extra numbers make it unsure ("raceLow").
   Input is the text, or the reader's lines with a confidence (0 to 100) for each word. */
const SLIP_CONF=70;
function slipNum(t){return String(t).replace(/[Oo]/g,"0").replace(/[lI|]/g,"1").replace(/,/g,".")}
function slipTime(t){
  const m=slipNum(t).replace(/\s+/g,"").match(/^(?:(\d{1,2}):)?(\d{1,3})\.(\d{2})$/);if(!m)return null;
  const cs=(m[1]?+m[1]*6000:0)+(+m[2])*100+(+m[3]);
  if(m[1]&&+m[2]>=60)return null;
  return cs>0&&cs<60000?cs:null;
}
const SLIP_CLOCK=/(\d{2})\s*:\s*(\d{2})\s*[.,]\s*(\d{3})\s*$/;
function slipClock(line){
  const m=slipNum(line).match(SLIP_CLOCK);
  return m?(+m[1])*60000+(+m[2])*1000+(+m[3]):null;
}
function slipLines(input){
  if(Array.isArray(input))return input.map(l=>({t:String(l.text||"").trim(),w:(l.words||[]).map(x=>({t:String(x.text||""),c:+x.confidence}))})).filter(l=>l.t);
  return String(input||"").split(/\r?\n/).map(t=>({t:t.trim(),w:null})).filter(l=>l.t);
}
/* true when the reader was not confident of the words matching re (text input carries no scores) */
function slipLow(line,re){
  if(!line.w)return false;
  const ws=line.w.filter(x=>re.test(x.t));
  return !ws.length||ws.some(x=>!(x.c>=SLIP_CONF));
}
function parseSlip(input,maxLanes){
  maxLanes=maxLanes||10;
  const lines=slipLines(input);
  const D="[\\dOolI|]";
  const STOP=new RegExp("^(?:s\\s*)?t?\\s*[o0]\\s*p\\s*("+D+"{1,2})(?![\\d:])","i");
  const STOPISH=/^\W{0,2}(?:s\s*)?t?\s*[o0]\s*p/i;
  const TIME=new RegExp("("+D+"{0,2}\\s*:?\\s*"+D+"{1,3}\\s*[.,]\\s*"+D+"{2})(?=\\s*s|\\s*$)","i");
  let race=null,raceLow=false,start=null,clock=null,lane=null,laneLow=false,heads=0,starts=0,above=false,strong=false,weak=false;
  const lanes={},order=[],problems=[],unsure=[],missed=[],far=[];
  const doubt=l=>{if(!unsure.includes(l))unsure.push(l)};
  const noTime=()=>{if(lane!=null){problems.push("Lane "+lane+": no time read");if(!missed.includes(lane))missed.push(lane)}lane=null};
  const lastConfLow=L=>{if(!L.w)return false;const d=L.w.filter(x=>/[\dOolI|]/.test(x.t));return !d.length||!(d[d.length-1].c>=SLIP_CONF)};
  for(const L of lines){
    const line=L.t;
    heads+=(line.match(/M[O0]DE/gi)||[]).length;
    if((line.match(/\bs\s*t\s*[o0]\s*p\b/gi)||[]).length>1||(line.match(/\d[.,]\s*\d{2}\s*s/gi)||[]).length>1)strong=true;
    if((line.match(/\bst\s*a\s*r?\s*t\b/gi)||[]).length>1)strong=true;
    const mm=line.match(/M[O0]DE(.*)$/i);
    if(mm){
      if(race==null){
        const tail=mm[1],sl=tail.lastIndexOf("/");
        let ns=(sl>=0?tail.slice(sl+1):tail).trim().split(/\s+/).filter(x=>/^[\dOolI|]+$/.test(x));
        if(sl<0&&ns.length>=2)ns=ns.slice(1);
        const n=ns[ns.length-1];
        if(n){race=+slipNum(n);raceLow=ns.length>1||(sl<0&&!/\s/.test(tail.trim()))||lastConfLow(L)}
      }
      continue;
    }
    if(/^st\s*a\s*r?\s*t\b/i.test(line)){starts++;if(starts>1)strong=true;else start=slipClock(line);continue}
    const sm=line.match(STOP);
    const clockish=SLIP_CLOCK.test(slipNum(line))||/\d{3,4}\s*:\s*\d{2}/.test(line);
    const tm=!sm&&!clockish?line.match(TIME):null;
    if(!heads){if(sm||clockish||tm||STOPISH.test(line))above=true;continue}
    if(sm){noTime();lane=+slipNum(sm[1]);clock=slipClock(line);laneLow=slipLow(L,/^[^:]*[\dOolI|]/);
      if(!(lane>=1&&lane<=maxLanes)){problems.push("Lane "+sm[1]+" not on this pool");lane=null}continue}
    if(clockish||STOPISH.test(line)){noTime();problems.push("A stop line not read");continue}
    if(tm&&lane!=null){
      const cs=slipTime(tm[1]);
      if(cs==null){noTime();continue}
      if(lanes[lane]!=null){problems.push("Lane "+lane+" twice");doubt(lane);weak=true}
      else{lanes[lane]=cs;order.push(lane);
        if(laneLow||slipLow(L,/\d[.,]\d/))doubt(lane);
        if(start==null||clock==null)doubt(lane);
        else{const dur=((clock-start)%3600000+3600000)%3600000,gap=Math.abs(dur/10-cs);if(gap>1)doubt(lane);if(gap>1000)far.push(lane)}}
      lane=null;
    }
    else if(tm)problems.push("A time with no lane");
    else if(/\bs\s*e\s*c\b/i.test(line)||/\d\D{0,3}\d/.test(line)){problems.push("A time not read");noTime()}
  }
  noTime();
  for(let i=1;i<order.length;i++){const d=lanes[order[i]]-lanes[order[i-1]];if(d<-100)weak=true;else if(d<0){doubt(order[i]);doubt(order[i-1])}}
  return {race:race!=null&&race>0?race:null,raceLow,lanes,order,problems,unsure,missed,far,head:heads>0,
    twoSlips:heads>1||strong||(above&&heads>0),mixed:weak};
}

/* ---- students: paste or CSV with DOB → age group (DOB never kept) ---- */
function ageOn(dobIso,onIso){
  const b=new Date(dobIso+"T00:00:00"),c=new Date(onIso+"T00:00:00");
  if(isNaN(b)||isNaN(c))return null;
  let a=c.getFullYear()-b.getFullYear();
  if(c.getMonth()<b.getMonth()||(c.getMonth()===b.getMonth()&&c.getDate()<b.getDate()))a--;
  return a;
}
function ageGroup(a){if(a==null)return null;if(a<=13)return "13";if(a>=18)return "18";return String(a)}
function parseDob(v){
  v=String(v||"").trim();if(!v)return null;
  if(/^\d{5}(\.\d+)?$/.test(v)){const d=new Date(Math.round((Number(v)-25569)*864e5));return isNaN(d)?null:d.toISOString().slice(0,10)}
  let m=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if(m)return ymd(+m[1],+m[2],+m[3]);
  m=v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if(m){let y=+m[3];if(y<100)y+=y>40?1900:2000;return ymd(y,+m[2],+m[1])}
  return null;
}
function ymd(y,m,d){if(m<1||m>12||d<1||d>31)return null;return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
function splitRow(line){
  if(line.includes("\t"))return line.split("\t");
  const out=[];let cur="",q=false;
  for(let i=0;i<line.length;i++){const c=line[i];
    if(q){if(c==='"'){if(line[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===","){out.push(cur);cur=""}else cur+=c}
  out.push(cur);return out;
}
function tidyName(s){return String(s).trim().replace(/\s+/g," ")}
function parseStudents(text,ageDate){
  const lines=String(text||"").split(/\r?\n/).filter(l=>l.trim());
  const ok=[],bad=[];const seen=new Map();
  lines.forEach((line,i)=>{
    if(i===0&&/surname|last\s*name/i.test(line))return;
    const c=splitRow(line).map(s=>s.trim());
    const [s,f,h,x,d]=c;
    const row={n:i+1,s:s||"",f:f||"",h:(h||"").toUpperCase().slice(0,1),x:(x||"").toUpperCase().slice(0,1),dob:d||""};
    const probs=[];
    if(!row.s||!row.f)probs.push("Name missing. Add it.");
    if(!["B","J","N"].includes(row.h))probs.push("No house. Pick one.");
    if(!["F","M"].includes(row.x))probs.push("Sex not M or F. Fix it.");
    const iso=parseDob(row.dob);const a=iso?ageOn(iso,ageDate):null;
    if(a==null)probs.push("Date of birth not clear. Fix it.");
    if(probs.length){bad.push({row,probs});return}
    const base=(row.s+"-"+row.f).toLowerCase().replace(/[^a-z0-9]+/g,"-");
    const n=(seen.get(base)||0)+1;seen.set(base,n);
    ok.push({id:"s-"+base+"-"+n,s:tidyName(row.s),f:tidyName(row.f),h:row.h,x:row.x,g:ageGroup(a)});
  });
  return {ok,bad};
}

if(typeof module!=="undefined")module.exports={TYPES,TYPE,GROUPS,DEFAULT_CONFIG,parseTime,fmtTime,oddTime,heatEffective,pointsFor,compute,programEvents,parseStudents,groupLabel,groupKey,parseSlip};
