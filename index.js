const express = require('express');
let app = express();
app.use(express.static('public'));
app.use('/cookies.js', express.static('node_modules/js-cookie/src/js.cookie.js'));
const server = require('http').Server(app);
const io = require('socket.io')(server);
//sqlite3数据库
const sqlite3 = require("sqlite3");
// 链接数据库
const db = new sqlite3.Database("main.db");


const point = 3399;
console.log(`服务已启动,正在监听${point}`)
server.listen(point);

let userId = [];
let userNum = 0;

io.on('connection', (socket) => {
    console.log("new user content")
    socket.on('msg', (data) => {
        console.log("msg",data);
    });
    socket.on("newPlayer", function (data) {
        console.log("新玩家加入",data.name)

    })
});