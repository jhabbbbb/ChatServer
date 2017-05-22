var app = require('http').createServer(handler)
var mysql = require('mysql')
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(12345);

function handler (req, res) {
	fs.readFile(__dirname + '/index.html',
	function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}

var connection = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password : 'im.jin.com',
	port: '3306',
	database: 'Chat',
});
connection.connect()

var socketArray = new Array()

io.on('connection', function (socket) {
	socket.emit('handShake', { hello: 'hello client' });
	
	socket.on('login', function (data) {
		var query = "select * from user where username = '" + data.username + "'"
		console.log(query);
		connection.query(query, function (err, res) {
			if (res.length > 0) {
				if (res[0].password == data.password) {
					socket.emit('loginResult', {status: 1, message: "login success", username: res[0].username, userID: res[0].id, password: res[0].password})
					socket.userID = res[0].id
					socketArray.push(socket)
				} else {
					socket.emit('loginResult', {status: 2, message: "wrong password"})
				}
			} else {
				socket.emit('loginResult', {status: 3, message: "no user"})
			}
		})
	});
	
	socket.on('register', function (data) {
		var query = "select * from user where username = '" + data.username + "'"
		connection.query(query, function (err, res) {
			console.log(res)
			if (res.length > 0) {
				console.log("username used")
				socket.emit('registerResult', {status: 2, message: "username used"})
			} else {
				query = "insert into user(username, password) values('"+data.username+"','"+data.password+"')"
				connection.query(query, function(err, res2) {
					if (res2) {
						console.log("success")
						socket.emit('registerResult', {status: 1, message: "success"})
					} else {
						socket.emit('registerResult', {status: 3, message: "failure"})
					}
				})
			}
		})
	});
	
	socket.on('search', function (data) {
		var query = "select * from user where username = '" + data.username + "'"
		connection.query(query, function (err, res) {
			if (res.length > 0) {
				var array = new Array()
				for (var i = 0; i < res.length; i++) {
					array.push({id: res[i].id, username: res[i].username})
				}
				socket.emit('searchResult', {status: 1, message: "", data: array})
			} else {
				socket.emit('searchResult', {status: 2, message: "no user with this name"})
			}
		})
	})
	
	socket.on('addFriendRequest', function(data) {
		var query = "insert into friend(id1, id2, username1, username2) values('"+data.id1+"','"+data.id2+"','"+data.username1+"','"+data.username2+"')"
		console.log(query)
		connection.query(query, function(err, res) {
			if (err) {
				console.log(err)
			} else {
				query = "insert into friend(id1, id2, username1, username2) values('"+data.id2+"','"+data.id1+"','"+data.username2+"','"+data.username1+"')"
				connection.query(query, function(err, res) {
					if (err) {
						console.log(err)
					} else {
						socket.emit('addFriendRequestResult', {status: 1, message: "add friend Requset added"})
					}
				})
			}
		})
	})
	
	socket.on('addFriendConfirm', function(data) {
		var query = "update friend set status = 'comfirmed' where (id1 = '"+data.id1+"' and id2 = '"+data.id2+"') or (id1 = '"+data.id2+"' and id2 = '"+data.id1+"')"
		console.log(query)
		connection.query(query, function(err, res) {
			if (err) {
				console.log(err)
			} else {
				socket.emit('addFriendConfirmResult', {status: 1, message: "add friend confirm success"})
			}
		})
	})
	
	socket.on('friendList', function(data) {
		var query = "select * from friend where id1 = "+data.id
		console.log(query)
		connection.query(query, function(err, res) {
			// console.log(res)
			if (res.length > 0) {
				var array = new Array()
				for (var i = 0; i < res.length; i++) {
					array.push({id: res[i].id2, username: res[i].username2})
				}
				console.log(array)
				socket.emit('friendListResult', {status: 1, message: "", data: array})
			} else {
				socket.emit('friendListResult', {status: 2, message: "no friend"})
			}
		})
	})
	
	socket.on('messageC2S', function(data) {
		var query = "insert into message(sender_id, reciver_id, content, type) values("+data.senderID+","+ data.reciverID+",'"+ data.content+"','"+ data.type+"')"
		console.log(query)
		connection.query(query, function (err, res) {
			if (err) {
				console.log(err)
			} else {
				socket.emit('messageStoreResult', {data: 'success'})
			}
		})
		var flag = false
		for (var i = 0; i < socketArray.length; i++) {
			console.log(socketArray[i].userID)
			if (socketArray[i].userID == data.reciverID) {
				socketArray[i].emit('messageS2C', {message: data.content})
				socket.emit('messageSendResult', {status: 1, message: "success"})
				flag = true
			}
		}
		if (flag == false) {
			socket.emit('messageSendResult', {status: 2, message: "reciver offline"})
		}
	})
});