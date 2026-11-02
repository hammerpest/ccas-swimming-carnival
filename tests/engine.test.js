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
a(sl.race===15&&sl.lanes[5]===3012&&sl.problems[0]==='Lane 9 not on this pool','slip misreads allowed, lane 9 flagged on an 8 lane pool');
a(C.parseSlip('nothing useful here').race===null,'slip unreadable');
sl=C.parseSlip('LANE MODE 1/7 1\nstart 09:19:07.000\nstop 4 09:19:41.700\n34.70 sec\nstop 8 09:19:42.550\n35.95 sec',8);
a(sl.race===1&&sl.unsure.length===1&&sl.unsure[0]===8,'slip: race is the last number; a time that disagrees with the clock is unsure');
a(C.parseSlip('LANE MODE 1/ 40\nstart 11:00:00.000\nstop 3 11:01:12.340\n1:12.34 sec',8).lanes[3]===7234,'slip 1:12.34 over a minute, as the printer shows it');
// slip time for an empty lane must not change the results (check 3 on 2.1, defect 1)
{const S2={config:{},students:[{id:'a',s:'A',f:'Ann',h:'B',x:'F',g:'14'},{id:'b',s:'B',f:'Bea',h:'J',x:'F',g:'14'}],
 heats:[{race:1,k:'back50',x:'F',g:'14',heat:1,lanes:{1:'a',2:'b'}}],
 times:{r0001:{lanes:{1:{t:3600},2:{t:3800},8:{t:3000}}}},finish:{r0001:{order:[[2],[1]]}},records:[],openGroups:new Set()};
 const R2=C.compute(S2);const r1=R2.races.get(1);
 a(r1.eff[2].eff===3600&&r1.eff[1].eff===3800&&!r1.eff[8],'empty lane slip time ignored in the judge swap');
 a(JSON.stringify(r1.extra)==='[8]','empty lane slip time listed as extra');}
sl=C.parseSlip('LANE MODE 1/ 3\nstop 4 09:19:41.700\n34.70 sec\n35.55 sec',8);
a(sl.unsure.includes(4)&&sl.problems.includes('A time with no lane'),'no start clock: lane unsure; a time with no lane is a problem');
// reader confidence (check 3 rerun): a low-confidence lane digit or time is unsure; a stop line with no time is missed
{const W=(txt,c)=>({text:txt,words:txt.split(/\s+/).map(x=>({text:x,confidence:c}))});
 const lines=[W('LANE MODE 1/ 1',95),W('start 09:19:07.000',95),{text:'stop 5 09:19:50.220',words:[{text:'stop',confidence:96},{text:'5',confidence:17},{text:'09:19:50.220',confidence:87}]},W('43.22 sec',95),W('stop 4 09:19:41.700',95),W('34.70 sec',95),W('stop 8 09:19:42.550',95)];
 const r=C.parseSlip(lines,8);
 a(r.lanes[5]===4322&&r.unsure.includes(5)&&!r.unsure.includes(4),'slip: smudged lane digit is unsure');
 a(r.missed.includes(8)&&r.problems.includes('Lane 8: no time read'),'slip: stop line with no time is missed');
 const r2=C.parseSlip([{text:'LANE MODE 1/ 3',words:[{text:'LANE',confidence:95},{text:'MODE',confidence:95},{text:'1/',confidence:95},{text:'3',confidence:30}]}],8);
 a(r2.race===3&&r2.raceLow,'slip: low-confidence race number flagged');}
