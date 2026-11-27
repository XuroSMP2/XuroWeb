/* Saisonales Design: ab 27.11. bis 6.1. automatisch Weihnachten. Test: ?xmas=1 oder ?xmas=0 an die Adresse hängen. */
(function(){
 var d=new Date(),m=d.getMonth()+1,t=d.getDate(),on=(m===11&&t>=27)||m===12||(m===1&&t<=6);
 try{var q=location.search.match(/[?&]xmas=([01])/);if(q)sessionStorage.setItem('xmas',q[1]);var s=sessionStorage.getItem('xmas');if(s!==null)on=s==='1'}catch(e){}
 if(!on)return;
 var root=document.documentElement;root.classList.add('xmas');
 var calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function el(tag,id,html){var e=document.createElement(tag);if(id)e.id=id;if(html)e.innerHTML=html;return e}
 function ready(f){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f()}
 ready(function(){
  var b=document.body;
  /* Himmel: Verlauf, Polarlicht, Mond, Sterne */
  var sky=el('div','xs-sky','<i class="xs-aur a1"></i><i class="xs-aur a2"></i><i class="xs-moon"></i><i class="xs-stars"></i><i class="xs-stars s2"></i>');b.prepend(sky);
  /* Tannen */
  var trees=el('div','xs-trees');trees.setAttribute('aria-hidden','true');b.prepend(trees);
  function pine(x,h,fill,snow){var w=h*.46,y=0,s='';var tiers=4;for(var i=0;i<tiers;i++){var th=h*(.36),tw=w*(1-i*.2),top=h*(i*.2);
    s+='<path d="M'+(x)+' '+(top)+' L'+(x+tw/2)+' '+(top+th)+' L'+(x-tw/2)+' '+(top+th)+'Z" fill="'+fill+'"/>';
    if(snow)s+='<path d="M'+x+' '+top+' L'+(x+tw*.2)+' '+(top+th*.38)+' Q'+x+' '+(top+th*.3)+' '+(x-tw*.24)+' '+(top+th*.42)+'Z" fill="#efe6ff" opacity=".85"/>'}
   return s+'<rect x="'+(x-h*.025)+'" y="'+(h*.9)+'" width="'+(h*.05)+'" height="'+(h*.12)+'" fill="'+fill+'"/>'}
  function drawTrees(){var W=innerWidth,H=Math.max(180,Math.min(340,innerHeight*.36)),s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">',r=7;
   function rnd(){r=(r*9301+49297)%233280;return r/233280}
   for(var layer=0;layer<2;layer++){var fill=layer?'#0b0318':'#2a1262',gap=layer?150:110,x=-20;
    while(x<W+40){var h=(layer?.62:.46)*H*(.75+rnd()*.5);s+='<g transform="translate(0,'+(H-h-8)+')">'+pine(x,h,fill,layer===0)+'</g>';x+=gap*(.7+rnd()*.7)}}
   trees.innerHTML=s+'<rect x="0" y="'+(H-10)+'" width="'+W+'" height="10" fill="#0b0318"/></svg>'}
  drawTrees();
  /* Lichterkette unter dem Header */
  var hd=document.querySelector('header'),gar=el('div','xs-lights');gar.setAttribute('aria-hidden','true');
  function drawLights(){var W=innerWidth,n=Math.max(4,Math.round(W/150)),seg=W/n,cols=['#ff4d5e','#ffd24a','#3ddc84','#c58bff','#5fd4ff'],s='<svg width="'+W+'" height="50" viewBox="0 0 '+W+' 50"><path d="M0 2',bulbs='',k=0;
   for(var i=0;i<n;i++){var x0=i*seg,x1=x0+seg;s+=' Q'+(x0+seg/2)+' 30 '+x1+' 2';
    for(var j=1;j<=3;j++){var u=j/4,x=(1-u)*(1-u)*x0+2*u*(1-u)*(x0+seg/2)+u*u*x1,y=(1-u)*(1-u)*2+2*u*(1-u)*30+u*u*2,c=cols[k%cols.length];
     bulbs+='<g class="xs-b" style="animation-delay:'+((k*.37)%2.4).toFixed(2)+'s"><circle cx="'+x.toFixed(1)+'" cy="'+(y+9).toFixed(1)+'" r="9" fill="'+c+'" opacity=".28"/><rect x="'+(x-2.5).toFixed(1)+'" y="'+(y-1).toFixed(1)+'" width="5" height="5" fill="#2a1a40"/><path d="M'+(x-4).toFixed(1)+' '+(y+4).toFixed(1)+' Q'+x.toFixed(1)+' '+(y+17).toFixed(1)+' '+(x+4).toFixed(1)+' '+(y+4).toFixed(1)+'Z" fill="'+c+'"/></g>';k++}}
   gar.innerHTML=s+'" fill="none" stroke="#1d1030" stroke-width="2"/>'+bulbs+'</svg>'}
  if(hd){hd.appendChild(gar);drawLights()}
  /* Countdown und Gruß */
  var hero=document.querySelector('#oberflaeche h1.mark');
  if(hero){var days=Math.round((new Date(d.getFullYear(),11,24)-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5),txt='';
   if(days>1)txt='Noch '+days+' Tage bis Heiligabend';else if(days===1)txt='Morgen ist Heiligabend';else if(days===0)txt='Heute ist Heiligabend';else if(m===12&&t<=26)txt='Frohe Weihnachten';else if((m===12&&t>=30)||m===1)txt='Frohes neues Jahr';
   if(txt){var c=el('p','xs-count');c.className='xs-count';c.textContent=txt;hero.parentNode.insertBefore(c,hero.nextSibling)}
   var sp=document.getElementById('splash');if(sp){var set=function(){if(sp.textContent!=='Frohe Weihnachten!')sp.textContent='Frohe Weihnachten!'};set();new MutationObserver(set).observe(sp,{childList:true,characterData:true,subtree:true})}}
  /* Schneefall */
  var cv=el('canvas','xs-snow');cv.setAttribute('aria-hidden','true');b.appendChild(cv);var g=cv.getContext('2d'),W=0,H=0,R=1,fl=[],mx=.5,t0=performance.now(),born=+(sessionStorage.getItem('xs-born')||Date.now());try{sessionStorage.setItem('xs-born',born)}catch(e){}
  function size(){R=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*R;cv.height=H*R;cv.style.width=W+'px';cv.style.height=H+'px';g.setTransform(R,0,0,R,0,0);
   var n=Math.min(170,Math.round(W/8));fl=[];for(var i=0;i<n;i++){var z=Math.random();fl.push({x:Math.random()*W,y:Math.random()*H,z:z,r:z<=.72?.8+z*2.6:4+z*7,v:.35+z*1.5,ph:Math.random()*6.28,rot:Math.random()*6.28,vr:(Math.random()-.5)*.02,star:z>.72})}drawTrees();drawLights()}
  function arm(x,y,r,a){g.save();g.translate(x,y);g.rotate(a);g.beginPath();for(var i=0;i<6;i++){g.moveTo(0,0);g.lineTo(0,-r);g.moveTo(0,-r*.55);g.lineTo(r*.22,-r*.8);g.moveTo(0,-r*.55);g.lineTo(-r*.22,-r*.8);g.rotate(Math.PI/3)}g.stroke();g.restore()}
  function frame(now){var tt=(now-t0)/1000;g.clearRect(0,0,W,H);
   var gust=Math.sin(tt*.35)*.6+Math.sin(tt*.9+2)*.25+(mx-.5)*1.2;
   for(var i=0;i<fl.length;i++){var f=fl[i];
    if(!calm){f.y+=f.v;f.x+=gust*(.4+f.z)+Math.sin(tt*.8+f.ph)*.35*(.3+f.z);f.rot+=f.vr}
    if(f.y>H+14){f.y=-14;f.x=Math.random()*W}if(f.x>W+14)f.x=-14;if(f.x<-14)f.x=W+14;
    var a=.35+f.z*.6;
    if(f.star){g.strokeStyle='rgba(245,238,255,'+a+')';g.lineWidth=1+f.z*.6;g.lineCap='round';arm(f.x,f.y,f.r,f.rot)}
    else{g.fillStyle='rgba(250,246,255,'+a+')';g.beginPath();g.arc(f.x,f.y,f.r,0,6.283);g.fill()}}
   /* Schneeverwehung am unteren Rand, wächst langsam */
   var grow=Math.min(1,(Date.now()-born)/6e5),hh=8+grow*30;g.beginPath();g.moveTo(0,H);
   for(var x=0;x<=W;x+=24)g.lineTo(x,H-hh-Math.sin(x*.013+1)*5-Math.sin(x*.031)*3);
   g.lineTo(W,H);g.closePath();var gr=g.createLinearGradient(0,H-hh-8,0,H);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#d9c8ff');g.fillStyle=gr;g.fill();
   if(!calm)requestAnimationFrame(frame)}
  addEventListener('mousemove',function(e){mx=e.clientX/Math.max(1,innerWidth)},{passive:true});
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){size();if(calm)frame(performance.now())},150)});
  size();frame(performance.now());
 });
})();
