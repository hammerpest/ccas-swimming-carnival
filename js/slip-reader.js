/* ===== Swim Opt 2.1: time slip photo reader (decision 110) =====
   Reads the photo on the phone with Tesseract.js (js/vendor/tesseract, loaded only when a real
   photo is read), then parseSlip() in core.js turns the text into the race number and lane times.
   Nothing leaves the phone to be read. */
let SLIP_OCR=null;
const SLIP_CHARS="0123456789:./ ABCDEGILMNOPSTUacemioprst";
function slipOcrLoad(){
  if(SLIP_OCR)return SLIP_OCR;
  const base=new URL("js/vendor/tesseract/",location.href).href;
  SLIP_OCR=new Promise((ok,bad)=>{
    const s=document.createElement("script");s.src=base+"tesseract.min.js";
    s.onload=async()=>{try{
      const w=await Tesseract.createWorker("eng",1,{workerPath:base+"worker.min.js",corePath:base,langPath:base,gzip:true});
      await w.setParameters({tessedit_pageseg_mode:"6",preserve_interword_spaces:"1",tessedit_char_whitelist:SLIP_CHARS});
      ok(w)}catch(e){SLIP_OCR=null;bad(e)}};
    s.onerror=()=>{SLIP_OCR=null;bad(new Error("Reader did not load"))};
    document.head.appendChild(s);
  });
  return SLIP_OCR;
}
/* grey, stretch the contrast and make it black on white, about 1400 px wide */
function slipPrepare(img,o){
  o=o||{};const scale=Math.min(o.max||4,(o.w||1800)/Math.max(img.width,1));
  const c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
  const g=c.getContext("2d");g.drawImage(img,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height),p=d.data,n=p.length/4,y=new Uint8Array(n),hist=new Array(256).fill(0);
  for(let i=0;i<n;i++){const v=Math.round(.299*p[i*4]+.587*p[i*4+1]+.114*p[i*4+2]);y[i]=v;hist[v]++}
  /* Otsu threshold */
  let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
  let sB=0,wB=0,best=0,th=128;
  for(let i=0;i<256;i++){wB+=hist[i];if(!wB)continue;const wF=n-wB;if(!wF)break;sB+=i*hist[i];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=i}}
  if(o.grey){for(let i=0;i<n;i++){p[i*4]=p[i*4+1]=p[i*4+2]=y[i];p[i*4+3]=255}g.putImageData(d,0,0);return c}
  for(let i=0;i<n;i++){const v=y[i]>th?255:0;p[i*4]=p[i*4+1]=p[i*4+2]=v;p[i*4+3]=255}
  g.putImageData(d,0,0);return c;
}
function slipImage(src){return new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(new Error("Photo did not open"));i.src=src})}
/* src: a data URL or blob URL. The photo is read twice, in grey and in black and white, and the two
   readings are compared. Only what both agree on, with confidence, is passed as sure: a lane read
   differently, or found by only one reading, goes in "unsure"; a race number the readings do not agree on
   (or are not confident of) sets raceUnsure, and the phone asks for the photo again. Lines either
   reading could not use set "Some lines not read". Returns the race, lanes, order, unsure, problems,
   missed lanes and the text read. */
function slipMerge(a,b){
  const r={race:null,raceUnsure:false,twoSlips:!!(a.twoSlips||b.twoSlips||a.far.some(l=>b.far.includes(l))),mixed:!!(a.mixed&&b.mixed),lanes:{},order:[],unsure:[],problems:[],missed:[],text:a.text+"\n----\n"+b.text};
  if(a.race!=null&&b.race!=null){r.race=a.race;if(a.race!==b.race||(a.raceLow&&b.raceLow))r.raceUnsure=true}
  else{const one=a.race!=null?a:b,other=one===a?b:a;r.race=one.race;if(one.race!=null&&(one.raceLow||other.head))r.raceUnsure=true}
  const doubt=l=>{if(!r.unsure.includes(l))r.unsure.push(l)};
  for(const l of a.order.concat(b.order.filter(x=>!a.order.includes(x)))){
    const inA=a.lanes[l]!=null,inB=b.lanes[l]!=null;
    r.lanes[l]=inA?a.lanes[l]:b.lanes[l];r.order.push(l);
    if(!inA||!inB||a.lanes[l]!==b.lanes[l])doubt(l);
    else if(a.unsure.includes(l)&&b.unsure.includes(l))doubt(l);
  }
  for(const l of a.unsure.concat(b.unsure))if(r.lanes[l]!=null&&(a.problems.some(p=>p==="Lane "+l+" twice")||b.problems.some(p=>p==="Lane "+l+" twice")))doubt(l);
  for(const l of a.missed.concat(b.missed))if(r.lanes[l]==null&&!r.missed.includes(l))r.missed.push(l);
  const seen=x=>x.order.length+x.problems.filter(p=>p==="A time with no lane"||p==="A time not read"||p==="A stop line not read"||/no time read|not on this pool/.test(p)).length;
  if(r.missed.length||r.order.length<Math.max(seen(a),seen(b))||(a.problems.length&&b.problems.length)||a.problems.concat(b.problems).includes("A stop line not read"))r.problems=["Some lines not read"];
  return r;
}
async function readSlipPhoto(src,maxLanes){
  const [w,img]=await Promise.all([slipOcrLoad(),slipImage(src)]);
  const look=async o=>{const c=slipPrepare(img,o);const {data}=await w.recognize(c);const r=parseSlip(data.lines&&data.lines.length?data.lines:data.text,maxLanes);r.text=data.text;r.canvas=c;r.lines=data.lines||[];return r};
  const a=await look({grey:true}),b=await look({});
  const m=slipMerge(a,b);
  /* Swim Opt 2.20: the printer leaves a wide gap in "LANE MODE 1/ 1", which the whole-slip readings can misread.
     Only when the two readings give different race numbers (or only one finds it) is the LANE MODE line read again
     close up, digits only, to settle it. When both readings agree but are not sure, the photo is still refused:
     close-ups of the same blurred digits are no extra proof (check 3: a blurred race 10 read as 19 every way) */
  if(m.raceUnsure&&a.race!==b.race)slipRaceVote(m,a,b,await slipRaceClose(w,img,a,b));
  return m;
}
/* Close-ups of the LANE MODE line (right of MODE), read as one line of digits and "/": from each reading's prepared
   picture (enlarged 2 and 3 times; the surer of the two counts once) and from the original photo (enlarged, in grey and in
   black and white set for that small piece alone). Each gives at most one race number with its confidence. */
