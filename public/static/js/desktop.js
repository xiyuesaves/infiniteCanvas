function desktop() {
    const roomList = document.querySelector(".room-list")
    const desktopEl = document.querySelector(".desktop")
    let doubleClick, doubleClickTime

    // get桌面图标信息
    axios.get('/static/js/desktop.json')
        .then(function(response) {
            let jsonData = response.data
            if (typeof jsonData === "object") {
                createDesktopFile(jsonData)
            } else {
                console.log("远程桌面配置信息有误")
            }
        })
        .catch(function(error) {
            // alert("加载桌面数据失败")
            console.log(error)
        });

    function createDesktopFile(desktopJson) {
        for (let i = 0; i < desktopJson.length; i++) {
            iconList.push(new desktopFile(desktopJson[i]))
        }
        console.log(iconList)
    }


    // 图标点击事件
    roomList.addEventListener("mousedown", function(e) {
        let selectIcon = false
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].className && e.path[i].className.includes("screen-icon")) {
                selectIcon = e.path[i]
                break
            }
        }
        clearIconAct()
        if (selectIcon) {
            // 被点击元素添加选中效果
            selectIcon.className = "screen-icon act"
            // 清除上一次点击的倒计时
            clearTimeout(doubleClickTime)
            // 如果两次点击的是同一个元素,则触发双击操作
            if (selectIcon === doubleClick) {
                clearIconAct()
                let iconInstance = getInstance(selectIcon.getAttribute("data-uuid"))
                iconInstance.showProgram()
                // 重置双击判断
                doubleClick = null
            } else {
                // 添加双击判断
                doubleClick = selectIcon
            }
            // 如果双击判断不是null,则在倒计时结束后重置为null
            if (doubleClick) {
                doubleClickTime = setTimeout(function() {
                    doubleClick = null
                }, 300)
            }
        }
    })
    // 清除图标选中样式
    function clearIconAct() {
        const iconList = desktopEl.querySelectorAll(".screen-icon.act")
        for (let i = 0; i < iconList.length; i++) {
            iconList[i].className = "screen-icon"
        }
    }
}