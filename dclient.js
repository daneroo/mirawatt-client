var dnode = require('dnode');

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
  this.subscribe = function(newSubscriptions){
    subscriptions=newSubscriptions;
    console.log('client subscribed',subscriptions);
    
    // could let the server know if we dont have this feed ?
    if (cb) cb(null,null);
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
    console.log('publish',new Date().toISOString());
    subscriptions.forEach(function(subscription){
      console.log('--subscription',subscription);
      var feedIds=['sample','sampleBy2','daniel','danielBy2','danielBy8']
      var feedId= feedIds.indexOf(subscription.accountId)+1;
      feedId=feedId*100+subscription.scopeId;
      client.zing(feedId,function (err,zong) {
        // might be a good place to unsubscribe ? err: DONTCARE
        if (err) { console.log(err); return; }
        console.log('published: ' + zong);
      });
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