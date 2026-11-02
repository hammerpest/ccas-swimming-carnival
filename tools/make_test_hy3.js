/* Makes a test HY3 file from a made-up carnival with the 620 test students (decision 132).
   Run: node tools/make_test_hy3.js <out.hy3>
   Every swimmer gets a made-up DOB that fits their age group. Same seed, same file. */
const path=require('path'),fs=require('fs');
const C=require(path.join(__dirname,'..','js','core.js'));
const out=process.argv[2];if(!out){console.log('Usage: node tools/make_test_hy3.js <out.hy3>');process.exit(1)}
let seed=2027;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
const pick=(arr,n)=>arr.map(v=>[rnd(),v]).sort((a,b)=>a[0]-b[0]).slice(0,n).map(v=>v[1]);
const students=JSON.parse(fs.readFileSync(path.join(__dirname,'..','src','test-students.json'),'utf8')).students;
const BAND={J:['13','14'],I:['15','16'],S:['17','18']};
const cfg=Object.assign({},C.DEFAULT_CONFIG,{date:'2027-02-03',dateConfirmed:true});
const S={config:cfg,students,heats:[],times:{},finish:{},records:[],openGroups:new Set()};
let race=0;
for(const ev of C.programEvents(cfg)){
  const t=C.TYPE[ev.k];const lo=cfg.limits[ev.k][0];
  const field=t.relay?['B-A','B-B','J-A','J-B','N-A','N-B']
    :pick(students.filter(s=>s.x===ev.x&&(t.gk==='band'?BAND[ev.g].includes(s.g):s.g===ev.g)).map(s=>s.id),16);
  for(let h=0;h*8<field.length;h++){
    race++;const key='r'+String(race).padStart(4,'0');const lanes={},lt={};
    field.slice(h*8,h*8+8).forEach((id,i)=>{lanes[i+1]=id;lt[i+1]={t:Math.round(lo*(1.15+rnd()*0.8))}});
    S.heats.push({race,k:ev.k,x:ev.x,g:ev.g,heat:h+1,lanes});
    S.times[key]={lanes:lt,checked:true};
    S.finish[key]={order:Object.keys(lt).sort((a,b)=>lt[a].t-lt[b].t).map(l=>[+l])};
  }
}
const R=C.compute(S);
// made-up DOB that gives the student's age group on 31 December 2026
const dob=new Map(students.map(s=>{const age=s.g==='13'?(rnd()<0.5?12:13):+s.g;
  return [s.id,(2026-age)+'-'+String(1+Math.floor(rnd()*12)).padStart(2,'0')+'-'+String(1+Math.floor(rnd()*28)).padStart(2,'0')]}));
const f=C.hy3File(R,cfg,id=>dob.get(id),new Date());
fs.writeFileSync(out,f.text,'latin1');
console.log(`${race} races, ${f.entries} entries (${f.swimmers} swimmers plus relays), ${f.text.split('\r\n').length-1} lines, left out: ${f.missing.length}, not final: ${f.provisional.length}`);
