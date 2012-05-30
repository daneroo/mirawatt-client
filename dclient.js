var dnode = require('dnode');
var mirawatt = require('./lib/mirawatt');
var dnodeStream = require('./lib/dnode-stream');

var options = {
    // http://mw-spec.cloudfoundry.com:80
    // http://mw-spec.jit.su:80
    endpoint: 'http://0.0.0.0:8080',
    accountIds: ['daniel','danielBy2','danielBy8'],
    publishInterval: 1000
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
    It push out any subscribed feeds.
      -rate limited :minDelay, for scopes other than Live.
    It will push all feeds on a regular schedule. maxDelay
    
    Simplification: Given the: feed sizes [ 1613, 2393, 999, 1251, 1013 ]
    And given that scopes other than Live, are infrequently pushed,
      -When Live scope is subscribed, push only that scope.
      -If any other feed is pushed, push all scopes.
      
  */
  // TODO, 
  //  use var minDelayForScope=[900,5000,10000,10000,10000][scopeId];
  //  use maxDelay to push even if no client...
  //  cache feed for all daniels...
  // limit push to subscribed scopes.
  // rebalance in server on (di)connect, and subscribe.
  var lastPushed = { // timestamp of last time we pushed full feed/ per accountId.
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
    console.log('publish',new Date().toISOString());
    
    // forced publish, even if no subscription
    // Live,Hour,Day,Month,Year
    var maxDelay = 10000;
    var now=+new Date;
    console.log(options.accountIds);
    
    toPublish = []; // fake subscriptions - from expired MaxDelay
    options.accountIds.forEach(function(accountId){
      var delay = now - (lastPushed[accountId]||0);
      if (delay > maxDelay) {
        var scopeOtherThanLive=1;
        toPublish.push({accountId:accountId,scopeId:scopeOtherThanLive});
      }
    });
    
    // actual subscriptions are simply appended to toPublish, 
    //   a particular account will not be pushed a second time since its
    //   lastPushed will be reset if it was sent once, and minDelay will fail
    toPublish = toPublish.concat(subscriptions);

    // temporary measure becaus we may be subscribed to accounts we don't own
    toPublish = toPublish.filter(function(subscription){
      return 'daniel'===subscription.accountId.substring(0,6);
    });
    
    // fetch only once (if required)
    if (toPublish.length>0){
      mirawatt.iMetricalFetch(function(err,feeds){
        console.log('+feed sizes',sizes(feeds.feeds));

        toPublish.forEach(function(subscription){
          console.log('  --subscription',subscription);
          var accountId = subscription.accountId;
          lastPushed[accountId]=+new Date;
          var N=parseInt(accountId.substr(-1)); // danielBy2,4,8...
          if (N>0){
            feeds = mirawatt.byN(feeds,N);
          }
          
          client.set(accountId,feeds);
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