const express = require('express');
let app = express();
app.use(express.static('public'));
app.use('/cookies.js', express.static('node_modules/js-cookie/src/js.cookie.js'));
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
//sqlite3数据库
const sqlite3 = require("sqlite3");
// 链接数据库
const db = new sqlite3.Database("main.db");


// 数据库写入语句
//  db.run(`INSERT INTO reply_list (key,create_name,create_id,group_id) VALUES (?,?,?,?)`, [textArr[1], msg.sender.memberName, msg.sender.id, msg.sender.group.id], function(err) { if (!err) { resolve(this.lastID) } else { reject(err) } })
// 数据库查询语句
// db.all(`SELECT content,reply_type FROM reply_list a,reply_text_list b WHERE a.reply_list_id = b.reply_list_id AND a.key = ? AND a.group_id = ?`, [text, group_id], (err, row) => { if (err !== null) { reject(err) } else { resolve(row) } })

const invitationCode = "xiyue";

const canvasId = 0;

// 储存用户临时路径
let userPath = {};

const point = 3399;
console.log(`服务已启动,正在监听${point}`)
server.listen(point);

let userList = [];
let userNum = 0;

io.on('connection', (socket) => {
    // 登录请求
    socket.on("login", function(data) {
        console.log("用户登录");
        db.get("SELECT userName,password,userId FROM user WHERE user.userName = ?", [data.name], function(err, dbData) {
            if (data.name === dbData.userName && data.psw === dbData.password) {
                if (!checkId(dbData.userId)) {
                    let cookieId = Buffer.from("user" + data.name + new Date().getTime() + "time").toString('base64');
                    socket.emit("loginReturn", { status: true, cookieId: cookieId, name: data.name, id: dbData.userId });
                    updateCookieId(dbData.userId, cookieId);
                    newUserAdd(dbData.userName, dbData.userId, cookieId);
                } else {
                    console.log("登录失败,该账号已被登录");
                    socket.emit("loginReturn", { status: false, code: 1 })
                }
            } else {
                console.log("登录失败,账号密码错误");
                socket.emit("loginReturn", { status: false, code: 0 })
            }
        })
    })
    // cookie登录请求
    socket.on("cookieLogin", function(data) {
        console.log("cookie登录", data.cookie)
        db.get("SELECT userName,userId,cookieId FROM user WHERE user.cookieId = ?", [data.cookie], function(err, dbData) {
            if (dbData) {
                // 这条判断是不会出错的
                if (data.cookie === dbData.cookieId) {
                    if (!checkCookie(data.cookie)) {
                        socket.emit("loginReturn", { status: true, cookieId: data.cookie, name: dbData.userName, id: dbData.userId });
                        newUserAdd(dbData.userName, dbData.userId, data.cookie);
                    } else {
                        console.log("cookie登录失败, 已经在其他地方登录");
                        socket.emit("autoLoginReturn", { status: false, code: 2 })
                    }
                } else {
                    console.log("cookie登录失败, 数据库错误");
                    socket.emit("autoLoginReturn", { status: false, code: 1 })
                }
            } else {
                console.log("cookie已过期,登录失败");
                socket.emit("autoLoginReturn", { status: false, code: 0 })
            }
        })
    })
    // 注册
    socket.on("registered", function(data) {
        console.log("用户注册", data.name)
        db.get("SELECT userName FROM user WHERE user.userName = ?", [data.name], function(err, name) {
            if (!name) {
                // let invitationCode = getInvitationCode()
                if (data.invitationCode === invitationCode) {
                    let createTime = new Date().getTime() + "";
                    console.log(createTime)
                    db.run("INSERT INTO user (userName,createTime,password) VALUES (?,?,?)", [data.name, createTime, data.psw], function(err, noInfo) {
                        if (!err) {
                            db.get("SELECT userId FROM user WHERE user.userName = ?", [data.name], function(err, dbData) {
                                let cookieId = Buffer.from("user" + data.name + new Date().getTime()).toString('base64');
                                updateCookieId(dbData.userId, cookieId);
                                newUserAdd(data.name, dbData.userId, cookieId);
                                socket.emit("registeredReturn", { status: true, cookieId: cookieId, name: data.name, id: dbData.userId })
                            })
                        } else {
                            socket.emit("registeredReturn", { status: false })
                        }
                    })
                } else {
                    socket.emit("registeredReturn", { status: false, err: 2 })
                }
            } else {
                socket.emit("registeredReturn", { status: false, err: 1 })
            }
        })
    })
    // 判断用户名是否存在
    socket.on("checkName", function(data) {
        console.log("判断用户名是否存在", data)
        db.get("SELECT userName FROM user WHERE user.userName = ?", [data.name], function(err, data) {
            console.log(data)
            if (data) {
                socket.emit("checkNameReturn", { status: true })
            } else {
                socket.emit("checkNameReturn", { status: false })
            }
        })
    })
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
                })
            }
            socket.emit("returnUserList", userListArr)
        } else {
            console.log("没有通过检测 getUserList", cookie)
        }
    });
    // 获取历史消息 [未完成多canvas]
    socket.on("getHistoricalMessage", function(cookie) {
        if (checkCookie(cookie.cookie)) {
            db.all("SELECT msgId,userName,content,time,type,userId FROM message WHERE message.canvasId = ?", [0], function(err, dbData) {
                socket.emit("returnHistoricalMessage", dbData)
            })
        } else {
            console.log("没有通过检测 getHistoricalMessage", cookie)
        }
    });
    // 收到信息 [未完成多canvas]
    socket.on("sendMsg", function(data) {
        console.log(data)
        if (checkCookie(data.cookie)) {
            let userData = checkCookie(data.cookie)
            console.log(userData.userName)
            let sendTime = new Date().getTime() + "";
            db.run("INSERT INTO message (userName,userId,content,canvasId,time,type) VALUES (?,?,?,?,?,?)", [userData.userName, userData.userId, data.content, 0, sendTime, 0]);
            sendMessage({ content: data.content, time: sendTime, type: 0, userId: userData.userId, userName: userData.userName });
        } else {
            console.log("没有通过检测 sendMsg", data.userId)
        }
    })
    // 广播移动数据 [未完成多canvas]
    socket.on("pointMove", function(data) {
        if (checkCookie(data.cookie)) {
            let decodeData = {
                point: data.point,
                time: data.time,
                userId: checkCookie(data.cookie).userId
            }
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
                    fs.writeFile(`path/${canvasId}-${decodeData.userId}-${time}`, JSON.stringify(userPath[`id${decodeData.userId}`]), function(err) {
                        if (!err) {
                            db.run("INSERT INTO path_list (userId,userName,pathFile,canvasId) VALUES (?,?,?,?)", [decodeData.userId, checkId(decodeData.userId).userName, `${canvasId}-${decodeData.userId}-${time}`, canvasId], function(err, noInfo) {
                                if (!err) {} else {
                                    console.log("写入数据库失败", err);
                                    sendMessage({ content: "写入数据库失败,请联系管理员", time: 0, type: 1, userId: 0, userName: "root" });
                                }
                            })
                        } else {
                            console.log("写入失败", err)
                            sendMessage({ content: "写入路径文件失败,请联系管理员", time: 0, type: 1, userId: 0, userName: "root" });
                        }
                    })
                    userPath[`id${decodeData.userId}`] = new Array();
                }
            }
            socket.broadcast.emit("otherPlayer", decodeData);
        } else {
            console.log("没有通过检测 pointMove", data)
        }
    })
    // 获取历画布数据
    socket.on("getHistoricalPath", function(data) {
        if (checkCookie(data.cookie)) {
            db.all("SELECT * FROM path_list WHERE path_list.canvasId = ?", [0], function(err, dbData) {
                for (let i = 0; i < dbData.length; i++) {
                    let tempJson = []
                    try {
                        tempJson = JSON.parse(fs.readFileSync(`path/${dbData[i].pathFile}`).toString())
                    } catch (err) {
                        console.log("读取路径时出现错误", err)
                        sendMessage({ content: `无法加载路径${dbData[i].pathFile}`, time: 0, type: 1, userId: 0, userName: "root" });
                    }
                    dbData[i].path = tempJson;
                }; 
                socket.emit("returnHistoricalPath", dbData)
            })
        } else {
            console.log("没有通过检测 getHistoricalPath", data)
        }
    })
    // 广播消息 [未完成多canvas]
    function sendMessage(msg) {
        socket.emit("newMessage", msg);
        socket.broadcast.emit("newMessage", msg);
    }
    // 新用户加入 [未完成多canvas]
    function newUserAdd(userName, userId, userCookie) {
        console.log("用户上线");
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
                console.log("用户下线", userList[i].userName);
                socket.broadcast.emit("userDisconnect", { userName: userList[i].userName, userId: userList[i].userId });
                userList.splice(i, 1);
            };
        };
    };
});

function updateCookieId(userId, cookieId) {
    db.run("UPDATE user SET cookieId = ? WHERE userId = ?", [cookieId, userId], function(err, data) {});
};

// 通过cookie判断该用户是否在线 [未完成多canvas]
function checkCookie(cookie) {
    for (let i = 0; i < userList.length; i++) {
        if (userList[i].userCookie === cookie) {
            return userList[i]
        };
    };
    return false;
};

// 通过id判断该用户是否在线 [未完成多canvas]
function checkId(userId) {
    for (let i = 0; i < userList.length; i++) {
        if (userList[i].userId === userId) {
            return userList[i]
        };
    };
    return false;
};