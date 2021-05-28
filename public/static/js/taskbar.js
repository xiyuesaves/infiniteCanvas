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
                getInstance(programEl.getAttribute("data-program-uuid")).switchMinimize()
                break
            }
            if (e.path[i].className === "max") {
                let programEl = e.path[i].offsetParent
                getInstance(programEl.getAttribute("data-program-uuid")).switchMax()
                break
            }
        }

        // 任务栏图标点击事件
        if (e.path[0].className.includes("task-show")) {
            let programEl = getNextEl(e.path[0])
            let programInstance = getInstance(programEl.getAttribute("data-program-uuid"))
            if (e.path[0].className === "task-show") {
                // 打开程序
                programInstance.openProgram()
            } else {
                // 最小化程序
                programInstance.switchMinimize()
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
}