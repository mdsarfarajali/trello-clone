require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/cards', require('./routes/cards'));

app.get('/', (req, res) => res.json({ message: 'Trello Clone API is running!' }));

// Socket.IO real-time events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinBoard', (boardId) => {
        socket.join(`board:${boardId}`);
        console.log(`Socket ${socket.id} joined board:${boardId}`);
    });

    socket.on('leaveBoard', (boardId) => {
        socket.leave(`board:${boardId}`);
    });

    // Card events
    socket.on('cardMoved', (data) => {
        socket.to(`board:${data.boardId}`).emit('cardMoved', data);
    });
    socket.on('cardCreated', (data) => {
        socket.to(`board:${data.boardId}`).emit('cardCreated', data);
    });
    socket.on('cardUpdated', (data) => {
        socket.to(`board:${data.boardId}`).emit('cardUpdated', data);
    });
    socket.on('cardDeleted', (data) => {
        socket.to(`board:${data.boardId}`).emit('cardDeleted', data);
    });

    // List events
    socket.on('listCreated', (data) => {
        socket.to(`board:${data.boardId}`).emit('listCreated', data);
    });
    socket.on('listUpdated', (data) => {
        socket.to(`board:${data.boardId}`).emit('listUpdated', data);
    });
    socket.on('listDeleted', (data) => {
        socket.to(`board:${data.boardId}`).emit('listDeleted', data);
    });
    socket.on('listsReordered', (data) => {
        socket.to(`board:${data.boardId}`).emit('listsReordered', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.set('io', io);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
