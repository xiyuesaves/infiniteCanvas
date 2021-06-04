const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

const { v4: uuidv4 } = require('node-uuid');

const db = require('better-sqlite3')('main.db');

// http服务端口
const point = 3399;
const roomList = ["test"]
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
        let getRoom = db.prepare("SELECT * FROM canvas WHERE canvasName = ?").get(roomName)
        if (getRoom) {
            console.log(`进入房间${roomName}`)
            res.sendFile(`${__dirname}/public/room/index.html`);
        } else {
            let userInfo = db.prepare("SELECT uuid FROM user WHERE cookie = ?").get(req.cookies.user)
            if (userInfo) {
                console.log("询问是否创建")
                res.sendFile(`${__dirname}/public/errPage/newRoom.html`);
            } else {
                console.log(`没有找到房间${roomName}`)
                res.sendFile(`${__dirname}/public/errPage/notFoundRoom.html`);
            }
        }
    });

    // 获取房间信息
    app.post('/room/*', function(req, res, next) {
        let pathArr = req.path.split("/")
        let roomName = pathArr[pathArr.length - 1]
        let roomInfo = db.prepare("SELECT canvasId,createUserId,password FROM canvas WHERE canvasName = ?").get(roomName)
        let userInfo = db.prepare("SELECT * FROM user WHERE cookie = ?").get(req.cookies.user)
        // 用户身份验证
        if (userInfo) {
            // 房间是否存在
            if (roomInfo) {
                let roomUserList = db.prepare("SELECT * FROM canvas_user WHERE canvasId = ?").all(roomInfo.canvasId)
                console.log("进入房间", roomName)
                console.log("房间信息", roomInfo)
                console.log("用户信息", userInfo)
                console.log("房间用户列表", roomUserList)
                let inRoom = false
                for (var i = 0; i < roomUserList.length; i++) {
                    if (roomUserList[i].userId === userInfo.uuid) {
                        inRoom = true
                        break
                    }
                }
                // 是否已加入房间
                if (inRoom) {
                    console.log("已经在房间中")
                    res.send({ status: true, userList: roomUserList})
                } else if (roomInfo.password) { // 房间是否加密
                    console.log("加密房间")
                    // 验证密码
                    if (req.body.password === roomInfo.password) {
                        console.log("密码通过,加入房间")
                        roomUserList = addRoom()
                        res.send({ status: true, userList: roomUserList})
                    } else {
                        console.log("密码错误")
                        res.send({ status: false, code: 1 })
                    }
                } else {
                    console.log("普通房间")
                    roomUserList = addRoom()
                    res.send({ status: true, userList: roomUserList})
                }
                // 新加入用户
                function addRoom() {
                    let insert = db.prepare("INSERT INTO canvas_user (canvasId,userId,joinDate,online) VALUES (?,?,?,?)").run(roomInfo.canvasId, userInfo.uuid, new Date().getTime(), 1)
                    return db.prepare("SELECT * FROM canvas_user WHERE canvasId = ?").all(roomInfo.canvasId)
                }
            } else {
                console.log("访问房间不存在,重置cookie值")
                // 返回房间不存在,并重置其账户cookie强制重新登录
                res.send({ status: false, code: 0 })
                let userSession = uuidv4()
                db.prepare("UPDATE user SET cookie = ? WHERE uuid = ?").run(userSession, userInfo.uuid)
            }
        } else {
            console.log("没有登录")
            res.status(403);
        }
    });

    // 处理错误地址
    app.get('/*', function(req, res) {
        console.log("错误地址请求", req.path)
        res.sendFile(`${__dirname}/public/errPage/errImg/404.png`)
    });

    // 处理cookie登录
    app.post('/loginCookie', async function(req, res) {
        // console.log("cookie登录", req.cookies.user)
        if (req.cookies.user) {
            let userInfo = db.prepare("SELECT uuid FROM user WHERE cookie = ?").get(req.cookies.user)
            if (userInfo) {
                // console.log("cookie登录成功")
                res.send({ status: true, userInfo: { name: userInfo.userName, id: userInfo.userId } });
            } else {
                // console.log("cookie登录失败")
                res.send({ status: false, code: 1 });
            }
        } else {
            // console.log("cookie登录失败")
            res.send({ status: false, code: 0 });
        }
    });

    // 处理登录请求
    app.post('/login', async function(req, res) {
        console.log("用户登录", JSON.stringify(req.body))
        if (req.body.name && req.body.password) {
            let userInfo = db.prepare("SELECT * FROM user WHERE userName = ? AND password = ?").get(req.body.name, req.body.password)
            if (userInfo) {
                let userSession = uuidv4()
                res.cookie("user", userSession, { maxAge: new Date("Fri, 31 Dec 9999 23:59:59 GMT").getTime() })
                res.send({ status: true, userInfo: { name: userInfo.userName, id: userInfo.uuid } });
                db.prepare("UPDATE user SET cookie = ? WHERE uuid = ?").run(userSession, userInfo.uuid)
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
            let checkName = db.prepare("SELECT * FROM user WHERE userName = ?").get(req.body.name)
            if (!checkName) {
                let userSession = uuidv4()
                let userInfo = db.prepare("SELECT * FROM user").all()
                let insert = db.prepare("INSERT INTO user (userName,password,createDate,invitationCode,authority,cookie) VALUES (?,?,?,?,?,?)").run(req.body.name, req.body.password, new Date().getTime(), req.body.invitationCode, "user", userSession)
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