const express = require('express');
let app = express();
app.use(express.static('/public'));
const server = require('http').Server(app);
const io = require('socket.io')(server)

server.listen(3399);
// 警告：app.listen(80)在这里没起作用，可能有端口被占用情况

io.on('connection', (socket) => {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
        console.log(data);
    });
});