// Dependancies for json-rpc and dnode clients 
var dnode = require('dnode');
var jsonrpc = require('./lib/jsonrpc-client');
var request = require('request');

var endpoint='http://0.0.0.0:3000/jsonrpc';
//var endpoint='http://mirawatt.cloudfoundry.com/jsonrpc';
var client = jsonrpc(endpoint);


var method='zing';
var params=[44]; //{ n: param }, 
client.call(method,params,function(err, result) {
  if (err){
    console.log('jsonrpc.zing('+params+') Error: ',err);
  } else {
    console.log('jsonrpc.zing('+params+') = ' + result);
  }
});

// dnode part
if (0) dnode.connect(7070, function (remote, conn) {
  //console.log(conn);
  var param=42;
  remote.zing(param, function (err,result) {
    if (err){
      console.log('remote.zing('+param+') Error: ',err);
    } else {
      console.log('remote.zing('+param+') = ' + result);
    }
    conn.end();
  });
});

function fetch(cb){
  console.log('fetching')
  request.get({uri:"http://cantor.imetrical.com/iMetrical/feedsJSON.php", json : true},function(error,response,body){
    cb(error,body);
  });
}

function byN(feeds,N){
  // clone
  feeds = JSON.parse(JSON.stringify(feeds));
  feeds.feeds.forEach(function(feed,scopeId){
    feed.sensorId=[];//"s1","s2"
    for (i=1;i<=N;i++){
      feed.sensorId.push('s'+i);
    }
    feed.obs.forEach(function(o){ // mult by [1,2,..,N]/(N*(N+1)/2)
      var v=o.v[0]/(N*(N+1)/2);
      o.v=[];
      var i;
      for (i=1;i<=N;i++){
        var vi=Math.round(v*i*10)/10;
        o.v.push(vi);
      }
    });
  });
  return feeds;
}

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
    var feeds={stamp:new Date(),value:Math.random()};
    fetch(function(err,feeds){
        push(userId,feeds);
        // if (1) getCheck(userId);
        var Ns=[2,8];//[2,4,8];
        Ns.forEach(function(N){
          push(userId+'By'+N,byN(feeds,N));
          // if (1) getCheck(userId+'By'+N);        
        });
    });
}

//setTimeout(fetchAndPush,1000);
setInterval(fetchAndPush,1000);
