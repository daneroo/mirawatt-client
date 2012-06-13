// Dependancies for json-rpc and dnode clients 
var request = require('request');
var mirawatt = require('./lib/mirawatt');

var endpoint='http://0.0.0.0:8080/incoming';
var pushInterval = 3000;
if (process.argv.length>2){
    endpoint = endpoint=process.argv[2];
}
console.log('endpoint',endpoint,process.argv);

function push(accountId,feeds){
  request.post({
    uri: endpoint+'/'+accountId, 
    json : feeds,
  },function(error,response,body){
    if (error){
        console.log('remote.set('+accountId+',',feeds,') Error: ',error);
    } else {
      console.log('push.body',body);
    }
  });
}

// push, then get
function fetchAndPush(){
    var accountId='daniel';
    console.log(new Date().toISOString(),'fetching','for',endpoint);    
    mirawatt.iMetricalFetch(function(err,feeds){
        push(accountId,feeds);
        var Ns=[2,8];//[2,4,8];
        Ns.forEach(function(N){
          var accountIdByN = accountId+'By'+N;
          push(accountIdByN,mirawatt.byN(accountIdByN,feeds,N));
        });
    });
}

setInterval(fetchAndPush,pushInterval);
