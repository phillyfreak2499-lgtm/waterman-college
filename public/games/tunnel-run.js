(function(){
function load(u){return fetch(u).then(r=>r.text());}
Promise.all([load("/games/tr-p1.js"),load("/games/tr-p2.js")]).then(function(p){
  (0,eval)(p[0]+p[1]);
}).catch(function(e){
  document.body.innerHTML="<pre style='color:#fff;padding:20px'>Tunnel Run failed: "+e+"</pre>";
});
})();
