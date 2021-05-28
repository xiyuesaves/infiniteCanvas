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
            this.folderList = data.folderList
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
                    case "folder":
                        programEl.querySelector(".content").className = "content folder"
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
                    console.log(getPrevEl(this.programEl).className += " create")
                    setTimeout(() => {
                        this.programEl.setAttribute("style", this.programEl.getAttribute("data-disable-style"))
                        this.programEl.removeAttribute("data-disable-style")
                        this.programEl.className = "folder-list act"
                        // 置顶窗口
                        this.topProrame()
                    },)
                } else {
                    this.programEl.setAttribute("style", this.programEl.getAttribute("data-disable-style"))
                    this.programEl.removeAttribute("data-disable-style")
                    this.programEl.className = "folder-list act"
                    // 置顶窗口
                    this.topProrame()
                }
            } else {
                this.topProrame()
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
            if (!showIconEl.className.includes("act")) {
                // 清除图标激活效果
                let actIcons = document.querySelectorAll(".task-show.act")
                for (let i = 0; i < actIcons.length; i++) {
                    actIcons[i].className = "task-show"
                }
                // 激活当前图标
                showIconEl.className = "task-show act"
            }

            // 判断是否需要置顶
            let programEls = document.querySelectorAll(".program")
            let topIndex = 0
            programEls.forEach((el, index) => {
                if (parseInt(el.style.zIndex) >= topIndex) {
                    topIndex = parseInt(el.style.zIndex)
                    topIndex++
                }
            })
            if (parseInt(this.programEl.parentNode.style.zIndex) !== topIndex - 1) {
                this.programEl.parentNode.style.zIndex = topIndex
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