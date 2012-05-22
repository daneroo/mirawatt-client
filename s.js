var dnode = require('dnode');

var server = dnode(function (remote, conn) {
    this.zing = function (n, cb) { cb(n * 100) };
    ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
      conn.on(ev,function(){
        console.log('  --dnode.conn',conn.id,ev,new Date().toISOString());
      });
    });
});
server.listen(7070);
