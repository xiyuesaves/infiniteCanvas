function getRoomInfo() {
    enterRoom()
    let timeOut = true
    document.querySelector(".wating-service").className += " show"
    document.querySelector(".post-password").addEventListener("click", function() {
        if (timeOut) {
            const pswVal = document.querySelector(".room-password").value
            joinRoom(pswVal)
            timeOut = false
            setTimeout(function() {
                timeOut = true
            }, 1500)
        }

    })

    function enterRoom() {
        axios.post("", {
            type: "enterRoom"
        }).then(function(response) {
            const data = response.data
            console.log(data)
            if (data.status) {
                socketConnection()
            } else if (data.error === "notJoinRoom") {
                joinRoom("")
            }
        })
    }

    function joinRoom(psw) {
        axios.post("", {
            type: "joinRoom",
            password: psw
        }).then(function(response) {
            const data = response.data
            console.log(data)
            if (data.status) {
                document.querySelector(".post-password").innerText = "验证通过"
                setTimeout(function() {
                    loadingText()
                    enterRoom()
                    document.querySelector(".post-password").innerText = "验证"
                }, 600)
            } else {
                showPasswod()
            }
        })
    }

    function showPasswod() {
        const inputEl = document.querySelector(".input-psw")
        if (inputEl.className.includes("show")) {
            showText("密码错误,请在1秒后重试")
            setTimeout(function() {
                hiden()
            }, 1500)
        } else {
            hiden()
            inputEl.className += " show"
            document.querySelector(".get-data").className = "get-data"
        }
    }

    function showText(str, type) {
        type = type ? type : "war"
        let infoEl = document.querySelector(".input-psw .text-info")
        infoEl.className = "text-info show " + type
        infoEl.innerText = str
    }

    function hiden() {
        let infoEl = document.querySelector(".input-psw .text-info")
        infoEl.className = "text-info war"
    }

    function loadingText() {
        document.querySelector(".input-psw").className = "input-psw"
        document.querySelector(".get-data").className = "get-data show"
    }

    function initUserData() {
        console.log("初始化用户数据")
    }

    function socketConnection() {
        // 开始尝试socket连接
        let roomName = getRoomName()
        const room = io('/room')
        let myData
        room.on("connect", () => {
            console.log("连接成功")
            connectSuccess()
        })
        room.on('disconnect', (data) => {
            console.log("断开连接", data)
            if (data === "transport close") {
                document.querySelector(".wating-service .get-data p").innerText = "与服务器的通信已断开,正在重新连接"
                document.querySelector(".wating-service").className += " show"
            } else {
                document.querySelector(".wating-service .get-data p").innerText = "您的连接已被服务器拒绝,请刷新页面"
                document.querySelector(".wating-service").className += " show"
            }
        })
        room.on('loginout', () => {
            console.log("连接已被服务器断开")
            room.disconnect()
        })
        // 接收到消息
        room.on('newMsg', (msg) => {
            console.log(msg)
            if (msg.user_id === myData.userId) {
                myMsg(msg)
            } else {
                newMsg(msg)
            }
        })

        function connectSuccess() {
            room.emit("getHistoricalData")
            room.on("historicalData", (msg, player, path, my) => {
                console.log("历史数据", msg, player, path, my)
                myData = my
                document.querySelector(".wating-service .get-data p").innerText = "获取数据中..."
                document.querySelector(".wating-service").className = "wating-service"
                clearMsg()
                for (let i = 0; i < msg.length; i++) {
                    if (msg[i].user_id === my.userId) {
                        myMsg(msg[i])
                    } else {
                        newMsg(msg[i])
                    }
                }
                initSendMsg()
            })
            room.on("mouse", (point) => {
                console.log("鼠标数据", users)
            })
        }
        // 发送消息
        function initSendMsg() {
            console.log("开始监听")
            const sendBtn = document.querySelector(".send-box button")
            const sendInput = document.querySelector(".send-box input")
            sendInput.addEventListener("keydown", (event) => {
                if (event.keyCode === 13) {
                    sendBtn.click()
                }
            })
            sendBtn.addEventListener("click", function() {
                const inputVal = sendInput.value
                if (inputVal.length) {
                    // console.log(inputVal)
                    room.emit("sendMsg", inputVal)
                    myMsg({
                        user_name: myData.userName,
                        content: inputVal
                    })
                    sendInput.value = ""
                }
            })
        }
    }

    // 自己发送的消息
    function myMsg(msg) {
        const msgListEl = document.querySelector(".message-list")
        const msgListinsEl = msgListEl.querySelector(".msg-ovf")
        let tempHtml = document.querySelector("#my-msg").content.cloneNode(true)
        tempHtml.querySelector(".user-name").innerText = msg.user_name
        tempHtml.querySelector(".content").innerText = msg.content
        msgListinsEl.appendChild(tempHtml)
        msgListEl.scroll({ top: msgListinsEl.clientHeight, left: 0, behavior: 'smooth' });
    }
    // 其他人的消息
    function newMsg(msg) {
        const msgListEl = document.querySelector(".message-list")
        const msgListinsEl = msgListEl.querySelector(".msg-ovf")
        let tempHtml = document.querySelector("#msg").content.cloneNode(true)
        tempHtml.querySelector(".user-name").innerText = msg.user_name
        tempHtml.querySelector(".content").innerText = msg.content
        msgListinsEl.appendChild(tempHtml)
        msgListEl.scroll({ top: msgListinsEl.clientHeight, left: 0, behavior: 'smooth' });
    }
    // 清空消息区
    function clearMsg() {
        const msgEl = document.querySelectorAll(".message-list .msg-box")
        for (let i = 0; i < msgEl.length; i++) {
            msgEl[i].remove()
        }
    }
}

function getRoomName() {
    return window.location.pathname.replace(/\/room\//, "")
}