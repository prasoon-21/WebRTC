const express = require('express');
// const {} = require('body-parser');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');


const io = new Server({
    cors: {
        origin: '*', 
        methods: ['GET', 'POST']
    }
});
const app = express();

app.use(bodyParser.json());
 
const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on('connection', (socket) => {
    console.log("New client connected ", socket.id);
    socket.on('join', (data) => {
         if (!data || !data.roomId || !data.emailId) {
        console.error("Invalid data received for 'join' event:", data);
        return;
    }
        const {roomId, emailId} = data;
        console.log("User ", emailId, " joined room ", roomId);
        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);
        socket.join(roomId);
        socket.emit('Joined Room', {roomId})
        socket.broadcast.to(roomId).emit('user-joined', emailId);
    });
    socket.on('Call-user', (data) => {
        const {emailId, offer} = data;
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToSocketMapping.get(emailId);
        socket.to (socketId).emit ('Incoming-call', {from: fromEmail, offer});
});


app.listen(8000, () => console.log("Server is runningat PORT 8000"));
io.listen(8001);