// Generated by CoffeeScript 1.4.0
(function() {
  var Encoder, EventEmitter, PlugAPI, Room, SockJS, apiId, client, encoder, http, logger, request, WebSocket, actionRPC;
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SockJS = require('./sockjs-client');

  ws = null;
  
  var uuid = require('uuid');
  
  var net = require('net');
  
  http = require('http');

  EventEmitter = require('events').EventEmitter;

  Encoder = require('node-html-encoder').Encoder;

  Room = require('./room');
  
  request = require('request')

  WebSocket = require('ws')

  encoder = new Encoder('entity');

  http.OutgoingMessage.prototype.__renderHeaders = http.OutgoingMessage.prototype._renderHeaders;

  client = null;

  actionRPC = null;
  
  apiId = 0;

  logger = {
    log: function() {
      return console.log.apply(console, arguments);
    }
  };

  PlugAPI = (function(_super) {

    __extends(PlugAPI, _super);

    function PlugAPI(key, updateCode) {
      this.key = key;
      
      this.chatIDs = [];
      
      this.getRoomScore = __bind(this.getRoomScore, this);

      this.getMedia = __bind(this.getMedia, this);

      this.getAmbassadors = __bind(this.getAmbassadors, this);

      this.getWaitList = __bind(this.getWaitList, this);

      this.getSelf = __bind(this.getSelf, this);

      this.getHost = __bind(this.getHost, this);

      this.getAdmins = __bind(this.getAdmins, this);

      this.getStaff = __bind(this.getStaff, this);

      this.getDJs = __bind(this.getDJs, this);

      this.getAudience = __bind(this.getAudience, this);

      this.getUser = __bind(this.getUser, this);

      this.getUsers = __bind(this.getUsers, this);

      this.moderateKickUser = __bind(this.moderateKickUser, this);

      this.moderateRemoveDJ = __bind(this.moderateRemoveDJ, this);

      this.moderatePermissions = __bind(this.moderatePermissions, this);
      
      this.initRoom = __bind(this.initRoom, this);

      this.joinRoom = __bind(this.joinRoom, this);

      this.createPlaylist = __bind(this.createPlaylist, this);
	  
      this.addSongToPlaylist = __bind(this.addSongToPlaylist, this);

      this.getPlaylists = __bind(this.getPlaylists, this);

      this.activatePlaylist = __bind(this.activatePlaylist, this);

      this.playlistMoveSong = __bind(this.playlistMoveSong, this);
      
      this.setAvatar == __bind(this.setAvatar, this);
      
      this.deleteChat = __bind(this.deleteChat, this);

      this.getDJHistory = __bind(this.getDJHistory, this);
      
      this.fanUser = __bind(this.fanUser, this);
      
      this.dataHandler = __bind(this.dataHandler, this);

      this.ws = null;
	  
      this.multiLine = false;

      this.multiLineLimit = 5;

      this.roomId = false;

      this.updateCode = updateCode != undefined ? updateCode : '_:8s[H@*dnPe!nNerEM';

      this.avatars = [
        'tastycat02', 'monster02', 'animal13', 'animal12', 'animal11', 'warrior04', 'warrior03', 'warrior02', 'warrior01', 'animal14', 'space05', 'animal10', 'space04', 'space06', 'lucha06', 'lucha07', 'lucha04', 'lucha05', 'lucha02', 'lucha03', 'space03', 'lucha01', 'space01', 'monster04', 'lucha08', 'space02', 'monster05', 'revolvr', 'tastycat', 'animal08', 'animal09', 'monster01', 'monster03', 'animal01', 'animal02', 'animal03', 'animal04', 'animal05', 'animal06', 'animal07', 'su01', 'su02'
      ];
      
      if (!key) {
        throw new Error("You must pass the authentication cookie into the PlugAPI object to connect correctly");
      }
      this.rpcHandlers = {};
      this.room = new Room();
    }
	
    PlugAPI.getAuth = function(creds, callback) {
      var plugLogin = require('plug-dj-login');
      plugLogin(creds, function(err, cookie) {
        if(err) {
          if(typeof callback == 'function')
            callback(err, null);
          return;
        }

        var cookieVal = cookie.value;
        cookieVal = cookieVal.replace(/^\"/, "").replace(/\"$/, "");
        if(typeof callback == 'function') {
          callback(err, cookieVal);
        }
      });
    };

    PlugAPI.getUpdateCode = function(auth, room, callback) {
      var jar = request.jar();
      jar.setCookie("usr=" + auth, "http://plug.dj", {}, function(){});
      request({
        uri: "http://plug.dj/" + room,
        method: 'GET',
        jar: jar
      }, function(error, response, body) {
        if(error) {
          console.log("error: ", error);
        }
        var match = /(\/_\/static\/js\/room\.[^\.]+\.js)/.exec(body);
        if(match == null) {
          if(typeof callback == 'function')
            callback("Invalid auth.", false);
          return;
        }
        var url = "http://plug.dj" + match[1];
        request({
          uri: url,
          method: 'GET'
        }, function(error, response, body) {
          var m = /var ([a-z]="[^"]+"),((?:[a-z]="[^"]+",?)+);return ([a-z\+]+)/.exec(body);
          if(m == null) {
            console.log("Something went wrong, sorry.");
          } else {
						var pairs = {};
						var n = /([a-z])="([^"]+)/.exec(m[1]);
						pairs[n[1]] = n[2];

						var keyval = m[2].split(",");
            // m[2] contains the rest of the code, in at least one key=value pair, so let's extract it with another regex
            for(var i=0;i<keyval.length;i++) {
              var n = /([a-z])="([^"]+)/.exec(keyval[i]);
              pairs[n[1]] = n[2];
            }
						
						// m[3] contains the order the pairs should be assembled
						var asm = m[3].split("+");
						var updateCode = "";
						for(var i=0;i<asm.length;i++) {
							updateCode += pairs[asm[i]];
						}
            if(typeof callback == 'function')
              callback(false, updateCode);
          }
        });
      });
    };
    
    PlugAPI.prototype.setLogObject = function(c) {
      return logger = c;
    };

    PlugAPI.prototype.connect = function(room) {
      var cookie,
        _this = this;
      cookie = this.key;
	  
      var opts = {
        url: 'https://sio2.plug.dj/socket.io/1/?t=' + Date.now()
        , headers: {
          Cookie: 'usr='+cookie
        }
      };
      request(opts, function(err, res, body) {
        if (err) {
          console.error(err)
        }
				
        var sockId = body.split(':')[0];
        var sockUrl = 'wss://sio2.plug.dj/socket.io/1/websocket/' + sockId;
        _this.ws = new WebSocket(sockUrl);

        _this.ws.on('open', function() {
          _this.ws.send('1::/room');
          var roomOpts = {
            name: 'join',
            args: [room]
          }
          _this.ws.send('5::/room:'+JSON.stringify(roomOpts))
        });

        _this.ws.on('message', function(data, flags) {
          // log all data
          //console.log("message: ", data);
					
					// Invalid login
					if (data == '0::') {
						console.log("message: ", data);
						_this.emit('invalidLogin')
						return;
					}
					
          // heartbeat
          if (data == '2::') _this.ws.send('2::');

          // other messages (including chat)
          if (data.match(/^5::\/room:/)) {
          var mStr = data.split('5::/room:')[1];
          var m = JSON.parse(mStr).args[0];

          // chat messages
          //if (m.type === 'message') onMessage(ws, m); 
          switch(m.type) {
            case 'message':
              //_this.onChat(m);
              if(_this.chatIDs.indexOf(m.chatID) > -1)
                return;
              _this.emit('chat', m);
              _this.chatIDs.push(m.chatID);
              break;
            case 'emote':
              _this.emit('emote', m);
              break;
            default:
              break;
          }
        }
      });
      
      
      
      // actionRPC
      
	  });
	  
	  
      http.OutgoingMessage.prototype._renderHeaders = function() {
        if (this._header) {
          throw new Error('Can\'t render headers after they are sent to the client.');
        }
        this.setHeader('Cookie', 'usr="' + cookie + '\"');
        return this.__renderHeaders();
      };
      client = SockJS.create('https://sjs.plug.dj:443/plug');
      client.send = function(data) {
        return this.write(JSON.stringify(data));
      };
      client.on('error', function(e) {
        console.log("client error: ", e);
        return _this.emit('error', e);
      });
      client.on('data', this.dataHandler);
      client.on('data', function(data) {
//        console.log("sjs data: ", data);
        return _this.emit('tcpMessage', data);
      });
      client.on('close', function() {
        return _this.emit('close');
      });
      return client.on('connection', function() {
        if (room) {
          _this.joinRoom(room);
        }
        _this.emit('connected');
        return _this.emit('tcpConnect', client);
      });
	  
	  
    };

    PlugAPI.prototype.dataHandler = function(data) {
      var msg, reply, _i, _len, _ref, _ref1, _ref2, _ref3;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (data.messages) {
        _ref = data.messages;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          msg = _ref[_i];
          this.messageHandler(msg);
        }
        return;
      }
      if (data.type === 'rpc') {
        reply = data.result;
        if (((_ref1 = data.result) != null ? _ref1.stacktrace : void 0)) {
          logger.log(data.result.stacktrace);
        }
        if (data.status !== 0) {
          reply = data;
        }
        if ((_ref2 = this.rpcHandlers[data.id]) != null) {
          if (typeof _ref2.callback === "function") {
            _ref2.callback(reply);
          }
        }
        this.parseRPCReply((_ref3 = this.rpcHandlers[data.id]) != null ? _ref3.type : void 0, reply);
        return delete this.rpcHandlers[data.id];
      }
    };

    PlugAPI.prototype.parseRPCReply = function(name, data) {
      switch (name) {
        case 'room.join':
          this.emit('roomChanged', data);
          if(typeof data.room !== 'undefined') {
            if(typeof data.room.historyID !== 'undefined') {
            	this.historyID = data.room.historyID;
            	this.roomId = data.room.id;
            	this.userId = data.user.profile.id;
            }
          }
      }
    };

    PlugAPI.prototype.messageHandler = function(msg) {
      switch (msg.type) {
        case 'ping':
          this.sendRPC('user.pong');
          break;
        case 'userJoin':
          this.room.addUser(msg.data);
          this.emit('registered', msg.data);
          this.emit('user_join', msg.data);
          break;
        case 'userLeave':
          this.room.remUser(msg.data.id);
          this.emit('registered', msg.data);
          this.emit('user_leave', msg.data);
          break;
        case 'chat':
          msg.data.message = encoder.htmlDecode(msg.data.message);
          this.emit('speak', msg.data);
          break;
        case 'voteUpdate':
          if (msg.data.vote === 1) {
            this.room.logVote(msg.data.id, 'woot');
          } else {
            this.room.logVote(msg.data.id, 'meh');
          }
          this.emit('update_votes', msg.data);
          break;
        case 'djUpdate':
					var addedDJs = []; // dj's that were added with this update
					var removedDJs = []; // dj's that were removed with this update
					var djs = this.room.djs;
					this.room.setDjs(msg.data.djs);
					var newdjs = this.room.djs;
					
					for (var id in newdjs) {
						if (djs[id] === undefined) {
							addedDJs.push(newdjs[id]);
						}
					}
					for (var id in djs) {
						if (newdjs[id] === undefined) {
							removedDJs.push(djs[id]);
						}
					}
					if (addedDJs.length > 0) {
						this.emit('waitlist_add', addedDJs);
					}
					if (removedDJs.length > 0) {
						this.emit('waitlist_remove', removedDJs);
					}
          break;
        case 'djAdvance':
          this.room.setDjs(msg.data.djs);
          this.room.setMedia(msg.data.media);
          this.historyID = msg.data.historyID;
          this.emit('dj_advance', msg);
          break;
        case 'curateUpdate':
          this.room.logVote(msg.data.id, 'curate');
          break;
        case void 0:
          logger.log('UNKNOWN MESSAGE FORMAT', msg);
      }
      if (msg.type) {
        return this.emit(msg.type, msg.data);
      }
    };

    PlugAPI.prototype.sendRPC = function(name, args, callback) {
      var rpcId, sendArgs;
      if (args === void 0) {
        args = [];
      }
      if (Object.prototype.toString.apply(args) !== "[object Array]") {
        args = [args];
      }
      rpcId = ++apiId;
      this.rpcHandlers[rpcId] = {
        callback: callback,
        type: name
      };
      sendArgs = {
        type: 'rpc',
        id: rpcId,
        name: name,
        args: args
      };
      return client.send(sendArgs);
    };

    PlugAPI.prototype.send = function(data) {
      return client.send(data);
    };

    PlugAPI.prototype.actionRPC = function(service, args, callback) {
      var _this = this;
      var sendData = JSON.stringify({
        service: service,
        body: args
      });
      
      var post_options = {
        host: 'plug.dj',
        port: '80',
        Cookie: 'usr=' + _this.key, 
        path: '/_/gateway/' + service,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': sendData.length
        }
      };
      
      var post_req = http.request(post_options, function(res) {
          var dataStr = '';
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
              dataStr += chunk
          });
          res.on('end', function() {
            var data = JSON.parse(dataStr).body;
//            console.log("ROOM DETAILS: ", data);
            
            if(typeof callback == 'function') {
              return callback(data);
            }
          });
        });
        // post the data
        post_req.write(sendData);
        post_req.end();
    }
    
    PlugAPI.prototype.joinRoom = function(name, callback) {
      var _this = this;
      return this.sendRPC('room.join_1', [name, _this.updateCode], function(data) {
        _this.actionRPC('room.details_1', [name], function(data) {
          return _this.initRoom(data, function(data) {
            _this.emit('roomJoin', data);
            if (typeof callback === 'function') {
              return callback(data);
            }
          });
        });
      });
    };

    PlugAPI.prototype.initRoom = function(data, callback) {
      this.room.reset();
      this.roomId = data.room.id;
  	  this.historyID = data.room.historyID;
      this.room.setUsers(data.room.users);
      this.room.setStaff(data.room.staff);
      this.room.setAdmins(data.room.admins);
			this.room.setAmbassadors(data.room.ambassadors);
      this.room.setOwner(data.room.owner);
      this.room.setSelf(data.user.profile);
      this.room.setDjs(data.room.djs);
      this.room.setMedia(data.room.media, data.room.votes, data.room.curates);
//      this.emit('roomJoin', data);
      return callback(data);
    };

    PlugAPI.prototype.roomRegister = function(name, callback) {
      return this.joinRoom(name, callback);
    };

    PlugAPI.prototype.intChat = function(msg) {
//      return this.send({
//        type: 'chat',
//        msg: msg
//      });
			var cid = uuid.v4().replace(/-/g,'').substr(0, 13);
		  var message = {
			  name: 'chat',
				args: [{
					msg: msg,
					chatID: cid
				}]
		  }
			return this.ws.send('5::/room:'+JSON.stringify(message))
    };

	PlugAPI.prototype.chat = function(msg) {
		if(msg.length > 235 && this.multiLine) {
			var lines = msg.replace(/.{235}\S*\s+/g, "$&@").split(/\s+@/);
			for(var i=0;i<lines.length;i++) {
				msg = lines[i];
				if(i > 0)
					msg = "(continued) " + msg;
				this.intChat(msg);
				if(i+1 >= this.multiLineLimit)
					break;
			}
		} else
			this.intChat(msg);
	};
	
    PlugAPI.prototype.speak = function(msg) {
      return this.chat(msg);
    };

    PlugAPI.prototype.sendChat = function(msg) {
      return this.chat(msg);
    };

    PlugAPI.prototype.upvote = function(callback) {
      this.actionRPC("room.cast", [true, this.historyID, this.lastHistoryID === this.historyID], callback);
      return this.lastHistoryID = this.historyID;
    };

    PlugAPI.prototype.downvote = function(callback) {
      this.actionRPC("room.cast", [false, this.historyID, this.lastHistoryID === this.historyID], callback);
      return this.lastHistoryID = this.historyID;
    };

    PlugAPI.prototype.woot = function(callback) {
      return this.upvote(callback);
    };

    PlugAPI.prototype.meh = function(callback) {
      return this.downvote(callback);
    };

    PlugAPI.prototype.vote = function(updown, callback) {
      if (updown.toLowerCase() === "up") {
        return this.upvote(callback);
      } else {
        return this.downvote(callback);
      }
    };

    PlugAPI.prototype.changeRoomInfo = function(name, description, callback) {
      var roomInfo;
      roomInfo = {
        name: name,
        description: description
      };
      return this.sendRPC("moderate.update_1", roomInfo, callback);
    };

    PlugAPI.prototype.changeRoomOptions = function(boothLocked, waitListEnabled, maxPlays, maxDJs, callback) {
      var options;
      if (!this.roomId) {
        throw new Error('You must be in a room to change its options');
      }
      options = {
        boothLocked: boothLocked,
        waitListEnabled: waitListEnabled,
        maxPlays: maxPlays,
        maxDJs: maxDJs
      };
      return this.sendRPC("room.update_options_1", [this.roomId, options], callback);
    };

    PlugAPI.prototype.joinBooth = function(callback) {
      return this.actionRPC("booth.join_1", [], callback);
    };

    PlugAPI.prototype.leaveBooth = function(callback) {
      return this.actionRPC("booth.leave_1", [], callback);
    };
	
    PlugAPI.prototype.lockBooth = function(arg1, arg2) {
      var clear = false;
      var callback = false;
      if(typeof arg1 == 'function') {
        callback = arg1;
      } else {
        clear = arg1;
        if(typeof arg2 == 'function') {
          callback = arg2;
        }
      }
        return this.actionRPC("room.lock_booth_1", [this.roomId, true, clear], callback);
    }

    PlugAPI.prototype.unlockBooth = function(arg1, arg2) {
      var clear = false;
      var callback = false;
      if(typeof arg1 == 'function') {
        callback = arg1;
      } else {
        clear = arg1;
        if(typeof arg2 == 'function') {
          callback = arg2;
        }
      }
        return this.actionRPC("room.lock_booth_1", [this.roomId, false, clear], callback);
    }

    PlugAPI.prototype.removeDj = function(userid, callback) {
      return this.actionRPC("moderate.remove_dj_1", [userid], callback);
    };

    PlugAPI.prototype.moderateRemoveDJ = function(userid) {
      return this.removeDj(userid);
    };
    
    PlugAPI.prototype.moderatePermissions = function(userid, permission, callback) {
      return this.actionRPC("moderate.permissions_1", [userid, permission], callback);
    };

    PlugAPI.prototype.moderateAddDJ = function(userid, callback) {
      return this.actionRPC("moderate.add_dj_1", [userid], callback);
    };

    PlugAPI.prototype.addDj = function(callback) {
      return this.joinBooth(callback);
    };

    PlugAPI.prototype.remDj = function(userid, callback) {
      if (userid && userid === this.userid) {
        return this.leaveBooth(callback);
      } else {
        return this.removeDj(userid, callback);
      }
    };
    
    PlugAPI.prototype.moveDJ = function(id, index, callback) {
    	if (index > 50) index = 50;
    	else if (index < 1) index = 1;
    	return this.actionRPC("moderate.move_dj_1", [id, index], callback);
    };

    PlugAPI.prototype.moderateBanUser = function(id, reason, duration, callback) {
      return this.actionRPC("moderate.ban_1", [id, reason, duration], callback);
    };
    
    PlugAPI.prototype.moderateUnBanUser = function(id, callback) {
      return this.actionRPC("moderate.unban_1", [id], callback);
    };

    PlugAPI.prototype.waitListJoin = function() {
      return this.joinBooth();
    };

    PlugAPI.prototype.waitListLeave = function() {
      return this.leaveBooth();
    };

    PlugAPI.prototype.skipSong = function(userid, callback) {
      return this.actionRPC("moderate.skip_1", [userid, this.historyID], callback);
    };

    PlugAPI.prototype.moderateForceSkip = function() {
      return this.skipSong();
    };

    PlugAPI.prototype.getUsers = function() {
      return this.room.getUsers();
    };

    PlugAPI.prototype.getUser = function(userid) {
      return this.room.getUser(userid);
    };

    PlugAPI.prototype.getAudience = function(name) {
      return this.room.getAudience();
    };

    PlugAPI.prototype.getDJs = function() {
      return this.room.getDjs();
    };

    PlugAPI.prototype.getStaff = function() {
      return this.room.getStaff();
    };

    PlugAPI.prototype.getAdmins = function() {
      return this.room.getAdmins();
    };

    PlugAPI.prototype.getHost = function() {
      return this.room.getHost();
    };

    PlugAPI.prototype.getSelf = function() {
      return this.room.getSelf();
    };

    PlugAPI.prototype.getWaitList = function() {
      return this.room.getWaitlist();
    };

    PlugAPI.prototype.getAmbassadors = function() {
      return this.room.getAmbassadors();
    };

    PlugAPI.prototype.getMedia = function() {
      return this.room.getMedia();
    };

    PlugAPI.prototype.getRoomScore = function() {
      return this.room.getRoomScore();
    };

    PlugAPI.prototype.createPlaylist = function(name, callback) {
      return this.actionRPC("playlist.create_1", name, callback);
    };

    PlugAPI.prototype.addSongToPlaylist = function(playlistId, songid, callback) {
      return this.actionRPC("playlist.media.insert_1", [playlistId, null, -1, [songid]], callback);
    };

    PlugAPI.prototype.getPlaylists = function(callback) {
      var date = new Date(0).toISOString().replace('T', ' ');
      return this.actionRPC("playlist.select_1", [date, null, 100, null], callback);
    };

    PlugAPI.prototype.activatePlaylist = function(playlist_id, callback) {
      return this.actionRPC("playlist.activate_1", [playlist_id], callback);
    };

    PlugAPI.prototype.playlistMoveSong = function(playlist, song_id, position, callback) {
      return this.actionRPC("playlist.media.move_1", [playlist.id, playlist.items[position], [song_id]], callback);
    };
    
    PlugAPI.prototype.setAvatar = function(avatar, callback) {
      return this.actionRPC("user.set_avatar_1", [avatar], callback);
    };
    
    PlugAPI.prototype.deleteChat = function(chatID, callback) {
      return this.actionRPC("moderate.chat_delete_1", [chatID], callback);
    };

    PlugAPI.prototype.getDJHistory = function(room, callback) {
      return this.actionRPC('history.select_1', room, callback);
    };

    PlugAPI.prototype.fanUser = function(userid, callback) {
      return this.actionRPC("user.follow_1", userid, callback);
    };

    PlugAPI.prototype.unfanUser = function(userid, callback) {
      return this.actionRPC("user.unfollow_1", userid, callback);
    };
	
    PlugAPI.prototype.listen = function (port, address) {
      var self = this;
      var querystring = require('querystring');
      http.createServer(function (req, res) {
        var dataStr = '';
        req.on('data', function (chunk) {
        dataStr += chunk.toString();
        });
        req.on('end', function () {
        var data = querystring.parse(dataStr);
        req._POST = data;
        self.emit('httpRequest', req, res);
        });
      }).listen(port, address);
	  };
	  
	  PlugAPI.prototype.tcpListen = function (port, address) {
      var self = this;
      net.createServer(function (socket) {
        socket.on('connect', function () {
        self.emit('tcpConnect', socket);
        });
        socket.on('data', function (data) {
        var msg = data.toString();
        if (msg[msg.length - 1] == '\n') {
          self.emit('tcpMessage', socket, msg.substr(0, msg.length-1), port);
        }
        });
        socket.on('end', function () {
        self.emit('tcpEnd', socket);
        });
      }).listen(port, address);
	  };
    return PlugAPI;

  })(EventEmitter);

  module.exports = PlugAPI;

}).call(this);
