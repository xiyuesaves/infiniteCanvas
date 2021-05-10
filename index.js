const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
//sqlite3数据库
const sqlite3 = require("sqlite3");
// 链接数据库
const db = new sqlite3.Database("main.db");

// 封装异步sql方法
db.runSync = function(sql, arr) {
    return new Promise((resolve, reject) => {
        let param = arr || [];
        // console.log(sql, param)
        db.run(sql, param, function(err) {
            if(!err){
                resolve();
            } else {
                console.error(err);
            }
        });
    });
};
db.getSync = function(sql, arr) {
    return new Promise((resolve, reject) => {
        let param = arr || [];
        // console.log(sql, param)
        db.get(sql, param, function(err, data) {
            if (!err) {
                resolve(data);
            } else {
                console.error(err);
            };
        });
    });
};
db.allSync = function(sql, arr) {
    return new Promise((resolve, reject) => {
        let param = arr || [];
        // console.log(sql, param)
        db.all(sql, param, function(err, data) {
            if (!err) {
                resolve(data);
            } else {
                console.error(err);
            };
        });
    });
};

// 检查数据库是否需要初始化
async function initDatabase() {
    const dbData = await db.allSync('SELECT name FROM sqlite_master');
    let tableArr = [
        "canvas",
        "canvas_data",
        "user",
        "invitationCode",
        "message",
        "path_list"
    ];
    // 剔除已存在的数据库
    for (let i = dbData.length - 1; i >= 0; i--) {
        if (tableArr.indexOf(dbData[i].name) !== -1) {
            tableArr.splice(tableArr.indexOf(dbData[i].name), 1);
        };
    };
    // 恢复出错数据库
    if (tableArr.length) {
        console.log("数据库缺失", tableArr);
        console.log("正在修复");
        for (let i = 0; i < tableArr.length; i++) {
            switch (tableArr[i]) {
                case "canvas":
                    db.runSync(`CREATE TABLE "canvas" ("canvasName" TEXT,"canvasId" INTEGER,"createTime" TEXT,"isPrivate" TEXT);`);
                    break;
                case "canvas_data":
                    db.runSync(`CREATE TABLE "canvas_data" ("canvasId" TEXT,"userId" INTEGER);`);
                    break;
                case "user":
                    db.runSync(`CREATE TABLE "user" (  "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,  "userName" text,  "createTime" TEXT,  "cookieId" TEXT,  "password" TEXT,  "invitePeople" TEXT,  "invitationCode" TEXT);`);
                    break;
                case "invitationCode":
                    db.runSync(`CREATE TABLE "invitationCode" ("invitationCode" TEXT,"createUserId" TEXT,"usingUserId" TEXT);`);
                    break;
                case "message":
                    db.runSync(`CREATE TABLE "message" (  "msgId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,  "userName" TEXT,  "userId" INTEGER,  "content" TEXT,  "canvasId" INTEGER,  "time" TEXT,  "type" integer);`);
                    break;
                case "path_list":
                    db.runSync(`CREATE TABLE "path_list" (  "userId" integer,  "userName" TEXT,  "pathFile" TEXT,  "canvasId" INTEGER,  "disable" integer DEFAULT 0);`);
                    break;
            };
        };
        console.log("修复完成");
    }
    clearPathFile();
}
initDatabase();

// 整理路径数据
async function clearPathFile() {
    const dbData = await db.allSync('SELECT pathFile FROM path_list');
    let pathFile = fs.readdirSync("path/");
    for (let i = 0; i < dbData.length; i++) {
        if (pathFile.indexOf(dbData[i].pathFile) !== -1) {
            pathFile.splice(pathFile.indexOf(dbData[i].pathFile), 1);
        };
    };
    if (pathFile.length) {
        console.log(`清理无用路径文件，共${pathFile.length}条`);
        for (let i = 0; i < pathFile.length; i++) {
            fs.unlinkSync(`path/${pathFile[i]}`);
        };
    }
    startHttpServer()
};

// 邀请码[测试用]
const invitationCode = "xiyue";

// 画布id[测试用]
const canvasId = 0;

// 房间列表[测试用]
const roomList = ["xiyue", "test"];

