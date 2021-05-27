function desktop() {
    const roomList = document.querySelector(".room-list")
    const desktopEl = document.querySelector(".desktop")
    let doubleClick, doubleClickTime, zIndexVal = 0
    const desktopFile = class {
        constructor(data, sort) {
            this.icon = data.icon
            this.title = data.title
            this.position = {
                x: data.position.x,
                y: data.position.y
            }
            this.type = data.type
            this.content = data.content
            this.src = data.src
            this.sort = sort || null
            this.floderList = data.floderList
            this.uuid = uuid()
            this.iconEl = null
            this.openWindow = false
            this.only = data.only || false
            this.programEl = null
            this.showOnDesktop()
        }
        // 在页面上展示此图标
        showOnDesktop() {
            const desktopEl = document.querySelector(".desktop")
            const desktopIconEl = document.querySelector("#deaktop-icon").content.cloneNode(true)
            desktopIconEl.querySelector(".screen-icon").style.left = this.position.x + "px"
            desktopIconEl.querySelector(".screen-icon").setAttribute("data-uuid", this.uuid)
            desktopIconEl.querySelector(".screen-icon").style.top = this.position.y + "px"
            desktopIconEl.querySelector(".icon").innerText = this.icon
            desktopIconEl.querySelector(".icon-title").innerText = this.title
            desktopEl.appendChild(desktopIconEl)
            this.iconEl = document.querySelector(`[data-uuid="${this.uuid}"]`)
        }
        // 调用打开窗口
        showProgram() {
            // 判断该程序是否能同时打开多个 - [现在只能打开一个]
            this.openProgram()
        }
        // 内部打开方法,忽略仅打开一个限制
        openProgram() {
            // 创建窗口元素
            let newCreate = false
            if (!this.openWindow) {
                this.openWindow = true
                newCreate = true
                const taskList = document.querySelector(".task-list");
                const programEl = document.querySelector("#taskList-folder").content.cloneNode(true);
                programEl.querySelector(".task-show .icon").innerText = this.icon
                programEl.querySelector(".left-title").innerText = this.icon + this.title
                switch (this.type) {
                    case "floder":
                        programEl.querySelector(".content").className = "content floder"
                        break
                    case "text":
                        let pEl = document.createElement("p")
                        pEl.innerText = this.content
                        programEl.querySelector(".content").appendChild(pEl)
                        programEl.querySelector(".content").className = "content text"
                        break
                    case "image":
                        let imgEl = document.createElement("img")
                        imgEl.setAttribute("src", this.src)
                        programEl.querySelector(".content").appendChild(imgEl)
                        programEl.querySelector(".content").className = "content img"
                        break
                    case "program":
                        let iframeEl = document.createElement("iframe")
                        iframeEl.setAttribute("src", this.src)
                        programEl.querySelector(".content").appendChild(iframeEl)
                        programEl.querySelector(".content").className = "content program"
                        break
                }
                programEl.querySelector(".program .folder-list").setAttribute("data-program-uuid", this.uuid)
                taskList.appendChild(programEl)
                this.programEl = taskList.querySelector(`[data-program-uuid="${this.uuid}"]`)
            }
            // 验证元素是否处于最小化状态
            if (this.programEl.getAttribute("data-disable-style")) {
                // 清除图标激活效果
                let actIcons = document.querySelectorAll(".task-show.act")
                for (let i = 0; i < actIcons.length; i++) {
                    actIcons[i].className = "task-show"
                }
                // 激活当前图标
                let showIconEl = getPrevEl(this.programEl)
                showIconEl.className = "task-show act"
                //  打开窗口
                if (newCreate) {
                    let programEl = this.programEl
                    console.log(getPrevEl(programEl).className += " create")
                    setTimeout(function() {
                        programEl.setAttribute("style", programEl.getAttribute("data-disable-style"))
                        programEl.removeAttribute("data-disable-style")
                        programEl.className = "folder-list act"
                        // setTimeout(function() {
                            // 置顶窗口
                            this.topProrame()
                        // }, 300)
                    })
                } else {
                    this.programEl.setAttribute("style", this.programEl.getAttribute("data-disable-style"))
                    this.programEl.removeAttribute("data-disable-style")
                    this.programEl.className = "folder-list act"
                    // 置顶窗口
                    this.topProrame()
                }
            }

        }
        // 置顶窗口
        topProrame() {
            if (this.programEl.parentNode.className !== "program act") {
                let actPrograms = document.querySelectorAll(".program.act")
                // 清除激活图标
                for (let i = 0; i < actPrograms.length; i++) {
                    actPrograms[i].className = "program"
                }
                // 激活触发元素
                this.programEl.parentNode.className = "program act"
            }

            let showIconEl = getPrevEl(this.programEl)
            if (showIconEl.className !== "task-show act") {
                // 清除图标激活效果
                let actIcons = document.querySelectorAll(".task-show.act")
                for (let i = 0; i < actIcons.length; i++) {
                    actIcons[i].className = "task-show"
                }
                // 激活当前图标
                showIconEl.className = "task-show act"
            }

            // 判断是否需要置顶
            if (parseInt(this.programEl.parentNode.style.zIndex) !== zIndexVal) {
                zIndexVal++
                this.programEl.parentNode.style.zIndex = zIndexVal
            }
        }
        // 最小化
        minimizeProgram() {
            // 验证元素是否处于打开状态
            if (this.programEl.getAttribute("style")) {
                let showIconEl = getPrevEl(this.programEl)
                if (showIconEl.className) {
                    showIconEl.className = "task-show"
                }
                this.programEl.parentNode.className = "program"
                this.programEl.setAttribute("data-disable-style", this.programEl.getAttribute("style"))
                this.programEl.removeAttribute("style")
                this.programEl.className = "folder-list"
                // 找到下一个层级最高的窗口,并激活
                this.activeProgram()
            }
        }
        // 激活下一个窗口
        activeProgram() {
            let programList = document.querySelectorAll(".program")
            let nextProgram = { style: { zIndex: 0 } }
            for (let i = 0; i < programList.length; i++) {
                if (programList[i].querySelector(".folder-list.act") && programList[i].style.zIndex > nextProgram.style.zIndex) {
                    nextProgram = programList[i]
                }
            }
            if (nextProgram.className) {
                nextProgram.className = "program act"
                nextProgram.querySelector(".task-show").className = "task-show act"
            }
        }
    }


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