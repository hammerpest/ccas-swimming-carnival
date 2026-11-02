/* HY3 writer tests (decisions 100, 132). Run: node tests/hy3.test.js
   Column positions come from Jordan's Meet Manager sample (PROJECT-STATE 2.29).
   Only made-up values here: the sample itself stays outside the repo. */
const C=require(require('path').join(__dirname,'..','js','core.js'));
const a=(x,m)=>{if(!x){console.log('FAIL',m);process.exitCode=1}else console.log('ok',m)};

// checksum rule, checked on Meet Manager lines that hold no student details
for(const l of [
'A108Merge Advancer Entries   Hy-Tek, Ltd    MM5 7.0Gb     10272026  3:22 PMCentral Coast Adventist School                       12',
'B2                                                                                          040101L1  0.00                      61',
'C1BRA  Bradman                                                                                                        0  0      54',
'C1JAC  Jackson                                                                                                        0  0      64'])a(C.hy3Check(l)===l.slice(128),'checksum '+l.slice(0,5));

// expected lines written straight from the column map, not from the writer
const spec=(code,parts)=>{const b=Array(128).fill(' ');b[0]=code[0];b[1]=code[1];for(const [c,t] of parts)for(let i=0;i<t.length;i++)b[c-1+i]=t[i];const s=b.join('');return s+C.hy3Check(s)};
const tail=(no,time,place)=>[[29,'  0U'],[33,'  0.00'],[39,no],[43,time],[52,time],[61,'    0.00'],[69,'    0.00'],[77,'  0NN'],[85,place]];

const kid={id:'k1',s:'Testman',f:'Tess',h:'B',x:'F',g:'13',name:'Tess Testman'};
const cfg={name:'Test Carnival 2027',pool:'Test Pool',date:'2027-02-03',ageDate:'2026-12-31',poolLen:'50'};
const R={events:[{no:4,key:'free100|F|13'},{no:61,key:'relayfree|F|J'},{no:74,key:'relaymed|M|O'}],groups:new Map([
  ['free100|F|13',{k:'free100',x:'F',g:'13',final:true,rows:[{p:kid,hris:true,place:1,eff:7512}]}],
  ['relayfree|F|J',{k:'relayfree',x:'F',g:'J',final:true,rows:[{p:{id:'J-A',team:true,h:'J'},hris:true,place:2,eff:13456}]}],
  ['relaymed|M|O',{k:'relaymed',x:'M',g:'O',final:true,rows:[{p:{id:'N-B',team:true,h:'N'},hris:true,place:1,eff:14272}]}]])};
const out=C.hy3File(R,cfg,id=>id==='k1'?'2013-06-15':null,new Date(2027,1,3,9,5));
const L=out.text.split('\r\n');
a(out.text.endsWith('\r\n')&&L.pop()==='','Windows line ends');
a(L.every(l=>l.length===130&&/^[\x20-\x7e]+$/.test(l)),'every line 130 plain characters');
a(L.map(l=>l.slice(0,2)).join(' ')==='A1 B1 B2 C1 D1 E1 C1 F1 C1 F1','line order');
a(L[0]===spec('A1',[[3,'08'],[5,'Merge Advancer Entries'],[30,'Hy-Tek, Ltd'],[45,'MM5 7.0Gb'],[59,'02032027'],[67,'  9:05 AM'],[76,'Central Coast Adventist School']]),'A1');
a(L[1]===spec('B1',[[3,'Test Carnival 2027'],[48,'Test Pool'],[93,'020320270203202712312026'],[120,'0']]),'B1');
a(L[2]===spec('B2',[[93,'040101L1'],[101,'  0.00']]),'B2');
a(L[3]===spec('C1',[[3,'BRA  '],[8,'Bradman'],[119,'0'],[122,'0']]),'C1 Bradman');
a(L[4]===spec('D1',[[3,'F'],[4,'10101'],[9,'Testman'],[29,'Tess'],[70,'101'],[86,'100'],[89,'06152013'],[97,' 13'],[105,'0'],[125,'N']]),'D1 swimmer, age 13 at 31 December');
a(L[5]===spec('E1',[[3,'F'],[4,'10101'],[9,'Testm'],[14,'FG'],[19,'100A'],[23,'  0 13']].concat(tail('   4','   75.12L','   1'))),'E1 100 m free, 13 and under, 1:15.12');
a(L[6]===spec('C1',[[3,'JAC  '],[8,'Jackson'],[119,'0'],[122,'0']]),'C1 Jackson');
a(L[7]===spec('F1',[[3,'JAC  '],[8,'A'],[12,'0'],[14,'FG'],[20,'50A'],[23,'  0 14']].concat(tail('  61','  134.56L','   2'))),'F1 free relay, Junior, 2nd');
a(L[9]===spec('F1',[[3,'NEW  '],[8,'B'],[12,'0'],[14,'MB'],[20,'50E'],[23,'  0109']].concat(tail('  74','  142.72L','   1'))),'F1 medley relay, stroke E, open');
a(out.entries===3&&out.swimmers===1&&!out.missing.length&&!out.provisional.length,'counts');

