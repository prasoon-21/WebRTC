require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Root route to prevent "Cannot GET /" and confirm server is live
app.get('/', (req, res) => {
    res.send('<h1>Binary Asesino: Secure Signaling Server is Online</h1><p>This is the backend. Use the client application to start a call.</p>');
});

// Privacy Setting: Use environment variable, fallback to false (secure by default)
const LOGGING_ENABLED = process.env.LOGGING_ENABLED === 'true';

function privateLog(message, isSensitive = false) {
    if (!LOGGING_ENABLED) return;
    if (isSensitive) {
        console.log(`[SECURE-NODE] ${message.replace(/./g, (c, i) => i < 10 ? c : '*')}`); // Obfuscate sensitive info
    } else {
        console.log(`[SERVER] ${message}`);
    }
}

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();
const meetings = new Map(); // roomId -> { hostEmail, expiryTime, status, participants: [], lastHostDisconnect }

const EXPIRY_TIME = 60 * 60 * 1000; // 1 hour
const GRACE_PERIOD = 30 * 1000; // 30 seconds

io.on('connection', (socket) => {
    privateLog(`Connected: ${socket.id.substring(0, 5)}...`);

    socket.on('join-room', (data) => {
        const { roomId, emailId } = data;

        let meeting = meetings.get(roomId);

        // 1. Check if meeting exists and is expired
        if (meeting && meeting.status === 'expired') {
            if (meeting.hostEmail === emailId) {
                privateLog(`Host reactivating session`);
                meeting.status = 'active';
                meeting.expiryTime = Date.now() + EXPIRY_TIME;
                meeting.lastHostDisconnect = null;
            } else {
                return socket.emit('join-error', { message: 'This meeting has expired or already ended.' });
            }
        }

        // 2. Room capacity check (Max 2)
        if (meeting && meeting.status === 'active' && meeting.participants.length >= 2) {
            const isRejoining = meeting.participants.includes(socket.id);
            if (!isRejoining) {
                return socket.emit('join-error', { message: 'Room is full (max 2 participants).' });
            }
        }

        privateLog(`User joined room pool`);

        // Create meeting if it doesn't exist
        if (!meeting) {
            meeting = {
                hostEmail: emailId,
                expiryTime: Date.now() + EXPIRY_TIME,
                status: 'active',
                participants: [],
                lastHostDisconnect: null
            };
            meetings.set(roomId, meeting);
            privateLog(`New encrypted session created`);
        }

        if (meeting.hostEmail === emailId) {
            meeting.lastHostDisconnect = null;
        }

        if (!meeting.participants.includes(socket.id)) {
            meeting.participants.push(socket.id);
        }

        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);

        socket.join(roomId);

        socket.emit('joined-room', { roomId });
        socket.broadcast.to(roomId).emit('user-joined', { emailId, socketId: socket.id });
    });

    socket.on('offer', (data) => {
        const { to, offer } = data;
        socket.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', (data) => {
        const { to, answer } = data;
        socket.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;
        socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
        const emailId = socketToEmailMapping.get(socket.id);

        meetings.forEach((meeting, roomId) => {
            if (meeting.participants.includes(socket.id)) {
                meeting.participants = meeting.participants.filter(pid => pid !== socket.id);

                if (meeting.hostEmail === emailId) {
                    privateLog(`Host left. Starting grace period.`);
                    meeting.lastHostDisconnect = Date.now();
                }
            }
        });

        if (emailId) {
            emailToSocketMapping.delete(emailId);
            socketToEmailMapping.delete(socket.id);
        }
    });
});

// Periodic Expiry Check
setInterval(() => {
    const now = Date.now();
    meetings.forEach((meeting, roomId) => {
        if (meeting.status === 'active') {
            if (now > meeting.expiryTime) {
                meeting.status = 'expired';
                io.to(roomId).emit('room-closed', { reason: 'Meeting time has expired (1 hour limit).' });
            }
            if (meeting.lastHostDisconnect && (now - meeting.lastHostDisconnect > GRACE_PERIOD)) {
                meeting.status = 'expired';
                io.to(roomId).emit('room-closed', { reason: 'Host has left the meeting.' });
            }
        }
    });
}, 5000);

const PORT = process.env.PORT || 8001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[BINARY-ASESINO] Secure Signaling Online on Port ${PORT}`);
});

