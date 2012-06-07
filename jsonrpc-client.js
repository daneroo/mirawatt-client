var jsonrpc = require('./lib/jsonrpc-client');
var mirawatt = require('./lib/mirawatt');

var endpoint='http://0.0.0.0:8080/jsonrpc';
var pushInterval = 3000;
if (process.argv.length>2){
    endpoint = endpoint=process.argv[2];
}
console.log('endpoint',endpoint,process.argv);
var client = jsonrpc(endpoint);

function push(accountId,feeds){
  client.call('set',[accountId,feeds],function(err,result){
      if (err){
          console.log('remote.set('+accountId+',',feeds,') Error: ',err);
      } else {
          // console.log('remote.set('+accountId+',',feeds,') = ',result);
      }
  });
}

// push, then get
function fetchAndPush(){
    var accountId='daniel';
    console.log(new Date().toISOString(),'fetching','for',endpoint);    
    mirawatt.iMetricalFetch(function(err,feeds){
        push(accountId,feeds);
        // if (1) getCheck(accountId);
        var Ns=[2,8];//[2,4,8];
        Ns.forEach(function(N){
          var accountIdByN = accountId+'By'+N;
          push(accountIdByN,mirawatt.byN(accountIdByN,feeds,N));
          // if (1) getCheck(accountId+'By'+N);        
        });
    });
}

function getCheck(accountId){
  client.call('get',[accountId],function(err,result){
      if (err){
          console.log('remote.get('+accountId+') Error: ',err);
      } else {
          console.log('remote.get('+accountId+') = ');
          result.forEach(function(sc,i){
              console.log('scope',sc.scopeId,sc.name);
              sc.obs=sc.obs.slice(0,1);
              sc.obs.push('...');
          });
          console.log(JSON.stringify(result,null,2))
      }
  });
}

setInterval(fetchAndPush,pushInterval);
