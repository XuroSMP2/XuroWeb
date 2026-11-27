const S=Object.assign({ip:'xurosmp.daronlo.com',discord:'',guild:''},window.SITE||{});
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(x==='class')e.className=v;else if(x==='style')e.style.cssText=v;else if(x.startsWith('on'))e[x]=v;else e.setAttribute(x,v)}e.append(...k.filter(Boolean));return e};

function toast(t,s){let b=$('#toasts');if(!b){b=h('div',{id:'toasts','aria-live':'polite'});document.body.append(b)}const e=h('div',{class:'adv',role:'status'},h('i',{class:'ic','aria-hidden':'true'}),h('div',{},h('b',{},t),h('span',{},s)));b.append(e);setTimeout(()=>e.remove(),4200)}
const copy=(t,m)=>navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast(m||'Kopiert',t),()=>{});
/* Header, Banner, Footer */
if(document.body.dataset.shell!=='none'){
 const pg=document.body.dataset.page,L=(href,t,id,x='',xm=0)=>h('a',{class:'hl'+(pg===id?' act':'')+(xm?' xm-only':''),href,...(x?{'data-discord':''}:{})},t);
 document.body.prepend(h('a',{class:'skip',href:'#inhalt'},'Zum Inhalt'),h('header',{},h('a',{class:'logo',href:'/'},'XuroSMP'),L('/','Start','home'),L('/events','Events','events'),L('/client','Client','client'),L('/advent','Advent','advent','',1),L('/stats','Bestenlisten','stats'),L('/wiki','Wiki','wiki'),L('/wiki#regeln','Regeln','r'),L('#','Discord','d',1),h('button',{'data-ip':''},S.ip)));
 document.body.append(h('footer',{},'XuroSMP · Kein offizielles Mojang- oder Microsoft-Produkt · ',h('a',{href:'/wiki'},'Wiki'),' · ',h('a',{href:'/events'},'Events')));
 fetch('/api/banner').then(r=>r.json()).then(b=>{if(b.on&&b.text){const bn=h('div',{class:'bn',role:'status'}),t=h('span',{class:'bn-t'},b.text);bn.append(t);$('header').after(bn);const fit=()=>{bn.classList.remove('run');bn.querySelectorAll('.bn-c').forEach(x=>x.remove());if(t.scrollWidth>bn.clientWidth-32){const c=h('span',{class:'bn-t bn-c','aria-hidden':'true'},b.text);bn.append(c);bn.style.setProperty('--bn-d',Math.max(12,Math.round(b.text.length*0.33))+'s');bn.classList.add('run')}};fit();let w=innerWidth;addEventListener('resize',()=>{if(innerWidth!==w){w=innerWidth;fit()}})}}).catch(()=>{});
}
document.addEventListener('click',e=>{if(e.target.closest('[data-ip]'))copy(S.ip,'IP kopiert');const d=e.target.closest('[data-discord]');if(d&&d.getAttribute('href')==='#'){e.preventDefault();toast('Discord','Link in config.js eintragen')}});
const dc=/DEIN-LINK/.test(S.discord)?'':S.discord;$$('[data-discord]').forEach(a=>{if(dc){a.href=dc;a.target='_blank';a.rel='noopener'}});
if(S.guild)fetch('https://discord.com/api/guilds/'+S.guild+'/widget.json').then(r=>r.json()).then(j=>$$('[data-dc]').forEach(e=>e.textContent=j.presence_count)).catch(()=>{});
/* Server-Status */
async function status(){for(const u of['https://api.mcsrvstat.us/3/'+S.ip,'https://api.mcstatus.io/v2/status/java/'+S.ip]){try{const j=await(await fetch(u)).json();return{on:!!j.online,p:j.players&&j.players.online,m:j.players&&j.players.max,v:typeof j.version==='object'&&j.version?j.version.name_clean:j.version}}catch(e){}}return null}
status().then(s=>{$$('[data-status]').forEach(e=>{e.className='pill '+(s?(s.on?'on':'off'):'');e.textContent=s?(s.on?'Online':'Offline'):'Status nicht verfügbar'});if(s&&s.on){$$('[data-players]').forEach(e=>e.textContent=s.p+'/'+s.m);$$('[data-version]').forEach(e=>e.textContent=s.v||'')}});
/* Events */
const TY={pvp:['PvP','#ff5555'],bauen:['Bauen','#4ade80'],community:['Community','#b78cff'],gewinnspiel:['Gewinnspiel','#ffaa00'],sonstiges:['Event','#b89fc4']};
const XS={TY,
 fmt:d=>new Date(d).toLocaleString('de-DE',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})+' Uhr',
 end:e=>e.end?new Date(e.end):new Date(+new Date(e.start)+7200e3),
 left(e){const n=Date.now(),s=+new Date(e.start);if(n>=+XS.end(e))return'Beendet';if(n>=s)return'Läuft jetzt!';const m=Math.floor((s-n)/6e4),d=Math.floor(m/1440),hh=Math.floor(m%1440/60);return'in '+(d?d+' T ':'')+(d||hh?hh+' Std ':'')+(m%60)+' Min'},
 async load(){let a=[];try{const r=await fetch('/api/events');if(!r.ok)throw 0;a=await r.json()}catch(e){try{a=await(await fetch('/events.json')).json()}catch(x){}}return a.sort((x,y)=>new Date(x.start)-new Date(y.start))},
 ics(e){const z=d=>new Date(d).toISOString().replace(/[-:]|\.\d+/g,''),x=s=>String(s||'').replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n');const t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//XuroSMP//DE','BEGIN:VEVENT','UID:'+(e.id||z(e.start))+'@xurosmp','DTSTAMP:'+z(Date.now()),'DTSTART:'+z(e.start),'DTEND:'+z(XS.end(e)),'SUMMARY:'+x(e.title),'DESCRIPTION:'+x(e.description),'LOCATION:'+x(e.location||S.ip),'END:VEVENT','END:VCALENDAR'].join('\r\n');const a=h('a',{href:URL.createObjectURL(new Blob([t],{type:'text/calendar'})),download:'xurosmp-event.ics'});a.click()},
 card(e){const[tn,c]=TY[e.type]||TY.sonstiges;return h('div',{class:'card ev',style:'--c:'+c,'data-type':e.type},h('span',{class:'tag'},tn),e.pinned?h('span',{class:'tag',style:'--c:#fff;margin-left:6px'},'Angepinnt'):null,h('h3',{},e.title),h('p',{},XS.fmt(e.start)),h('div',{class:'cdn','data-t':e.start,'data-e':+XS.end(e)},XS.left(e)),e.location?h('p',{},'Ort: '+e.location):null,e.prize?h('p',{},'Preis: '+e.prize):null,e.description?h('p',{style:'white-space:pre-wrap;color:var(--tx)'},e.description):null,h('div',{class:'fl'},h('button',{class:'btn2',onclick:()=>XS.ics(e)},'In Kalender'),h('button',{class:'btn2','data-discord':'',onclick:()=>{if(dc)open(dc,'_blank')}},'Discord')))}};
setInterval(()=>$$('.cdn[data-t]').forEach(e=>e.textContent=XS.left({start:e.dataset.t,end:new Date(+e.dataset.e).toISOString()})),30000);
/* Easter Egg: Konami */
const K='ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a';let ki=[];
addEventListener('keydown',e=>{ki.push(e.key.length>1?e.key:e.key.toLowerCase());ki=ki.slice(-10);if(ki.join()===K){document.body.animate([{transform:'translate(-8px,5px)'},{transform:'translate(8px,-6px)'},{transform:'none'}],{duration:500});toast('Sssssss…','Ein Creeper! Mehr Easter Eggs gibt es in der Wiki.')}});
console.log('%cXuroSMP','font:700 28px monospace;color:#ffaa00');
