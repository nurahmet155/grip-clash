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