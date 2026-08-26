e="play";ov.classList.add("hid");}}return;}else{die(W.q.bad);return;}}if(!W.done&&P.x>W.L.x-320){ask();return;}die("Fell off the floor.");return;}
if(!W.done&&P.x>W.L.x-190){ask();return;}
if(W.done&&aabb(box(),W.goal)){score+=100;hud();report(score);if(fi+1>=N)win();else{mode="lesson";ov.classList.remove("hid");card.innerHTML='<p class="tag">Floor clear</p><h2>'+esc(W.q.src)+'</h2><p>'+esc(W.q.why)+'</p><button class="btn gold" id="go">Next floor</button>';document.getElementById("go").onclick=()=>{load(fi+1);mode="play";ov.classList.add("hid");}}}
const t=P.x-cv.width*.35;cam+=(t-cam)*.12;if(cam<0)cam=0;if(cam>W.W-cv.width)cam=Math.max(0,W.W-cv.width);
parts=parts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.life--;return p.life>0;});if(shake>0)shake--;
}
function draw(){const w=cv.width,h=cv.height;ctx.save();if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#1a4a6e");g.addColorStop(1,"#0B2A4A");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
if(!W){ctx.restore();return;}ctx.translate(-Math.floor(cam),0);
for(let y=0;y<W.rows;y++)for(let x=0;x<W.cols;x++){const t=W.tiles[y][x],px=x*T,py=y*T;if(t==="#"){ctx.fillStyle="#0f3a63";ctx.fillRect(px,py,T,T);ctx.fillStyle="#C9A227";ctx.fillRect(px,py,T,3);}else if(t==="="){ctx.fillStyle="#2a6a8a";ctx.fillRect(px,py,T,10);ctx.fillStyle="#C9A227";ctx.fillRect(px,py,T,2);}else if(t==="^"){ctx.fillStyle="#b42318";ctx.beginPath();ctx.moveTo(px+4,py+T);ctx.lineTo(px+T/2,py+12);ctx.lineTo(px+T-4,py+T);ctx.fill();}}
for(const m of W.movers){ctx.fillStyle="#3d7ea6";ctx.fillRect(m.x,m.y,m.w,m.h);ctx.fillStyle="#C9A227";ctx.fillRect(m.x,m.y,m.w,3);}
if(!W.done){[["A",W.L],["B",W.R]].forEach(([lab,tun])=>{ctx.fillStyle="rgba(201,162,39,.25)";ctx.fillRect(tun.x,tun.y-48,tun.w,48);ctx.fillStyle="#C9A227";ctx.font="bold 20px system-ui";ctx.fillText(lab,tun.x+tun.w/2-6,tun.y-18);});}
for(const c of W.coins)if(!c.t){ctx.fillStyle="#C9A227";ctx.beginPath();ctx.arc(c.x+8,c.y+8,7,0,Math.PI*2);ctx.fill();}
const gl=W.goal;ctx.fillStyle="#C9A227";ctx.fillRect(gl.x+8,gl.y-40,4,48);ctx.fillStyle="#1f7a4c";ctx.beginPath();ctx.moveTo(gl.x+12,gl.y-40);ctx.lineTo(gl.x+36,gl.y-28);ctx.lineTo(gl.x+12,gl.y-16);ctx.fill();
if(P&&!P.dead){ctx.fillStyle="#e8d48a";ctx.fillRect(P.x,P.y,P.w,P.h);ctx.fillStyle="#0B2A4A";ctx.fillRect(P.x+(P.face>0?12:2),P.y+8,6,6);}
for(const p of parts){ctx.globalAlpha=Math.max(0,p.life/30);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s);ctx.globalAlpha=1;}
if(!W.done){const sx=W.L.x-300;ctx.fillStyle="rgba(11,42,74,.85)";ctx.fillRect(sx,140,120,28);ctx.strokeStyle="#C9A227";ctx.strokeRect(sx,140,120,28);ctx.fillStyle="#C9A227";ctx.font="bold 12px system-ui";ctx.fillText("QUESTION AHEAD",sx+10,158);}
ctx.restore();
}
window.addEventListener("keydown",e=>{keys.add(e.key);if(["ArrowLeft","ArrowRight","ArrowUp"," ","w","W","a","A","d","D"].includes(e.key))e.preventDefault();});
window.addEventListener("keyup",e=>keys.delete(e.key));
function bind(el,set){const on=v=>e=>{e.preventDefault();set(v);el.classList.toggle("on",v);};el.addEventListener("touchstart",on(1),{passive:false});el.addEventListener("touchend",on(0));el.addEventListener("mousedown",on(1));el.addEventListener("mouseup",on(0));el.addEventListener("mouseleave",on(0));}
bind(document.getElementById("tL"),v=>tL=v);bind(document.getElementById("tR"),v=>tR=v);bind(document.getElementById("tJ"),v=>tJ=v);
function resize(){const s=Math.min(Math.min(window.innerWidth,1100)/960,window.innerHeight/540);cv.style.width=Math.floor(960*s)+"px";cv.style.height=Math.floor(540*s)+"px";if(window.matchMedia("(pointer:coarse)").matches||window.innerWidth<900)touch.classList.add("on");else touch.classList.remove("on");}
resize();window.addEventListener("resize",resize);
let last=performance.now(),acc=0;const DT=1000/60;
function frame(now){acc+=Math.min(100,now-last);last=now;while(acc>=DT){step();acc-=DT;}draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);title();
})();