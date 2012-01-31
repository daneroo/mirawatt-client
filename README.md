# Mirawatt Client

## Initial pump from mysql repo
Reproduce feds.php for JSON.

  scp -p php/feedsJSON.php cantor:/var/www/iMetrical/
  # or
  rsync -av --progress php/feedsJSON.php cantor:/var/www/iMetrical/
  
## Timezones
Found this binding to time.h [node-time](https://github.com/TooTallNate/node-time).

### curl command to invoke jsonrpc service

  curl -H "Content-Type: application/json" -d '{ "jsonrpc": "2.0", "method": "zing", "params": [42], "id":2 }' http://localhost:3000/jsonrpc

### node client to invoke jsonrpc-service

  node client.js

### node client to invoke dnode-service (local-only)
  