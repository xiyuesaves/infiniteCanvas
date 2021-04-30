const express = require('express');
let app = express();
app.use(express.static('public'));
const server = require('http').Server(app);
const io = require('socket.io')(server)

const point = 3399;
console.log(`服务已启动,正在监听${point}`)
server.listen(point);

let userId = [];
let userNum = 0;

io.on('connection', (socket) => {
    console.log("new user content")
    socket.emit('hello', {id:userNum});
    userNum++
    ;
    socket.on('msg', (data) => {
        console.log("msg",data);
    });
});