function taskbar() {
    console.log("加载任务栏模块")
    const taskList = document.querySelector(".task-list");

    // 开始菜单点击事件
    const menuBtn = document.querySelector(".menu-btn");
    menuBtn.addEventListener("click", function(e) {
        if (menuBtn.className === "menu-btn act") {
            menuBtn.className = "menu-btn"
        } else if (e.path[0].className === "menu-btn") {
            menuBtn.className = "menu-btn act"
        }
    })
    // 开始菜单按下事件
    const roomList = document.querySelector(".room-list")
    roomList.addEventListener("mousedown", function(e) {
        // 开始菜单失焦
        let clickMenu = false
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].className && e.path[i].className.includes("menu-btn")) {
                clickMenu = true
                break
            }
        }
        if (!clickMenu) {
            menuBtn.className = "menu-btn"
        }
    })

    // 全局程序层级
    let zIndexVal = 0
    // 任务栏点击事件
    taskList.addEventListener("click", function(e) {
        // 窗口按钮事件
        for (let i = 0; i < e.path.length; i++) {
            // 最小化按钮操作
            if (e.path[i].className === "min") {
                let programEl = e.path[i].offsetParent
                minimizeProgram(programEl)
                getInstance(programEl.getAttribute("data-program-uuid")).minimizeProgram()
                break
            }
            if (e.path[i].className === "max") {
                let programEl = e.path[i].offsetParent
                getInstance(programEl.getAttribute("data-program-uuid")).fullSizeProgram()
                break
            }
        }

        // 任务栏图标点击事件
        if (e.path[0].className.includes("task-show")) {
            let programEl = getNextEl(e.path[0])
            if (e.path[0].className === "task-show") {
                // 判断文件夹是否处于打开状态
                if (programEl.getAttribute("data-disable-style")) {
                    // 打开文件夹
                    getInstance(programEl.getAttribute("data-program-uuid")).openProgram()
                } else {
                    // 文件夹已打开,仅置顶
                    getInstance(programEl.getAttribute("data-program-uuid")).topProrame()
                }
            } else {
                // 最小化程序
                getInstance(programEl.getAttribute("data-program-uuid")).minimizeProgram()
            }
        }
    })

    // 任务栏鼠标按下事件
    taskList.addEventListener("mousedown", function(e) {
        for (let i = 0; i < e.path.length; i++) {
            // 置顶点击的窗口
            if (e.path[i].className === ("folder-list act")) {
                getInstance(e.path[i].getAttribute("data-program-uuid")).topProrame()
            }
        }
    })

    // 最小化窗口 - 传入窗口元素
    function minimizeProgram(programEl) {
        console.log("废弃方法")
        // 验证元素是否处于打开状态
        // if (programEl.getAttribute("style")) {
        //     let showIconEl = getPrevEl(programEl)
        //     if (showIconEl.className) {
        //         showIconEl.className = "task-show"
        //     }
        //     programEl.parentNode.className = "program"
        //     programEl.setAttribute("data-disable-style", programEl.getAttribute("style"))
        //     programEl.removeAttribute("style")
        //     programEl.className = "folder-list"
        //     // 找到下一个层级最高的窗口,并激活
        //     activeProgram()
        // }
    }

    // 打开窗口 - 传入窗口元素
    function openProgram(programEl) {
        console.log("废弃方法")
        // 验证元素是否处于最小化状态
        // if (programEl.getAttribute("data-disable-style")) {
        //     // 清除图标激活效果
        //     let actIcons = document.querySelectorAll(".task-show.act")
        //     for (let i = 0; i < actIcons.length; i++) {
        //         actIcons[i].className = "task-show"
        //     }
        //     // 激活当前图标
        //     let showIconEl = getPrevEl(programEl)
        //     showIconEl.className = "task-show act"
        //     //  打开窗口
        //     programEl.setAttribute("style", programEl.getAttribute("data-disable-style"))
        //     programEl.removeAttribute("data-disable-style")
        //     programEl.className = "folder-list act"
        //     // 置顶窗口
        //     topProrame(programEl)
        // }
    }

    // 全屏窗口
    function fullSizeProgram(programEl) {

    }

    // 置顶窗口 - 传入窗口元素
    function topProrame(programEl) {
        console.log("废弃方法")
        // if (programEl.parentNode.className !== "program act") {
        //     let actPrograms = document.querySelectorAll(".program.act")
        //     // 清除激活图标
        //     for (let i = 0; i < actPrograms.length; i++) {
        //         actPrograms[i].className = "program"
        //     }
        //     // 激活触发元素
        //     programEl.parentNode.className = "program act"
        // }

        // let showIconEl = getPrevEl(programEl)
        // if (showIconEl.className !== "task-show act") {
        //     // 清除图标激活效果
        //     let actIcons = document.querySelectorAll(".task-show.act")
        //     for (let i = 0; i < actIcons.length; i++) {
        //         actIcons[i].className = "task-show"
        //     }
        //     // 激活当前图标
        //     showIconEl.className = "task-show act"
        // }

        // // 判断是否需要置顶
        // if (parseInt(programEl.parentNode.style.zIndex) !== zIndexVal) {
        //     zIndexVal++
        //     programEl.parentNode.style.zIndex = zIndexVal
        // }
    }

    // 找到下一个层级最高的窗口,并激活
    // function activeProgram() {
    //     let programList = document.querySelectorAll(".program")
    //     let nextProgram = { style: { zIndex: 0 } }
    //     for (let i = 0; i < programList.length; i++) {
    //         if (programList[i].querySelector(".folder-list.act") && programList[i].style.zIndex > nextProgram.style.zIndex) {
    //             nextProgram = programList[i]
    //         }
    //     }
    //     if (nextProgram.className) {
    //         nextProgram.className = "program act"
    //         nextProgram.querySelector(".task-show").className = "task-show act"
    //     }
    // }
}