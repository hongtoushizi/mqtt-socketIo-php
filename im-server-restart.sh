#!/bin/bash
 kill  `ps aux | grep mqttSocketIoPhp.js | grep -v grep | awk -F' ' '{print $2}'`
 echo 'killed'
 
 nohup node mqttSocketIoPhp.js  >> node_output.log &


