/* ===== Swim Opt 2.1: time slip photo reader (decision 110) =====
   Reads the photo on the phone with Tesseract.js (js/vendor/tesseract, loaded only when a real
   photo is read), then parseSlip() in core.js turns the text into the race number and lane times.
   Nothing leaves the phone to be read. */
let SLIP_OCR=null;
function slipOcrLoad(){
  if(SLIP_OCR)return SLIP_OCR;
  const base=new URL("js/vendor/tesseract/",location.href).href;
  SLIP_OCR=new Promise((ok,bad)=>{
    const s=document.createElement("script");s.src=base+"tesseract.min.js";
    s.onload=async()=>{try{
      const w=await Tesseract.createWorker("eng",1,{workerPath:base+"worker.min.js",corePath:base,langPath:base,gzip:true});
      await w.setParameters({tessedit_pageseg_mode:"6",preserve_interword_spaces:"1",tessedit_char_whitelist:"0123456789:./ ABCDEGILMNOPSTUacemioprst"});
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
  const r={race:null,raceUnsure:false,twoSlips:!!(a.twoSlips||b.twoSlips),lanes:{},order:[],unsure:[],problems:[],missed:[],text:a.text+"\n----\n"+b.text};
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
  const seen=x=>x.order.length+x.problems.filter(p=>p==="A time with no lane"||p==="A time not read"||/no time read|not on this pool/.test(p)).length;
  if(r.missed.length||r.order.length<Math.max(seen(a),seen(b))||(a.problems.length&&b.problems.length))r.problems=["Some lines not read"];
  return r;
}
async function readSlipPhoto(src,maxLanes){
  const [w,img]=await Promise.all([slipOcrLoad(),slipImage(src)]);
  const look=async o=>{const {data}=await w.recognize(slipPrepare(img,o));const r=parseSlip(data.lines&&data.lines.length?data.lines:data.text,maxLanes);r.text=data.text;return r};
  const a=await look({grey:true});
  return slipMerge(a,await look({}));
}
