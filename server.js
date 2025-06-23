const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const Message = require('./models/Message'); // Make sure this path is correct

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// In-memory map of users: username -> socketId
const users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (username) => {
    users[username] = socket.id;
    console.log(`Registered: ${username} with socket ID ${socket.id}`);
  });

  socket.on('private_message', async ({ sender, receiver, content }) => {
    const receiverSocket = users[receiver];
    if (!receiverSocket) {
      console.log(`User ${receiver} not found.`);
      return;
    }

    // Save message to DB
    const msg = new Message({ sender, receiver, content });
    await msg.save();

    // Emit message to receiver
    io.to(receiverSocket).emit('private_message', { sender, content });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up disconnected user
    for (let [username, id] of Object.entries(users)) {
      if (id === socket.id) {
        delete users[username];
        break;
      }
    }
  });
});

server.listen(5005, () => {
  console.log('Server running on port 5005');
});
