import json
roster=[[x['s'],x['f'],x['h'],x['x'],x['g']] for x in json.load(open('test-students.json'))['students']]
head='''<title>CCAS Swimming Carnival</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;700;800;900&family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Mono:wght@500;700&display=swap">
<style>
'''+open('styles.css').read()+'''</style>
<header class="top" id="hdr"></header>
<main id="main"></main>
<div id="mod"></div>
<div class="toast" id="toast" role="status" hidden></div>
<script>
(function(){
"use strict";
/* Swim Opt 1.5 */
const TEST_ROWS='''+json.dumps(roster,separators=(',',':'))+''';
function TEST_STUDENTS(){return TEST_ROWS.map((r,i)=>({id:"t"+String(i+1).padStart(3,"0"),s:r[0],f:r[1],h:r[2],x:r[3],g:r[4],test:true}))}
'''
body=''
for f in ['core.js','store.js','ui1.js','ui2.js','ui3.js','ui4.js','ui5.js']:
    s=open(f).read()
    if f=='core.js': s=s.split('if(typeof module')[0]
    body+='\n'+s
html=head+body+'\n})();\n</script>\n'
open('ccas-swim.html','w').write(html)
print(len(html))
