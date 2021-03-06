var dnode = require('dnode');
var mirawatt = require('./lib/mirawatt');
var dnodeStream = require('./lib/dnode-stream');

var options = require('optimist').options('endpoint', {
  alias: 'e',
  default : 'http://0.0.0.0:8080',
  describe: 'e.g. -e http://mw-spec.cloudfoundry.com  -e http://mw-spec.jit.su'
}).options('by', {
  alias: 'b',
  default : [2,8],
  describe: 'sensor counts to simulate (may be multiple)'
}).options('forcePublishAfterDelay', {
  default: 120000,
  describe: 'Delay after which, publish, even if no acive subscription'
}).options('minDelayOtherThanLive', {
  default: 30000,
  describe: "Don't send scope>Live if delay < minDelay"
}).options('publishInterval', {
  default: 1000,
  describe: 'Delay for publish loop'
}).options('help', {
  alias: 'h',
  describe: 'Show this message'
}).argv;

if (options.help) {
  require('optimist').showHelp();
  process.exit();
}

options.accountIds=['daniel'];
if (options.by!==false && !(Array.isArray(options.by))) {
  // --no-by : options.by==fasle
  // --by 3 --by 4 : options.by==[3,4]
  options.by = [options.by];
}
if (Array.isArray(options.by)) {
  options.by.forEach(function(by){ options.accountIds.push('danielBy'+by)});
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
  
  // this seems to be necessary to keep the connection alive to the sensorhubs...
  // we get pinged every 10 seconds (15 seconds is the threshhold)
  var keepAliveCount=-1;
  this.keepAlive = function(cb){    
      keepAliveCount++;
      // only log every hour (%360), every minute (%6)
      if (keepAliveCount%360==0) console.log('keepAlive',keepAliveCount);
      if (cb) cb(null,keepAliveCount);
  }
  
  // if we want to see all connection events
  // if (1) debugConn(conn);
  
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
          feedsByN = mirawatt.byN(accountId,feeds,N);
          
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