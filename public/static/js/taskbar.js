function taskbar() {
    console.log("加载任务栏模块")
    const taskList = document.querySelector(".task-list");

    // 开始菜单点击事件
    const menuBtn = document.querySelector(".menu-btn");
    menuBtn.addEventListener("click", function(e) {
        if (!menuBtn.className.includes("act")) {
            menuBtn.className = "menu-btn act"
        } else if (e.path[0].className.includes("menu-btn")) {
            menuBtn.className = "menu-btn"
        }
    })
    // 开始菜单按下事件
    document.addEventListener("mousedown", function(e) {
        // 开始菜单失焦
        let clickMenu = false
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].className && e.path[i].className.includes("menu-btn")) {
                clickMenu = true
                return
            }
        }
        if (!clickMenu) {
            menuBtn.className = "menu-btn"
        }
    })

    // 程序层级
    let zIndexVal = 0
    // 任务栏点击事件
    taskList.addEventListener("click", function(e) {
        // 窗口按钮事件
        for (let i = 0; i < e.path.length; i++) {
            // 最小化按钮操作
            if (e.path[i].className === "min") {
                let folderEl = e.path[i].offsetParent
                minimizeProgram(folderEl)
            }
        }

        // 如果点击的图标没有处于激活状态,则清除已激活图标,并激活当前点击的图标
        if (e.path[0].className.includes("task-show")) {
            let programEl = getNextEl(e.path[0])
            if (e.path[0].className === "task-show") {
                // 判断文件夹是否处于打开状态
                if (programEl.getAttribute("data-disable-style")) {
                    // 打开文件夹
                    openProgram(programEl)
                } else {
                    // 文件夹已打开,仅置顶
                    topProrame(programEl)
                }
            } else {
                // 最小化程序
                minimizeProgram(programEl)
            }
        }
    })

    // 任务栏鼠标按下事件
    taskList.addEventListener("mousedown", function(e) {
        for (let i = 0; i < e.path.length; i++) {
            // 点击展开的文件夹
            if (e.path[i].className === ("folder-list act")) {
                topProrame(e.path[i])
            }
        }
    })

    // 最小化窗口 - 传入窗口元素
    function minimizeProgram(programEl) {
        // 验证元素是否处于打开状态
        if (programEl.getAttribute("style")) {
            let showIconEl = getPrevEl(programEl)
            if (showIconEl.className) {
                showIconEl.className = "task-show"
            }
            programEl.parentNode.className = "program"
            programEl.setAttribute("data-disable-style", programEl.getAttribute("style"))
            programEl.removeAttribute("style")
            programEl.className = "folder-list"
            // 找到下一个层级最高的窗口,并激活
            activeNextView()
        }
    }

    // 打开窗口 - 传入窗口元素
    function openProgram(programEl) {
        // 验证元素是否处于最小化状态
        if (programEl.getAttribute("data-disable-style")) {
            console.log("打开窗口")
            // 清除图标激活效果
            let actIcons = document.querySelectorAll(".task-show.act")
            for (let i = 0; i < actIcons.length; i++) {
                actIcons[i].className = "task-show"
            }
            // 激活当前图标
            let showIconEl = getPrevEl(programEl)
            showIconEl.className = "task-show act"
            //  打开窗口
            programEl.setAttribute("style", programEl.getAttribute("data-disable-style"))
            programEl.removeAttribute("data-disable-style")
            programEl.className = "folder-list act"
            // 置顶窗口
            topProrame(programEl)
        }
    }

    // 置顶窗口
    function topProrame(programEl) {
        console.log("置顶窗口")
        let actPrograms = document.querySelectorAll(".program.act")
        // 清除激活图标
        for (let i = 0; i < actPrograms.length; i++) {
            actPrograms[i].className = "program"
        }
        // 激活触发元素
        programEl.parentNode.className = "program act"
        // 清除图标激活效果
        let actIcons = document.querySelectorAll(".task-show.act")
        for (let i = 0; i < actIcons.length; i++) {
            actIcons[i].className = "task-show"
        }
        // 激活当前图标
        let showIconEl = getPrevEl(programEl)
        showIconEl.className = "task-show act"
        // 判断是否需要置顶
        if (parseInt(programEl.parentNode.style.zIndex) !== zIndexVal) {
            zIndexVal++
            programEl.parentNode.style.zIndex = zIndexVal
        }
    }

    // 找到下一个层级最高的窗口,并激活
    function activeNextView() {
        let programList = document.querySelectorAll(".program")
        let lastProgram = { style: { zIndex: 0 } }
        for (let i = 0; i < programList.length; i++) {
            if (programList[i].querySelector(".folder-list.act") && programList[i].style.zIndex > lastProgram.style.zIndex) {
                lastProgram = programList[i]
            }
        }
        if (lastProgram.className) {
            lastProgram.className = "program act"
            lastProgram.querySelector(".task-show").className = "task-show act"
        }
    }
}