(function(){
function load(url){ return fetch(url).then(function(r){ return r.text(); }); }
Promise.all([load("/games/tr-a.txt"), load("/games/tr-b.txt")]).then(function(parts){
  var b64 = parts[0] + parts[1];
  function go(code){ (0,eval)(code); }
  if (typeof DecompressionStream === "undefined") {
    document.body.innerHTML = "<pre style='color:#fff;padding:20px'>Please use a modern browser for Tunnel Run.</pre>";
    return;
  }
  var bin = atob(b64);
  var u = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("deflate")))
    .text().then(go)
    .catch(function(e){ document.body.innerHTML = "<pre style='color:#fff;padding:20px'>Load error: "+e+"</pre>"; });
});
})();