// 储存用户临时路径
let userPath = {};

// http服务端口
const point = 3399;

function startHttpServer() {
    server.listen(point);
    console.log(`服务已启动,正在监听${point}`)
}

// 处理http服务

// 返回正确文件地址
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

let userList = [];

// socketio
io.on('connection', (socket) => {
    // 登录请求
    socket.on("login", async function(req) {
        console.log("用户登录");
        let dbData = await db.getSync("SELECT userName,userId FROM user WHERE user.userName = ? AND user.password = ?", [req.name, req.psw])
        if (dbData) {
            if (!checkId(dbData.userId)) {
                let cookieId = Buffer.from(`${dbData.userName}${new Date().getTime()}`).toString('base64');
                socket.emit("loginReturn", { status: true, cookieId: cookieId, name: dbData.userName, id: dbData.userId });
                updateCookieId(dbData.userId, cookieId);
                newUserAdd(dbData.userName, dbData.userId, cookieId);
            } else {
                // [修改]踢掉已上线的人
                console.log("登录失败,该账号已被登录");
                socket.emit("loginReturn", { status: false, code: 1 });
            }
        } else {
            console.log("登录失败,账号密码错误");
            socket.emit("loginReturn", { status: false, code: 0 });
        }
    });
    // cookie登录请求
    socket.on("cookieLogin", async function(data) {
        console.log("cookie登录", data)
        let dbData = await db.getSync("SELECT userName,userId,cookieId FROM user WHERE user.cookieId = ?", [data.cookie]);
        if (dbData) {
            if (!checkCookie(dbData.cookieId)) {
                socket.emit("loginReturn", { status: true, cookieId: dbData.cookieId, name: dbData.userName, id: dbData.userId });
                newUserAdd(dbData.userName, dbData.userId, dbData.cookieId);
            } else {
                // [修改]踢掉已上线的人
                console.log("cookie登录失败, 已经在其他地方登录");
                socket.emit("autoLoginReturn", { status: false, code: 2 });
            }
        } else {
            console.log("cookie已过期,登录失败");
            socket.emit("autoLoginReturn", { status: false, code: 0 });
        };
    });
    // 注册
    socket.on("registered", async function(data) {
        console.log("用户注册", data.name)
        let dbData = await db.getSync("SELECT userName FROM user WHERE user.userName = ?", [data.name]);
        if (!dbData) {
            if (data.invitationCode === invitationCode) {
                let createTime = new Date().getTime() + "";
                await db.runSync("INSERT INTO user (userName,createTime,password) VALUES (?,?,?)", [data.name, createTime, data.psw]);
                let userData = await db.getSync("SELECT userId,userName FROM user WHERE user.userName = ?", [data.name]);
                userData = userData.data
                let cookieId = Buffer.from(`${userData.userName}${new Date().getTime()}`).toString('base64');
                updateCookieId(userData.userId, cookieId);
                newUserAdd(userData.userName, userData.userId, cookieId);
                socket.emit("registeredReturn", { status: true, cookieId: cookieId, name: userData.userName, id: userData.userId });
            } else {
                console.log("注册失败,邀请码错误");
                socket.emit("registeredReturn", { status: false, err: 2 });
            }
        } else {
            console.log("注册失败,重名");
            socket.emit("registeredReturn", { status: false, err: 1 });
        }
    });
    // 判断用户名是否存在
    socket.on("checkName", async function(data) {
        let dbData = await db.getSync("SELECT userName FROM user WHERE user.userName = ?", [data.name]);
        if (dbData) {
            socket.emit("checkNameReturn", { status: true });
        } else {
            socket.emit("checkNameReturn", { status: false });
        }
    });
    // 断开连接
    socket.on("disconnect", function(data) {
        userDisconnect(socket);
    });
    // 登录之后的请求方法

    // 获取用户列表 [未完成多canvas]
    socket.on("getUserList", function(cookie) {
        if (checkCookie(cookie.cookie)) {
            let userListArr = [];
            for (let i = 0; i < userList.length; i++) {
                userListArr.push({
                    name: userList[i].userName,
                    userId: userList[i].userId
                });
            };
            socket.emit("returnUserList", userListArr);
        } else {
            console.log("没有通过检测 getUserList", cookie);
        };
    });
    // 获取历史消息 [未完成多canvas]
    socket.on("getHistoricalMessage", async function(cookie) {
        if (checkCookie(cookie.cookie)) {
            let dbData = await db.allSync("SELECT msgId,userName,content,time,type,userId FROM message WHERE message.canvasId = ?", [canvasId]);
            socket.emit("returnHistoricalMessage", dbData);
        } else {
            console.log("没有通过检测 getHistoricalMessage", cookie);
        };
    });
    // 收到信息 [未完成多canvas]
    socket.on("sendMsg", async function(data) {
        if (checkCookie(data.cookie)) {
            let userData = checkCookie(data.cookie);
            let sendTime = new Date().getTime() + "";
            await db.runSync("INSERT INTO message (userName,userId,content,canvasId,time,type) VALUES (?,?,?,?,?,?)", [userData.userName, userData.userId, data.content, 0, sendTime, 0]);
            sendMessage({ content: data.content, time: sendTime, type: 0, userId: userData.userId, userName: userData.userName });
            console.log(`${userData.userName} > ${data.content}`)
        } else {
            console.log("没有通过检测 sendMsg", data.userId);
        };
    });
    // 广播移动数据 [未完成多canvas]
    socket.on("pointMove", function(data) {
        if (checkCookie(data.cookie)) {
            let decodeData = {
                point: data.point,
                time: data.time,
                userId: checkCookie(data.cookie).userId
            };
            if (data.point.drag) {
                let brsuhMove = data.point.brushSize / 2;
                if (!userPath[`id${decodeData.userId}`].length) {
                    userPath[`id${decodeData.userId}`].push({
                        x: data.point.x + brsuhMove,
                        y: data.point.y + brsuhMove,
                        time: data.time,
                        color: data.point.color,
                        brushSize: data.point.brushSize,
                        tween: false
                    });
                } else {
                    userPath[`id${decodeData.userId}`].push({
                        x: data.point.x + brsuhMove,
                        y: data.point.y + brsuhMove,
                        tween: false
                    });
                };
            } else {
                if (userPath[`id${decodeData.userId}`].length) {
                    let time = userPath[`id${decodeData.userId}`][0].time
                    if (!fs.existsSync('path/')) {
                        console.log("创建路径存储目录");
                        fs.mkdirSync('path');
                    };
                    fs.writeFile(`path/${canvasId}-${decodeData.userId}-${time}`, JSON.stringify(userPath[`id${decodeData.userId}`]), async function(err) {
                        if (!err) {
                            await db.runSync("INSERT INTO path_list (userId,userName,pathFile,canvasId) VALUES (?,?,?,?)", [decodeData.userId, checkId(decodeData.userId).userName, `${canvasId}-${decodeData.userId}-${time}`, canvasId]);
                            // await db.runSync("DELETE FROM path_list WHERE disable = 1 AND userId = ?", [decodeData.userId]); [需要单独分离出去]
                        } else {
                            console.log("写入失败", err);
                            sendMessage({ content: "写入路径文件失败,请联系管理员", time: 0, type: 1, userId: 0, userName: "root", only: true });
                        };
                    });
                    userPath[`id${decodeData.userId}`] = new Array();
                };
            };
            socket.broadcast.emit("otherPlayer", decodeData);
        } else {
            console.log("没有通过检测 pointMove", data);
        };
    });
    // 获取历画布数据
    socket.on("getHistoricalPath", async function(data) {
        if (checkCookie(data.cookie)) {
            let dbData = await db.allSync("SELECT * FROM path_list WHERE path_list.canvasId = ? AND path_list.disable = 0", [canvasId]);
            for (let i = 0; i < dbData.length; i++) {
                let tempJson = [];
                try {
                    tempJson = JSON.parse(fs.readFileSync(`path/${dbData[i].pathFile}`).toString());
                } catch (err) {
                    console.log("读取路径时出现错误", err);
                    sendMessage({ content: `无法加载路径${dbData[i].pathFile}`, time: 0, type: 1, userId: 0, userName: "root" });
                };
                dbData[i].path = tempJson;
            };
            socket.emit("returnHistoricalPath", dbData);
        } else {
            console.log("没有通过检测 getHistoricalPath", data);
        };
    });
    // 撤回
    socket.on("withdraw", async function(data) {
        if (checkCookie(data.cookie)) {
            // 撤回该用户发送的此条路径
            let pathFile = `${canvasId}-${checkCookie(data.cookie).userId}-${data.time}`;
            console.log(`撤回${pathFile}`);
            await db.runSync("UPDATE path_list SET disable = ? WHERE pathFile = ?", [1, pathFile]);
            socket.broadcast.emit("userWithdraw", { userId: checkCookie(data.cookie).userId });
        } else {
            console.log("没有通过检测 withdraw", data)
        }
    })
    // 重做
    socket.on("redo", async function(data) {
        if (checkCookie(data.cookie)) {
            let pathFile = `${canvasId}-${checkCookie(data.cookie).userId}-${data.time}`;
            console.log(`重做${pathFile}`);
            await db.runSync("UPDATE path_list SET disable = ? WHERE pathFile = ?", [0, pathFile]);
            let pathList = JSON.parse(fs.readFileSync(`path/${pathFile}`).toString());
            socket.broadcast.emit("userRedo", { userId: checkCookie(data.cookie).userId, path: pathList });
        } else {
            console.log("没有通过检测 redo", data)
        }
    })
    // 获取服务端重做列表
    socket.on("getRedoPath", async function(data) {
        if (checkCookie(data.cookie)) {
            let dbData = await db.allSync("SELECT pathFile FROM path_list WHERE path_list.userId = ? AND path_list.disable = 1", [checkCookie(data.cookie).userId]);
            let pathList = []
            for (let i = 0; i < dbData.length; i++) {
                let tempJson = [];
                try {
                    tempJson = JSON.parse(fs.readFileSync(`path/${dbData[i].pathFile}`).toString());
                    pathList.push(tempJson)
                } catch (err) {
                    console.log("读取路径时出现错误", err);
                    sendMessage({ content: `无法加载重做路径${dbData[i].pathFile}`, time: 0, type: 1, userId: 0, userName: "root", only: true });
                };
            }
            socket.emit("returnRedoPath", pathList)
        } else {
            console.log("没有通过检测 getRedoPath", data)
        }
    })

    // 广播消息 [未完成多canvas]
    function sendMessage(msg) {
        let only = msg.only || false
        if (!only) {
            socket.emit("newMessage", msg);
        }
        socket.broadcast.emit("newMessage", msg);
    };
    // 新用户加入 [未完成多canvas]
    function newUserAdd(userName, userId, userCookie) {
        console.log("用户上线", userName);
        userList.push({ socket: socket, userName: userName, userId: userId, userCookie: userCookie });
        socket.broadcast.emit("userAdd", { name: userName, userId: userId });
        if (!userPath[`id${userId}`]) {
            userPath[`id${userId}`] = new Array();
        };
    };
    // 用户下线 [未完成多canvas]
    function userDisconnect(userSocket) {
        for (let i = 0; i < userList.length; i++) {
            if (userList[i].socket == userSocket) {
                console.log("用户离开房间", userList[i].userName);
                socket.broadcast.emit("userDisconnect", { userName: userList[i].userName, userId: userList[i].userId });
                userList.splice(i, 1);
            };
        };
    };
});

// 更新用户cookie值
async function updateCookieId(userId, cookieId) {
    await db.runSync("UPDATE user SET cookieId = ? WHERE userId = ?", [cookieId, userId]);
};

// 通过cookie判断该用户是否在线 [未完成多canvas]
function checkCookie(cookie) {
    for (let i = 0; i < userList.length; i++) {
        if (userList[i].userCookie === cookie) {
            return userList[i];
        };
    };
    return false;
};

// 通过id判断该用户是否在线 [未完成多canvas]
function checkId(userId) {
    for (let i = 0; i < userList.length; i++) {
        if (userList[i].userId === userId) {
            return userList[i];
        };
    };
    return false;
};