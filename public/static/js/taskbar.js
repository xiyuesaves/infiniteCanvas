document.addEventListener("DOMContentLoaded", function() {
    console.log("加载任务栏")
    const menuBtn = document.querySelector(".menu-btn");
    const taskList = document.querySelector(".task-list");

    // 开始菜单
    document.addEventListener("mousedown", function(e) {
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
    menuBtn.addEventListener("click", function(e) {
        if (!menuBtn.className.includes("act")) {
            menuBtn.className = "menu-btn act"
        } else if (e.path[0].className.includes("menu-btn")) {
            menuBtn.className = "menu-btn"
        }
    })

    // 任务栏图标点击事件
    taskList.addEventListener("click", function(e) {
        console.log(e.path)
        if (e.path[0].className === "program") {
            if (document.querySelector(".program.act")) {
                document.querySelector(".program.act").className = "program"
            }
            e.path[0].className = "program act"
        } else {
            document.querySelector(".program.act").className = "program"
        }
    })
})