
module.exports = {
  byN : byN,
  iMetricalFetch : iMetricalFetch
};

var request = require('request');


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


function iMetricalFetch(cb){
  request.get({uri:"http://cantor.imetrical.com/iMetrical/feedsJSON.php", json : true},function(error,response,body){
    cb(error,body);
  });
}

