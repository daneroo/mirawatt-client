var io = require('socket.io-client');
var Stream = require('stream');
var dnode = require('dnode');


function doit(){
  var sock = io.connect('http://localhost:8080',{
    reconnect:false,
    // 'try multiple transports':false,
    //'max reconnection attempts':3
    // transports:['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
  });
  
  var stream = new Stream;
  stream.writable = true;
  stream.readable = true;
  stream.write = function (buf) {
      sock.emit('message', String(buf));
  };
  stream.destroy = stream.end = function () {
      console.log('  --stream destroy-end');
      // stream.emit('end');
      sock.disconnect();
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
  
  dnode(function (remote, conn) {
    console.log('*****new remote/conn',conn.id);
    this.type='sensorhub';
    ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
      conn.on(ev,function(){
        console.log('  --dnode.conn',conn.id,ev,new Date().toISOString());
      });
    });
    var count=5;
    var intervalId;
    conn.on('ready',function(){
      console.log('dnode ready',conn.id);
      intervalId=setInterval(doZing,2000)
    });
    conn.on('end',function(){
      console.log('dnode end',conn.id);
      clearInterval(intervalId);
    });
    
    function doZing(){
      if (!--count){
        conn.end();
        return;
      }
      remote.zing(count, function (n) {
        console.log('n=' + n,'count',count,'conn',conn.id);
      });
    }
    
  }).connect(stream /*, {reconnect:5000}*/);;

}

doit();
