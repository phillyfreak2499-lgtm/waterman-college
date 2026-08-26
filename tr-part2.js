ndom()*(i+1)|0;[x[i],x[j]]=[x[j],x[i]];}return x;};
function build(i,q){
const cols=50+(i%4),rows=14,tiles=Array.from({length:rows},()=>Array(cols).fill(" "));
for(let x=0;x<cols;x++){tiles[12][x]="#";tiles[13][x]="#";}
const r=Math.random;let x=8;while(x<cols-16){const w=2+(r()*3|0);if(r()>.4){for(let k=0;k<w&&x+k<cols-14;k++){tiles[12][x+k]=" ";tiles[13][x+k]=r()>.5?"^":" ";}if(r()>.4){const py=7+(r()*4|0),pw=2+(r()*3|0),px=Math.min(cols-4,x+(r()*3|0));for(let k=0;k<pw;k++)if(px+k<cols)tiles[py][px+k]="=";} }x+=w+3+(r()*4|0);}
const coins=[];for(let n=0;n<8+i;n++){const cx=6+(r()*(cols-20)|0),cy=5+(r()*6|0);if(tiles[cy][cx]===" "&&tiles[cy+1]&&(tiles[cy+1][cx]==="#"||tiles[cy+1][cx]==="="))coins.push({x:cx*T+8,y:cy*T+8,w:16,h:16,t:0});}
const movers=[];if(r()>.3){const mx=16+(r()*18|0);movers.push({x:mx*T,y:8*T,w:3*T,h:12,min:mx*T-50,max:mx*T+110,sp:1.2+r()*.7,dir:1});}
const fc=cols-14,sw=2;for(let ax=Math.max(0,fc-8);ax<fc;ax++){tiles[12][ax]="#";tiles[13][ax]="#";}for(let k=0;k<sw;k++){tiles[12][fc+k]=tiles[13][fc+k]=" ";tiles[12][fc+sw+2+k]=tiles[13][fc+sw+2+k]=" ";}
for(let y=8;y<=12;y++)tiles[y][fc+sw]=tiles[y][fc+sw+1]="#";
for(let x=fc+sw*2+3;x<cols;x++)tiles[12][x]=tiles[13][x]="#";
for(let x=cols-4;x<cols;x++)tiles[10][x]=tiles[11][x]="#";
const solids=[],one=[],haz=[];
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const t=tiles[y][x];if(t==="#")solids.push({x:x*T,y:y*T,w:T,h:T});else if(t==="=")one.push({x:x*T,y:y*T,w:T,h:10});else if(t==="^")haz.push({x:x*T+4,y:y*T+16,w:T-8,h:16});}
const L={x:fc*T,y:12*T,w:sw*T,h:T*2},Rt={x:(fc+sw+2)*T,y:12*T,w:sw*T,h:T*2},flip=r()>.5;
return{i,q,cols,rows,tiles,solids,one,movers,coins,haz,L,R:Rt,flip,spawn:{x:2*T,y:10*T},goal:{x:(cols-3)*T,y:9*T,w:T*2,h:T*2},W:cols*T,H:rows*T,done:0};
}
const cv=document.getElementById("c"),ctx=cv.getContext("2d"),ov=document.getElementById("ov"),card=document.getElementById("card"),touch=document.getElementById("touch");
let mode="title",floors=[],fi=0,W=null,P=null,cam=0,keys=new Set(),jHeld=0,tL=0,tR=0,tJ=0,coins=0,score=0,ok=0,ans=0,parts=[],shake=0,reason="",side=null,best=0;
try{best=+localStorage.getItem("tunnel-run-best")||0;}catch(e){}
function report(n){try{if(window.QuadScore)window.QuadScore.report(Math.max(0,Math.round(n)));}catch(e){}try{if(n>best){best=n;localStorage.setItem("tunnel-run-best",String(best));}localStorage.setItem("tunnel-run-score",String(Math.max(0,Math.round(n))));}catch(e){}}
function hud(){document.getElementById("coins").textContent=coins;document.getElementById("fl").textContent=fi+1;document.getElementById("sc").textContent=score;}
function esc(s){return String(s).replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">");}
function title(){mode="title";ov.classList.remove("hid");card.innerHTML='<p class="tag">Waterman College · The Quad</p><h1>Tunnel Run</h1><p>Run the floor. Drop into the right path. Wrong tunnel ends the run.</p><p>Complete Solution · W.R.A.P. · product · reviews · WOW</p>'+(best?'<p class="hint">Best: <strong>'+best+'</strong></p>':'')+'<button class="btn gold" id="go">Start run</button><p class="hint">A/D or ←/→ · Space/W/↑ jump · double-jump</p>';document.getElementById("go").onclick=start;}
function start(){const deck=sh(B).slice(0,N);floors=deck.map((q,i)=>build(i,q));fi=0;coins=0;score=0;ok=0;ans=0;parts=[];load(0);mode="play";ov.classList.add("hid");report(0);hud();}
function load(i){fi=i;W=floors[i];P={x:W.spawn.x,y:W.spawn.y,vx:0,vy:0,w:20,h:28,face:1,gnd:0,coy:0,jbuf:0,jumps:2,on:null,dead:0};cam=0;side=null;hud();}
function die(msg){mode="dead";reason=msg||reason;report(score);ov.classList.remove("hid");card.innerHTML='<p class="tag">Run over</p><h2>Wrong path</h2><p>'+esc(reason)+'</p><p>Score <strong>'+score+'</strong> · Coins '+coins+' · Correct '+ok+'/'+ans+'</p><button class="btn gold" id="go">Try again</button><button class="btn ghost" id="hub">Title</button>';document.getElementById("go").onclick=start;document.getElementById("hub").onclick=title;}
function win(){mode="win";score+=250;report(score);ov.classList.remove("hid");card.innerHTML='<p cl