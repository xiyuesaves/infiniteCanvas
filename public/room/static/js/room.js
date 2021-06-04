"use strict"

function getRoomInfo() {
    let postIn = false
    postRoomInfo()
    document.querySelector(".post-password").addEventListener("click", function() {
        postRoomInfo()
    })

    function postRoomInfo() {
        if (!postIn) {
            postIn = true
            document.querySelector(".post-password").innerText = "稍等"
            document.querySelector(".wating-service").className += " show"
            axios.post("", {
                    password: document.querySelector(".room-password").value
                })
                .then(function(response) {
                    document.querySelector(".post-password").innerText = "验证"
                    if (response.data.status) {
                        // 验证通过
                        let roomInfo = response.data.roomInfo
                        postIn = false
                        if (document.querySelector(".get-data").className.includes("show")) {
                        	initUserData()
                            getpaths()
                        } else {
                            showText("通过", "success")
                            setTimeout(function() {
                                loadingText()
                        		initUserData()
                                getpaths()
                            }, 800)
                        }

                    } else {
                        // 验证失败,判断原因
                        switch (response.data.code) {
                            case 0:
                                alert("请求地址错误")
                                window.location = "/room/default";
                                break;
                            case 1:
                                showPasswod()
                                break;
                        }
                    }
                })
                .catch(function(error) {
                    // 网络错误
                    document.querySelector(".post-password").innerText = "验证"
                    showText("网络错误,请刷新页面")
                    postIn = false
                    console.log(error)
                })
        }
    }

    function showPasswod() {
        const inputEl = document.querySelector(".input-psw")
        if (inputEl.className.includes("show")) {
            showText("密码错误,请在此文本消失后重试")
            setTimeout(function() {
                hiden()
                postIn = false
            }, 1500)
        } else {
            postIn = false
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

    function getpaths() {
    	console.log("请求路径数据")
    	document.querySelector(".wating-service").className = "wating-service"
    }
}