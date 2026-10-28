/* ===== Storage layer (swappable). Claude store now; Supabase later with the same calls. =====
   Store API: mode, onDoc(path,cb), onCol(col,cb), get(path), set(path,data), update(path,data), del(path),
   nextRace(dev) -> number, presence(obj), onPeers(cb), pending() */
const DEV=(()=>{let d=null;try{d=sessionStorage.getItem("swim_dev")}catch(e){}if(!d){const a=new Uint32Array(2);try{crypto.getRandomValues(a)}catch(e){a[0]=Date.now();a[1]=performance.now()*1000}d="d"+a[0].toString(36)+a[1].toString(36);try{sessionStorage.setItem("swim_dev",d)}catch(e){}}return d})();
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function withTimeout(p,ms){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej({code:"timeout"}),ms))])}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* --- offline queue shared by both stores --- */
function makeQueue(write,onChange){
  let q=lsGet("swim_queue",[]);let busy=false;
  const save=()=>{lsSet("swim_queue",q);onChange&&onChange(q.length)};
  async function flush(){
    if(busy||!q.length)return;busy=true;
    while(q.length){
      const w=q[0];
      try{await withTimeout(write(w),8000);q.shift();save()}
      catch(e){if(e&&e.code==="invalid_argument"){q.shift();save();continue}break}
    }
    busy=false;
  }
  setInterval(flush,8000);
  if(typeof window!=="undefined")window.addEventListener("online",flush);
  return {
    async run(w){
      if(q.length){q.push(w);save();flush();return {queued:true}}
      try{await withTimeout(write(w),8000);return {ok:true}}
      catch(e){if(e&&e.code==="invalid_argument")throw e;q.push(w);save();return {queued:true}}
    },
    size:()=>q.length,flush
  };
}

/* --- Claude shared store (db + room capabilities) --- */
async function claudeStore(onQueue){
  if(!window.claude||!window.claude.use)return null;
  let db=null,room=null;
  try{[db,room]=await Promise.all([window.claude.use("db"),window.claude.use("room")])}catch(e){}
  if(!db)return null;
  const ref=p=>p.split("/").length%2===0?db.doc(p):null;
  const write=w=>{
    const r=db.doc(w.path);
    if(w.op==="set")return r.set(w.data);
    if(w.op==="update")return r.update(w.data);
    if(w.op==="del")return r.delete();
  };
  const queue=makeQueue(write,onQueue);
  let peersCb=[];let myPres={};
  if(room){
    try{room.onPeers(ch=>{const list=ch.peers.map(p=>p.presence||{});peersCb.forEach(cb=>cb(list))},()=>{})}catch(e){}
  }
  return {
    mode:"claude",
    onDoc(path,cb){return db.doc(path).onSnapshot(s=>cb(s.exists?s.data():null),e=>cb(null,e))},
    onCol(col,cb){return db.collection(col).onSnapshot(s=>cb(s.docs.map(d=>Object.assign({_id:d.id},d.data()))),e=>cb([],e))},
    async get(path){const s=await db.doc(path).get();return s.exists?s.data():null},
    set(path,data){return queue.run({op:"set",path,data})},
    async update(path,data){
      try{return await queue.run({op:"update",path,data})}
      catch(e){if(e&&e.code==="invalid_argument")return queue.run({op:"set",path,data});throw e}
    },
    del(path){return queue.run({op:"del",path})},
    async nextRace(){
      /* lease on the counter: one marshal at a time, no repeats, no gaps */
      const r=db.doc("counter/race");
      for(let i=0;i<40;i++){
        let lease=null;
        try{lease=await withTimeout(r.acquire({holder:DEV,ttlMs:2500}),6000)}catch(e){throw {code:"offline"}}
        if(lease&&lease.acquired){
          const s=await r.get();const d=s.exists?s.data():{};
          const n=Number(d.next)||1;
          await r.set({next:n+1,by:DEV,at:Date.now()});
          return n;
        }
        await sleep(250+Math.random()*250);
      }
      throw {code:"busy"};
    },
    presence(obj){myPres=Object.assign(myPres,obj);if(room){try{room.presence(Object.assign({dev:DEV},obj))}catch(e){}}},
    onPeers(cb){peersCb.push(cb)},
    hasRoom:!!room,
    pending:()=>queue.size(),flush:()=>queue.flush()
  };
}

