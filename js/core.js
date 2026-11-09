/* ===== Swim Opt 1: core rules (no screen code) ===== */
const TYPES=[
  {k:"fly50",name:"50 m butterfly",btn:"50 m fly",dist:50,stroke:"Butterfly",gk:"age",start:"8:55 am"},
  {k:"back50",name:"50 m backstroke",btn:"50 m back",dist:50,stroke:"Backstroke",gk:"age",start:"9:15 am"},
  {k:"free50",name:"50 m freestyle",btn:"50 m free",dist:50,stroke:"Freestyle",gk:"age",start:"10:00 am"},
  {k:"free100",name:"100 m freestyle",btn:"100 m free",dist:100,stroke:"Freestyle",gk:"age",start:"10:45 am"},
  {k:"breast50",name:"50 m breaststroke",btn:"50 m breast",dist:50,stroke:"Breaststroke",gk:"age",start:"11:30 am"},
  {k:"free200",name:"200 m freestyle",btn:"200 m free",dist:200,stroke:"Freestyle",gk:"band",start:"12:15 pm",noPrimary:true},
  {k:"relayfree",name:"4 x 50 m freestyle relay",btn:"Free relay",dist:200,stroke:"Freestyle",gk:"band",relay:true,start:"1:00 pm"},
  {k:"relaymed",name:"4 x 50 m medley relay",btn:"Medley relay",dist:200,stroke:"Medley",gk:"open",relay:true,start:"1:25 pm",optional:true}
];
const TYPE=Object.fromEntries(TYPES.map(t=>[t.k,t]));
const GROUPS={age:["13","14","15","16","17","18"],band:["J","I","S"],open:["O"],y12:["Y12"]};
const AGE_GROUPS=GROUPS.age;
const BAND_OF={"13":"J","14":"J","15":"I","16":"I","17":"S","18":"S"};
const BAND_AGES={J:["13","14"],I:["15","16"],S:["17","18"]};
/* Swim Opt 2.18 (S1.44, decisions 160 to 164): a carnival is Primary (ages 8 to 12) or Secondary (13 to 18),
   and each age can be turned off. A student's g is their age, kept inside the carnival's range (13 holds
   13 and under, 18 holds 18 and over, 8 holds 8 and under, 12 holds 12 and over). ageGrp(g) gives the age
   group they swim in: an age turned off swims with the youngest age on (if younger) or the next age up.
   Primary relays are Junior (8 to 10) and Senior (11 and 12), freestyle and medley; no 200 m freestyle. */
