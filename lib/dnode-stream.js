var io = require('socket.io-client');
var Stream = require('stream');

var defaultOptions = {
    uri:'http://localhost:8080',
    debug:false,
    sockReconnect:false
}

function stream (options) {
  // could use a merge here!
  if (typeof options === 'string') {
      options = {uri:options}
  }
  options.uri = options.uri || defaultOptions.uri
  options.debug = options.debug || defaultOptions.debug
  options.sockReconnect = options.sockReconnect || defaultOptions.sockReconnect
  

  var sock = io.connect(options.uri,{
    reconnect:options.sockReconnect,
    //'max reconnection attempts':3
  });
  
  var stream = new Stream;
  stream.writable = true;
  stream.readable = true;
  stream.write = function (buf) {
      sock.emit('message', String(buf));
  };
  
  stream.destroy = stream.end = function () {
      if (options.debug) console.log('  --stream destroy-end');
      sock.disconnect();
      stream.emit('end'); // not sure...
  };

  if (options.debug) {
      ['connecting','connect','connect_failed','disconnect','reconnecting','reconnect','error','end'].forEach(function(ev){
        sock.on(ev,function(){
          console.log('  --sock',ev,new Date().toISOString());
        });
      });
  }

  sock.on('message', function (msg) {
      stream.emit('data', msg);
  });

  sock.on('connect', function () {
      stream.emit('connect');
  });

  sock.on('disconnect', function () {
    stream.emit('end');
  });
  
  return stream;
}

/**
  * export the setup() function
  */
module.exports = stream