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
    // 任务栏图标点击事件
    taskList.addEventListener("click", function(e) {
        // 遍历点击路径
        for (let i = 0; i < e.path.length; i++) {
            // 最小化按钮操作
            if (e.path[i].className === "min") {
                let floderEl = e.path[i].offsetParent
                floderEl.className = "folder-list"
                floderEl.setAttribute("data-disable-style", floderEl.getAttribute("style"))
                floderEl.removeAttribute("style")
                getPrevEl(floderEl).className = "task-show"
            }
        }
        // 如果点击的图标没有处于激活状态,则清除已激活图标,并激活当前点击的图标
        if (e.path[0].className.includes("task-show")) {
            if (e.path[0].className === "task-show") {
                // 清除选中图标
                if (document.querySelector(".task-show.act")) {
                    document.querySelector(".task-show.act").className = "task-show"
                }
                e.path[0].className = "task-show act"
                // 打开并置顶此图标对应的窗口
                let floderEl = getNextEl(e.path[0])
                if (floderEl.getAttribute("data-disable-style")) {
                    floderEl.setAttribute("style", floderEl.getAttribute("data-disable-style"))
                    floderEl.removeAttribute("data-disable-style")
                    floderEl.className = "folder-list act"
                }
                if (!floderEl.parentNode.className.includes("act")) {
                    if (document.querySelector(".program.act")) {
                        document.querySelector(".program.act").className = "program"
                    }
                    floderEl.parentNode.className = "program act"
                    if (parseInt(floderEl.parentNode.style.zIndex) !== zIndexVal) {
                        zIndexVal++
                        floderEl.parentNode.style.zIndex = zIndexVal
                    }
                }
            } else {
                // 最小化程序窗口
                if (document.querySelector(".task-show.act")) {
                    document.querySelector(".task-show.act").className = "task-show"
                }
                let floderEl = getNextEl(e.path[0])
                if (floderEl.getAttribute("style")) {
                    floderEl.setAttribute("data-disable-style", floderEl.getAttribute("style"))
                    floderEl.removeAttribute("style")
                    floderEl.className = "folder-list"
                }
                // 找到下一个层级最高的窗口,并激活
                let programList = document.querySelectorAll(".program")
                let lastProgram = { style: { zIndex: 0 } }
                for (let i = 0; i < programList.length; i++) {
                    if (programList[i].querySelector(".folder-list.act") && programList[i].style.zIndex > lastProgram.style.zIndex) {
                        lastProgram = programList[i]
                    }
                }
                e.path[0].parentNode.className = "program"
                if (lastProgram.className) {
                    lastProgram.className = "program act"
                    lastProgram.querySelector(".task-show").className = "task-show act"
                }
            }
        }
    })

    // 程序本体鼠标按下事件
    taskList.addEventListener("mousedown", function(e) {
        for (let i = 0; i < e.path.length; i++) {
            // 点击展开的文件夹
            if (e.path[i].className === ("folder-list act")) {
                // 对应图标添加激活样式
                if (getPrevEl(e.path[i]).className !== "task-show act") {
                    if (document.querySelector(".task-show.act")) {
                        document.querySelector(".task-show.act").className = "task-show"
                    }
                }
                getPrevEl(e.path[i]).className = "task-show act"
                // 添加激活属性,判断是否置顶
                if (!e.path[i].parentNode.className.includes("act")) {
                    if (parseInt(e.path[i].parentNode.style.zIndex) !== zIndexVal) {
                        zIndexVal++
                        e.path[i].parentNode.style.zIndex = zIndexVal
                    }
                    // 去除其他进程的置顶属性
                    if (document.querySelector(".program.act")) {
                        document.querySelector(".program.act").className = "program"
                    }
                    e.path[i].parentNode.className = "program act"
                }
            }
        }
    })
}
