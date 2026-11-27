/* Pixel-Kristall für die Startseite: Amethyst-Gruppe, Pixel für Pixel berechnet.
   Jede Spitze ist ein sechskantiges Prisma mit drei Facetten, Lichteinfall von links oben,
   Streifung, Randlicht, Glanzstreifen und einem Funkeln, das über die Steine wandert. */
(function(){
 var cv=document.getElementById('crystal');if(!cv)return;
 var N=80,ctx=cv.getContext('2d'),img=ctx.createImageData(N,N),buf=new Uint32Array(img.data.buffer),base=new Uint32Array(N*N),snow=document.documentElement.classList.contains('xmas');
 function rgb(h){h=h.replace('#','');return[parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]}
 function pack(c,a){return((a===undefined?255:a)<<24|c[2]<<16|c[1]<<8|c[0])>>>0}
 function P(h){return pack(rgb(h))}
 var seed=7;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
 /* Paletten von dunkel (Fuß) nach hell (Spitze) */
 var PAL={
  L:['#5d3aa0','#6f49b6','#8460cb','#9b79de','#b496ee'],
  C:['#7a55c2','#9068d6','#a681e6','#bd9bf3','#d6bdfd'],
  R:['#3f2680','#4e3092','#5f3da6','#714ebb','#865fcf'],
  PL:['#8e5fc4','#a875d6','#c48ae4','#dca1ee','#f1bdf1'],
  PC:['#a672d0','#c088e0','#d89dec','#eab5f4','#f9d2f8'],
  PR:['#5a3490','#6b42a4','#7d52b8','#9163cb','#a877dc']};
 var SNOW={L:'#d9cdf5',C:'#ffffff',R:'#b5a3dc'};
 var EDGE_DARK=P('#2a1260'),EDGE_RIM=P('#cdb0f8'),GLINT=P('#fff1c2'),STREAK=P('#efe2ff');
 var BAYER=[[0,2],[3,1]];
 var layerMask=new Uint8Array(N*N);
 function crystal(cx,cy,w,h,t,lean,pink,tipOff){
  var a=lean*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),hw=w/2,H=h+t;layerMask.fill(0);var px=[];
  for(var y=0;y<N;y++)for(var x=0;x<N;x++){
   var dx=x+.5-cx,dy=-(y+.5-cy),lx=dx*ca-dy*sa,ly=dx*sa+dy*ca; /* lokale Koordinaten, ly nach oben */
   if(ly<0||ly>H)continue;
   var half=ly<=h?hw:hw*(1-(ly-h)/t);if(Math.abs(lx-(ly>h?tipOff*(ly-h)/t:0))>half)continue;
   layerMask[y*N+x]=1;px.push([x,y,lx-(ly>h?tipOff*(ly-h)/t:0),ly,half])}
  var fam=pink?['PL','PC','PR']:['L','C','R'];
  px.forEach(function(p){var x=p[0],y=p[1],lx=p[2],ly=p[3],half=Math.max(.001,p[4]),u=lx/half,f=u<-.34?0:u<.42?1:2,k=['L','C','R'][f],pal=PAL[fam[f]];
   var tt=ly/H,sh=tt*4.4+(BAYER[y&1][x&1]-1.5)*.34;
   /* Streifung wie bei echtem Quarz */
   if(ly<h&&Math.floor(ly)%9===0&&f!==1)sh-=.7;
   var i=Math.max(0,Math.min(4,Math.round(sh))),col=pal[i];
   /* Fuß dunkler, innen leuchtet es */
   if(ly<h*.14)col=pal[0];
   if(snow&&tt>.8-(f===1?.04:0)-(BAYER[y&1][x&1]*.03))col=SNOW[k];
   /* Facettenkanten */
   if(Math.abs(u+.34)<.5/half&&ly<h)col=pal[Math.max(0,i-1)];
   if(Math.abs(u-.42)<.5/half&&ly<h)col=pal[Math.max(0,i-2)];
   /* Glanzstreifen auf der Mittelfacette */
   if(f===1&&Math.abs(u+.05)<.55/half&&tt>.24&&tt<.62)col='#efe2ff';
   base[y*N+x]=P(col)});
  /* Funkeln wie im Vorbild: hellgelber Fleck oben links */
  var gx=cx+(-.18*hw)*ca-(h*.78)*-sa+0,gy=cy-(h*.78)*ca-(-.18*hw)*sa;
  if(!snow&&w>9){var ix=Math.round(gx),iy=Math.round(gy);for(var yy=0;yy<2;yy++)for(var xx=0;xx<3;xx++)if(layerMask[(iy+yy)*N+ix+xx])base[(iy+yy)*N+ix+xx]=GLINT}
  /* Rand: Randlicht links oben, Schatten sonst */
  px.forEach(function(p){var x=p[0],y=p[1],edge=false,rim=false;
   [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d,j){var nx=x+d[0],ny=y+d[1];if(nx<0||ny<0||nx>=N||ny>=N||!layerMask[ny*N+nx]){edge=true;if(j===0||j===2)rim=true}});
   if(edge)base[y*N+x]=rim&&!snow?EDGE_RIM:EDGE_DARK;
   if(edge&&rim&&(BAYER[y&1][x&1]>1))base[y*N+x]=EDGE_DARK})}
 /* Gruppe, von hinten nach vorn */
 crystal(40,67,15,31,13,0,false,1);
 crystal(27,67,11,21,10,-21,false,-1);
 crystal(53,67,12,23,10,23,false,1);
 crystal(19,68,9,13,8,-52,true,0);
 crystal(61,68,9,14,8,50,true,0);
 crystal(34,69,8,12,7,-9,false,0);
 crystal(47,70,7,10,6,13,true,0);
 crystal(12,70,6,8,5,-72,true,0);
 crystal(68,70,6,8,5,70,false,0);
 /* Gestein, aus dem sie wachsen */
 var R=['#2b1d49','#382860','#463477','#241838'],ROCK=['#5a477f','#6d5a96'];
 for(var x=8;x<72;x++){var top=Math.round(66.5+Math.abs(x-40)*.1+Math.sin(x*.55)*1.6+Math.sin(x*1.3)*.9+(rnd()-.5)*1.4);
  for(var y=top;y<77-Math.max(0,Math.round((Math.abs(x-40)-22)*.45));y++){var c=R[Math.floor(rnd()*3)];if(y>top+3&&rnd()<.5)c=R[3];if(y===top||y===top+1&&BAYER[y&1][x&1]>1)c=ROCK[(x+y)%2];
   if(rnd()<.05)c='#7f6aae';if(rnd()<.015)c='#cdb0f8';base[y*N+x]=P(c)}}
 if(snow)for(var x=8;x<72;x++)for(var y=60;y<72;y++){var o=base[y*N+x];if(o&&(o>>>24)===255){var r0=o&255,g0=(o>>8)&255,b0=(o>>16)&255;if(r0<130&&g0<110&&b0<170&&y>0&&!base[(y-1)*N+x]){base[y*N+x]=P('#ffffff');if(!base[(y)*N+x-1]||BAYER[y&1][x&1])base[(y+1)*N+x]=P('#e6dcf7')}}}
 /* Funkeln */
 var spark=[[40,16,0],[27,31,1.7],[53,29,3.1],[19,53,.6],[61,52,2.4],[34,52,4],[47,56,5],[40,38,2]];
 function draw(t){
  buf.set(base);
  var pos=(t*.0003%1)*190-45; /* diagonale Lichtkante */
  if(t>=0)for(var y=0;y<N;y++)for(var x=0;x<N;x++){var v=buf[y*N+x];if(!(v>>>24))continue;var d=Math.abs(x+y*.9-pos);if(d<4.5){var k=(1-d/4.5)*.5,r=v&255,g=(v>>8)&255,b=(v>>16)&255;buf[y*N+x]=pack([r+(255-r)*k|0,g+(255-g)*k|0,b+(255-b)*k|0])}}
  spark.forEach(function(s){var ph=Math.sin(t*.003+s[2]*2.2);if(ph<.35)return;var r=ph>.8?2:1,c=pack([255,248,225]);
   var sx=s[0],sy=s[1];function set(a,b,v){if(a>=0&&b>=0&&a<N&&b<N)buf[b*N+a]=v}
   set(sx,sy,c);for(var i=1;i<=r;i++){set(sx+i,sy,c);set(sx-i,sy,c);set(sx,sy+i,c);set(sx,sy-i,c)}});
  ctx.putImageData(img,0,-10,0,10,80,70)}
 var calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(calm){draw(-1);return}
 var last=0;(function loop(now){if(now-last>60){last=now;draw(now)}requestAnimationFrame(loop)})(0);
})();
