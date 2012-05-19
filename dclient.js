var io = require('socket.io-client');
var sock = io.connect('http://localhost:8080');
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

sock.on('message', function (msg) {
    stream.emit('data', msg);
});

sock.on('connect', function () {
    console.log('  --sock connect',new Date().toISOString());
    stream.emit('connect');
});

var remoteServer = null;
dnode(function (client, conn) {
    ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
        conn.on(ev,function(){
            console.log('  --dnode.conn',conn.id,ev,new Date().toISOString());
        });
    });
}).connect(stream, {reconnect:5000}, function (remote,conn) {
    console.log('dnode connect');
    remoteServer=remote;
    setTimeout(function(){
        remoteServer=null;
        conn.end();
    },300000000);
});

setInterval(doZing,3000);

function doZing(cb){
    if (remoteServer){
        console.log('doZing',new Date().toISOString());
        [10,/* 0, 1, 10, 1234*/].forEach(function(zing){
            remoteServer.zing(zing,function (err,zong) {
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