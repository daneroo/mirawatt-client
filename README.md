# Mirawatt Client

The new php client `php/feedJSON.php` now conforms to the mirawatt-api.

* It omits the feed level stamp,value. 
* It adds sensorId array, and values are presented as an array of length 1.
* It allows fetching each scope independantly.


## deploy php bridge from imetrical mysql.
  Reproduce feeds.php for JSON. (green/scalr-utils/php/feeds.php)

  scp -p php/feedsJSON.php cantor:/var/www/iMetrical/
  # or
  rsync -av --progress php/feedsJSON.php cantor:/var/www/iMetrical/

To execute and pretty print:

    curl -s http://cantor/iMetrical/feedsJSON.php|python -mjson.tool >example.json
    # or to just get one feed scope
    curl -s "http://cantor/iMetrical/feedsJSON.php?scope=0"|python -mjson.tool
    curl -s "http://cantor/iMetrical/feedsJSON.php?scope=1"|python -mjson.tool
    curl -s "http://cantor/iMetrical/feedsJSON.php?scope=2"|python -mjson.tool
    curl -s "http://cantor/iMetrical/feedsJSON.php?scope=3"|python -mjson.tool
    curl -s "http://cantor/iMetrical/feedsJSON.php?scope=4"|python -mjson.tool


## Timezones
Found this binding to time.h [node-time](https://github.com/TooTallNate/node-time).

### curl command to invoke jsonrpc service

  curl -H "Content-Type: application/json" -d '{ "jsonrpc": "2.0", "method": "zing", "params": [42], "id":2 }' http://localhost:3000/jsonrpc

### node client to invoke jsonrpc-service

  node client.js

### node client to invoke dnode-service (local-only)
  