/* --- Local store: this device only (tabs on one device stay in step). Used for preview and testing. --- */
function localStore(onQueue){
  const PFX="swim_db:";
  const ch=("BroadcastChannel" in window)?new BroadcastChannel("swim_db"):null;
  const docSubs=new Map(),colSubs=new Map();
  const readAll=()=>{const out={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX))out[k.slice(PFX.length)]=JSON.parse(localStorage.getItem(k))}}catch(e){}return out};
  const mem=readAll();
  const fire=(path)=>{
    (docSubs.get(path)||[]).forEach(cb=>cb(mem[path]||null));
    const col=path.split("/").slice(0,-1).join("/");
    (colSubs.get(col)||[]).forEach(cb=>cb(colDocs(col)));
  };
  const colDocs=col=>Object.keys(mem).filter(p=>p.startsWith(col+"/")&&p.split("/").length===col.split("/").length+1).sort().map(p=>Object.assign({_id:p.split("/").pop()},mem[p]));
  const put=(path,data)=>{if(data==null)delete mem[path];else mem[path]=data;try{if(data==null)localStorage.removeItem(PFX+path);else localStorage.setItem(PFX+path,JSON.stringify(data))}catch(e){}fire(path);if(ch)ch.postMessage({path,data})};
  if(ch)ch.onmessage=e=>{const {path,data,pres,hello,bye}=e.data||{};
    if(hello){const me=peers.get(DEV);if(me)ch.postMessage({pres:me});return}
    if(bye){peers.delete(bye);emitPeers();return}
    if(pres){peers.set(pres.dev,pres);emitPeers();return}if(data==null)delete mem[path];else mem[path]=data;fire(path)};
  const merge=(a,b)=>{const o=Object.assign({},a||{});for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=merge(o[k],b[k]);else o[k]=b[k]}return o};
  const peers=new Map();let peersCb=[];
  const emitPeers=()=>{const list=[...peers.values()];peersCb.forEach(cb=>cb(list))};
  let counterLock=Promise.resolve();
  /* test mode: ask other tabs who is here, and say goodbye on close */
  if(ch){setTimeout(()=>ch.postMessage({hello:true}),50);window.addEventListener("pagehide",()=>{try{ch.postMessage({bye:DEV})}catch(e){}})}
  return {
    mode:"local",
    onDoc(path,cb){(docSubs.get(path)||docSubs.set(path,[]).get(path)).push(cb);setTimeout(()=>cb(mem[path]||null));return()=>{}},
    onCol(col,cb){(colSubs.get(col)||colSubs.set(col,[]).get(col)).push(cb);setTimeout(()=>cb(colDocs(col)));return()=>{}},
    async get(path){return mem[path]||null},
    async set(path,data){put(path,JSON.parse(JSON.stringify(data)));return {ok:true}},
    async update(path,data){put(path,merge(mem[path],JSON.parse(JSON.stringify(data))));return {ok:true}},
    async del(path){put(path,null);return {ok:true}},
    async nextRace(){
      const run=async()=>{const d=mem["counter/race"]||{};const n=Number(d.next)||1;put("counter/race",{next:n+1,by:DEV,at:Date.now()});return n};
      const p=counterLock.then(run);counterLock=p.catch(()=>{});return p;
    },
    presence(obj){const pres=Object.assign({dev:DEV},peers.get(DEV)||{},obj);peers.set(DEV,pres);emitPeers();if(ch)ch.postMessage({pres})},
    onPeers(cb){peersCb.push(cb)},
    hasRoom:!!ch,
    pending:()=>0,flush:()=>{}
  };
}
