var dnode = require('dnode');
var mirawatt = require('./lib/mirawatt');
var dnodeStream = require('./lib/dnode-stream');

var options = {
    // http://mw-spec.cloudfoundry.com:80
    // http://mw-spec.jit.su:80
    endpoint: 'http://0.0.0.0:8080',
    accountIds: ['daniel','danielBy2','danielBy8'],
    forcePublishAfterDelay: 30000,  // forced publish, even if no subscription
    minDelayOtherThanLive: 10000,  // don't send scope>Live if delay < minDelay    
    publishInterval: 1000 // delay for publish loop
}

// TODO: use optimist
if (process.argv.length>2){
    options.endpoint = process.argv[2];
}


var stream = dnodeStream(options.endpoint);

dnode(function (client, conn) {
  // dnode exported attributes
  this.type='sensorhub';
  this.accountIds = options.accountIds;
  
  // dnode exported function
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
    intervalId=setInterval(publish,options.publishInterval);
  });
  
  conn.on('end',function(){
    clearInterval(intervalId);    
  });

  /*
  This function is run every options.publishInterval milis,
    It will fetch source data  - from (mirawatt.iMetricalFetch)
      -only once per run, and only if required
    It will push all feeds on a regular schedule. forcePublishAfterDelay
    It will push out any subscribed feeds.
      - if subscription is to scopeId==0 (Live) send only that scope
      - otherwise send All scopes, but not before minDelay has expired
      This in effect rate limits scope>Live
    
    Simplification: Given the: feed sizes [ 1613, 2393, 999, 1251, 1013 ]
    And given that scopes other than Live, are infrequently pushed,
      -When Live scope is subscribed, push only that scope.
      -If any other feed is pushed, push all scopes.
      
  */
  var lastPushedOtherThanLive = { // timestamp of last time we pushed full feed/ per accountId.
    // accountId: stampForLastPushOtherThanLive
  };
  function sizes(feeds){
    var sz=[0,0,0,0,0];
    feeds.forEach(function(feed,i){
      sz[i]=JSON.stringify(feed).length;
    })
    return sz;
  }
  function publish(){
    // console.log('publish',new Date().toISOString());
    var now=+new Date;
    
    toPublish = []; // simulate subscriptions - when delay > forcePublishAfterDelay
    options.accountIds.forEach(function(accountId){
      var delay = now - (lastPushedOtherThanLive[accountId]||0);
      if (delay > options.forcePublishAfterDelay) {
        var scopeOtherThanLive=1;
        toPublish.push({accountId:accountId,scopeId:scopeOtherThanLive});
      }
    });
    
    // actual subscriptions are simply appended to toPublish, 
    //   a particular account will not be pushed twice time since its
    //   lastPushed will be reset if it was sent, and minDelay test will fail for subsequent subs
    toPublish = toPublish.concat(subscriptions);

    // temporary measure becaus we may be subscribed to accounts we don't own
    toPublish = toPublish.filter(function(subscription){
      return 'daniel'===subscription.accountId.substring(0,6);
    });

    // rate limit Scope>Live;
    // filter out if scope>Live && delay<minDelay
    toPublish = toPublish.filter(function(subscription){
      if (subscription.scopeId===0) return true;
      var delay = now - (lastPushedOtherThanLive[subscription.accountId]||99999);
      return !(delay < options.minDelayOtherThanLive); 
    });
    
    // fetch only once (if required)
    if (toPublish.length>0){
      mirawatt.iMetricalFetch(function(err,feeds){
        toPublish.forEach(function(subscription){
          var accountId = subscription.accountId;
          var N=parseInt(accountId.substr(-1)); // danielBy2,4,8...
          N=N||1; // NaN => 1
          feedsByN = mirawatt.byN(feeds,N);
          
          // if Live send only Live otherwise send all
          if (subscription.scopeId===0){
            // this assumes feeds[] is complete and ordered
            feedsByN.feeds = [feedsByN.feeds[0]];
          }
          // console.log('--',feedsByN);
          console.log('  --push',new Date().toISOString(),subscription);
          
          client.set(accountId,feedsByN);
          if (subscription.scopeId!==0) lastPushedOtherThanLive[accountId]=now; // mark as pushed
        }); // foreach subscription
      }); // fetch
    }
  }

}).connect(stream);


function debugConn(conn){
  ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
    conn.on(ev,function(){
      console.log('  --dnode.conn',ev,conn.id,new Date().toISOString());
    });
  });  
}