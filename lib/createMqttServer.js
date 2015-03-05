var mqtt = require('mqtt') , util = require('util');
//var io  = require('socket.io').listen(5000);
new mqtt.Server(function (client) {
	var self = this;

	if (!self.clients) self.clients = {};

	client.on('connect', function (packet) {
		self.clients[packet.clientId] = client;
//    mqttClients[packet.clientId] = client;
		client.id = packet.clientId;
		console.log("CONNECT: client id: " + client.id);
		console.log("CONNECT: packet id: " + packet.clientId);

		client.subscriptions = [];
		client.connack({returnCode: 0});
	});

	client.on('subscribe', function (packet) {
		var granted = [];

		console.log("SUBSCRIBE(%s): %j", client.id, packet);

		for (var i = 0; i < packet.subscriptions.length; i++) {
			var qos = packet.subscriptions[i].qos
				, topic = packet.subscriptions[i].topic
				, reg = new RegExp(topic.replace('+', '[^\/]+').replace('#', '.+') + '$');

			granted.push(qos);
			client.subscriptions.push(reg);
		}

		client.suback({messageId: packet.messageId, granted: granted});
	});

	client.on('publish', function (packet) {
		console.log("PUBLISH(%s): %j", client.id, packet);
		console.log('jin ru le publish');
		for (var k in self.clients) {
			var c = self.clients[k]
				, publish = false;

			for (var i = 0; i < c.subscriptions.length; i++) {
				var s = c.subscriptions[i];
				if (s.test(packet.topic)) {
					publish = true;
				}
			}

			if (publish) {
				c.publish({topic: packet.topic, payload: packet.payload});
//        messageJson  = eval('(' + packet.payload + ')');;

//        $topic = "chat/630e80953e11ac25";
//        strs=$topic.split("/"); //字符分割      
				packetTopic = packet.topic;
				topicInfo = packetTopic.split("/");
				console.log('topicInfo');
				console.log(topicInfo);
				console.log('topicInfo');
				if (topicInfo.hasOwnProperty('chat')) {
					console.log('topicInfo[chat]');
					console.log(topicInfo['chat']);

				}
				if (topicInfo[0] == 'chat') {
//        	  console.log('is chat');
//            console.log("packet.topic:"+packet.topic);
//            messageJson = JSON.parse(packet.payload);
//            message = messageJson.message;  //发送内容
//            room = messageJson.room; //发送的房间
//            userId = messageJson.userId;
//            username= messageJson.username;
//            console.log('packet.payload:'+packet.payload);
//            console.log('message:'+message);
////          str ='{userId: '+userId+', username: "'+username+'", msg: "'+message+'"}';
//            str_jsonObj ={'userId':'"'+userId+'"','username':'"'+username+'"','msg':'"'+message+'"'};
//            str_jsonObj.userId = userId;
//            str_jsonObj.username = username;
//            str_jsonObj.msg = message;
//            str =  JSON.stringify(str_jsonObj); 
//            io.sockets.emit('mqtt',{'topic': room,
//                'room':room,
//                'payload':str});
					//点对点的聊天处理
				} else {
					console.log('not chat');
				}
			}
		}
	});

	client.on('pingreq', function (packet) {
		console.log('PINGREQ(%s)', client.id);
		client.pingresp();
	});

	client.on('disconnect', function (packet) {
		console.log('disconnect:' + client.id);
		client.stream.end();
	});

	client.on('close', function (packet) {
		console.log('close:' + client.id);
		delete self.clients[client.id];
	});

	client.on('error', function (e) {
		client.stream.end();
		console.log('error:' + client.id);
		console.log(e);
	});
}).listen(process.argv[2] || 1883);
