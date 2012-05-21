// Dependancies for json-rpc and dnode clients 
var dnode = require('dnode');
var jsonrpc = require('./lib/jsonrpc-client');
var mirawatt = require('./lib/mirawatt');

var endpoint='http://0.0.0.0:8080/jsonrpc';
if (process.argv.length>2){
    endpoint = endpoint=process.argv[2];
}
console.log('endpoint',endpoint,process.argv);
var client = jsonrpc(endpoint);

function push(userId,feeds){
  client.call('set',[userId,feeds],function(err,result){
      if (err){
          console.log('remote.set('+userId+',',feeds,') Error: ',err);
      } else {
          // console.log('remote.set('+userId+',',feeds,') = ',result);
      }
  });
}

function getCheck(userId){
  client.call('get',[userId],function(err,result){
      if (err){
          console.log('remote.get('+userId+') Error: ',err);
      } else {
          console.log('remote.get('+userId+') = ');
          result.forEach(function(sc,i){
              console.log('scope',sc.scopeId,sc.name);
              sc.obs=sc.obs.slice(0,1);
              sc.obs.push('...');
          });
          console.log(JSON.stringify(result,null,2))
      }
  });
}

// push, then get
function fetchAndPush(){
    var userId='daniel';
    console.log(new Date().toISOString(),'fetching','for',endpoint);    
    mirawatt.iMetricalFetch(function(err,feeds){
        push(userId,feeds);
        // if (1) getCheck(userId);
        var Ns=[2,8];//[2,4,8];
        Ns.forEach(function(N){
          push(userId+'By'+N,mirawatt.byN(feeds,N));
          // if (1) getCheck(userId+'By'+N);        
        });
    });
}

//setTimeout(fetchAndPush,1000);
setInterval(fetchAndPush,3000);