sl=C.parseSlip('LANE MODE 1/ 1\nstart 09:00:00.000\nstop 3 09:00:35.550\n35.55 sec\nstop 3 09:00:42.100\n42.10 sec',8);
a(sl.lanes[3]===3555&&sl.mixed&&sl.problems.includes('Lane 3 twice'),'slip: a lane twice is refused (mixed)');
sl=C.parseSlip('LANE MODE 1/ 1\nstart 09:19:07.000\nstop 4 09:19:41.700\n34.70 sec\nTIMING Time2\nLANE MODE 1/ 2\nstart 09:21:00.000\nstop 1 09:21:33.010\n33.01 sec',8);
a(sl.twoSlips&&sl.race===1,'slip: two slips in one photo are spotted');
sl=C.parseSlip('LANE MODE 1/ 1\nstart 09:19:07.000\nstop 4 09:19:41.700\n34.70 sec\n.  sec',8);
a(sl.problems.includes('A time not read'),'slip: a sec line with no time is a problem');
a(C.parseSlip('LANE MODE 1/ 20   LANE MODE 1/ 21\nstart 09:00:00.000 start 09:03:00.000\nstop 1 09:00:30.000\n30.00 sec',8).twoSlips,'slip: two slips side by side are spotted');
a(C.parseSlip('48.03 sec\nTIMING Time2\nLANE MODE 1/ 5\nstart 09:00:00.000\nstop 1 09:00:30.000\n30.00 sec',8).twoSlips,'slip: the end of the previous slip above the header is spotted');
a(C.parseSlip('LANE MODE 1/ 21   12\nstart 09:00:00.000\nstop 1 09:00:30.000\n30.00 sec',8).raceLow,'slip: a second number after the slash makes the race unsure');
a(!C.parseSlip('LANE MOLE 1/ 5\nstart 09:00:00.000\nstop 1 09:00:30.000\n30.00 sec',8).twoSlips,'slip: a misread header is not called two slips');
a(C.parseSlip('LANE MODE 1/ 5\nstart 09:00:00.000\nstop 2 09:00:30.000 stop 3 08:36:32.440\n30.00 sec',8).twoSlips,'slip: two stop lines joined on one line are two slips');
a(C.parseSlip('LANE MODE 1/ 5\nstart 09:00:00.000\nstop 2 09:00:40.000\n40.00 sec\nstop 5 09:00:31.000\n31.00 sec',8).mixed,'slip: a time faster than the one above is refused (mixed)');
a(C.parseSlip('LANE MODE 1/ 5\nstart 09:00:00.000\nstop 2 09:00:40.000\n40.00 sec\n41.00 sec  33.00 sec',8).twoSlips,'slip: two times on one line means two slips');
sl=C.parseSlip('LANE MODE 1/ 5\nstart 09:00:00.000\nstop 2 09:00:40.000\n40.00 sec\nstop 5 09:00:39.500\n39.50 sec',8);
a(!sl.twoSlips&&sl.unsure.includes(2)&&sl.unsure.includes(5),'slip: a small dip makes both lanes unsure');
// check 3 run 6
sl=C.parseSlip('LANE MODE 1/ 41\nstart 11:25:28.000\nstop 1 11:26:00.300\n32.30 sec\nstop 3 10:40:26.950\n46.95 sec',8);
a(sl.far.includes(3)&&sl.unsure.includes(3),'slip: a stop clock minutes away from its time is far');
sl=C.parseSlip('LANE MODE 1/ 4\nstart 09:45:00.000\nstop 3 09:45:34.716\n34.71 sec\nop 7 09:45:35.349\n35.34\nstop 8 09:45:36.000\n36.00 sec',8);
a(sl.lanes[7]===3534,'slip: a garbled stop word ("op 7") still gives the lane');
sl=C.parseSlip('LANE MODE 1/ 4\nstart 09:45:00.000\nstop409:53:09.853\n31:85sec\nstop 8 09:45:36.000\n36.00 sec',8);
a(sl.problems.length>0,'slip: an unreadable stop line is a problem, never skipped');
sl=C.parseSlip('LANE MODE 1/ 4\nstart 08:04:00. 000\nstop 2 08:04:34. 500\n34.50 sec',8);
a(sl.lanes[2]===3450&&!sl.unsure.includes(2),'slip: a clock read with a space still checks');
sl=C.parseSlip('LANE MODE 1 9\nstart 09:00:00.000\nstop 1 09:00:30.000\n30.00 sec',8);
a(sl.race===9&&!sl.raceLow,'slip: a lost slash still gives the race');
sl=C.parseSlip('5top 5 13:11:01.015\n45.01 5ec',8);
a(sl.race===null,'slip: no header, no race');
// equal times (Swim Opt 2.6): the Place Judge splits a heat; across heats equal times stay a tie
{const st=['a','b','c','d'].map(id=>({id,s:id,f:id,h:'B',x:'F',g:'14'}));
 const S3={config:{},students:st,heats:[{race:1,k:'back50',x:'F',g:'14',heat:1,lanes:{1:'a',2:'b',3:'d'}},{race:2,k:'back50',x:'F',g:'14',heat:2,lanes:{1:'c'}}],
  times:{r0001:{lanes:{1:{t:3500},2:{t:3500},3:{t:3600}},checked:true},r0002:{lanes:{1:{t:3500}},checked:true}},
  finish:{r0001:{order:[[2],[1],[3]]}},records:[],openGroups:new Set()};
 const rows=C.compute(S3).groups.get('back50|F|14').rows;const by=id=>rows.find(r=>r.id===id);
 a(by('b').place===1&&by('c').place===1&&by('b').tie&&by('c').tie,'equal time across heats: joint 1st');
 a(by('a').place===3&&!by('a').tie,'judge splits equal time in one heat: placed 2nd in heat is 3rd overall');
 a(by('d').place===4,'next time after the split');
 a(by('b').pts===17.5&&by('a').pts===10,'points follow the split');}
