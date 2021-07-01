const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

const { v4: uuidv4 } = require('node-uuid');

const db = require('better-sqlite3')('canvas.db');

// http服务端口
const point = 3399;
// 房间列表
const roomList = ["test"]
// 验证数据库
function verifyDatabase() {
    let tableNames = db.prepare('SELECT name FROM sqlite_master').all()
    let tableList = [
        "invitationCode",
        "message",
        "path",
        "room",
        "user"
    ]
    for (var i = 0; i < tableNames.length; i++) {
        tableList.splice(tableList.indexOf(tableNames[i].name), 1);
    }
    if (tableList.length) {
        console.log("正在初始化数据库")
        initDatabase(tableList)
    } else {
        console.log("数据库校验完成")
    }
}
verifyDatabase()

// 初始化数据库 -[弃用]
function initDatabase(tableList) {
    console.log("初始化数据库")
    for (var i = 0; i < tableList.length; i++) {
        switch (tableList[i]) {
            case "invitationCode":
                db.prepare('CREATE TABLE "invitationCode" (  "invitation_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,  "invitation_code" text NOT NULL,  "create_id" integer NOT NULL,  "create_date" text NOT NULL,  "use_id" integer,  "use_date" text);').run()
                break
            case "message":
                db.prepare('CREATE TABLE "message" (  "msg_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,  "canvas_id" integer NOT NULL,  "user_id" integer NOT NULL,  "content" text NOT NULL);').run()
                break
            case "path":
                db.prepare('CREATE TABLE "path" (  "path_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,  "canvas_id" integer NOT NULL,  "user_id" integer NOT NULL,  "path_data" TEXT NOT NULL);').run()
                break
            case "room":
                db.prepare('CREATE TABLE "room" (  "canvas_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,  "canvas_name" text NOT NULL,  "create_user_id" text NOT NULL,  "create_date" text NOT NULL,  "password" text);').run()
                break
            case "user":
                db.prepare('CREATE TABLE "user" (  "user_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,  "user_name" text NOT NULL,  "password" text NOT NULL,  "create_date" text NOT NULL,  "cookie" text);').run()
                break
        }
    }
}

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
    app.get('/uuid.js', function(req, res) {
        res.sendFile(`${__dirname}/node_modules/node-uuid/uuid.js`);
    });
    app.get('/pixi.js', function(req, res) {
        res.sendFile(`${__dirname}/node_modules/pixi.js/dist/browser/pixi.js`);
    });

    // 处理错误地址
    app.get('/room', function(req, res) {
        // res.redirect(302, '/');
        console.log("错误地址请求", req.path)
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 使用内置中间键托管静态文件
    app.use(express.static('public'));

    // 处理错误地址
    app.get('/room/*/*', function(req, res) {
        console.log("错误地址请求", req.path)
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 进入绘画房间
    app.get('/room/*', function(req, res) {
        const roomName = req.path.replace(/\/room\//, "");
        let getRoom = db.prepare("SELECT * FROM room WHERE canvas_name = ?").get(roomName)
        if (getRoom) {
            console.log("访问房间地址", roomName)
            res.sendFile(`${__dirname}/public/room/index.html`);
        } else {
            console.log("没有找到房间", roomName)
            res.sendFile(`${__dirname}/public/errPage/notFoundRoom.html`);
        }
    });

    // 获取房间密码
    app.post('/room/*', function(req, res) {
        const checkUser = db.prepare("SELECT user_id FROM user WHERE cookie = ?").get(req.cookies.user)
        const reqData = req.body
        const roomName = req.path.replace(/\/room\//, "");
        const roomDetail = db.prepare("SELECT password,canvas_id FROM room WHERE canvas_name = ?").get(roomName)
        console.log(roomDetail)
        if (checkUser) {
            const userId = checkUser.user_id
            console.log("用户已登录",reqData)
            if (reqData.type === "enterRoom") {
                const roomId = db.prepare("SELECT room_id FROM room_user WHERE canvas_id = ? AND user_id = ?").get(roomDetail.canvas_id, userId)
                if (roomId) {
                    console.log("进入房间")
                    const sessionStr = uuidv4()
                    db.prepare("UPDATE user SET room_session = ? WHERE user_id = ?").run(sessionStr, userId)
                    res.cookie("room", sessionStr, { maxAge: new Date("Fri, 31 Dec 9999 23:59:59 GMT").getTime() })
                    res.send({ status: true, data: "enterSuccess" })
                } else {
                    console.log("需要加入房间")
                    res.send({ status: false, error: "notJoinRoom" })
                }
            } else if (reqData.type === "joinRoom") {
                if (roomDetail.password === reqData.password) {
                    console.log("密码正确")
                    const insert = db.prepare("INSERT INTO room_user (user_id,canvas_id,join_date) VALUES (?,?,?)").run(userId, roomDetail.canvas_id, new Date().getTime())
                    res.send({ status: true, data: "joinSuccess" })
                } else {
                    console.log("密码错误")
                    res.send({ status: false, error: "wrongPassword" })
                }
            }
        } else {
            console.log("拒绝请求")
            res.send({ status: false, error: "rejectRequest" })
        }
    })

    // 处理错误地址
    app.get('/*', function(req, res) {
        // console.log("错误地址请求", req.path)
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 判断cookie
    app.post('/loginCookie', async function(req, res) {
        if (req.cookies.user) {
            let userInfo = db.prepare("SELECT user_id FROM user WHERE cookie = ?").get(req.cookies.user)
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
        console.log("用户登录", JSON.stringify(req.body))
        if (req.body.name && req.body.password) {
            let userInfo = db.prepare("SELECT * FROM user WHERE user_name = ? AND password = ?").get(req.body.name, req.body.password)
            if (userInfo) {
                let userSession = uuidv4()
                res.cookie("user", userSession, { maxAge: new Date("Fri, 31 Dec 9999 23:59:59 GMT").getTime() })
                res.send({ status: true, userInfo: { name: userInfo.user_name, id: userInfo.user_id } });
                db.prepare("UPDATE user SET cookie = ? WHERE user_id = ?").run(userSession, userInfo.user_id)
            } else {
                res.send({ status: false, code: 1 });
            }
        } else {
            res.send({ status: false, code: 0 });
        }
    });

    // 处理注册请求
    app.post('/registered', async function(req, res) {
        if (req.body.name && req.body.password && req.body.invitationCode) {
            let checkName = db.prepare("SELECT * FROM user WHERE user_name = ?").get(req.body.name)
            if (!checkName) {
                let userSession = uuidv4()
                let insert = db.prepare("INSERT INTO user (user_name,password,create_date,cookie) VALUES (?,?,?,?)").run(req.body.name, req.body.password, new Date().getTime(), userSession)
                let getData = db.prepare("SELECT * FROM user WHERE user_name = ? AND password = ?").get(req.body.name, req.body.password)
                res.cookie("user", userSession, { maxAge: new Date("Fri, 31 Dec 9999 23:59:59 GMT").getTime() })
                res.send({ status: true, userInfo: { name: getData.user_name, id: getData.user_id } });
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