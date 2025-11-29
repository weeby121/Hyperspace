const express = require('express');
const cors = require('cors');
const {Server} = require('socket.io');
const http = require('http');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from anywhere (for now)
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 1. User Joins a specific Board (Room)
  socket.on('join-board', (boardId) => {
    socket.join(boardId);
    console.log(`User ${socket.id} joined board: ${boardId}`);
  });

  // 2. User moves mouse -> Broadcast to room
  socket.on('cursor-move', (data) => {
    // data = { boardId, x, z, userId, color }
    // Broadcast to everyone else in the room EXCEPT the sender
    socket.to(data.boardId).emit('cursor-update', data);
  });

  // 3. Cleanup when user leaves
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001; // Use Cloud's port OR 3001 if local
server.listen(PORT, () => {
  console.log(`Microservice running on port ${PORT}`);
});



