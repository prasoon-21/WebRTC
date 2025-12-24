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

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();
const meetings = new Map(); // roomId -> { hostEmail, expiryTime, status, participants: [], lastHostDisconnect }

const EXPIRY_TIME = 60 * 60 * 1000; // 1 hour
const GRACE_PERIOD = 30 * 1000; // 30 seconds

io.on('connection', (socket) => {
    console.log(`[SERVER] Connected: ${socket.id}`);

    socket.on('join-room', (data) => {
        const { roomId, emailId } = data;

        let meeting = meetings.get(roomId);

        // 1. Check if meeting exists and is expired
        if (meeting && meeting.status === 'expired') {
            // Allow host to "reactivate" a meeting they created
            if (meeting.hostEmail === emailId) {
                console.log(`[SERVER] Host ${emailId} reactivating Meeting ${roomId}`);
                meeting.status = 'active';
                meeting.expiryTime = Date.now() + EXPIRY_TIME;
                meeting.lastHostDisconnect = null;
            } else {
                return socket.emit('join-error', { message: 'This meeting has expired or already ended.' });
            }
        }

        // 2. Room capacity check (Max 2)
        if (meeting && meeting.status === 'active' && meeting.participants.length >= 2) {
            // Check if this is a participant re-joining
            const isRejoining = meeting.participants.includes(socket.id);
            if (!isRejoining) {
                return socket.emit('join-error', { message: 'Room is full (max 2 participants).' });
            }
        }

        console.log(`[SERVER] Join Room: User ${emailId} -> Room ${roomId}`);

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
            console.log(`[SERVER] New Meeting Created. Host: ${emailId}`);
        }

        // If host returns, clear grace period
        if (meeting.hostEmail === emailId) {
            meeting.lastHostDisconnect = null;
            console.log(`[SERVER] Host ${emailId} is back in Room ${roomId}`);
        }

        if (!meeting.participants.includes(socket.id)) {
            meeting.participants.push(socket.id);
        }

        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);

        socket.join(roomId);

        console.log(`[SERVER] Emitting joined-room to ${socket.id}`);
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
        console.log(`[SERVER] Disconnected: ${emailId || socket.id}`);

        meetings.forEach((meeting, roomId) => {
            if (meeting.participants.includes(socket.id)) {
                meeting.participants = meeting.participants.filter(pid => pid !== socket.id);

                // If the host disconnected, mark the time for grace period
                if (meeting.hostEmail === emailId) {
                    console.log(`[SERVER] Host ${emailId} disconnected from ${roomId}. Starting 30s grace period.`);
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

// Periodic Expiry & Grace Period Check
setInterval(() => {
    const now = Date.now();
    meetings.forEach((meeting, roomId) => {
        if (meeting.status === 'active') {
            // 1. One-hour hard expiry
            if (now > meeting.expiryTime) {
                console.log(`[SERVER] Meeting ${roomId} expired after 1 hour.`);
                meeting.status = 'expired';
                io.to(roomId).emit('room-closed', { reason: 'Meeting time has expired (1 hour limit).' });
            }
            // 2. 30-second host grace period
            if (meeting.lastHostDisconnect && (now - meeting.lastHostDisconnect > GRACE_PERIOD)) {
                console.log(`[SERVER] Host failed to reconnect to ${roomId} within 30s. Closing Room.`);
                meeting.status = 'expired';
                io.to(roomId).emit('room-closed', { reason: 'Host has left the meeting.' });
            }
        }
    });
}, 2000);

const PORT = 8001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Signaling Server running on http://127.0.0.1:${PORT}`);
});
