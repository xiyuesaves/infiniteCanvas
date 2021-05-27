function drag() {
    // 可拖动模组
    let overY = 0
    let overX = 0
    let drop = false
    document.addEventListener("mousedown", function(e) {
        if (e.buttons === 1) {
            for (let i = 0; i < e.path.length; i++) {
                if (e.path[i].className && e.path[i].className.includes("drop-el")) {
                    drop = e.path[i]
                    e.path[i].parentNode.style.transition = "0ms"
                    overX = e.offsetX
                    overY = e.offsetY
                    break
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
        if (drop) {
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
            drop.parentNode.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`
        }
    })
}