// Swim Opt 2.7 rules
{const st=['a','b','c','d','e','f'].map((id,i)=>({id,s:id,f:id,h:['B','J','N'][i%3],x:'F',g:'14'}));
 const base=()=>({config:{},students:st,heats:[{race:1,k:'back50',x:'F',g:'14',heat:1,lanes:{1:'a',2:'b',3:'c'}}],
  times:{r0001:{lanes:{1:{t:3500},2:{t:3600},3:{t:3700}}}},finish:{r0001:{order:[[1],[2],[3]]}},records:[],openGroups:new Set()});
 // 143: Times checked is optional
 let S4=base();let R4=C.compute(S4);
 a(R4.races.get(1).done&&R4.groups.get('back50|F|14').final,'143: times and places in, not checked: final');
 S4=base();S4.finish={r0001:{order:[[1],[2]]}};R4=C.compute(S4);
 a(!R4.races.get(1).done&&!R4.groups.get('back50|F|14').final,'143: a place missing: not final');
 S4.finish.r0001.ok=true;R4=C.compute(S4);
 a(R4.races.get(1).done,'143: fewer places confirmed by the Place Judge: done');
 S4=base();S4.finish={};S4.times.r0001.checked=true;R4=C.compute(S4);
 a(R4.races.get(1).done,'143: no places but checked: done');
 S4=base();delete S4.times.r0001.lanes[3];R4=C.compute(S4);
 a(!R4.races.get(1).done,'143: a lane with no time or status: not done');
 S4.times.r0001.lanes[3]={st:'DNS'};S4.finish={r0001:{order:[[1],[2]]}};R4=C.compute(S4);
 a(R4.races.get(1).done,'143: DNS lane counts; places needed only for swimmers with a time');
 a(R4.finalCount===1,'143: final count');
 // 144: No time
 S4=base();S4.times.r0001.lanes[3]={t:3700,st:'NT'};S4.finish={r0001:{order:[[1],[2]]}};R4=C.compute(S4);
 let rows=R4.groups.get('back50|F|14').rows;let c=rows.find(r=>r.id==='c');
 a(c.place==null&&c.pts===5&&!c.hris&&c.eff==null&&c.rec==null,'144: No time: no place, participation points, not on HRIS');
 a(R4.house.N.total===5&&R4.champs['14|F'].winners[0].id==='a','144: No time points count for the house');
 a(R4.races.get(1).done,'144: No time lane counts as in');
 // 145: no runner up beside joint champions
 S4={config:{},students:st,heats:[{race:1,k:'back50',x:'F',g:'14',heat:1,lanes:{1:'a'}},{race:2,k:'back50',x:'F',g:'14',heat:2,lanes:{1:'b',2:'c'}}],
  times:{r0001:{lanes:{1:{t:3500}}},r0002:{lanes:{1:{t:3500},2:{t:3600}}}},finish:{r0001:{order:[[1]]},r0002:{order:[[1],[2]]}},records:[],openGroups:new Set()};
 R4=C.compute(S4);const ch=R4.champs['14|F'];
 a(ch.winners.length===2&&ch.runners.length===0,'145: joint champions, no runner up');
 // 138: every tied swimmer in the top 2 is on the HRIS Team List
 S4={config:{},students:st,heats:[{race:1,k:'back50',x:'F',g:'14',heat:1,lanes:{1:'a',2:'b'}},{race:2,k:'back50',x:'F',g:'14',heat:2,lanes:{1:'c'}},{race:3,k:'back50',x:'F',g:'14',heat:3,lanes:{1:'d'}}],
  times:{r0001:{lanes:{1:{t:3400},2:{t:3500}}},r0002:{lanes:{1:{t:3500}}},r0003:{lanes:{1:{t:3500}}}},finish:{r0001:{order:[[1],[2]]},r0002:{order:[[1]]},r0003:{order:[[1]]}},records:[],openGroups:new Set()};
 rows=C.compute(S4).groups.get('back50|F|14').rows;
 a(rows.filter(r=>r.hris).length===4&&rows.filter(r=>r.place===2).length===3,'138: 3-way tie for 2nd: all three on the HRIS list');
 // A2: a place change after Times checked sends the race back
 S4=base();S4.times.r0001.checked=true;S4.times.r0001.checkedAt=1000;R4=C.compute(S4);
 a(R4.races.get(1).checked,'A2: checked');
 S4.finish.r0001.ck=1000;R4=C.compute(S4);
 a(!R4.races.get(1).checked&&R4.races.get(1).tstatus==='To check','A2: place changed after the check: To check');
 S4.times.r0001.checkedAt=2000;R4=C.compute(S4);
 a(R4.races.get(1).checked,'A2: checked again after the change');
 // A1: cancel and re-swim
 S4=base();S4.heats.push({race:2,k:'back50',x:'F',g:'14',heat:2,lanes:{1:'d'},cancelled:true});R4=C.compute(S4);
 a(R4.groups.get('back50|F|14').final&&R4.races.get(2).cancelled&&R4.groups.get('back50|F|14').heats.length===1,'A1: a cancelled race does not hold the group up');
 S4=base();S4.heats[0].gen=1;R4=C.compute(S4);
 a(R4.races.get(1).nTimes===0&&R4.races.get(1).tapped===0&&!R4.groups.get('back50|F|14').final,'A1: re-swim: old times and places no longer count');
 S4.times.r0001.gen=1;S4.finish.r0001.gen=1;R4=C.compute(S4);
 a(R4.races.get(1).done,'A1: re-swim: new times and places count');
 // A9: Not swum
 S4=base();S4.config={notSwum:['fly50|F|13']};R4=C.compute(S4);
 a(R4.isFinal('fly50|F|13')&&R4.finalCount===2,'A9: a group marked Not swum counts as final');
 // 136: a late slip never overwrites typed times
 const old={lanes:{1:{t:3500,st:'ok',src:'typed'},2:{t:3600,st:'ok',src:'photo'},3:{st:'DNS',src:'typed'}},checked:true,checkedAt:5};
 let m=C.lateSlip(old,{lanes:{1:{t:3510,st:'ok',src:'photo'},2:{t:3600,st:'ok',src:'photo'},3:{t:3900,st:'ok',src:'photo'}},src:'photo',checked:false});
 a(m.lanes[1].t===3500&&m.lanes[1].slip===3510&&m.lanes[3].st==='DNS'&&m.lanes[3].slip===3900,'136: typed lanes kept, slip time kept beside them');
 a(m.checked===true&&m.checkedAt===5,'136: a checked race stays checked when the slip changes nothing');
 m=C.lateSlip(old,{lanes:{2:{t:3650,st:'ok',src:'photo'}},src:'photo',checked:false});
 a(m.lanes[2].t===3650&&!m.checked,'136: an untyped lane takes the slip time and the race goes back to To check');
 a(C.lateSlip(Object.assign({gen:0},old),{gen:1,lanes:{1:{t:1}}}).lanes[1].t===1,'136: re-swum race starts fresh');
 S4=base();S4.times.r0001.lanes[1].slip=3510;R4=C.compute(S4);
 a(JSON.stringify(R4.races.get(1).differs)==='[1]','136: Slip differs lane listed');
 a(!R4.races.get(1).done&&!R4.groups.get('back50|F|14').final,'136: a race with Slip differs is not done until the Recorder picks');}