// swimmers left out are named: no DOB, a DOB not in YYYY-MM-DD, an unknown swimmer
for(const [d,m] of [[null,'no DOB'],['15/06/2013','DOB not YYYY-MM-DD']]){
  const o=C.hy3File(R,cfg,()=>d);a(o.missing.join()==='Tess Testman'&&o.entries===2&&!/\r\nD1/.test(o.text),m+': left out and named')}
const R2={events:[{no:1,key:'fly50|F|14'}],groups:new Map([['fly50|F|14',{k:'fly50',x:'F',g:'14',final:false,rows:[
  {p:{id:'x',s:'Unknown swimmer',f:'',h:'',name:'Unknown swimmer'},hris:true,place:1,eff:3000},
  {p:{id:'y',s:'O’Brien-Smith',f:'Zoë',h:'N',x:'F',g:'14',name:'Zoë O’Brien-Smith'},hris:true,place:2,eff:3100},
  {p:{id:'z',s:'Tie',f:'Tina',h:'J',x:'F',g:'14',name:'Tina Tie'},hris:true,place:2,eff:3100},
  {p:{id:'w',s:'Third',f:'Tom',h:'J',x:'F',g:'14',name:'Tom Third'},place:4,eff:3300}]}]])};
const o2=C.hy3File(R2,{ageDate:'2026-12-31'},()=>'2012-03-04');
const L2=o2.text.split('\r\n');
a(o2.missing.join()==='Unknown swimmer','unknown swimmer named, not dropped silently');
a(o2.provisional.join()==='50 m butterfly, Girls 14','unfinished race listed');
a(o2.entries===2&&L2.filter(l=>l.startsWith('E1')).every(l=>l.slice(84,88)==='   2'),'tie for 2nd: both in, 4th place out');
a(L2[4].slice(8,28)==="O'Brien-Smith       "&&L2[4].slice(28,32)==='Zoe '&&L2[5].slice(8,13)==="O'Bri",'curly apostrophe kept, accent removed');

// 25 m pool, long names, 18 and over
const R3={events:[{no:7,key:'fly50|M|18'}],groups:new Map([['fly50|M|18',{k:'fly50',x:'M',g:'18',final:true,rows:[{p:{id:'q',s:'Featherstonehaugh-Cholmondeley',f:'Bartholomew',h:'N',x:'M',g:'18'},hris:true,place:2,eff:2934}]}]])};
const L3=C.hy3File(R3,{poolLen:'25',ageDate:'2026-12-31'},()=>'2008-05-04').text.split('\r\n');
a(L3[2].slice(98,99)==='S'&&L3[5].slice(50,51)==='S','25 m pool course S');
a(L3[4].slice(8,28)==='Featherstonehaugh-Ch','surname cut to 20');
a(L3[5].slice(18,22)===' 50D'&&L3[5].slice(22,28)===' 18109','50 m fly, 18 and over');
a(L3[5].slice(84,88)==='   2'&&L3[5].slice(42,51)==='   29.34S','place 2, time 29.34');

// a full made-up carnival: top 2 in all 74 races, every checksum right
const tmp=require('path').join(require('os').tmpdir(),'hy3-test-'+process.pid+'.hy3');
require('child_process').spawnSync(process.execPath,[require('path').join(__dirname,'..','tools','make_test_hy3.js'),tmp]);
const F=require('fs').readFileSync(tmp,'latin1').split('\r\n');F.pop();require('fs').unlinkSync(tmp);
a(F.length===431&&F.every(l=>l.length===130&&C.hy3Check(l)===l.slice(128)),'full carnival file: 431 lines, all checksums right');
a(F.filter(l=>/^[EF]1/.test(l)).length===148,'148 entries: top 2 in 74 races');
