const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

const { v4: uuidv4 } = require('uuid');

const db = require('better-sqlite3')('main.db');

// http服务端口
const point = 3399;

// 处理http服务
function startHttpServer() {
    // 加入中间键
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    // 返回正确文件地址
    app.get('/axios.js', function(req, res) {
        res.sendFile(`${__dirname}/node_modules/axios/dist/axios.js`);
    });
    app.get('/cookies.js', function(req, res) {
        res.sendFile(`${__dirname}/node_modules/js-cookie/src/js.cookie.js`);
    });

    // 处理错误地址
    app.get('/room', function(req, res) {
        // res.redirect(302, '/');
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 使用内置中间键托管静态文件
    app.use(express.static('public'));

    // 处理错误地址
    app.get('/room/*/*', function(req, res) {
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 进入绘画房间
    app.get('/room/*', function(req, res) {
        const roomName = req.path.replace(/\/room\//, "");
        if (roomList.indexOf(roomName) !== -1) {
            console.log(`进入房间${roomName}`)
            res.sendFile(`${__dirname}/public/room/index.html`);
        } else {
            console.log(`没有找到房间${roomName}`)
            res.sendFile(`${__dirname}/public/errPage/notFoundRoom.html`);
        }
    });

    // 处理错误地址
    app.get('/*', function(req, res) {
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 处理cookie登录
    app.post('/loginCookie', async function(req, res) {
        console.log(JSON.stringify(req.body))
        if (req.body.cookie) {
            let userInfo = db.prepare("SELECT * FROM user WHERE userName = ? AND password = ?").get(req.body.cookie)
            if (userInfo) {
                res.send({ status: true, userInfo: { name: userInfo.userName, id: userInfo.userId } });
            } else {
                res.send({ status: false, code: 1 });
            }
        } else {
            res.send({ status: false, code: 0 });
        }
    });

    // 处理登录请求
    app.post('/login', async function(req, res) {
        console.log(JSON.stringify(req.body))
        if (req.body.name && req.body.password) {
            let userInfo = db.prepare("SELECT * FROM user WHERE userName = ? AND password = ?").get(req.body.name, req.body.password)
            if (userInfo) {
                let userSession = uuidv4()
                res.cookie("user", userSession, { maxAge: new Date("Fri, 31 Dec 9999 23:59:59 GMT").getTime() })
                res.send({ status: true, userInfo: { name: userInfo.userName, id: userInfo.userId } });
                db.prepare("UPDATE user SET cookieId = ? WHERE userId = ?").run(userSession, userInfo.userId)
            } else {
                res.send({ status: false, code: 1 });
            }
        } else {
            res.send({ status: false, code: 0 });
        }
    });

    // 处理注册请求
    app.post('/registered', async function(req, res) {
        if (req.body.name && req.body.password && req.body.key) {
            let checkName = db.prepare("SELECT * FROM user WHERE userName = ?").get(req.body.name)
            if (!checkName) {
                let userSession = uuidv4()
                let insert = db.prepare("INSERT INTO user (userName,createTime,password,cookieId) VALUES (?,?,?,?)").run(req.body.name, new Date().getTime().toString(), req.body.password, userSession)
                let userInfo = db.prepare("SELECT * FROM user WHERE userName = ?").get(req.body.name)
                res.cookie("user", userSession, { maxAge: new Date("Fri, 31 Dec 9999 23:59:59 GMT").getTime() })
                res.send({ status: true, userInfo: { name: userInfo.userName, id: userInfo.userId } });
            } else {
                res.send({ status: false, code: 1 });
            }
        } else {
            res.send({ status: false, code: 0 });
        }
    })

    server.listen(point);
    console.log(`服务已启动,正在监听${point}`)
}
startHttpServer()