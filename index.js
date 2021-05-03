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
// 数据库写入语句
//  db.run(`INSERT INTO reply_list (key,create_name,create_id,group_id) VALUES (?,?,?,?)`, [textArr[1], msg.sender.memberName, msg.sender.id, msg.sender.group.id], function(err) { if (!err) { resolve(this.lastID) } else { reject(err) } })
// 数据库查询语句
// db.all(`SELECT content,reply_type FROM reply_list a,reply_text_list b WHERE a.reply_list_id = b.reply_list_id AND a.key = ? AND a.group_id = ?`, [text, group_id], (err, row) => { if (err !== null) { reject(err) } else { resolve(row) } })

const invitationCode = "xiyue";

const point = 3399;
console.log(`服务已启动,正在监听${point}`)
server.listen(point);

let userList = [];
let userNum = 0;

io.on('connection', (socket) => {
    socket.on("login", function(data) {
        console.log("用户登录");
        db.get("SELECT userName,password,userId FROM user WHERE user.userName = ?", [data.name], function(err, dbData) {
            if (data.name === dbData.userName && data.psw === dbData.password) {
                let cookieId = Buffer.from("user" + data.name + new Date().getTime() + "time").toString('base64');
                socket.emit("loginReturn", { status: true, cookieId: cookieId, name: data.name });
                updateCookieId(dbData.userId, cookieId);
                newUserAdd(dbData.userName, dbData.userId, cookieId);
            } else {
                console.log("登录失败");
                socket.emit("loginReturn", { status: false })
            }
        })
    })
    socket.on("cookieLogin", function(data) {
        console.log("cookie登录", data.cookie)
        db.get("SELECT userName,userId,cookieId FROM user WHERE user.cookieId = ?", [data.cookie], function(err, dbData) {
            if (dbData) {
                if (data.cookie === dbData.cookieId) {
                    socket.emit("loginReturn", { status: true, cookieId: data.cookie, name: dbData.userName });
                    newUserAdd(dbData.userName, dbData.userId, data.cookie);
                } else {
                    console.log("cookie登录失败, 数据库错误");
                    socket.emit("autoLoginReturn", { status: false })
                }
            } else {
                console.log("cookie登录失败, 没有找到对应用户");
                socket.emit("autoLoginReturn", { status: false })
            }
        })
    })
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
                                socket.emit("registeredReturn", { status: true, cookieId: cookieId })
                                updateCookieId(dbData.userId, cookieId);
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
    socket.on("disconnect", function(data) {
        userDisconnect(socket);
    });
    // 登录之后的请求方法
    socket.on("getUserList", function (cookie) {
        if (checkCookie(cookie.userId)) {
            let userListArr = [];
            for (let i = 0; i < userList.length; i++) {
                userListArr.push({
                    name: userList[i].userName,
                    userId: userList[i].userId
                })
            }
            socket.emit("returnUserList", userListArr)
        }else{
            console.log("没有通过检测",cookie.userId)
        }
    });

    function newUserAdd(userName, userId, userCookie) {
        console.log("用户上线");
        userList.push({ socket: socket, userName: userName, userId: userId, userCookie: userCookie});
        socket.broadcast.emit("userAdd", { name: userName, userId: userId });
    };
    function userDisconnect(userSocket) {
        for (let i = 0; i < userList.length; i++) {
            if (userList[i].socket == userSocket) {
                console.log("用户下线",userList[i].userName);
                socket.broadcast.emit("userDisconnect", { userName: userList[i].userName, userId: userList[i].userId });
                userList.splice(i,1);
            };
        };
    };
});

function updateCookieId(userId, cookieId) {
    db.run("UPDATE user SET cookieId = ? WHERE userId = ?", [cookieId, userId], function(err, data) {});
};
function checkCookie(cookie) {
    for (let i = 0; i < userList.length; i++) {
        if (userList[i].userCookie === cookie) {
            return true;
        };
    };
    return false;
};