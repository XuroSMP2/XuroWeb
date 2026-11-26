/* Tiefenanzeige: Y-Wert nach Scrollstand, Sprungmarken je Schicht. */
(function(){
 var layers=[].slice.call(document.querySelectorAll('.layer[data-label]'));if(!layers.length)return;
 var g=document.createElement('div');g.id='gauge';g.setAttribute('role','navigation');g.setAttribute('aria-label','Tiefenanzeige');
 g.innerHTML='<div class="rail"></div>';var y=document.createElement('div');y.className='y';y.textContent='Y 64';g.appendChild(y);
 var links=layers.map(function(l){var a=document.createElement('a');a.href='#'+l.id;a.innerHTML='<span>'+l.dataset.label+'</span>';g.appendChild(a);return a});
 document.body.appendChild(g);
 var H=0,tops=[];function measure(){H=document.documentElement.scrollHeight-innerHeight;var h=g.clientHeight;tops=layers.map(function(l){return(l.offsetTop/Math.max(1,H))*h});links.forEach(function(a,i){a.style.top=Math.min(h-4,tops[i]+4)+'px'});upd()}
 function upd(){var p=Math.max(0,Math.min(1,scrollY/Math.max(1,H))),h=g.clientHeight;y.style.top=(p*h)+'px';y.textContent='Y '+Math.round(64-p*128);
  var cur=0;layers.forEach(function(l,i){if(scrollY+innerHeight*.4>=l.offsetTop)cur=i});links.forEach(function(a,i){a.classList.toggle('on',i===cur)})}
 addEventListener('scroll',upd,{passive:true});addEventListener('resize',measure);addEventListener('load',measure);measure();setTimeout(measure,800);
})();
