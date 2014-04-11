var http = require('http');
var sys = require('sys');
var net = require('net');
global.mqtt = require('mqtt');  //创建全局变量，不是最好的方案，先这么做，后期再改。
//global.mqttClients = {};
var mysql = require('mysql');
//服务器地址,
var db_config = {
		  host: 'localhost',
		    user: 'kuulabu',
		    password: 'kuulabu',
		    database: 'Kuulabu'
		};

var connection;

function handleDisconnect() {
          connection = mysql.createConnection(db_config); // Recreate the connection, since
		                                                  // the old one cannot be reused.
		  connection.connect(function(err) {              // The server is either down
		    if(err) {                                     // or restarting (takes a while sometimes).
		      console.log('error when connecting to db:', err);
		      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
		    }                                     // to avoid a hot loop, and to allow our node script to
		  });                                     // process asynchronous requests in the meantime.
		                                          // If you're also serving http, display a 503 error.
		  connection.on('error', function(err) {
		    console.log('db error', err);
		    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
		      handleDisconnect();                         // lost due to either server restart, or a
		    } else {                                      // connnection idle timeout (the wait_timeout
		      throw err;                                  // server variable configures this)
		    }
		  });
	}

handleDisconnect();
//扩展js的数组方法
Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

Array.prototype.in_array = function(e)  
{  
	for(i=0;i<this.length && this[i]!=e;i++);  
	return !(i==this.length);  
} 



var  util = require('util');
var client = mqtt.createClient();
//MQTTClient(1883, '127.0.0.1', 'pusher');
global.io  = require('socket.io');
var Memcached = require('memcached');
var memcached = new Memcached('localhost:11211');
//var PHPUnserialize = require('php-unserialize');
//var sessionecode =  require('./session_decode.js');
server =  http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('node shell\n'); 
});
server.listen(5000);
io = io.listen(server);
var createMqttServer = require('./createMqttServer.js');
var roomOnlineNum = new Array();
var obj={};
var onlineUsersId=new Array(); //在线用户Id的数组。以能够准确判定当前在线人数。
var socketMap  = {};
//var roomUserToUser = 'userTouser-';
var userClients = new Array();
var msg = '';  
var portrait = '';
var mqttContent = '';
var sql= '';
var roomActivity = 'activity-';
var roomClub = 'club-';
var roomUsersGroup = 'group-';
var roomUserToUser = 'userTouser-';
var socketArr  = new Array();
var new_data = new Array();
/**
 * 过滤特殊字符
 * @param s
 * @returns {String}
 */
function stripscript(s) {
    var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）&mdash;—|{}【】‘；：”“'。，、？]")
        var rs = "";
    for (var i = 0; i < s.length; i++) {
        rs = rs + s.substr(i, 1).replace(pattern, '');
    }
    return rs;
}


//下步两项任务： 
// 1： 将用户所有的clientID记录进入memcached,并实现用户离线的自身的socket的清理断开。
// 2： 查询当前socket用户的所有好友userId，并查询出都那些人在线。
// 3： 查询当前socket用户加入的所有俱乐部的clubId,并统计在线人数。
// 4： 查询当前socket用户加入的活动的activityId，并统计在线人数。

//memcached.get('1g8n9qneetpiapup2utdf9qm12_userId', function (err, data) {
//	console.log('session jin ru 111');  
//    console.dir( data );
//    console.log('session tui chu  222');
//});

