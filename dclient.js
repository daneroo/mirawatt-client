var io = require('socket.io-client');
var sock = io.connect('http://localhost:8080',{
  reconnect:false,
  //'max reconnection attempts':3
});
// var sock = io.connect('http://mw-spec.cloudfoundry.com:80');
// var sock = io.connect('http://mw-spec.jit.su:80');
var dnode = require('dnode');
var Stream = require('stream');

var stream = new Stream;
stream.writable = true;
stream.readable = true;
stream.write = function (buf) {
    sock.emit('message', String(buf));
};
stream.destroy = stream.end = function () {
    console.log('  --stream destroy-end');
    sock.disconnect();
    stream.emit('end');
};

['connecting','connect','connect_failed','disconnect','reconnecting','reconnect','error','end'].forEach(function(ev){
  sock.on(ev,function(){
    console.log('  --sock',ev,new Date().toISOString());
  });
});

sock.on('message', function (msg) {
    stream.emit('data', msg);
});

sock.on('connect', function () {
    stream.emit('connect');
});

sock.on('disconnect', function () {
  stream.emit('end');
});

dnode(function (client, conn) {
  console.log('*****new client/conn',conn.id);
  this.type='sensorhub';
  ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
    conn.on(ev,function(){
      console.log('  --dnode.conn',conn.id,ev,new Date().toISOString());
    });
  });
  var intervalId;
  conn.on('ready',function(){
    console.log('dnode ready',conn.id);
    intervalId=setInterval(doZing,3000,client)
  });
  conn.on('end',function(){
    console.log('dnode end',conn.id);
    clearInterval(intervalId);    
  });
  setTimeout(function(){
    conn.end();
    // conn.close();
  },10000);
}).connect(stream /*, {reconnect:5000}*/);;


setInterval(function(){
  var p = sock.socket;
  console.log('sock monitor',p.connected,p.connecting,p.reconnecting/*,p.transport,p.options*/);
  if (!(p.connected || p.connecting || p.reconnecting)){
    console.log('reconnect...');
    sock.socket.connect();
  }
  // console.log('sock monitor',sock);
},5000);

// setInterval(doZing,3000);

function doZing(remote,cb){
  if (!sock.socket.connected) {
    console.log('doZing - should not happen!')
  }
  if (sock.socket.connected && remote){
    console.log('doZing',new Date().toISOString());
    [10,/* 0, 1, 10, 1234*/].forEach(function(zing){
      remote.zing(zing,function (err,zong) {
        if (err){
          console.dir(err);
        } else {
          console.log('zing-zong: ' + zong);
        }
        if (cb) cb();
      });
    });
  } else {
    console.log('skipping doZing');
  }
}