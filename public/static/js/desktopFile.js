const desktopFile = class {
    constructor(data, sort) {
        this.icon = data.icon
        this.title = data.title
        this.iconPosition = {
            x: data.iconPosition.x,
            y: data.iconPosition.y
        }
        this.type = data.type
        this.content = data.content
        this.src = data.src
        this.sort = sort || null
        this.folderList = data.folderList
        this.uuid = uuid()
        this.iconEl = null
        this.windowOption = {
            width: 700,
            height: 400,
            position: {
                x: 0,
                y: 0
            },
            isOpen: false,
            isMax: false,
            create: false
        }
        this.only = data.only || false
        this.programEl = null
        this.showOnDesktop()
    }
    // 在页面上展示此图标
    showOnDesktop() {
        const desktopEl = document.querySelector(".desktop")
        const desktopIconEl = document.querySelector("#deaktop-icon").content.cloneNode(true)
        const iconFileHeight = 120
        const iconFileWidth = 78
        const offsetTop = 10
        const offsetLeft = 2
        desktopIconEl.querySelector(".screen-icon").style.left = this.iconPosition.x * iconFileWidth + offsetLeft + "px"
        desktopIconEl.querySelector(".screen-icon").setAttribute("data-uuid", this.uuid)
        desktopIconEl.querySelector(".screen-icon").style.top = this.iconPosition.y * iconFileHeight + offsetTop + "px"
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
        if (!this.windowOption.create) {
            this.windowOption.create = true
            const taskList = document.querySelector(".task-list");
            const programEl = document.querySelector("#taskList-folder").content.cloneNode(true);
            const styleText = `width: ${this.windowOption.width}px;height: ${this.windowOption.height}px;top: -${this.windowOption.height}px`
            programEl.querySelector(".folder-list").setAttribute("style", styleText)
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
            programEl.querySelector(".folder-list").setAttribute("data-program-uuid", this.uuid)
            taskList.appendChild(programEl)
            this.programEl = taskList.querySelector(`[data-program-uuid="${this.uuid}"]`)
            getPrevEl(this.programEl).setAttribute("create", "true")
        }
        // 验证元素是否处于最小化状态
        if (this.windowOption.isOpen) {
            this.topProrame()
        } else if (this.windowOption.isMax) {
            this.maxWindow()
        } else {
            this.resetWindow()
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
        let topIndex = 1
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

    // 切换最小化
    switchMinimize() {
        if (this.windowOption.isOpen) {
            this.minimize()
        } else {
            this.resetWindow()
        }
    }

    // 重置窗口
    resetWindow() {
        // 重置窗口
        this.windowOption.isOpen = true
        this.windowOption.isMax = false
        // 清除图标激活效果
        let actIcons = document.querySelectorAll(".task-show.act")
        for (let i = 0; i < actIcons.length; i++) {
            actIcons[i].className = "task-show"
        }
        // 激活当前图标
        let showIconEl = getPrevEl(this.programEl)
        showIconEl.className = "task-show act"
        //  重置窗口
        if (getPrevEl(this.programEl).getAttribute("create")) {
            getPrevEl(this.programEl).className += " create"
            getPrevEl(this.programEl).removeAttribute("create")
            setTimeout(() => {
                let styleText = `width: ${this.windowOption.width}px; height: ${this.windowOption.height}px; top: -${this.windowOption.height}px; transition: all 200ms ease 0s; transform: translateX(${this.windowOption.position.x}px) translateY(${this.windowOption.position.y}px);`
                this.programEl.setAttribute("style", styleText)
                this.programEl.className = "folder-list act"
                // 置顶窗口
                this.topProrame()
            }, )
        } else {
            let styleText = `width: ${this.windowOption.width}px; height: ${this.windowOption.height}px; top: -${this.windowOption.height}px; transition: all 200ms ease 0s; transform: translateX(${this.windowOption.position.x}px) translateY(${this.windowOption.position.y}px);`
            this.programEl.setAttribute("style", styleText)
            this.programEl.className = "folder-list act"
            // 置顶窗口
            this.topProrame()
        }
    }

    // 最小化
    minimize() {
        // 验证元素是否处于打开状态
        this.windowOption.isOpen = false
        let showIconEl = getPrevEl(this.programEl)
        if (showIconEl.className) {
            showIconEl.className = "task-show"
        }
        this.programEl.parentNode.className = "program"
        this.programEl.removeAttribute("style")
        this.programEl.className = "folder-list"
        // 找到下一个层级最高的窗口,并激活
        this.activeProgram()
    }

    // 切换最大化
    switchMax() {
        console.log("切换最大化")
        if (this.windowOption.isMax) {
            this.resetWindow()
        } else {
            this.maxWindow()
        }
    }

    maxWindow() {
        let offsetRect
        console.log("最大化窗口", this.programEl.style.transform)
        offsetRect = this.programEl.getBoundingClientRect()
        this.windowOption.isMax = true
        if (!this.windowOption.isOpen) {
            this.windowOption.isOpen = true
            let styleText = `width: ${this.windowOption.width}px; height: ${this.windowOption.height}px; top: -${this.windowOption.height}px; transition: all 200ms ease 0s; transform: translateX(0px) translateY(0px);`
            this.programEl.setAttribute("style", styleText)
            this.programEl.className = "folder-list act"
            this.programEl.style.transform = `translateX(-${offsetRect.left}px) translateY(-${document.querySelector(".room-list").offsetHeight - this.windowOption.height - document.querySelector(".task-list").offsetHeight}px)`
            this.programEl.style.width = `${document.querySelector(".room-list").offsetWidth}px`
            this.programEl.style.height = `${document.querySelector(".room-list").offsetHeight - document.querySelector(".task-list").offsetHeight}px`
        } else {
            this.programEl.style.transform = `translateX(${this.windowOption.position.x - offsetRect.left}px) translateY(${this.windowOption.position.y - offsetRect.top}px)`
            this.programEl.style.width = `${document.querySelector(".room-list").offsetWidth}px`
            this.programEl.style.height = `${document.querySelector(".room-list").offsetHeight - document.querySelector(".task-list").offsetHeight}px`
        }
        // 置顶窗口
        this.topProrame()
    }

    // 激活图标
    selectIcon() {
        this.clearIconAct()
        this.iconEl.className += " act"
    }

    // 清除图标激活
    clearIconAct() {
        const desktopEl = document.querySelector(".desktop")
        const iconList = desktopEl.querySelectorAll(".screen-icon.act")
        for (let i = 0; i < iconList.length; i++) {
            iconList[i].className = "screen-icon"
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