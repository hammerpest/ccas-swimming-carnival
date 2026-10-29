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
// time slip text (decision 110)
const SLIP=`TIMING  Time2
LANE MODE 1/  7
start    09:19:07.000
stop  4  09:19:41.700
      34.70 sec
stop  8  09:19:42.550
      35.55 sec
stop  2  09:19:45.880
      38.88 sec
stop  7  09:19:46.690
      39.69 sec
stop  3  09:19:49.100
      42.10 sec
stop  6  09:19:50.220
      43.22 sec`;
let sl=C.parseSlip(SLIP,8);
a(sl.race===7,'slip race number after the slash');
a(JSON.stringify(sl.order)==='[4,8,2,7,3,6]','slip finish order');
a(sl.lanes[4]===3470&&sl.lanes[6]===4322&&sl.lanes[1]===undefined&&sl.lanes[5]===undefined,'slip lane times, missing lanes left out');
a(sl.problems.length===0,'slip no problems');
sl=C.parseSlip('LANE MODE 3/ 12\nstop 1 10:02:01.000\n72.34 sec\nstop 2 10:02:05.000\n1:15.10 sec',8);
a(sl.race===12&&sl.lanes[1]===7234&&sl.lanes[2]===7510,'slip over a minute, both ways');
sl=C.parseSlip('LANE M0DE 1/ l5\nst0p 5 09:00:00.0\n3O,12 sec\nstop 9 09:00:01.0\n31.00 sec',8);
a(sl.race===15&&sl.lanes[5]===3012&&sl.problems.length===1,'slip misreads allowed, lane 9 flagged on an 8 lane pool');
a(C.parseSlip('nothing useful here').race===null,'slip unreadable');
sl=C.parseSlip('LANE MODE 1/7 1\nstart 09:19:07.000\nstop 4 09:19:41.700\n34.70 sec\nstop 8 09:19:42.550\n35.95 sec',8);
a(sl.race===1&&sl.unsure.length===1&&sl.unsure[0]===8,'slip: race is the last number; a time that disagrees with the clock is unsure');
a(C.parseSlip('LANE MODE 1/ 40\nstart 11:00:00.000\nstop 3 11:01:12.340\n1:12.34 sec',8).lanes[3]===7234,'slip 1:12.34 over a minute, as the printer shows it');
