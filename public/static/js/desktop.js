function desktop() {
    const roomList = document.querySelector(".room-list")
    const desktopEl = document.querySelector(".desktop")

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
        if (iconList) {
            let selectIcon = false
            for (let i = 0; i < e.path.length; i++) {
                if (e.path[i].className && e.path[i].className.includes("screen-icon")) {
                    selectIcon = e.path[i]
                    break
                }
            }
            getInstance(iconList[0].uuid).clearIconAct()
            if (selectIcon) {
                // 被点击元素添加选中效果
                // selectIcon.className = "screen-icon act"
                getInstance(selectIcon.getAttribute("data-uuid")).selectIcon()
                // 如果两次点击的是同一个元素,则触发双击操作
                if (doubleClick(selectIcon)) {
                    let iconInstance = getInstance(selectIcon.getAttribute("data-uuid"))
                    iconInstance.showProgram()
                    getInstance(selectIcon.getAttribute("data-uuid")).clearIconAct()
                }
            }
        }
    })
}