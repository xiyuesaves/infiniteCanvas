const express = require('express');
let app = express();
app.use(express.static('public'));
const server = require('http').Server(app);
const io = require('socket.io')(server)

server.listen(3399);

io.on('connection', (socket) => {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
        console.log(data);
    });
});