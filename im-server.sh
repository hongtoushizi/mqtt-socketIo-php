#!/bin/bash
#node server

DATE=$(date '+%m%d%y')
date_log=node_output_$DATE.log   #    log 
while [ true ]
do
  nohup node ./lib/mqttSocketIoPhp.js  2>>  $date_log  
done



