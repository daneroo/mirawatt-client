var dnode = require('dnode');
function doit(){
  dnode.connect(7070, {reconnect:5000},function (remote, conn) {

    ['connect','ready','remote','end','error','refused','drop','reconnect'].forEach(function(ev){
      conn.on(ev,function(){
        console.log('  --dnode.conn',conn.id,ev,new Date().toISOString());
      });
    });

    var count=20;
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

  });  
}

doit();
setTimeout(doit,6000);