const LEVELS={
  secondary:{name:"Secondary",ages:["13","14","15","16","17","18"],bands:{J:["13","14"],I:["15","16"],S:["17","18"]}},
  primary:{name:"Primary",ages:["8","9","10","11","12"],bands:{PJ:["8","9","10"],PS:["11","12"]}}
};
function carnLevel(cfg){return cfg&&cfg.level==="primary"?"primary":"secondary"}
function levelAgesOn(cfg){
  const L=LEVELS[carnLevel(cfg)];const off=new Set(((cfg&&cfg.agesOff)||{})[carnLevel(cfg)]||[]);
  const on=L.ages.filter(a=>!off.has(a));return on.length?on:L.ages.slice();
}
function setAll(arr,vals){arr.splice(0,arr.length,...vals)}
function setObj(o,vals){for(const k of Object.keys(o))delete o[k];Object.assign(o,vals)}
/* point the shared group lists at this carnival's ages (changes them in place, so every screen follows) */
function applyAges(cfg){
  const lv=carnLevel(cfg),L=LEVELS[lv];const on=levelAgesOn(cfg);
  setAll(GROUPS.age,on);
  const bands=Object.keys(L.bands).filter(b=>L.bands[b].some(a=>on.includes(a)));
  setAll(GROUPS.band,bands.length?bands:Object.keys(L.bands));
  setObj(BAND_AGES,L.bands);
  const of={};for(const b in L.bands)for(const a of L.bands[b])of[a]=b;
  for(const a of on)if(!of[a])of[a]=null;
  setObj(BAND_OF,of);
  TYPE.relaymed.gk=lv==="primary"?"band":"open";
  return on;
}
function typeOn(p,cfg){const t=TYPE[p.k];return !!(t&&p.on&&!(t.noPrimary&&carnLevel(cfg)==="primary"))}
function ageGrp(g){
  const on=GROUPS.age;if(g==null||!on.length)return g;g=String(g);if(on.includes(g))return g;
  const n=+g;if(isNaN(n))return g;
  if(n<+on[0])return on[0];
  const up=on.find(a=>+a>=n);return up||on[on.length-1];
}
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
  const on=GROUPS.age;
  if(on.includes(g)){if(g===on[0]&&on.length>1)return g+" & under";if(g===on[on.length-1])return g+"+";return g}
  if(g==="13")return "13";if(g==="18")return "18";
  if(g==="J"||g==="PJ")return "Junior";if(g==="I")return "Intermediate";if(g==="S"||g==="PS")return "Senior";
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
  applyAges(cfg);
  for(const p of prog){
    const t=TYPE[p.k];if(!typeOn(p,cfg))continue;
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
  for(const ln in laneTimes){const v=laneTimes[ln];if(v&&!noTimeSt(v.st)&&v.t!=null)ok[ln]=v.t}
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

/* a lane status that means no time counts: DNS, DQ, or No time (decision 144) */
function noTimeSt(st){return st==="DNS"||st==="DQ"||st==="NT"}
function stName(st){return st==="NT"?"No time":st}
/* A late slip never overwrites what the Recorder typed (decision 136). A lane typed by the Recorder, or
   given a status (DNS, DQ, No time), keeps its value; where the slip has a different time, it is kept
   beside the lane as "slip" so the Recorder sees "Slip differs" and picks. A checked race stays checked
   when the slip changes nothing. A slip for an earlier run of a re-swum race (gen) starts fresh.
   supabase/01-setup.sql does the same on the server for photos that wait in the queue. */
function lateSlip(old,neu){
  if(!old)return neu;
  /* Swim Opt 2.11: a send from before a re-swim (an older gen) never replaces the re-swim's times */
  if((neu.gen||0)<(old.gen||0))return old;
  if((old.gen||0)!==(neu.gen||0))return neu;
  const ol=old.lanes||{},nl=neu.lanes||{};const lanes={};let changed=false;
  for(const l of new Set([...Object.keys(ol),...Object.keys(nl)])){
    const o=ol[l],n=nl[l];
    if(o&&(o.src==="typed"||noTimeSt(o.st))){
      lanes[l]=Object.assign({},o);
      if(n&&n.t!=null&&n.t!==o.t)lanes[l].slip=n.t;else delete lanes[l].slip;
    }else if(n){lanes[l]=n;if(!o||o.t!==n.t||o.st!==n.st)changed=true}
    else lanes[l]=o;
  }
  const out=Object.assign({},neu,{lanes});
  if(!changed&&old.checked){out.checked=true;out.checkedAt=old.checkedAt;if(old.checkedBy)out.checkedBy=old.checkedBy}
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
    /* a re-swum race keeps its number (decision 134): times, places and slips from an earlier run
       (an older gen) no longer count */
    const gen=h.gen||0;const cur=d=>d&&(d.gen||0)===gen?d:null;
    const T=cur((S.times||{})[id])||{};
    const F=cur((S.finish||{})[id])||{};
    const slip=cur(S.slips&&S.slips[id]);
    const lanes=h.lanes||{};
    /* a cancelled race keeps its lanes on screen, but none of them counts */
    const filled=h.cancelled?[]:Object.keys(lanes).filter(l=>lanes[l]);
    const lt=T.lanes||{};
    /* Swim Opt 2.12 (decision 154): multitimer places are worked out from the whole tap order each time,
       so a lane marked DNS, DQ or No time gets no place, and gets it back if the mark is taken off (Use slip) */
    const FO=F.multi&&Array.isArray(F.taps)?F.taps.filter(l=>lanes[l]&&!(lt[l]&&noTimeSt(lt[l].st))).slice(0,F.n||4).map(l=>[l]):(F.order||[]);
    /* only marshalled lanes count; a slip time for an empty lane is shown to the Recorder as "extra" */
    const ltIn={};for(const l of filled)if(lt[l])ltIn[l]=lt[l];
    const eff=heatEffective(ltIn,FO.map(g=>g.filter(l=>lanes[l])).filter(g=>g.length));
    const extra=Object.keys(lt).filter(l=>!lanes[l]&&lt[l]&&lt[l].t!=null&&!noTimeSt(lt[l].st)).map(Number).sort((a,b)=>a-b);
    const placeTaps=finishOrderFromTaps(FO);
    const nTimes=filled.filter(l=>lt[l]&&(lt[l].t!=null||noTimeSt(lt[l].st))).length;
    const nOk=filled.filter(l=>lt[l]&&lt[l].t!=null&&!noTimeSt(lt[l].st)).length;
    const flagged=filled.filter(l=>{const v=lt[l];return v&&v.t!=null&&!noTimeSt(v.st)&&!v.keep&&(oddTime(h.k,v.t,cfg.limits)||v.chk)}).length;
    const differs=filled.filter(l=>lt[l]&&lt[l].slip!=null&&lt[l].slip!==lt[l].t).map(Number);
    const need=Math.min(4,filled.length);
    const dh=FO.map(g=>g.map(String).filter(l=>lanes[l])).filter(g=>g.length>1);
    const tapped=Object.keys(placeTaps).filter(l=>lanes[l]).length;
    /* a lane changed after Times checked sends the race back to "To check" (decision 113); two minutes
       either way allows for device clocks that differ, so a doubtful change is checked again */
    /* a place change after Times checked also sends the race back (A2). The Place Judge's device saves
       the checkedAt it saw (ck), so no device clocks are compared */
    const checked=!!T.checked&&!(h.edited&&T.checkedAt&&h.edited>T.checkedAt-120000)&&!(F.ck&&T.checkedAt&&F.ck>=T.checkedAt);
    /* decision 143: Times checked is optional. A heat is done when every filled lane has a time or a status
       and the places are in (top 4 of the swimmers with a time, or fewer confirmed by the Place Judge),
       or when the Recorder has checked it */
    const allIn=nTimes===filled.length;
    const placesIn=!!F.ok||tapped>=Math.min(4,nOk);
    /* a late slip that differs from a typed time waits for the Recorder to pick (decision 136) */
    const done=!h.cancelled&&!differs.length&&(allIn&&(placesIn||checked));
    let tstatus="Waiting for slip";
    if(h.cancelled)tstatus="Cancelled";
    else if(nTimes)tstatus=checked?"Checked":"To check";
    const doneAt=Math.max(h.at||0,T.at||0,T.checkedAt||0,F.at||0,(slip&&slip.at)||0);
    const r={race:h.race,heat:h.heat,k:h.k,x:h.x,g:h.g,key,label:groupLabel(h.k,h.x,h.g),lanes,filled,times:lt,eff,placeTaps,FO,
      tstatus,checked,checkedAt:T.checkedAt||0,nTimes,nOk,flagged,need,tapped,placesIn,allIn,done,doneAt,differs,dh,extra,src:T.src||null,hasSlip:!!slip,
      gen,T,F,slip,cancelled:!!h.cancelled};
    races.set(h.race,r);
    if(h.cancelled)continue;
    const G=ensure(key);G.heats.push(r);
  }
  for(const G of groups.values()){
    const t=TYPE[G.k];const rows=[];
    for(const r of G.heats){
      for(const ln of r.filled){
        const p=who(r.lanes[ln]);const v=r.times[ln]||{};const e=r.eff[ln];
        rows.push({id:r.lanes[ln],p,race:r.race,heat:r.heat,lane:+ln,st:v.st||(v.t!=null?"ok":"wait"),rec:v.t!=null&&v.st!=="NT"?v.t:null,eff:e?e.eff:null,pink:!!(e&&e.pink),judge:r.placeTaps[ln]||null,dh:r.dh.some(g=>g.includes(String(ln))),place:null,pts:0});
      }
    }
    const ok=rows.filter(x=>x.eff!=null).sort((a,b)=>a.eff-b.eff);
    let i=0;
    while(i<ok.length){
      let j=i;while(j<ok.length&&ok[j].eff===ok[i].eff)j++;
      /* equal times: inside one heat the Place Judge's order splits them; across heats they stay a tie
         (Swim Opt 2.6). A swimmer's rank among the equal times of their own heat sets the order, and
         equal ranks from different heats share the place */
      const blk=ok.slice(i,j);const jp=x=>x.judge||99;
      const rank=new Map(blk.map(x=>[x,1+blk.filter(y=>y.race===x.race&&jp(y)<jp(x)).length]));
      blk.sort((a,b)=>rank.get(a)-rank.get(b));
      let q=0;
      while(q<blk.length){
        let e=q;while(e<blk.length&&rank.get(blk[e])===rank.get(blk[q]))e++;
        const size=e-q;const pts=pointsFor(i+q+1,size,P,!!t.nopts);
        for(let n=q;n<e;n++){blk[n].place=i+q+1;blk[n].pts=pts;blk[n].tie=size>1}
        q=e;
      }
      ok.splice(i,j-i,...blk);
      i=j;
    }
    /* No time (decision 144): no place, but the 4th-and-below points for the swimmer and the house */
    const others=rows.filter(x=>x.eff==null).sort((a,b)=>(a.st==="wait")-(b.st==="wait")||a.race-b.race||a.lane-b.lane);
    for(const x of others)if(x.st==="NT")x.pts=t.nopts?0:P.rest;
    G.rows=[...ok,...others];
    G.allChecked=G.heats.length>0&&G.heats.every(h=>h.checked);
    G.allDone=G.heats.length>0&&G.heats.every(h=>h.done);
    G.open=!!(S.openGroups&&S.openGroups.has(G.key));
    G.final=G.allDone&&!G.open;
    G.status=G.final?"Final":"Provisional";
    /* when the group became final: the latest change to any of its heats (keeps the Announcer's order) */
    G.checkedAt=Math.max(0,...G.heats.map(h=>h.doneAt||0));
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
  /* a group nobody swam can be marked "Not swum" by the organiser (A9): it counts as final */
  const notSwum=new Set(cfg.notSwum||[]);
  function isFinal(key){const G=groups.get(key);return G?G.final:notSwum.has(key)}
  /* houses and champions */
  const house={};for(const h of HOUSES)house[h.c]={c:h.c,n:h.n,byAge:Object.fromEntries(AGE_GROUPS.map(a=>[a,0])),relay:0,indiv:0,total:0};
  const champ={};
  for(const G of groups.values()){
    const t=TYPE[G.k];if(t.nopts)continue;
    for(const r of G.rows){
      if(!r.pts||!r.p||!house[r.p.h])continue;
      if(t.relay){house[r.p.h].relay+=r.pts}
      else{
        const ag=r.p.g?ageGrp(r.p.g):G.g;
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
    /* joint champions: no runner up beside them (decision 145) */
    const second=winners.length>1?null:list.find(r=>r.pts<top);
    const runners=second?list.filter(r=>r.pts===second.pts):[];
    /* races that count: 5 age races + 200 m band race */
    const counting=events.filter(e=>e.x===x&&((TYPE[e.k].gk==="age"&&e.g===ag)||(e.k==="free200"&&e.g===BAND_OF[ag])));
    const done=counting.filter(e=>isFinal(e.key)).length;
    champs[ck]={winners,runners,done,of:counting.length};
  }
  const finalCount=events.filter(e=>isFinal(e.key)).length;
  const maxRace=heats.length?heats[heats.length-1].race:0;
  return {cfg,P,events,groups,races,heats,house,houseRank,champs,broken,finalCount,maxRace,who,isFinal,notSwum};
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
function ageGroup(a,level){if(a==null)return null;const L=(LEVELS[level]||LEVELS.secondary).ages;const lo=+L[0],hi=+L[L.length-1];
  if(a<=lo)return String(lo);if(a>=hi)return String(hi);return String(a)}
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
function parseStudents(text,ageDate,level){
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
    ok.push({id:"s-"+base+"-"+n,s:tidyName(row.s),f:tidyName(row.f),h:row.h,x:row.x,g:ageGroup(a,level)});
  });
  return {ok,bad};
}

/* ===== HY3 file for HRIS (decisions 100, 132; layout in PROJECT-STATE 2.29) =====
   Fixed width: every line is 130 characters, columns 129-130 are a checksum.
   Top 2 in every race and group (the HRIS Team List), carnival times as seed times.
   DOB comes from dobOf(id) on the organiser's computer and is never stored.
   missing: swimmers left out (no house, no clear DOB). provisional: races not final yet. */
const HY3_TEAM={B:"BRA",J:"JAC",N:"NEW"};
const HY3_STROKE={Freestyle:"A",Backstroke:"B",Breaststroke:"C",Butterfly:"D",Medley:"E"};
const HY3_AGES={J:[0,14],I:[15,16],S:[17,109],PJ:[0,10],PS:[11,109],O:[0,109],Y12:[0,109]};
/* an age group's range: the youngest age on is "and under" (0), the oldest "and over" (109) */
function hy3Ages(g){
  if(HY3_AGES[g])return HY3_AGES[g];const on=GROUPS.age;const n=+g;if(isNaN(n))return [0,109];
  return [g===on[0]?0:n,g===on[on.length-1]?109:n];
}
function hy3Check(body){
  let s=0;for(let i=0;i<128;i++)s+=body.charCodeAt(i)*(i%2?2:1);
  const v=String(Math.floor(s/21)+205).slice(-2).padStart(2,"0");
  return v[1]+v[0];
}
function hy3Line(code,parts){
  const b=Array(128).fill(" ");b[0]=code[0];b[1]=code[1];
  for(const [col,txt] of parts){const t=String(txt);for(let i=0;i<t.length;i++)if(col-1+i<128)b[col-1+i]=t[i]}
  const body=b.join("");return body+hy3Check(body);
}
function hy3Ascii(v){return String(v||"").replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014]/g,"-").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g,"")}
function hy3Date(iso){const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[2]+m[3]+m[1]:"        "}
function hy3Time(cs){return ((cs/100).toFixed(2)).padStart(8)}
function hy3Event(G,ev,cfg,course,place,cs,pre){
  const t=TYPE[G.k];const ag=hy3Ages(G.g);const dist=t.relay?t.dist/4:t.dist;
  return pre.concat([[14,G.x],[15,G.x==="F"?"G":"B"],[16,String(dist).padStart(6)],[22,HY3_STROKE[t.stroke]||"A"],
    [23,String(ag[0]).padStart(3)],[26,String(ag[1]).padStart(3)],[29,"  0U"],[33,"  0.00"],[39,String(ev.no).padStart(4)],
    [43,hy3Time(cs)+course],[52,hy3Time(cs)+course],[61,"    0.00"],[69,"    0.00"],[77,"  0NN"],[85,String(place).padStart(4)]]);
}
function hy3File(R,cfg,dobOf,now){
  cfg=Object.assign({},DEFAULT_CONFIG,cfg||{});now=now||new Date();applyAges(cfg);
  const course=String(cfg.poolLen)==="25"?"S":"L";
  const p2=n=>String(n).padStart(2,"0");
  const made=p2(now.getMonth()+1)+p2(now.getDate())+now.getFullYear();
  const hr=now.getHours(),clock=((hr%12)||12)+":"+p2(now.getMinutes())+(hr<12?" AM":" PM");
  const day=hy3Date(cfg.date);
  const out=[
    hy3Line("A1",[[3,"08"],[5,"Merge Advancer Entries"],[30,"Hy-Tek, Ltd"],[45,"MM5 7.0Gb"],[59,made],[67,clock.padStart(9)],[76,"Central Coast Adventist School"]]),
    hy3Line("B1",[[3,hy3Ascii(cfg.name).slice(0,45)],[48,hy3Ascii(cfg.pool).slice(0,45)],[93,day],[101,day],[109,hy3Date(cfg.ageDate)],[120,"0"]]),
    hy3Line("B2",[[93,"040101"+course+"1"],[101,"  0.00"]])
  ];
  const team=h=>hy3Line("C1",[[3,(HY3_TEAM[h]||h).padEnd(5)],[8,houseName(h)],[119,"0"],[122,"0"]]);
  const nums=new Map(),missing=[],provisional=[];let entries=0;
  const evs=(R.events||[]).slice().sort((a,b)=>a.no-b.no);
  for(const ev of evs){
    const G=R.groups.get(ev.key);if(!G||TYPE[G.k].nopts)continue;
    if(!G.final&&G.rows.some(r=>r.hris))provisional.push(groupLabel(G.k,G.x,G.g));
    for(const r of G.rows.filter(r=>r.hris&&r.eff!=null).sort((a,b)=>a.place-b.place)){
      const p=r.p;if(!p||!HY3_TEAM[p.h]){missing.push((p&&p.name)||"Unknown swimmer");continue}
      if(p.team){
        out.push(team(p.h));
        out.push(hy3Line("F1",hy3Event(G,ev,cfg,course,r.place,r.eff,[[3,HY3_TEAM[p.h].padEnd(5)],[8,p.id.split("-")[1]||"A"],[12,"0"]])));
        entries++;continue;
      }
      const dob=dobOf?dobOf(p.id):null;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(dob||"")||ageOn(dob,cfg.ageDate)==null){missing.push(p.name||p.id);continue}
      if(!nums.has(p.id))nums.set(p.id,nums.size+101);
      const n=nums.get(p.id),id=String(10000+n),sx=p.x||G.x;const age=ageOn(dob,cfg.ageDate);
      out.push(team(p.h));
      out.push(hy3Line("D1",[[3,sx],[4,id],[9,hy3Ascii(p.s).slice(0,20)],[29,hy3Ascii(p.f).slice(0,20)],[70,String(n).padStart(3)],[86,String(n-1).padStart(3)],[89,hy3Date(dob)],[97,String(age==null?"":age).padStart(3)],[105,"0"],[125,"N"]]));
      out.push(hy3Line("E1",hy3Event(G,ev,cfg,course,r.place,r.eff,[[3,sx],[4,id],[9,hy3Ascii(p.s).slice(0,5)]])));
      entries++;
    }
  }
  return {text:out.join("\r\n")+"\r\n",entries,swimmers:nums.size,missing,provisional};
}

if(typeof module!=="undefined")module.exports={TYPES,TYPE,GROUPS,LEVELS,applyAges,ageGrp,ageGroup,grpName,typeOn,levelAgesOn,carnLevel,BAND_AGES,BAND_OF,DEFAULT_CONFIG,lateSlip,noTimeSt,parseTime,fmtTime,oddTime,heatEffective,pointsFor,compute,programEvents,parseStudents,groupLabel,groupKey,parseSlip,hy3File,hy3Line,hy3Check};
