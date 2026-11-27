/* Hero-Kristall: realistischer Amethyst-Cluster (Canvas 2D) – Sechskant-Prismen mit Flächen, Kanten, Tiefenfarbe, Lichtreflexen */
(function(){
var cv=document.getElementById('crystal');if(!cv||!cv.getContext)return;
var W=560,H=490;cv.width=W;cv.height=H;var ctx=cv.getContext('2d');
var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var seed=7;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
var xmas=document.documentElement.classList.contains('xmas');
function hsl(h,s,l,a){return'hsla('+h+','+s+'%,'+l+'%,'+(a==null?1:a)+')'}

/* Ein Kristall: Sechskant-Prisma + Spitze. cx/base = Fußpunkt, w = Breite, h = Gesamthöhe, ang = Neigung in Grad */
function prism(g,cx,base,w,h,ang,hu,snow){
 g.save();g.translate(cx,base);g.rotate(ang*Math.PI/180);
 var tip=w*1.05,bh=h-tip,x0=-w/2,x1=-w*.2,x2=w*.26,x3=w/2,ax=w*.04;
 var faces=[[x0,x1,1.0,-6],[x1,x2,0.0,0],[x2,x3,-1.0,8]];
 for(var i=0;i<3;i++){
  var f=faces[i],a=f[0],b=f[1],k=f[2],hh=hu+f[3];
  g.save();g.beginPath();
  g.moveTo(a,0);g.lineTo(a,-bh);
  g.lineTo(ax,-h+ (i==1?0:w*.02));g.lineTo(b,-bh+(i==1?w*.0:0));g.lineTo(b,0);g.closePath();
  g.clip();
  var gr=g.createLinearGradient(0,-h,0,0);
  gr.addColorStop(0,hsl(hh,62,66+k*7));
  gr.addColorStop(.16,hsl(hh,66,50+k*7));
  gr.addColorStop(.55,hsl(hh,56,42+k*8));
  gr.addColorStop(.88,hsl(hh-6,40,58+k*6));
  gr.addColorStop(1,hsl(hh-10,28,70+k*5));
  g.fillStyle=gr;g.fillRect(a-2,-h-2,b-a+4,h+4);
  /* Innenleuchten (Transluzenz) */
  var rg=g.createRadialGradient((a+b)/2,-bh*.45,0,(a+b)/2,-bh*.45,Math.max(b-a,w*.4)*1.7);
  rg.addColorStop(0,hsl(hh+14,90,80,.34+(i==1?.1:0)));rg.addColorStop(1,hsl(hh,80,70,0));
  g.fillStyle=rg;g.fillRect(a,-h,b-a,h);
  /* feine Wachstumsstreifen */
  g.lineWidth=1;
  for(var s=0;s<7;s++){var sx=a+(b-a)*(.12+.76*rnd());g.strokeStyle='rgba(255,255,255,'+(.06+rnd()*.12)+')';
   g.beginPath();g.moveTo(sx,-bh*(.05+rnd()*.2));g.lineTo(sx+(rnd()-.5)*3,-bh*(.45+rnd()*.5));g.stroke()}
  /* Einschlüsse / Wolken */
  for(s=0;s<4;s++){g.fillStyle='rgba(255,235,255,'+(.05+rnd()*.07)+')';var cxn=a+(b-a)*rnd(),cyn=-bh*(.1+rnd()*.7);
   g.beginPath();g.ellipse(cxn,cyn,(b-a)*.25,6+rnd()*14,0,0,7);g.fill()}
  /* Abdunkeln zum Fuß (steckt im Gestein) */
  var sh=g.createLinearGradient(0,-h*.18,0,0);sh.addColorStop(0,'rgba(20,4,40,0)');sh.addColorStop(1,'rgba(20,4,40,.7)');
  g.fillStyle=sh;g.fillRect(a,-h*.18,b-a,h*.18);
  g.restore();
 }
 /* Kanten */
 g.lineCap='round';
 g.strokeStyle='rgba(255,248,255,.8)';g.lineWidth=Math.max(1.4,w*.018);
 g.beginPath();g.moveTo(x1,-h*.02);g.lineTo(x1,-bh);g.lineTo(ax,-h+w*.02);g.stroke();
 g.strokeStyle='rgba(255,230,255,.45)';g.lineWidth=Math.max(1,w*.012);
 g.beginPath();g.moveTo(x0+1,-h*.02);g.lineTo(x0+1,-bh);g.lineTo(ax,-h+w*.02);g.stroke();
 g.strokeStyle='rgba(30,6,60,.55)';
 g.beginPath();g.moveTo(x2,-h*.02);g.lineTo(x2,-bh);g.lineTo(ax,-h+w*.02);g.stroke();
 /* Terminationskanten (Übergang Prisma → Spitze) */
 g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.2;
 g.beginPath();g.moveTo(x0,-bh);g.lineTo(x1,-bh);g.lineTo(x2,-bh);g.stroke();
 g.strokeStyle='rgba(30,6,60,.4)';g.beginPath();g.moveTo(x2,-bh);g.lineTo(x3,-bh);g.stroke();
 /* Glanzlicht (Spiegelung) */
 var sp=g.createLinearGradient(0,-bh*.9,0,-bh*.1);sp.addColorStop(0,'rgba(255,255,255,0)');sp.addColorStop(.3,'rgba(255,255,255,.85)');sp.addColorStop(1,'rgba(255,255,255,0)');
 g.strokeStyle=sp;g.lineWidth=Math.max(1.6,w*.04);g.beginPath();g.moveTo(x0+w*.14,-bh*.88);g.lineTo(x0+w*.14,-bh*.14);g.stroke();
 g.strokeStyle='rgba(255,255,255,.32)';g.lineWidth=Math.max(1,w*.02);g.beginPath();g.moveTo(x1+w*.1,-bh*.78);g.lineTo(x1+w*.1,-bh*.4);g.stroke();
 g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(x0+w*.14,-bh*.88,Math.max(1.6,w*.025),0,7);g.fill();
 /* dunkler Umriss */
 g.strokeStyle='rgba(28,5,52,.75)';g.lineWidth=1.3;g.lineJoin='round';
 g.beginPath();g.moveTo(x0,0);g.lineTo(x0,-bh);g.lineTo(ax,-h+w*.02);g.lineTo(x3,-bh);g.lineTo(x3,0);g.stroke();
 /* Schnee auf der Spitze */
 if(snow){var sy=-h+tip*.34;g.fillStyle='#f7f2ff';g.beginPath();g.moveTo(ax,-h+w*.02);
  g.lineTo(x3-(x3-ax)*.66,sy);g.lineTo(x0+(ax-x0)*.62,sy);g.closePath();g.fill();
  g.beginPath();g.moveTo(x0+(ax-x0)*.62-3,sy-2);g.quadraticCurveTo(x0+(ax-x0)*.8,sy+9,ax-w*.1,sy+3);g.quadraticCurveTo(ax+w*.05,sy+11,ax+w*.16,sy+4);g.quadraticCurveTo(ax+w*.24,sy+9,x3-(x3-ax)*.64+2,sy-1);g.lineTo(ax,sy-6);g.closePath();g.fill()}
 g.restore();
}

/* Statisch gerendert */
var base=document.createElement('canvas');base.width=W;base.height=H;var b=base.getContext('2d');
/* Bodenleuchten */
var gl=b.createRadialGradient(W/2,H-30,10,W/2,H-30,300);gl.addColorStop(0,'rgba(190,130,255,.35)');gl.addColorStop(1,'rgba(190,130,255,0)');
b.fillStyle=gl;b.fillRect(0,H-260,W,260);
/* Kristalle von hinten nach vorn: cx, base, w, h, Neigung, Farbton */
var C=[[286,452,108,340,2,268],[196,456,80,238,-16,272],[378,456,86,258,15,264],
 [118,462,58,150,-40,282],[452,462,58,160,38,258],[240,468,52,128,-7,276],[334,470,50,108,10,262],[70,470,42,84,-64,284],[504,470,42,86,60,256]];
C.forEach(function(c,i){prism(b,c[0],c[1],c[2],c[3],c[4],c[5],xmas&&i<5)});

/* Muttergestein */
(function(){
 var pts=[],x;for(x=24;x<=W-24;x+=8){var d=Math.abs(x-W/2)/(W/2);pts.push([x,H-34-(1-d*d)*26+rnd()*14-(x>150&&x<420?8:0)])}
 b.beginPath();b.moveTo(10,H);b.lineTo(24,H-26);pts.forEach(function(p){b.lineTo(p[0],p[1])});b.lineTo(W-10,H-26);b.lineTo(W-6,H);b.closePath();
 var rg=b.createLinearGradient(0,H-70,0,H);rg.addColorStop(0,'#4a3068');rg.addColorStop(.4,'#2b1842');rg.addColorStop(1,'#0f0716');b.fillStyle=rg;b.fill();
 b.save();b.clip();
 for(var i=0;i<900;i++){var px=20+rnd()*(W-40),py=H-80+rnd()*80,r=.6+rnd()*2.4,t=rnd();
  b.fillStyle=t<.5?'rgba(10,3,18,'+(.25+rnd()*.3)+')':t<.85?'rgba(120,90,160,'+(.1+rnd()*.2)+')':'rgba(220,190,255,'+(.25+rnd()*.4)+')';
  b.beginPath();b.arc(px,py,r,0,7);b.fill()}
 for(i=0;i<22;i++){var qx=30+rnd()*(W-60),qy=H-70+rnd()*60;b.strokeStyle='rgba(8,2,14,.5)';b.lineWidth=1.2;
  b.beginPath();b.moveTo(qx,qy);b.lineTo(qx+(rnd()-.5)*50,qy+(rnd()-.2)*22);b.stroke()}
 b.restore();
 b.strokeStyle='rgba(190,160,235,.5)';b.lineWidth=1.4;b.beginPath();pts.forEach(function(p,i){i?b.lineTo(p[0],p[1]):b.moveTo(p[0],p[1])});b.stroke();
 /* kleine Druse am Gestein */
 for(i=0;i<16;i++){var kx=40+rnd()*(W-80),ky=H-18-rnd()*26,kw=7+rnd()*9;
  prism(b,kx,ky,kw,kw*(1.6+rnd()*1.8),(rnd()-.5)*70,256+rnd()*30,false)}
})();

var sp=[[286,112],[176,232],[388,206],[108,330],[456,336]];
function draw(t){
 ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,W,H);ctx.drawImage(base,0,0);
 if(!calm){
  var ph=(t/1000%6)/4.2;if(ph<1){var x=-160+ph*(W+320);
   ctx.globalCompositeOperation='source-atop';
   var g=ctx.createLinearGradient(x-70,0,x+70,H*.7);
   g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.42)');g.addColorStop(1,'rgba(255,255,255,0)');
   ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  ctx.globalCompositeOperation='source-over';
 }
 for(var i=0;i<sp.length;i++){
  var a=calm?(i%2?.7:.4):Math.max(0,Math.sin(t/700+i*1.9));a=a*a;if(a<.03)continue;
  var X=sp[i][0],Y=sp[i][1],L=6+a*14;
  var rg=ctx.createRadialGradient(X,Y,0,X,Y,L*1.3);rg.addColorStop(0,'rgba(255,245,255,'+a+')');rg.addColorStop(1,'rgba(220,170,255,0)');
  ctx.fillStyle=rg;ctx.fillRect(X-L*1.3,Y-L*1.3,L*2.6,L*2.6);
  ctx.strokeStyle='rgba(255,252,255,'+a+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(X-L,Y);ctx.lineTo(X+L,Y);ctx.moveTo(X,Y-L);ctx.lineTo(X,Y+L);ctx.stroke();
 }
}
draw(0);
if(!calm){var last=0;(function loop(t){if(!document.hidden&&t-last>33){last=t;draw(t)}requestAnimationFrame(loop)})(0)}
})();
