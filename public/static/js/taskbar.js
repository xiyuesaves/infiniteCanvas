document.addEventListener("DOMContentLoaded", function() {
    console.log("加载任务栏")
    const menuBtn = document.querySelector(".menu-btn");
    const taskList = document.querySelector(".task-list");

    // 全局鼠标按下事件
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


        // 任务栏图标失焦
        let clickProgram = false
        console.log(e.path)
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].className && e.path[i].className.includes("task-show")) {
                clickProgram = true
                return
            }
        }
        if (!clickProgram) {
            if (document.querySelector(".task-show.act")) {
                document.querySelector(".task-show.act").className = "task-show"
            }
        }

        // 点击展开的文件夹
        for (let i = 0; i < e.path.length; i++) {
            if (e.path[i].className && e.path[i].className.includes("folder-list")) {
                getPrevEl(e.path[i]).className = "task-show act"
                return
            }
        }
    })
    // 开始菜单点击事件
    menuBtn.addEventListener("click", function(e) {
        if (!menuBtn.className.includes("act")) {
            menuBtn.className = "menu-btn act"
        } else if (e.path[0].className.includes("menu-btn")) {
            menuBtn.className = "menu-btn"
        }
    })

    // 任务栏图标点击事件
    taskList.addEventListener("click", function(e) {
        // console.log(e.path)
        if (e.path[0].className === "task-show") {
            if (document.querySelector(".task-show.act")) {
                document.querySelector(".task-show.act").className = "task-show"
            }
            e.path[0].className = "task-show act"
            let floderEl = getNextEl(e.path[0])
            floderEl.setAttribute("style", floderEl.getAttribute("data-disable-style"))
            floderEl.removeAttribute("data-disable-style")
            floderEl.className = "folder-list act"
        } else {
            // let floderEl = getNextEl(e.path[0])
            // floderEl.setAttribute("data-disable-style", floderEl.getAttribute("style"))
            // floderEl.removeAttribute("style")
            // floderEl.className = "folder-list"
            if (document.querySelector(".task-show.act")) {
                document.querySelector(".task-show.act").className = "task-show"
            }
        }
    })

    // 可拖动模组
    let drop = false
    document.addEventListener("mousedown", function(e) {
        console.log(e)
        if (e.buttons === 1) {
            for (let i = 0; i < e.path.length; i++) {
                if (e.path[i].className && e.path[i].className.includes("drop-el")) {
                    drop = e.path[i]
                    e.path[i].parentNode.style.transition = "0ms"
                    return
                }
            }
        }

    })
    document.addEventListener("mouseup", function(e) {
        if (drop) {
            drop.parentNode.style.transition = "200ms"
            drop = false
        }
    })
    document.addEventListener("mousemove", function(e) {
        // console.log(e)  
        if (drop) {
            let moveX = 0
            let moveY = 0
            // console.log(drop.parentNode.style.transform)
            if (drop.parentNode.style.transform) {
                moveX = parseInt(drop.parentNode.style.transform.match(/-?\d+/g)[0])
                moveY = parseInt(drop.parentNode.style.transform.match(/-?\d+/g)[1])
            }
            moveX += e.movementX
            moveY += e.movementY
            drop.parentNode.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`
        }
    })
    document.querySelector(".min").addEventListener("click", function() {
        document.querySelector(".folder-list").className = "folder-list"
        let style = document.querySelector(".folder-list").getAttribute("style")
        document.querySelector(".folder-list").setAttribute("data-disable-style", style)
        document.querySelector(".folder-list").removeAttribute("style")
    })
})