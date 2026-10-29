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
/* src: a data URL or blob URL. Reads the photo in grey first; when something is missing or doubtful,
   reads it again in black and white and fills the gaps from that second look (a lane both looks read
   differently is marked unsure). Returns parseSlip()'s result plus the text read. */
function slipMerge(a,b){
  const r={race:a.race!=null?a.race:b.race,lanes:Object.assign({},a.lanes),order:a.order.slice(),unsure:a.unsure.slice(),problems:[],text:a.text+"\n----\n"+b.text};
  for(const l of b.order){
    if(r.lanes[l]==null){r.lanes[l]=b.lanes[l];r.order.push(l);if(b.unsure.includes(l))r.unsure.push(+l)}
    else if(r.lanes[l]!==b.lanes[l]){if(!r.unsure.includes(+l))r.unsure.push(+l)}
    else if(r.unsure.includes(+l)&&!b.unsure.includes(l))r.unsure=r.unsure.filter(x=>x!==+l);
  }
  if(a.race!=null&&b.race!=null&&a.race!==b.race)r.raceUnsure=true;
  /* a line one look could not place is fine if the other look found as many lanes as it saw lines */
  const seen=x=>x.order.length+x.problems.filter(p=>p==="A time with no lane").length;
  if(r.order.length<Math.max(seen(a),seen(b)))r.problems=["Some lines not read"];
  return r;
}
async function readSlipPhoto(src,maxLanes){
  const [w,img]=await Promise.all([slipOcrLoad(),slipImage(src)]);
  const look=async o=>{const {data}=await w.recognize(slipPrepare(img,o));const r=parseSlip(data.text,maxLanes);r.text=data.text;return r};
  const a=await look({grey:true});
  if(a.race!=null&&a.order.length&&!a.unsure.length&&!a.problems.length)return a;
  return slipMerge(a,await look({}));
}
