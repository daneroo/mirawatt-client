<?php
// This file is part of mirawatt-client
// It came from feed.php in green/scalr-utils/php/feeds.php

// It no longer requires the aggregate second query..

// header("Content-type: text/plain");
header("Content-type: application/json");


// Parse params
$scope='all';
if (array_key_exists('scope', $_GET)) {
    $scope=intval(htmlspecialchars($_GET["scope"]));
}

// Connect to db
$dbname = 'ted'; $dbhost = 'localhost'; $dbuser = 'aviso'; $dbpass = '';
$conn = mysql_connect($dbhost, $dbuser, $dbpass) or die ('Error connecting to mysql');
mysql_select_db($dbname);

$feeds = array(
    array( 'name'=>"Live",  'scopeId'=>0, 'aggregate'=>array("watt",1),
    'observations'=>array(array('watt',10),array('watt_tensec',30) )),
    array( 'name'=>"Hour",  'scopeId'=>1, 'aggregate'=>array("watt_minute",60),
    'observations'=>array(array('watt_minute',60) )),
    array( 'name'=>"Day",   'scopeId'=>2, 'aggregate'=>array("watt_hour",24),
    'observations'=>array(array('watt_hour',24) )),
    array( 'name'=>"Month", 'scopeId'=>3, 'aggregate'=>array("watt_day",30),
    'observations'=>array(array('watt_day',30) )),
    array( 'name'=>"Year", 'scopeId'=>4, 'aggregate'=>array("watt_day",365),
    //'customqy'=>'select min(stamp) as month,max(stamp),avg(watt),count(*),sum(watt) from watt_day group by left(stamp,7) order by month desc limit 24')
    'customqy'=>'select min(stamp) as month,round(avg(watt)),count(*),sum(watt) from watt_day group by left(stamp,7) order by month desc limit 24')
);

if ($scope!=='all' && $scope >= 0 && $scope <= 4) {
    $feeds = array($feeds[$scope]);
}

function aggregateForFeed($table,$samples) {
    $subQy = queryForTableSince($table,NULL,$samples);
    $query = "select min(stamp),max(stamp),avg(watt) from (($subQy) as agg)";
    return $query;
}

function getAggRow($sql) {
    $result = mysql_query($sql) or die('Query failed: ' . mysql_error());
    while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
        $minStamp = substr($row[0],0,10).'T'.substr($row[0],-8).'Z';
        $maxStamp = substr($row[1],0,10).'T'.substr($row[1],-8).'Z';
        $avgwatt = $row[2];
        break;
    }
    mysql_free_result($result);
    return array($minStamp,$maxStamp,$avgwatt);
}

function queryForTableSince($table,$since,$samples) {
    $query =  "select stamp,watt from $table ";
    if (!is_null($since)) { $query .= " where stamp<'$since'"; }
    $query .= " order by stamp desc";
    $query .= " limit $samples";
    //print "<!-- Query: ".$query."  --> \n"; 
    return $query;
}


// this function appends the results to ary
// this function also returns le last stamp
function entriesForQuery($sql,$ary) {
    $result = mysql_query($sql) or die('Query failed: ' . mysql_error());
    $lastStamp = '';
    while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
        $stamp = substr($row[0],0,10).'T'.substr($row[0],-8).'Z';
        $lastStamp=$row[0];
        $watt = $row[1];
        array_push($ary,array('t'=>$stamp,'v'=>array(floatval($watt))));
    }
    mysql_free_result($result);
    return $lastStamp;
}

function feedFormatter($feed,$aggrow) {
    $name = $feed['name'];
    $scopeId = $feed['scopeId'];
    $stamp=$aggrow[1];
    $value=round($aggrow[2]);
    return array(
        'sensorId'=>array("s1"),
        'scopeId'=>$scopeId,
        'name'=>$name,
        // 'stamp'=>$stamp,
        // 'value'=>$value
    );
}

// might be called more than once ?
function entriesForTableSince($table,$since,$samples,$ary) {
    $sql = queryForTableSince($table,$since,$samples);
    return entriesForQuery( $sql ,&$ary);
}

$feedsObj=array();
foreach ($feeds as $feed) {
    $agg = $feed['aggregate'];
    $aggsql = aggregateForFeed($agg[0],$agg[1]);
    //echo "feed $i: ".$aggsql."\n";
    //print_r(getAggRow($aggsql));
    $feedObj = feedFormatter($feed,getAggRow($aggsql));
    $lastStamp=NULL;
    $results = array();
    if (isset($feed['observations'])){
        foreach ($feed['observations'] as $obs) {
            $lastStamp = entriesForTableSince($obs[0],$lastStamp,$obs[1],&$results);
        }
    }
    if (isset($feed['customqy'])){
        //echo $feed['customqy']."\n";
        entriesForQuery($feed['customqy'] ,&$results);
    }
    $feedObj['obs']=$results;
    array_push($feedsObj,$feedObj);
 }
 $wrapper=array( 
     "version"   =>"1.0",  
     "accountId" => "daniel",
     "feeds"     => $feedsObj
     );
 echo json_encode($wrapper)."\n"; //,JSON_PRETTY_PRINT - only in 5.4


mysql_close($conn);
?>