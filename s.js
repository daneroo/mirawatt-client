// Config section
var port = (process.env.VMC_APP_PORT || 8080);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();

var dnode = require('dnode');

dnode(function (remote, conn) {
    this.zing = function (n, cb) { cb(n * 100) };
    ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
      conn.on(ev,function(){
        console.log('  --dnode.conn',conn.id,ev,new Date().toISOString());
      });
    });
}).listen(server);

server.listen(port, host);
console.log('http://'+host+':'+port+'/');