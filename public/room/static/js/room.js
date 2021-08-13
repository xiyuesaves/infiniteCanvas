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
            getRoomInfoSuccess(room)
        })
        room.on('disconnect', (data) => {
            console.log("断开连接", data)
            if (data === "transport close") {
                document.querySelector(".wating-service .get-data p").innerText = "与服务器的通信已断开,正在重新连接"
                document.querySelector(".wating-service").className += " show"
            } else {
                document.querySelector(".wating-service .get-data p").innerText = "您的连接已断开,请刷新页面"
                document.querySelector(".wating-service").className += " show"
            }
        })
    }

    function getRoomName() {
        return window.location.pathname.replace(/\/room\//, "")
    }
}