io.sockets.on('connection', function (socket) {
	  var topic = '';

console.log('io.clients');
console.log(io.clients);
console.log('io.clients');
console.log('io-----------------------------------------');
console.log(io);
console.log('io-----------------------------------------');
 for(sessionId in io.clients){
      io.clients[sessionId].send(JSON.stringify(update));
    }


	  socket.on('subscribe', function (data) {
		      var count = 1;
              socket.topic = data.topic;
              socket.payload = data.payload;
              room = data.topic;
              userInfo = JSON.parse(data.payload);
              phpsession = userInfo.phpsession+'_userId';
              //生成socketId与userId的键值对： （key=>value） 如： socketId => userId
              socketArr[socket.id]=userInfo.userId;
              console.log('socketArr');
              console.log(socketArr);
              console.log('socketArr');
              //用户只要登录就订阅所有的消息。
              //1:首先订阅个人信息
              socketMap[roomUserToUser+userInfo.userId] = socket;
              //订阅俱乐部/活动/讨论组的信息。
	    	  sql = "select activityId from ActivityUserInvitation where inviteeUserId= "+ connection.escape(userInfo.userId);
              connection.query(sql, function(err, results) {
      			for(i=0;i<results.length;i++){
      				   socket.join(roomActivity+results[i].activityId);
      			}
      		  });
              sql = "select kuulabuId from KuulabuUser where userId= "+ connection.escape(userInfo.userId);
              connection.query(sql, function(err, results) {
      			for(i=0;i<results.length;i++){
      				   socket.join(roomClub+results[i].kuulabuId);
      			}
      		  });
              
              console.log('clientId:'+socket.id);
              var userClientArr = new Array();
              //查询当前socket用户的clients信息,并进行绑定
	          memcached.get(userInfo.userId, function (err, result) {
	        	  if(result){
	        		  result = new String(result); //强制转换为字符串类型，因为memcached获取的结果是object
	        		  data = result.split(","); 
	        		  console.log('testtest-----test-----');
	        		  for(i=0;i<data.length;i++){
	 					 console.log("data  "+i+":"+data[i]);
	 				  }
	        		  console.log('testtest-----test-----');
	        		  if(!data.in_array(socket.id)){
                    	  data.push(socket.id);
                    	  userClients = data.join(",");
                    	  console.log("userClients:"+userClients);
                    	  memcached.set(userInfo.userId, userClients, 10000, function( err, result ){
   	        	                if( err ) console.error( err );
              	        	    console.dir( result );  //返回值为boolen值
              	        	    console.log('stop aaaaa===========================');
                          });
	        		  }
	        	  }else{
	        		  userClientArr.push(socket.id);
	        		  userClients = userClientArr.join(",");
                      memcached.set(userInfo.userId, userClients, 10000, function( err, result ){
	        	            if( err ) console.error( err );
           	        	    console.dir( result );  //返回值为boolen值
                      });
                      console.log('data start ');
	        		  console.log(data);
	        		  console.log('data end! ');
	        	  }
	      	  });
	          //查看当前好友的在线信息。
	          sql = "select friendUserId from UserFriend where isAuthorized=1 and  userId =  "+ connection.escape(userInfo.userId);
              connection.query(sql, function(err, results) {
      			for(i=0;i<results.length;i++){
      				  //通知自己的好友自己已经上线
      	              roomMyFriends = roomUserToUser+results[i].friendUserId;
      	              if(socketMap.hasOwnProperty(roomMyFriends)){
      	    	    	  console.log('点对点有值'+results[i].friendUserId);
      	    	    	  socketFriend = socketMap[roomMyFriends];
      	    	          //主动发送消息
      	    	    	  socketFriend.emit('online',{'topic': roomMyFriends,
      	    		                  'room':roomMyFriends,
      	    		                  'payload':String(userInfo.userId)});
      	              }
      			}
      		  });
	          
	          
	          //将在线好友的列表发送到客户端。
	          
	          //及时将自己的登录状况发送给自己的好友。
	          //处理群（活动，俱乐部）的好友的在线状态。
	          //及时将自己的登录发送给自己相关的群。
	          
	          
	          
//              socket.join(data.topic);
              client.subscribe(data.topic); //向特定的用户发送信息。
              //向用户推送用户未读的信息。
              userTouserNonReadMessageSql = 'select u.userId,u.defaultNickname,ut.message,ut.createTime  '+
            	                            'from UserTouserChatRecord  ut ,User u '+
            	                            'where  ut.accepterUserId= '+connection.escape(userInfo.userId)+' and ut.isRead=0  and u.userId=ut.senderUserId ';
              console.log('userTouserNonReadMessageSql:'+userTouserNonReadMessageSql);
              connection.query(userTouserNonReadMessageSql, function(err, results) {
      			for(i=0;i<results.length;i++){
      		      var  strObj ={
      		    		    	'userId':'',
      		    		        'username':'',
      		    		        'userProfilePhotoUrl':'',
      		    		        'msg':''
      		    		        };
	      		      strObj.userId = results[i].userId;
	      		      strObj.username = results[i].defaultNickname;
	      		      strObj.msg = results[i].message;
      				  console.log('strobj');
      				  console.log(strObj);
      				  console.log('strObj end ');
      				  noticeRoom = roomUserToUser+results[i].userId;
      				  console.log("noticeRoom"+noticeRoom);
      				  socket.emit('mqtt',{'topic': String(roomUserToUser+results[i].userId),
      					  'room':noticeRoom,
      					  'payload':JSON.stringify(strObj)
                      });
      			 }
      		  });
              //向用户推送未读的群信息，包括：活动，俱乐部，讨论组。
              groupNonReadMessageSql = 'select u.userId,u.defaultNickname, gcr.message,gcr.activityId,gcr.clubId,gcr.senderUserId, gcr.createTime '+ 
            	                       ' from GroupChatUserReadStatus gcs ,GroupChatRecord gcr,User u  '+
                                       ' where  gcs.accepterUserId= '+connection.escape(userInfo.userId)+
            	                       ' and gcs.isRead=0  and gcr.groupChatRecordId = gcs.groupChatRecordId  and gcr.senderUserId = u.userId';
              connection.query(groupNonReadMessageSql, function(err, results) {
            	  for(i=0;i<results.length;i++){
          		      var  strObj ={
          		    		    	'userId':'',
          		    		        'username':'',
          		    		        'userProfilePhotoUrl':'',
          		    		        'msg':''
          		    		        };
    	      		      strObj.userId = results[i].userId;
    	      		      strObj.username = results[i].defaultNickname;
    	      		      strObj.msg = results[i].message;
    	      		      room = null;
    	      		      if(results[i].activityId!=null){
    	      		    	  room =roomActivity+results[i].activityId;
    	      		      }else{
    	      		    	  if(results[i].clubId!=null){
    	      		    		  room=roomClub+results[i].clubId;
    	      		    	  }
    	      		      }
          				  socket.emit('mqtt',{'topic':room,
          					  'room':room,
          					  'payload':JSON.stringify(strObj)
                          });
          			 } 
        	  });
              
              //推送完之后，将那些未读的信息全部设成已读。
              updateUserTouser = "update  UserTouserChatRecord  set isRead = 1 where isRead=0 and accepterUserId ="+connection.escape(userInfo.userId);           
              updateGroup= "update  GroupChatUserReadStatus set isRead = 1 where isRead=0 and accepterUserId ="+connection.escape(userInfo.userId);
              connection.query(updateUserTouser, function(err, results) {
            	  if (err) { 
    	    	      connection.rollback(function() {
    	    	        throw err;
    	    	      });
    	    	   }
        	  });
              connection.query(updateGroup, function(err, results) {
            	  if (err) { 
    	    	      connection.rollback(function() {
    	    	        throw err;
    	    	      });
    	    	   }
              });
              //处理去除重复，以免已经登录的用户，多次记录。
              //暂未处理。
              //暂时屏蔽了离线在线提示功能。
             // io.sockets.in(socket.topic).emit('users', { number:obj[socket.topic],room:room,payload:data.payload });
              //想实现动态监听。

//              memcached.get(phpsession, function (err, data) {
//            		console.log('session jin ru ');  
//            		console.log(typeof(data));
//            		console.log(data);
//            	    console.log('session tui chu');
//            	    io.sockets.in(data.topic).emit('mqtt',{'topic': String(data.topic),
//  	                  'room':room,
//  	                  'payload':String(data)});
//  	          	    
//            	});
    });
	socket.on('publish',function(data){
		  console.log('--- publish to '+data.topic+' msg:'+data.payload);
		  room = data.topic; //取得当前room.
		  io.sockets.in(data.topic).emit('mqtt',{'topic': String(data.topic),
                             'room':room,
			    'payload':String(data.payload)});
//		  userInfo =  eval('(' + data.payload + ')');
		  userInfo = JSON.parse(data.payload);
		  msg = stripscript(userInfo.msg);
		  timestamp=new Date().getTime();
		  groupChatInfo = room.split("-");
	      toGroupId = groupChatInfo[1];
		  portrait = userInfo.userProfilePhotoUrl;
		  //查询出对应群组的所有人的手机clientId.
		  groupType =   room.split("-"); //字符分割 
		  console.log("groupType");
		  console.log(groupType);
		  switch(groupType['0']){
	       case 'club':
	    	   sql = "select userClientId,userId from UserClient where userId in( select userId from  KuulabuUser where kuulabuId = "+ connection.escape(groupType['1'])+")";
	    	   insertGroupChatRecord = "insert into  GroupChatRecord (message,createTime,clubId,senderUserId) values(" +
		   		"'"+msg+"'," +
		   		timestamp+","+
		   		toGroupId+","+
		   		userInfo.userId+
		   		")";
	    	   groupUsersSql = " select userId from  KuulabuUser where kuulabuId = "+ connection.escape(groupType['1']);
	    	   break;
	       case 'activity':
	    	   sql = "select userClientId,userId from UserClient where userId in( select inviteeUserId from  ActivityUserInvitation where activityId = "+ connection.escape(groupType['1'])+")";
	    	   insertGroupChatRecord = "insert into  GroupChatRecord (message,createTime,activityId,senderUserId) values(" +
		   		"'"+msg+"'," +
		   		timestamp+","+
		   		toGroupId+","+
		   		userInfo.userId+
		   		")";
	    	   groupUsersSql=" select inviteeUserId as userId from  ActivityUserInvitation where activityId = "+ connection.escape(groupType['1']);
	    	   break;
	       case 'group':
	    	   break;
	       default:
	    	   sql='';
	    }
		console.log("sql:"+sql);
		mqttContent  = '{"isSuccess":true,"message":"'+msg+'","type":"CHAT_ROOM","portrait":"'+portrait+'"}';
        //将聊天记录插入数据库。
        connection.query(insertGroupChatRecord, function(err, results) {
        	 if (err) { 
	    	      connection.rollback(function() {
	    	        throw err;
	    	      });
	    	   }
        	insertId = results.insertId;
        	connection.query(groupUsersSql, function(err, results) {
        		console.log(results);
        		for(i=0;i<results.length;i++){
//        			if(results[i]['userId'] ==userInfo.userId ){
//		        		 isRead = true;
//		        		 timestamp=new Date().getTime();
//        			}else{
//        				 isRead = false;
//        				 timestamp = 0;
//        			}
        			//在线的全部标识为已读。
        			groupUser = roomUserToUser+results[i]['userId'];
        			if(socketMap.hasOwnProperty(groupUser)){
        				isRead = true;
        				timestamp=new Date().getTime();
        			}else{
        				 isRead = false;
        				 timestamp = 0;
        			}
        			insertGroupChatUserReadStatus = "insert into  GroupChatUserReadStatus (isRead,readTime,groupChatRecordId,accepterUserId) values(" +
			   		isRead +","+
			   		timestamp+","+
			   		insertId+","+
			   		results[i]['userId']+
			   		")";
        			console.log(insertGroupChatUserReadStatus);
					connection.query(insertGroupChatUserReadStatus, function(err, results) {
						 if (err) { 
				    	      connection.rollback(function() {
				    	        throw err;
				    	      });
				    	   }					
					})
        		}
        	})
        	
     		connection.query(sql, function(err, results) {
    			for(i=0;i<results.length;i++){
    				client.publish('chat/'+results[i]['userClientId'],mqttContent);
    			}
    		});
        })
//		client.publish('chat/630e80953e11ac25',mqttContent);
	});
	socket.on('userTouser-publish',function(data){
		  console.log('--- publish to '+data.topic+' msg:'+data.payload);
//		  userInfo =  eval('(' + data.payload + ')');
		  userInfo = JSON.parse(data.payload);
          message = stripscript(userInfo.msg);  //发送内容
          console.log('message');
          console.log(stripscript(message));
          console.log('message end');
		  roomA = data.topic; //取得当前room.
		  console.log("roomA:"+roomA);
		  roomB = roomUserToUser+userInfo.userId;
		  timestamp=new Date().getTime();
		  toUserInfo = roomA.split("-");
	      toUserId = toUserInfo[1];
	      if(socketMap.hasOwnProperty(roomA)){
	    	  console.log('点对点有值');
	    	  socketuserA = socketMap[roomA];
	          //主动发送消息
		      socketuserA.emit('mqtt',{'topic': String(data.topic),
		                  'room':roomB,
		                  'payload':String(data.payload)});
		      //记录在线信息。
		      $insertSql = "insert into UserTouserChatRecord(message,createTime,readTime,isRead,senderUserId,accepterUserId) values(" +
  	  		            "'"+message+"'," +
			  	  		+timestamp+','+
			  	  		+timestamp+","+
			  	  	    true+","+
			  	  	    +userInfo.userId+","+
			  	  	    +toUserId+
  	  		           ")";
		      connection.query($insertSql, function(err, result) {
		    	    if (err) { 
		    	      connection.rollback(function() {
		    	        throw err;
		    	      });
		    	    }
		       })
		      
		  }else{
			  //记录用户的离线信息
		      $insertSql = "insert into UserTouserChatRecord(message,createTime,readTime,isRead,senderUserId,accepterUserId) values(" +
  	  		            "'"+message+"'," +
			  	  		+timestamp+','+
			  	  		+timestamp+","+
			  	  		false+","+
			  	  	    +userInfo.userId+","+
			  	  	    +toUserId+
  	  		           ")";
		      console.log('insertSql');
		      console.log($insertSql);
		      console.log('insertSql  end ----');
		      connection.query($insertSql, function(err, result) {
		    	    if (err) { 
		    	      connection.rollback(function() {
		    	        throw err;
		    	      });
		    	    }
		       })
		  }
	    //被动发送消息
	      socketuserB = socketMap[roomB];
	      socketuserB.emit('mqtt',{'topic': String(data.topic),
            'room':roomA,
            'payload':String(data.payload)});

	      //将自己设为已读信息
	      $insertSql = "insert into UserTouserChatRecord(message,createTime,readTime,isRead,senderUserId,accepterUserId) values(" +
	  		            "'"+message+"'," +
			  	  		+timestamp+','+
			  	  		+timestamp+","+
			  	  		true+","+
			  	  	    +userInfo.userId+","+
			  	  	    +userInfo.userId+
	  		           ")";
	      connection.query($insertSql, function(err, result) {
	    	    if (err) { 
	    	      connection.rollback(function() {
	    	        throw err;
	    	      });
	    	    }
	       })
	      
		  userInfo =  eval('(' + data.payload + ')');
		  msg = userInfo.msg;
		  portrait = userInfo.userProfilePhotoUrl;
		  mqttConten_jsonObj ={'isSuccess':true,'message':'"'+msg+'"','type':'CHAT_ROOM','portrait':'"'+portrait+'"'};
		  mqttConten_jsonObj.portrait = portrait;
		  mqttConten_jsonObj.message = msg;
		  mqttContent =  JSON.stringify(mqttConten_jsonObj);
		  client.publish('chat/630e80953e11ac25',mqttContent);	   	  
	});
	
	socket.on('disconnect', function () {
		obj[socket.topic]--;
		userId = socketArr[socket.id];
		console.log("userId:"+userId);
		//查询当前socket用户的clients信息
        memcached.get(userId, function (err, result) {
        	console.log("socket.id:"+socket.id);
        	console.log(result);
        	console.log("data");
            var new_data = new Array();
            result = new String(result); //强制转换为字符串类型，因为memcached获取的结果是object
            data = result.split(","); 
        	if(data){
      		  if(data.in_array(socket.id)){
      			  for(i=0;i<data.length;i++){
      				  console.log("i:"+i);
      				  console.log(data[i]);
      				  //删除已经退出的client
      				  if(data[i]==socket.id){
      					  console.log("cun zai xiang deng de !");
      				  }else{
      					  console.log('jin lai le ');
      					  new_data.push(data[i]);
      				  }
      			  }
      			  //如果新的数组对象长度为0，则删除memcached中此用户的clients信息。表示用户已经彻底下线。
      			  if(new_data.length==0){
	      				memcached.del(userId, function (err) {
	      				  // stuff
	      				});
	      				delete socketMap[roomUserToUser+userId];
      			  }else{
      				  userClients = new_data.join(",");
      				 memcached.set(userId, new_data, 10000, function( err, result ){
     	                if( err ) console.error( err );
 	        	        console.dir( result );  //返回值为boolen值
      			     });
      			  }
      		  }
      		  	console.log('new_data exist start ');
      		    for(i=0;i<new_data.length;i++){
					 console.log("new_data  i="+new_data[i]);
				 }
      		  	console.log('new_data exist end! ');
        	}else{
      		  	//if  data  is null or empty object or array
        	}
        });
      //测试删除的clients情况，测试用，应用上没什么作用。
    	memcached.get(userId, function (err, data) {
    		console.log('shan chu hou de ');
//    		for(i=0;i<data.length;i++){
//				 console.log("new_data  i="+data[i]);
//			 }
    		console.log(data);
//    		console.log("data.length:"+data.length);
    	});
		delete socketArr[socket.id]; //删除js数组。
		 //查看当前用户的好友列表。
        sql = "select friendUserId from UserFriend where isAuthorized=1 and  userId =  "+ connection.escape(userInfo.userId);
        connection.query(sql, function(err, results) {
			for(i=0;i<results.length;i++){
				  //通知自己的好友自己已经上线
	              roomMyFriends = roomUserToUser+results[i].friendUserId;
	              if(socketMap.hasOwnProperty(roomMyFriends)){
	    	    	  console.log('点对点有值'+results[i].friendUserId);
	    	    	  socketFriend = socketMap[roomMyFriends];
	    	          //主动发送消息
	    	    	  socketFriend.emit('offline',{'topic': roomMyFriends,
	    		                  'room':roomMyFriends,
	    		                  'payload':String(userId)});
	              }
			}
		  });
		
  	});
});

//client.on('message', function(topic, payload){
//   console.log('teststest');
//   console.log("topic"+topic)
//   console.log(payload);
//   sys.puts(topic+'='+payload);
//   io.sockets.in(topic).emit('mqtt',{'topic': String(topic),
//	   'room':43,
//    'payload':String(payload)});
//});