function slipRaceText(t){
  const sl=t.lastIndexOf("/");if(sl<0)return null;
  let ns=t.slice(sl+1).trim().split(/\s+/).filter(x=>/^\d{1,3}$/.test(x));
  /* the printer's "/" and the gap after it often read as "/7": "1/ 1" comes back as "1/7 1" */
  if(ns.length===2&&ns[0]==="7")ns=ns.slice(1);
  return ns.length===1?+ns[0]:null;
}
async function slipRaceClose(w,img,a,b){
  const find=x=>(x.lines||[]).find(l=>/M[O0]DE/i.test(l.text||""));
  const box=(r,L)=>{const mw=(L.words||[]).find(x=>/M[O0]DE/i.test(x.text||""));return {x0:Math.max(0,(mw&&mw.bbox?mw.bbox.x1:L.bbox.x0)+2),y0:Math.max(0,L.bbox.y0-6),y1:Math.min(r.canvas.height,L.bbox.y1+6)}};
  const enlarge=(src,x0,y0,cw,ch,S)=>{const cc=document.createElement("canvas");cc.width=Math.round(cw*S);cc.height=Math.round(ch*S);
    const g=cc.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,cc.width,cc.height);g.drawImage(src,x0,y0,cw,ch,0,0,cc.width,cc.height);return cc};
  const read=async c=>{const {data}=await w.recognize(c);return {race:slipRaceText(String(data.text||"").trim()),conf:+data.confidence||0}};
  const best=list=>{const ok=list.filter(x=>x.race!=null).sort((p,q)=>q.conf-p.conf);return ok[0]||null};
  const out=[];
  try{
    await w.setParameters({tessedit_pageseg_mode:"7",tessedit_char_whitelist:"0123456789/ "});
    for(const r of [a,b]){
      const L=find(r);if(!L||!L.bbox||!r.canvas)continue;const B=box(r,L),cw=r.canvas.width-B.x0,ch=B.y1-B.y0;if(cw<10||ch<6)continue;
      const x=best([await read(enlarge(r.canvas,B.x0,B.y0,cw,ch,2)),await read(enlarge(r.canvas,B.x0,B.y0,cw,ch,3))]);if(x)out.push(x);
    }
    const r=find(a)?a:b,L=find(r);
    if(L&&L.bbox&&r.canvas){
      const k=img.width/r.canvas.width,B=box(r,L),x0=B.x0*k,y0=B.y0*k,cw=img.width-x0,ch=(B.y1-B.y0)*k;
      if(cw>=6&&ch>=4){const cut=enlarge(img,x0,y0,cw,ch,1),big=Math.min(8,Math.max(3,90/ch));
        for(const o of [{grey:true},{}]){const x=await read(slipPrepare(cut,Object.assign({w:cut.width*big,max:big},o)));if(x.race!=null)out.push(x)}}
    }
  }catch(e){}
  finally{await w.setParameters({tessedit_pageseg_mode:"6",tessedit_char_whitelist:SLIP_CHARS})}
  return out;
}
/* a race number counts only when a sure close-up (the usual confidence) and one of the whole-slip readings agree on it,
   and no other number has two readings: the two-readings rule that stops a slip going to the wrong race stays */
function slipRaceVote(m,a,b,f){
  const votes=[a.race,b.race].filter(x=>x!=null);const sure=[];
  for(const x of f)if(x.conf>=SLIP_CONF){votes.push(x.race);sure.push(x.race)}
  const count=n=>votes.filter(v=>v===n).length;
  const ok=[...new Set(sure)].filter(n=>count(n)>=2&&(n===a.race||n===b.race));
  const rivals=[...new Set(votes)].filter(n=>count(n)>=2);
  if(ok.length===1&&rivals.length===1){m.race=ok[0];m.raceUnsure=false;m.raceClose=true}
}
