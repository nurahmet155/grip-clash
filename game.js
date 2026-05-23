/*
GRIP CLASH — ONLINE 1v1 VERSION (REAL MULTIPLAYER)
Stack:
- Node.js + Express
- Socket.IO (real-time multiplayer)
- Simple HTML client

HOW IT WORKS:
- Players join a room code
- Server matches 2 players
- Each tap sends event to server
- Server syncs score in real time
*/

// =======================
// SERVER (server.js)
// =======================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { p1: null, p2: null, score1: 0, score2: 0 };
    }

    let room = rooms[roomId];

    if (!room.p1) room.p1 = socket.id;
    else room.p2 = socket.id;

    io.to(roomId).emit('state', room);
  });

  socket.on('tap', (roomId) => {
    let room = rooms[roomId];
    if (!room) return;

    if (socket.id === room.p1) room.score1 += 1;
    if (socket.id === room.p2) room.score2 += 1;

    io.to(roomId).emit('state', room);

    if (room.score1 >= 100 || room.score2 >= 100) {
      io.to(roomId).emit('gameOver', {
        winner: room.score1 > room.score2 ? 'p1' : 'p2'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});


// =======================
// CLIENT (public/index.html)
// =======================

/*
<!DOCTYPE html>
<html>
<head>
  <title>Grip Clash Online</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <style>
    body { font-family: Arial; text-align: center; background:#111; color:white; }
    button { font-size:30px; padding:40px; border-radius:50%; margin-top:40px; }
  </style>
</head>
<body>

<h1>GRIP CLASH ONLINE</h1>

<input id="room" placeholder="Room ID" />
<button onclick="join()">Join</button>

<h2 id="status">Waiting...</h2>
<h3 id="score">0 - 0</h3>

<button onclick="tap()">TAP</button>

<script>
const socket = io();
let roomId = null;

function join() {
  roomId = document.getElementById('room').value;
  socket.emit('joinRoom', roomId);
}

socket.on('state', (room) => {
  document.getElementById('score').innerText = room.score1 + ' - ' + room.score2;
  document.getElementById('status').innerText = 'Fighting...';
});

socket.on('gameOver', (data) => {
  document.getElementById('status').innerText = 'Game Over: ' + data.winner;
});

function tap() {
  socket.emit('tap', roomId);
}
</script>

</body>
</html>
*/
