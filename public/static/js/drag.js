function drag() {
    // 可拖动模组
    let overY = 0
    let overX = 0
    let drop = false
    document.addEventListener("mousedown", function(e) {
        if (e.buttons === 1) {
            for (let i = 0; i < e.path.length; i++) {
                if (e.path[i].className && e.path[i].className.includes("drop-el")) {
                    let clickEl = e.path[i]
                    if (doubleClick(clickEl)) {
                        getInstance(clickEl.parentNode.getAttribute("data-program-uuid")).switchMax()
                    } else {
                        drop = clickEl
                        drop.parentNode.style.transition = "0ms"
                        overX = e.offsetX
                        overY = e.offsetY
                        drop.parentNode.querySelector(".content").style.pointerEvents = "none"
                    }
                    break
                }
            }
        }
    })
    document.addEventListener("mouseup", function(e) {
        if (drop) {

            drop.parentNode.style.transition = "200ms"
            drop.parentNode.querySelector(".content").style.pointerEvents = "auto"
            let moveX = 0
            let moveY = 0
            if (drop.parentNode.style.transform) {
                moveX = parseInt(drop.parentNode.style.transform.match(/-?\d+/g)[0])
                moveY = parseInt(drop.parentNode.style.transform.match(/-?\d+/g)[1])
            }
            let elPosition = drop.parentNode.getBoundingClientRect()
            let offsetBottom = document.querySelector(".room-list").offsetHeight - elPosition.height - document.querySelector(".taskbar").offsetHeight
            if ((elPosition.top + e.movementY > 0 || e.movementY > 0) && (elPosition.top + e.movementY < offsetBottom || e.movementY < 0)) {
                moveY += e.movementY
            } else if (elPosition.top > offsetBottom / 2) {
                moveY += offsetBottom - elPosition.top
            } else {
                moveY -= elPosition.top
            }

            let offsetRight = document.querySelector(".room-list").offsetWidth - elPosition.width
            if ((elPosition.left + e.movementX > 0 || e.movementX > 0) && (elPosition.left + e.movementX < offsetRight || e.movementX < 0)) {
                moveX += e.movementX
            } else if (elPosition.left > offsetRight / 2) {
                moveX += offsetRight - elPosition.left
            } else {
                moveX -= elPosition.left
            }

            let iconInstance = getInstance(drop.parentNode.getAttribute("data-program-uuid"))
            if (!iconInstance.windowOption.isMax) {
                iconInstance.windowOption.position.x = moveX
                iconInstance.windowOption.position.y = moveY
            }

            drop.parentNode.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`
            drop = false
        }
    })
    document.addEventListener("mousemove", function(e) {
        if (drop) {
            let moveX = 0
            let moveY = 0
            if (drop.parentNode.style.transform) {
                moveX = parseInt(drop.parentNode.style.transform.match(/-?\d+(\.[\d]+)?/g)[0])
                moveY = parseInt(drop.parentNode.style.transform.match(/-?\d+(\.[\d]+)?/g)[1])
            } else {
                console.log("没有找到数据")
            }
            moveX += e.movementX
            moveY += e.movementY
            let iconInstance = getInstance(drop.parentNode.getAttribute("data-program-uuid"))
            if (!iconInstance.windowOption.isMax) {
                iconInstance.windowOption.position.x = moveX
                iconInstance.windowOption.position.y = moveY
                drop.parentNode.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`
            } else {
                console.log(e.clientX, e, iconInstance.windowOption.width)
                iconInstance.windowOption.position.x = moveX + e.clientX - e.clientX * (iconInstance.windowOption.width / drop.parentNode.offsetWidth);
                iconInstance.windowOption.position.y = moveY;
                iconInstance.resetWindow()
                drop.parentNode.style.transition = "transform 0ms"
            }
        }
    })
}