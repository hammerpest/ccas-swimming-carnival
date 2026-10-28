/* ===== Swim Opt 2.0: Supabase store. Same calls as the stores in store-local.js, plus the PIN calls.
   Used when js/config.js has the project URL and key. Add ?mode=local to the address for one-device test mode.
   Extra calls: role (the job the server has for this device), claimRole(hash), releaseRole(), setYear(y), checkPin(job,hash) =====
   Each browser tab signs in anonymously on its own (sessionStorage), so each tab is its own device, like test mode. */
const SB_TABLES=["config","roster","extras","heats","times","finish","slips","records","counter","years"];
async function supabaseStore(onQueue){
  const C=window.SWIM_CONFIG||{};
  if(!C.url||!C.key)return null;
  if(new URLSearchParams(location.search).get("mode")==="local")return null;
  /* the Supabase library loads only when it is used, so test mode runs exactly as before */
  if(!window.supabase)await new Promise((ok,no)=>{const s=document.createElement("script");s.src="js/vendor/supabase.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  /* the key is per tab: with one shared key, the library passes a new sign-in to every open tab */
  const sb=window.supabase.createClient(C.url,C.key,{auth:{storage:window.sessionStorage,storageKey:"swim_auth_"+DEV,persistSession:true,autoRefreshToken:true}});
  const split=p=>{const i=p.indexOf("/");return [p.slice(0,i),p.slice(i+1)]};
  /* a refused write (no job, locked, bad data) is dropped; a network failure waits in the queue */
  const err=e=>{const c=String((e&&(e.code||e.statusCode))||"");const net=!c||c==="PGRST301"||c==="401"||/fetch|network/i.test((e&&e.message)||"");return {code:net?"offline":"invalid_argument",message:e&&e.message}};
  const merge=(a,b)=>{const o=Object.assign({},a||{});for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=merge(o[k],b[k]);else o[k]=b[k]}return o};

  /* sign in once per tab; keep trying if there is no signal */
  let authed=null;
  function signIn(){
    if(!authed)authed=(async()=>{
      for(;;){
        try{const {data}=await sb.auth.getSession();if(data&&data.session)return true;
          const r=await sb.auth.signInAnonymously();if(!r.error)return true}catch(e){}
        await sleep(5000);
      }
    })();
    return authed;
  }

  /* photos live in the private Storage bucket "slips", one file per race */
  const toBlob=url=>fetch(url).then(r=>r.blob());
  const toUrl=blob=>new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(blob)});
  async function photoWrite(w,id){
    const B=sb.storage.from("slips");let r;
    if(w.op==="del")r=await B.remove([id+".jpg"]);
    else{const blob=await toBlob(w.data.img);r=await B.upload(id+".jpg",blob,{upsert:true,contentType:blob.type||"image/jpeg"})}
    if(r.error)throw err(r.error);
    return {ok:true};
  }
  async function write(w){
    await signIn();
    const [t,id]=split(w.path);
    if(t==="photos")return photoWrite(w,id);
    let r;
    if(w.op==="set")r=await sb.from(t).upsert({id,doc:w.data,updated_at:new Date().toISOString()});
    else if(w.op==="update")r=await sb.rpc("doc_update",{tbl:t,doc_id:id,patch:w.data});
    else r=await sb.from(t).delete().eq("id",id);
    if(r.error)throw err(r.error);
    return {ok:true};
  }
  const queue=makeQueue(write,onQueue);

  /* local copy of each table, kept live by Realtime; writes show straight away, even offline */
  const cache=new Map(),docSubs=new Map(),colSubs=new Map();
  const pendingFor=path=>lsGet("swim_queue",[]).filter(w=>w.path===path);
  const applyOp=(m,id,w)=>{if(w.op==="del")m.delete(id);else if(w.op==="set")m.set(id,w.data);else m.set(id,merge(m.get(id),w.data))};
  const colDocs=t=>{const m=cache.get(t)||new Map();return [...m.keys()].sort().map(id=>Object.assign({_id:id},m.get(id)))};
  function fire(t,id){
    const m=cache.get(t)||new Map();
    (docSubs.get(t+"/"+id)||[]).forEach(cb=>cb(m.has(id)?m.get(id):null));
    (colSubs.get(t)||[]).forEach(cb=>cb(colDocs(t)));
  }
  function fireAll(t){
    for(const [p,cbs] of docSubs)if(split(p)[0]===t){const m=cache.get(t)||new Map();const id=split(p)[1];cbs.forEach(cb=>cb(m.has(id)?m.get(id):null))}
    (colSubs.get(t)||[]).forEach(cb=>cb(colDocs(t)));
  }
  const watched=()=>{const s=new Set(colSubs.keys());for(const p of docSubs.keys())s.add(split(p)[0]);return [...s].filter(t=>SB_TABLES.includes(t))};
  /* while this device's own save of a record is on its way, its echoes (which can arrive out of order)
     are ignored; once the last save lands, the record is read again */
  const inflight=new Map();
  async function load(t){
    const {data,error}=await sb.from(t).select("id,doc");
    if(error)return;
    const old=cache.get(t)||new Map();
    const m=new Map(data.map(r=>[r.id,r.doc]));
    for(const w of lsGet("swim_queue",[])){const [wt,id]=split(w.path);if(wt===t)applyOp(m,id,w)}
    for(const [p,n] of inflight){const [wt,id]=split(p);if(wt===t&&n>0){if(old.has(id))m.set(id,old.get(id));else m.delete(id)}}
    cache.set(t,m);fireAll(t);
  }
  const loadAll=()=>Promise.all(watched().map(load));
  async function reread(path){
    const [t,id]=split(path);const m=cache.get(t);if(!m||t==="photos")return;
    const r=await sb.from(t).select("doc").eq("id",id).maybeSingle();
    if(r.error||(inflight.get(path)||0)>0)return;
    if(r.data)m.set(id,r.data.doc);else m.delete(id);
    for(const w of pendingFor(path))applyOp(m,id,w);
    fire(t,id);
  }
  async function send(w){
    local(w);inflight.set(w.path,(inflight.get(w.path)||0)+1);
    try{return await queue.run(w)}
    finally{const n=inflight.get(w.path)-1;if(n>0)inflight.set(w.path,n);else{inflight.delete(w.path);reread(w.path).catch(()=>{})}}
  }
  function local(w){
    const [t,id]=split(w.path);if(t==="photos")return;
    const m=cache.get(t)||cache.set(t,new Map()).get(t);
    applyOp(m,id,JSON.parse(JSON.stringify(w)));fire(t,id);
  }
  function onChange(p){
    const t=p.table;const m=cache.get(t);if(!m)return;
    const id=p.eventType==="DELETE"?(p.old&&p.old.id):(p.new&&p.new.id);if(id==null)return;
    if((inflight.get(t+"/"+id)||0)>0)return;
    if(p.eventType==="DELETE")m.delete(id);else m.set(id,p.new.doc);
    for(const w of pendingFor(t+"/"+id))applyOp(m,id,w);
    fire(t,id);
  }

  /* one private channel, "carnival": row changes plus presence. Only a device with a job can join. */
  let ch=null,myPres={},peersCb=[],role=null;
  const emitPeers=list=>peersCb.forEach(cb=>cb(list));
  async function join(){
    if(ch){try{await sb.removeChannel(ch)}catch(e){}ch=null}
    if(!role){emitPeers([]);return}
    try{await sb.realtime.setAuth()}catch(e){}
    ch=sb.channel("carnival",{config:{private:true,presence:{key:DEV}}});
    for(const t of SB_TABLES)ch.on("postgres_changes",{event:"*",schema:"public",table:t},onChange);
    ch.on("presence",{event:"sync"},()=>{const st=ch.presenceState();emitPeers(Object.values(st).flat().map(p=>{const o=Object.assign({},p);delete o.presence_ref;return o}))});
    ch.subscribe(st=>{if(st==="SUBSCRIBED"){ch.track(Object.assign({dev:DEV},myPres)).catch(()=>{});loadAll()}});
  }

  await signIn();
  try{const r=await sb.rpc("my_role");role=r.error?null:r.data||null}catch(e){}
  if(role)join();

  return {
    mode:"supabase",
    get role(){return role},
    onDoc(path,cb){(docSubs.get(path)||docSubs.set(path,[]).get(path)).push(cb);const [t,id]=split(path);
      if(cache.has(t)){const m=cache.get(t);setTimeout(()=>cb(m.has(id)?m.get(id):null))}else if(role)load(t);else setTimeout(()=>cb(null));return()=>{}},
    onCol(col,cb){(colSubs.get(col)||colSubs.set(col,[]).get(col)).push(cb);
      if(cache.has(col))setTimeout(()=>cb(colDocs(col)));else if(role)load(col);else setTimeout(()=>cb([]));return()=>{}},
    async get(path){
      await signIn();const [t,id]=split(path);
      if(t==="photos"){const r=await sb.storage.from("slips").download(id+".jpg");if(r.error){if(String(r.error.statusCode||"")==="404"||/not.?found/i.test(r.error.message||""))return null;throw err(r.error)}return {img:await toUrl(r.data)}}
      const r=await sb.from(t).select("doc").eq("id",id).maybeSingle();
      if(r.error)throw err(r.error);
      return r.data?r.data.doc:null;
    },
    set(path,data){return send({op:"set",path,data})},
    update(path,data){return send({op:"update",path,data})},
    del(path){return send({op:"del",path})},
    async nextRace(){
      await signIn();
      let r;try{r=await withTimeout(sb.rpc("next_race",{dev:DEV}),6000)}catch(e){throw {code:"offline"}}
      if(r.error)throw err(r.error).code==="offline"?{code:"offline"}:{code:"busy"};
      return r.data;
    },
    presence(obj){myPres=Object.assign(myPres,obj);if(ch){ch.track(Object.assign({dev:DEV},myPres)).catch(()=>{})}},
    onPeers(cb){peersCb.push(cb)},
    hasRoom:true,
    pending:()=>queue.size(),flush:()=>queue.flush(),
    /* PINs are checked on the server; the page never sees the PIN table */
    async claimRole(hash){
      await signIn();const r=await sb.rpc("claim_role",{pin_hash:hash});
      if(r.error)throw err(r.error);
      role=r.data||null;
      if(role){await join();await loadAll()}
      return role;
    },
    async releaseRole(){role=null;await join();try{await sb.rpc("release_role")}catch(e){}},
    async setYear(y){const r=await sb.rpc("set_year",{y:String(y||"current")});if(r.error)throw err(r.error)},
    async checkPin(job,hash){const r=await sb.rpc("check_pin",{job,pin_hash:hash});if(r.error)throw err(r.error);return !!r.data}
  };
}
