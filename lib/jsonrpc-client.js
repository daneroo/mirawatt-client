
/**
 * Module dependencies.
 */
var request = require('request');

function client (options) {
  if (typeof options === 'string') options = {uri:options}
  var req = request.defaults(options);
  var client = {
    call : function(method, params, callback) {
      // request can encode our object for us
      // is adds content-type, and content-length approprately
      // it also json decodes the response !
      var opts = {
        json:{
          'jsonrpc': '2.0',
          'id': +new Date(), // made this into an int for connect-jsonrpc, not technically required to be an int
          'method': method,
          'params': params
        }
      }
      req.post(opts,function (error, response, body) {
        if (!typeof callback==='function') return;        
        if (error) { // this error is from request-lib
          console.log('request.error',error);
          callback(error);
          return;
        }
        // this masks the response variable above...
        var response = body;
        if (response.error) {
          callback(response.error);
          return;
        }
        // done in request now with opt:{json:...} 
        // if JSON.parse(body) did not work, body is left intact
        if (typeof response.result==='undefined'){
          console.log('undefined result body:',body);
          callback({message:'Could not decode JSON response',data:body});
          return;
        }
        callback(null, response.result);
        return;
      });
      //console.log('called',arguments);
    }
  };
  return client;
}

/**
  * export the stup() function
  */
module.exports = client