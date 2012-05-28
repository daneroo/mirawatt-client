var dnode = require('dnode');
var mirawatt = require('./lib/mirawatt');

// http://mw-spec.cloudfoundry.com:80
// http://mw-spec.jit.su:80
var endpoint='http://0.0.0.0:8080';
if (process.argv.length>2){
    endpoint = endpoint=process.argv[2];
}

var accountIds=['daniel','danielBy2','danielBy8'];

var dnodeStream = require('./lib/dnode-stream');
var stream = dnodeStream(endpoint);

dnode(function (client, conn) {
  console.log('*****new client/conn',conn.id);
  this.type='sensorhub';
  this.accountIds = accountIds;
  
  // exported function

  var subscriptions=[]; // [{accountId:..,scopeId:...},...]
  this.subscribe = function(newSubscriptions,cb){
    subscriptions=newSubscriptions;
    console.log('client subscribed',subscriptions);
    
    // could let the server know if we dont have this feed ?
    if (cb) cb(null,'OK');
  }
  
  if (1) debugConn(conn);
  
  var intervalId;
  conn.on('ready',function(){
    intervalId=setInterval(publish,1000)
  });
  
  conn.on('end',function(){
    clearInterval(intervalId);    
  });

  function publish(){
    
    // TODO, 
    //  use var minDelayForScope=[900,5000,10000,10000,10000][scopeId];
    //  use maxDelay to push even if no client...
    //  cache feed for all daniels...
    // limit push to subscribed scopes.
    // rebalance in server on (di)connect, and subscribe.
    
    console.log('publish',new Date().toISOString());
    subscriptions.forEach(function(subscription){
      console.log('--subscription',subscription);

      var accountId = subscription.accountId;
      if ('daniel'===accountId.substring(0,6)){
        console.log(accountId,'thats me');
        mirawatt.iMetricalFetch(function(err,feeds){
          var N=accountId.substr(-1); // danielBy2,4,8...
          if (N>0){
            feeds = mirawatt.byN(feeds,N);
          }
          client.set(accountId,feeds);
        });
      }
      
    });
  }

}).connect(stream);


function debugConn(conn){
  ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
    conn.on(ev,function(){
      console.log('  --dnode.conn',ev,conn.id,new Date().toISOString());
    });
  });  
}