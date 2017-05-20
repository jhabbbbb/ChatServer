var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(12345);

var mysql = require('mysql');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'im.jin.com',
    database:'LoveChat',
    port: 3306
});
conn.connect();


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

var socketList = new Array();

io.on('connection', function (socket) {
  console.log(socket.id);
  socket.emit('handShake', { message: 'hello client' });


  // {
  //   username:
  //   password:
  // }
  socket.on('login', function(data) {
    console.log(data);
    socket.username = data.username;
    socketList.push(socket);
    var query = "select * from User where username = '" + data.username + "'";
    console.log(query);
    conn.query(query, function(err, rows) {
      var flag = false;
      for (var i in rows) {
        if (rows[i].password == data.password) {
          flag = true;
          socket.emit('loginResult', {result: "success"});
          break;
        }
      }
      if (flag == false){
        socket.emit('loginResult', {result: "failure"});
      }

    });
  });

  // {
  //   username:
  //   password:
  // }
  socket.on('register', function(data) {
    console.log(data);
    var query = 'insert into User(username, password) values("'+ data.username + '","' + data.password + '")';
    conn.query(query, function(err, res) {
      if (err) {
        console.log(err);
        socket.emit('registerResult', {result: "failure"});
      } else {
        socket.emit('registerResult', {result: "success"});
      }
    });
  });

  // {
  //   content:
  //   id:
  //   username:
  //   toUsername:
  //   toID:
  // }
  socket.on('sendMessageC2S', function (data) {
    console.log(data);
    var date = new Date();
    var query = "insert into Message(content, id, username, toUsername, toID, time) values("+ data.content + "," + data.id + "," + data.username + "," + data.toUsername + "," + data.toID + "," + date.getTime() + ")";
    console.log(query);
    conn.query(query, function(err, res) {});
    var flag = false;
    for (var i = 0; i < socketList.length; i++) {
      if (socketList[i].username == data.toUsername) {
        socketList[i].emit('sendMessageS2C', { message: data.message });
        socket.emit('sendMessageResult', {message: 'success'});
        flag = true;
        break;
      }
    }
    if (flag == false) {
      socket.emit('sendMessageResult', {message: 'failure'});
    }
  });


  // {
  //   username:
  // }
  socket.on('searchUser', function(data) {
    console.log(data);
    var query = "select * from User where username = '" + data.username + "'";
    console.log(query);
    conn.query(query, function(err, rows) {
      socket.emit('searchUserResult', {result: rows});
    });
  });

  // {
  //   id:
  //   friendID:
  // }
  socket.on('addFriend', function(data) {
    console.log(data);
    var query = "insert into Friend(id1, id2) values("+ data.id + "," + data.friendID + "), (" + data.friendID + "," + data.id + ")";
    console.log(query);
    conn.query(query, function(err, rows) {
      socket.emit('addFriendResult', {result: "success"});
    });
  });


  // {
  //   id:
  // }
  socket.on('friendList', function(data) {
    console.log(data);
    var query = "select * from Friend where id1 = '" + data.id + "'";
    console.log(query);
    conn.query(query, function(err, rows) {
      var query2 = "select * from User where";
      for (var i in rows) {
        query2 += "id = " + rows[i].id2;
        if (i < rows.length-1) {
          query2 += "OR";
        }
      }
      console.log(query2);
      conn(query2, function(err, rows) {
        socket.emit('friendListResult', {result: rows});
      });
    });
  });

});




// {
//   id:
//   type
//   message:
//   toID:
// }