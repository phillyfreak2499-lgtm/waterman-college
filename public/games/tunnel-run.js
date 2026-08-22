(function(){
function load(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(u+" "+r.status);return r.text();});}
Promise.all([
  load("/games/tr-part1.js"),
  load("/games/tr-part2.js"),
  load("/games/tr-part3.js"),
  load("/games/tr-part4.js")
]).then(function(p){
  (0,eval)(p[0]+p[1]+p[2]+p[3]);
}).catch(function(e){
  document.body.innerHTML="<pre style='color:#fff;padding:20px;font:14px monospace'>Tunnel Run failed to load:\n"+e+"</pre>";
});
})();
