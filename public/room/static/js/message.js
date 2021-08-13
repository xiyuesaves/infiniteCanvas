function initMessage(room) {
    room.emit("getHistoricalData")
    room.on("historicalData", (msg, player, my) => {
        console.log("历史数据", msg, player, my)
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
    // 接收到消息
    room.on('newMsg', (msg) => {
        console.log(msg)
        if (msg.user_id === myData.userId) {
            myMsg(msg)
        } else {
            newMsg(msg)
        }
    })
    // 初始化发送消息
    function initSendMsg() {
        console.log("开始监听")
        const sendInput = document.querySelector(".send-box .input-text")
        sendInput.addEventListener("keydown", (event) => {
            if (event.keyCode === 13) {
                event.preventDefault()
            }
        })
        sendInput.addEventListener("keyup", (event) => {
            const inputVal = sendInput.innerText
            const checkVal = inputVal.replace(/\s/g, "")
            if (event.keyCode === 13) {
                if (checkVal.length) {
                    room.emit("sendMsg", inputVal)
                    myMsg({
                        user_name: myData.userName,
                        content: inputVal
                    })
                }
                sendInput.innerText = ""
            }
        })
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