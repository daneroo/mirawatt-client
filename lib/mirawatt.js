var request = require('request');

module.exports = {
  byN : byN,
  iMetricalFetch : iMetricalFetch
};


// this always retunrs a copy
function byN(accountId,feeds,N){
  // clone
  sum1toN=N*(N+1)/2;
  
  // clone
  feeds = JSON.parse(JSON.stringify(feeds));
  feeds.accountId = accountId;
  // nothin to do if N==1
  if (N==1) return feeds;
  
  feeds.feeds.forEach(function(feed,scopeId){
    feed.sensorId=[];//"s1","s2"
    for (i=1;i<=N;i++){
      feed.sensorId.push('s'+i);
    }
    feed.obs.forEach(function(o){ // mult by [1,2,..,N]/(N*(N+1)/2)
      var v=o.v[0]/sum1toN;
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


function iMetricalFetch(cb){
  // var host = 'http://cantor.imetrical.com';
  var host = 'http://dl.imetrical.com:8888';
  var uri=host+'/iMetrical/feedsJSON.php';
  request.get({uri:uri, json : true},function(error,response,body){
    cb(error,body);
  });
}

