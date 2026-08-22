ass="tag">Campus clear</p><h2>All floors complete</h2><p>Final score <strong>'+score+'</strong></p><p>Correct '+ok+'/'+ans+' · Coins '+coins+'</p><button class="btn gold" id="go">Run again (new shuffle)</button><button class="btn ghost" id="hub">Title</button>';document.getElementById("go").onclick=start;document.getElementById("hub").onclick=title;}
function ask(){mode="q";const q=W.q;ov.classList.remove("hid");card.innerHTML='<p class="tag">'+esc(q.src)+'</p><p class="prompt">'+esc(q.prompt)+'</p><button class="side" data-a="left"><b>A</b> '+esc(q.left)+'</button><button class="side" data-a="right"><b>B</b> '+esc(q.right)+'</button><p class="hint">Choose, then drop into that tunnel.</p>';card.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>pick(b.getAttribute("data-a"),b));}
function pick(a,btn){const q=W.q,good=a===q.correct;ans++;if(good)ok++;score+=good?150:0;let phys=a;if(W.flip)phys=a==="left"?"right":"left";side=phys;W.done=1;card.querySelectorAll(".side").forEach(b=>{b.disabled=1;const x=b.getAttribute("data-a");if(x===q.correct)b.classList.add("ok");else if(x===a)b.classList.add("bad");});const fb=document.createElement("div");fb.className="fb "+(good?"ok":"bad");fb.innerHTML="<strong>"+(good?"Correct path":"Wrong path")+"</strong><br/>"+esc(good?q.why:q.bad);card.appendChild(fb);const c=document.createElement("button");c.className="btn"+(good?" gold":"");c.textContent=good?"Drop into the correct tunnel":"Continue (run ends)";c.onclick=()=>{ov.classList.add("hid");const tun=phys==="left"?W.L:W.R;P.x=tun.x+6;P.y=tun.y-P.h-4;P.vy=0;mode="play";if(!good){reason=q.bad;setTimeout(()=>{if(mode==="play"){P.dead=1;die(q.bad);}},350);}else{score+=50;hud();report(score);}};card.appendChild(c);hud();}
function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function burst(x,y,c,n){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*5,vy:-Math.random()*4-1,life:20+(Math.random()*15|0),c,s:2+Math.random()*3});}
function step(){if(mode!=="play"||!P||!W||P.dead)return;
const L=keys.has("ArrowLeft")||keys.has("a")||keys.has("A")||tL,Rgt=keys.has("ArrowRight")||keys.has("d")||keys.has("D")||tR,Jp=keys.has(" ")||keys.has("ArrowUp")||keys.has("w")||keys.has("W")||tJ;
if(Jp&&!jHeld)P.jbuf=8;jHeld=Jp;if(P.jbuf>0)P.jbuf--;
if(L){P.vx=-R;P.face=-1;}else if(Rgt){P.vx=R;P.face=1;}else P.vx*=.82;
if(P.gnd){P.coy=6;P.jumps=2;}else if(P.coy>0)P.coy--;
if(P.jbuf>0&&(P.coy>0||P.jumps>0)){if(P.coy>0){P.vy=J;P.coy=0;P.jumps=1;}else{P.vy=J*.92;P.jumps--;}P.jbuf=0;P.gnd=0;burst(P.x+10,P.y+P.h,"#C9A227",5);}
if(!Jp&&P.vy<-3)P.vy*=.6;P.vy+=G;if(P.vy>14)P.vy=14;
for(const m of W.movers){m.x+=m.sp*m.dir;if(m.x<=m.min){m.x=m.min;m.dir=1;}if(m.x+m.w>=m.max){m.x=m.max-m.w;m.dir=-1;}}
P.x+=P.vx;if(P.on)P.x+=P.on.sp*P.on.dir;P.on=null;
const box=()=>({x:P.x,y:P.y,w:P.w,h:P.h});
for(const s of W.solids)if(aabb(box(),s)){if(P.vx>0)P.x=s.x-P.w;else if(P.vx<0)P.x=s.x+s.w;P.vx=0;}
P.y+=P.vy;P.gnd=0;
for(const s of W.solids)if(aabb(box(),s)){if(P.vy>0){P.y=s.y-P.h;P.vy=0;P.gnd=1;}else if(P.vy<0){P.y=s.y+s.h;P.vy=0;}}
if(P.vy>=0){for(const s of W.one){const f=P.y+P.h;if(P.x+P.w>s.x&&P.x<s.x+s.w&&f>=s.y&&f<=s.y+s.h+P.vy+4){P.y=s.y-P.h;P.vy=0;P.gnd=1;}}
for(const m of W.movers){const f=P.y+P.h;if(P.x+P.w>m.x&&P.x<m.x+m.w&&f>=m.y&&f<=m.y+m.h+6){P.y=m.y-P.h;P.vy=0;P.gnd=1;P.on=m;}}}
for(const c of W.coins)if(!c.t&&aabb(box(),c)){c.t=1;coins++;score+=10;burst(c.x+8,c.y+8,"#C9A227",6);hud();report(score);}
for(const h of W.haz)if(aabb(box(),h)){P.dead=1;shake=12;burst(P.x+10,P.y+14,"#b42318",12);die("Spikes. Watch the floor.");return;}
if(P.y>W.H+40){if(W.done&&side){const want=W.flip?(W.q.correct==="left"?"right":"left"):W.q.correct;if(side===want){score+=100;hud();report(score);if(fi+1>=N)win();else{mode="lesson";ov.classList.remove("hid");card.innerHTML='<p class="tag">Right tunnel</p><h2>Lesson locked in</h2><p>'+esc(W.q.why)+'</p><button class="btn gold" id="go">Next floor</button>';document.getElementById("go").onclick=()=>{load(fi+1);mod