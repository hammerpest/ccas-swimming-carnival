/* Rules engine tests for the CCAS swimming app. Run: node tests/engine.test.js */
const C=require(require('path').join(__dirname,'..','js','core.js'));
const a=(x,m)=>{if(!x){console.log('FAIL',m);process.exitCode=1}else console.log('ok',m)};
a(C.parseTime('3412').cs===3412,'3412');
a(C.parseTime('10234').cs===6234,'10234');
a(C.parseTime('7512').err==='Over 60 sec: add minutes','7512');
a(C.parseTime('11512').cs===7512,'11512');
a(C.fmtTime(6234)==='1:02.34','fmt');
// judge overrule: lane4 22.00 lane5 22.05, judge lane5 first
let e=C.heatEffective({4:{t:2200},5:{t:2205},3:{t:2500}},[[5],[4]]);
a(e[5].eff===2200&&e[4].eff===2205&&e[5].pink&&e[4].pink&&!e[3].pink,'swap');
// faster time outside top: lane 6 fastest but judge 1,2,3,4 = lanes 1..4
e=C.heatEffective({1:{t:3000},2:{t:3100},3:{t:3200},4:{t:3300},5:{t:3400},6:{t:2900}},[[1],[2],[3],[4]]);
a(e[1].eff===2900&&e[4].eff===3200&&e[6].eff===3300&&e[5].eff===3400,'outside swap');
a(C.pointsFor(2,2,{p1:20,p2:15,p3:10,rest:5})===12.5,'tie pts');
const S={config:{},students:[{id:'a',s:'A',f:'Ann',h:'B',x:'F',g:'14'},{id:'b',s:'B',f:'Bea',h:'J',x:'F',g:'14'},{id:'c',s:'C',f:'Cat',h:'N',x:'F',g:'14'}],
 heats:[{race:1,k:'back50',x:'F',g:'14',heat:1,lanes:{1:'a',2:'b'}},{race:2,k:'back50',x:'F',g:'14',heat:2,lanes:{1:'c'}}],
 times:{r0001:{lanes:{1:{t:3600},2:{t:3500}},checked:true},r0002:{lanes:{1:{t:3540}},checked:true}},
 finish:{r0001:{order:[[1],[2]]}},records:[{key:'back50|F|14',t:3510,holders:[{n:'Jess Moran',y:2019}]}],openGroups:new Set()};
const R=C.compute(S);const G=R.groups.get('back50|F|14');
console.log(G.rows.map(r=>[r.id,r.eff,r.place,r.pts,r.tag,r.hris]));
a(G.rows[0].id==='a'&&G.rows[0].eff===3500&&G.rows[0].tag==='NEW RECORD','record+swap');
a(G.final,'final');
a(R.house.B.total===20&&R.house.N.total===15,'houses');
console.log(R.champs['14|F']);
const P=C.parseStudents('Surname,Firstname,House,Sex,DOB\nSmith,Jack,B,M,16/01/2013\nX,Y,Q,M,1/1/2012',"2026-12-31");
a(P.ok.length===1&&P.ok[0].g==='13'&&P.bad.length===1,'parse');
a(C.programEvents({}).length===74,'74 program races');
