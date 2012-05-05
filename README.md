# Mirawatt Client

The new php client `php/feedJSON.php` now conforms to the mirawatt-api.
It omits the feed level stamp,value. it adds sensorId array, and values are presented as an array of length1.


## deploy php bridge from imetrical mysql.
  Reproduce feeds.php for JSON. (green/scalr-utils/php/feeds.php)

  scp -p php/feedsJSON.php cantor:/var/www/iMetrical/
  # or
  rsync -av --progress php/feedsJSON.php cantor:/var/www/iMetrical/

To execute and pretty print:

  curl -s http://cantor/iMetrical/feedsJSON.php|python -mjson.tool >example.json



## Timezones
Found this binding to time.h [node-time](https://github.com/TooTallNate/node-time).

### curl command to invoke jsonrpc service

  curl -H "Content-Type: application/json" -d '{ "jsonrpc": "2.0", "method": "zing", "params": [42], "id":2 }' http://localhost:3000/jsonrpc

### node client to invoke jsonrpc-service

  node client.js

### node client to invoke dnode-service (local-only)
  