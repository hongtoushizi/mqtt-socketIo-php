var sys = require('sys');
var net = require('net');
var mqtt = require('mqtt');
var client = mqtt.createClient();
var io  = require('socket.io').listen(5000);
var roomOnlineNum = new Array();
var obj={};
io.sockets.on('connection', function (socket) {
	  var topic = '';
	  socket.on('subscribe', function (data) {
		     console.log(data);
		      var count = 1;
              socket.topic = data.topic;
              socket.payload = data.payload;
              room = data.topic;
              console.log("username"+data.payload);
              if(!obj[room]){
            	  obj[room] = count++;
              }else{
            	  obj[room]++;
              }
              socket.join(data.topic);
              client.subscribe(data.topic); //向特定的用户发送信息。
              io.sockets.in(socket.topic).emit('users', { number:obj[socket.topic],payload:data.payload });
    });
	socket.on('publish',function(data){
		  console.log('--- publish to '+data.topic+' msg:'+data.payload);
		  io.sockets.in(data.topic).emit('mqtt',{'topic': String(data.topic),
			    'payload':String(data.payload)});
//		  client.publish(data.topic,data.payload);	   	  
	});
	socket.on('disconnect', function () {
		obj[socket.topic]--;
  	    console.log('User disconnected. ' + obj[socket.topic] + ' user(s) present.');
  	    io.sockets.in(socket.topic).emit('usersDisconnect', { number: obj[socket.topic],payload:socket.payload });
  	});
});

client.on('message', function(topic, payload){
   console.log('teststest');
   console.log("topic"+topic)
   console.log(payload );
  sys.puts(topic+'='+payload);
  io.sockets.in(topic).emit('mqtt',{'topic': String(topic),
    'payload':String(payload)});
});

