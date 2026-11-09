/* Swim Opt 2.18 age groups tests (S1.44, decisions 160 to 164). Run: node tests/ages.test.js
   Made-up values only. */
const C=require(require('path').join(__dirname,'..','js','core.js'));
const a=(x,m)=>{if(!x){console.log('FAIL',m);process.exitCode=1}else console.log('ok',m)};
const ev=cfg=>C.programEvents(Object.assign({},C.DEFAULT_CONFIG,cfg));
const count=(list,k)=>list.filter(e=>e.k===k).length;

// secondary (the default) is unchanged
let E=ev({});
a(E.length===74,'secondary: 74 races');
a(C.GROUPS.age.join()==='13,14,15,16,17,18','secondary: ages 13 to 18');
a(C.grpName('13')==='13 & under'&&C.grpName('18')==='18+'&&C.grpName('15')==='15','secondary: 13 & under, 18+');
a(count(E,'relaymed')===2&&E.find(e=>e.k==='relaymed').g==='O','secondary: medley relay is Open');
a(count(E,'free200')===6,'secondary: 200 m freestyle swum');
a(C.ageGroup(12)==='13'&&C.ageGroup(19)==='18'&&C.ageGroup(15)==='15','secondary: ages kept in 13 to 18');

// primary: 5 age races x 5 ages x 2 + both relays Junior and Senior, no 200 m (58)
E=ev({level:'primary'});
a(E.length===58,'primary: 58 races');
a(C.GROUPS.age.join()==='8,9,10,11,12','primary: ages 8 to 12');
a(count(E,'free200')===0,'primary: no 200 m freestyle (161)');
a(count(E,'relayfree')===4&&count(E,'relaymed')===4,'primary: 4 races in each relay');
a(E.filter(e=>e.k==='relaymed').map(e=>e.g).join()==='PJ,PJ,PS,PS','primary: medley relay Junior and Senior (163)');
a(C.grpName('8')==='8 & under'&&C.grpName('12')==='12+'&&C.grpName('PJ')==='Junior'&&C.grpName('PS')==='Senior','primary: names');
a(C.BAND_AGES.PJ.join()==='8,9,10'&&C.BAND_AGES.PS.join()==='11,12','primary: Junior 8 to 10, Senior 11 and 12');
a(C.ageGroup(7,'primary')==='8'&&C.ageGroup(13,'primary')==='12'&&C.ageGroup(10,'primary')==='10','primary: ages kept in 8 to 12');
a(C.typeOn({k:'free200',on:true},{level:'primary'})===false&&C.typeOn({k:'free200',on:true},{})===true,'typeOn: 200 m off for primary only');

// an age turned off swims with the nearest age on
E=ev({level:'primary',agesOff:{primary:['8','10']}});
a(C.GROUPS.age.join()==='9,11,12','primary, 8 and 10 off: ages 9, 11, 12');
a(C.grpName('9')==='9 & under','primary, 8 off: 9 & under');
a(C.ageGrp('8')==='9'&&C.ageGrp('10')==='11'&&C.ageGrp('12')==='12','primary, 8 and 10 off: 8 swims in 9, 10 in 11');
a(E.length===3*5*2+8,'primary, 8 and 10 off: 38 races');
a(C.levelAgesOn({level:'primary',agesOff:{primary:['8','9','10','11','12']}}).length===5,'all ages off counts as all on');
E=ev({agesOff:{secondary:['13']}});
a(C.grpName('14')==='14 & under'&&C.ageGrp('13')==='14','secondary, 13 off: 14 & under holds the 13s');
a(E.length===74-10,'secondary, 13 off: 64 races');
// a secondary list of ages off does not touch primary
ev({level:'primary',agesOff:{secondary:['13']}});
a(C.GROUPS.age.length===5,'ages off are kept per carnival');

// HY3 age ranges follow the ages on
const kid=(id,g)=>({id,s:'Testman',f:'Tess',h:'B',x:'F',g,name:'Tess Testman'});
const grp=(k,g,p,place)=>[k+'|F|'+g,{k,x:'F',g,final:true,rows:[{p,hris:true,place,eff:4512}]}];
const R={events:[{no:1,key:'free50|F|8'},{no:2,key:'free50|F|12'},{no:3,key:'relayfree|F|PJ'},{no:4,key:'relaymed|F|PS'}],groups:new Map([
  grp('free50','8',kid('k1','8'),1),grp('free50','12',kid('k2','12'),1),
  grp('relayfree','PJ',{id:'J-A',team:true,h:'J'},1),grp('relaymed','PS',{id:'N-A',team:true,h:'N'},2)])};
const L=C.hy3File(R,{level:'primary',ageDate:'2026-12-31'},()=>'2017-05-04').text.split('\r\n');
const E1=L.filter(l=>l.startsWith('E1')),F1=L.filter(l=>l.startsWith('F1'));
a(E1[0].slice(22,28)==='  0  8','HY3 primary: 8 & under is 0 to 8');
a(E1[1].slice(22,28)===' 12109','HY3 primary: 12+ is 12 to 109');
a(F1[0].slice(22,28)==='  0 10'&&F1[1].slice(22,28)===' 11109','HY3 primary relays: Junior 0 to 10, Senior 11 to 109');
a(F1[1].slice(15,22)==='    50E'&&F1[0].slice(15,22)==='    50A','HY3 primary relays: 50 m legs, medley E and freestyle A');
a(L.every(l=>!l||(l.length===130&&C.hy3Check(l)===l.slice(128))),'HY3 primary: every line 130 long, checksums right');

// back to secondary: everything as before
E=ev({});
a(E.length===74&&C.TYPE.relaymed.gk==='open'&&C.GROUPS.band.join()==='J,I,S','back to secondary: as before');
